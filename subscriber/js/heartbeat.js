var heartbeat = {
	chart: {
		legend: {
		},
		load: function () {
			heartbeat.data.time_series_in = new TimeSeries();
			heartbeat.data.time_series_out = new TimeSeries();

			$.ajax({
				data: {
					device_id: heartbeat.data.device_id
				},
				type: "GET",
				url: '/system/interval',
				dataType: 'json',
				success: function (data) {
					// base object
					for (var i in data) {
						var base_data = {'in': 0, 'out': 0};
						var k = i;
						// build object
						heartbeat.data.previous_data[k] = base_data;

						heartbeat.data.previous_data[k].in = data[i].in_bytes * 1;
						heartbeat.data.previous_data[k].out = data[i].out_bytes * 1;
					}

					heartbeat.update_text();

					heartbeat.data.timer_id = setInterval(function () {
						heartbeat.data.times++;
						if (window.location.hash == '#/system/status') {
							$.ajax({
								data: {
									device_id: heartbeat.data.device_id
								},
								type: "GET",
								url: '/system/interval',
								dataType: 'json',
								success: function (data) {
									heartbeat.chart.status('working');
									// set time so all will have the same timestamp
									var timestamp = new Date().getTime();

									//reduce the numbers of bytes that where returned
									for (var i in data) {
										data[i].in_bytes = (data[i].in_bytes * 1) - heartbeat.data.previous_data[i].in;
										data[i].out_bytes = (data[i].out_bytes * 1) - heartbeat.data.previous_data[i].out;
									}

									// add new inbound mark
									heartbeat.data.time_series_in.append(timestamp, data[heartbeat.data.display_id].in_bytes);

									// add new outbound mark
									heartbeat.data.time_series_out.append(timestamp, data[heartbeat.data.display_id].out_bytes);

									// add data to array so that additional processing can happen
									heartbeat.data.loaded_data.unshift(data);
									// remove the oldest item off the array if there are to many
									while (heartbeat.data.loaded_data.legnth > 60) {
										heartbeat.data.loaded_data.pop();
									}

									// update the offset because the api gives back overall total
									for (var i in data) {
										heartbeat.data.previous_data[i].in = (data[i].in_bytes * 1) + heartbeat.data.previous_data[i].in;
										heartbeat.data.previous_data[i].out = (data[i].out_bytes * 1) + heartbeat.data.previous_data[i].out;
									}

									heartbeat.update_text();
								},
								error: function (xhr, ajaxOptions, thrownError) {
									heartbeat.chart.status('error');
									heartbeat.data.times = 201;
									clearInterval(heartbeat.data.timer_id);
									heartbeat.data.chart.stop();

									for (i = 0; i < 100000; i++) {
										window.clearInterval(i);
									}
								},
								async: true});
							if (heartbeat.data.times > 200) {
								clearInterval(heartbeat.data.timer_id);
								heartbeat.data.chart.stop();
							}
						} else {
							clearInterval(heartbeat.data.timer_id);
							heartbeat.data.chart.stop();
						}
					}, 3000);
				},
				error: function (xhr, ajaxOptions, thrownError) {
				},
				async: true});
		},
		reset: function () {
			if (heartbeat.data.time_series_in !== null) {
				heartbeat.data.time_series_in.clear();
			}
			if (heartbeat.data.time_series_out !== null) {
				heartbeat.data.time_series_out.clear();
			}
			heartbeat.data.loaded_data = [];
			heartbeat.data.times = 0;
			for (var i in heartbeat.chart.legend) {
				heartbeat.chart.legend[i].in.total = 0;
				heartbeat.chart.legend[i].in.average = 0;
				heartbeat.chart.legend[i].in.peak = 0;
				heartbeat.chart.legend[i].in.recent = 0;
				heartbeat.chart.legend[i].out.total = 0;
				heartbeat.chart.legend[i].out.average = 0;
				heartbeat.chart.legend[i].out.peak = 0;
				heartbeat.chart.legend[i].out.recent = 0;
			}
		},
		settings: {
			grid: {fillStyle: '#ffffff', strokeStyle: 'rgba(119,119,119,0.64)', verticalSections: 4, millisPerLine: 30000},
			millisPerPixel: 250,
			scaleSmoothing: 0.618,
			interpolation: 'linear',
			labels: {fillStyle: '#000000', fontSize: 10, precision: 2, disabled: false},
			timestampFormatter: SmoothieChart.timeFormatter,
			yFormatter: function (value, precision) {
				return (parseFloat(value) * 8 / 1024).toFixed(precision) + ' (kbits/s)';
			},
			yRangeFunction: function (range) {
				var remainder = range.max % 64;
				var max = range.max + 64 - remainder;
				return {min: 0, max: max};
			}
		},
		show: function () {
			heartbeat.data.chart = new SmoothieChart(heartbeat.chart.settings);
			heartbeat.data.canvas = document.getElementById('chart');

			heartbeat.data.chart.addTimeSeries(heartbeat.data.time_series_in, {lineWidth: 2, strokeStyle: '#22f6a6', fillStyle: 'rgba(34,246,166,0.30)'});
			heartbeat.data.chart.addTimeSeries(heartbeat.data.time_series_out, {lineWidth: 2, strokeStyle: '#ff6487', fillStyle: 'rgba(255,100,135,0.30)'});
			heartbeat.data.chart.streamTo(heartbeat.data.canvas, 1076);
		},
		status: function (level) {
			var $message = $('#chart-message');
			$message.children().hide();
			switch (level) {
				default:
				case 'error':
					$message.find('.error').show();
					break;
				case 'working':
					$message.find('.main').show();
					break;
				case 'initial':
					$message.find('.getting').show();
					break;
			}
		}
	},
	data: {
		canvas: null,
		chart: null,
		legend_base: {'in': {total: 0, average: 0, peak: 0, recent: 0}, 'out': {total: 0, average: 0, peak: 0, recent: 0}, 'name': ''},
		device_id: '',
		devices: [],
		display_id: 1,
		loaded_data: [],
		previous_data: {},
		time_series_in: null,
		time_series_out: null,
		timer_id: 0,
		times: 0
	},
	device: {
		// list of devices that have been retrieved
		get: function () {
			if (heartbeat.data.devices.length === 0) {
				entrypoint.wait.show('Getting Gateways....');
				$.ajax({
					dataType: 'json',
					method: 'GET',
					url: '/system/devices'
				}).success(function (resp) {
					if (resp.code) {
						notify.errorBox(resp.message, resp.code);
					} else {
						heartbeat.data.devices = resp.devices;
						heartbeat.device.show();
					}
				}).always(function () {
					entrypoint.wait.hide();
				});
			} else {
				heartbeat.device.show();
			}
		},
		// show devices that have already been retrieved with the get function
		show: function () {
			$('.chart').hide();
			var $ports = $('#ports');
			$ports.hide();
			var $listing = $('#devices .list');
			if (heartbeat.data.devices.length === 0) {
				notify.errorBox('Your account is not associated with a gateway.<br/>Please contact support for additional assistance.');
				$listing.find('.items').html('<p class="bold">No gateways available</p>');
			} else {
				$listing.html('');
				for (var i in heartbeat.data.devices) {
					var dev = heartbeat.data.devices[i];
					var name = (dev.serial_number !== '' ? dev.serial_number : (dev.uid !== '' ? dev.uid : (dev.openflow_id !== '' ? dev.openflow_id : dev.id)));
					var content = '';
					if (dev.PhysicalLocation) {
						var loc = dev.PhysicalLocation;
						content += loc.house_number + ' ' + loc.pre_directional + ' ' + loc.street + ' ' + loc.post_directional + '<br />';
						content += loc.city + ', ' + loc.state + ' ' + loc.zip;
					}

					var html = '<div class="device"><button type="button" class="btn btn-info device-btn" data-id="' + dev.id + '">' + name + ' - ' + content + '</button></div>';
					$listing.append(html);
				}

				// select the last option in the drop down and trigger the system to show the available ports
				if (heartbeat.data.devices.length === 1) {
					$('#devices').hide();
					$listing.find('button').trigger('click');
				} else {
					$('#devices').show();
				}
			}
		}
	},
	port: {
		click: function ($button) {
			// update the display of the buttons to indicate which one is active
			$('.ports .btn').removeClass('btn-primary').addClass('btn-info');
			$button.removeClass('btn-info').addClass('btn-primary');

			$('.chart h2').html('Realtime Traffic for ' + heartbeat.chart.legend[heartbeat.data.display_id].name);

			heartbeat.chart.reset();
		},
		show: function () {
			var dev = null;
			for (var i in heartbeat.data.devices) {
				if (heartbeat.data.devices[i].id === heartbeat.data.device_id) {
					dev = heartbeat.data.devices[i];
					break;
				}
			}

			var $listing = $('#ports');
			$listing.html('');
			if (dev === null) {
				alert('Please select a gateway.');
				$listing.hide();
			} else {


				heartbeat.data.device_id = dev.id;
				$listing.show();
				$('.chart').show();
				if (dev.Portinterfaces.length === 0) {
					notify.errorBox('The selected gateway does not have any compatible ports for this service.<br/>Please contact support for additional assistance.');
					$listing.html('<p class="bold">No ports available</p>');
				} else {
					// update legend with ports form the device that was selected
					heartbeat.chart.legend = {};
					heartbeat.data.display_id = '';
					for (var i in dev.Portinterfaces) {
						var int = dev.Portinterfaces[i];

						if (heartbeat.data.display_id === '') {
							heartbeat.data.display_id = int.number;
						}

						heartbeat.chart.legend[int.number] = heartbeat.data.legend_base;
						heartbeat.chart.legend[int.number].name = int.name;

						// build port buttons
						var class_name = 'btn-info';
						if (int.number === heartbeat.data.display_id) {
							class_name = 'btn-primary';
						}

						html = '<div class="interface"><button type="button" class="btn ' + class_name + ' interface-btn" data-id="' + int.number + '">' + int.name + '</button></div>';
						$listing.append(html);
					}
					$('.chart h2').html('Realtime Traffic for ' + heartbeat.chart.legend[heartbeat.data.display_id].name);
					$listing.find('.btn-primary').trigger('click');
				}
			}
		}
	},
	update_text: function () {
		var entry = heartbeat.chart.legend[heartbeat.data.display_id];

		var in_total = 0;
		var out_total = 0;
		var in_max = 0;
		var out_max = 0;
		var in_recent = 0;
		var out_recent = 0;
		var first = true;


		for (var j in heartbeat.data.loaded_data) {
			var item = heartbeat.data.loaded_data[j];
			in_total += item[heartbeat.data.display_id].in_bytes;
			out_total += item[heartbeat.data.display_id].out_bytes;

			if (in_max < item[heartbeat.data.display_id].in_bytes) {
				in_max = item[heartbeat.data.display_id].in_bytes;
			}
			if (out_max < item[heartbeat.data.display_id].out_bytes) {
				out_max = item[heartbeat.data.display_id].out_bytes;
			}

			if (first) {
				in_recent = item[heartbeat.data.display_id].in_bytes;
				out_recent = item[heartbeat.data.display_id].out_bytes;
				first = false;
			}

			entry.in.total = in_total;
			entry.in.peak = in_max;
			entry.in.average = (in_total / heartbeat.data.loaded_data.length);
			entry.in.recent = in_recent;
			entry.out.total = out_total.toLocaleString();
			entry.out.peak = out_max;
			entry.out.average = (out_total / heartbeat.data.loaded_data.length);
			entry.out.recent = out_recent;
			heartbeat.chart.legend[heartbeat.data.display_id] = entry;
		}

		var html = '';
		var base_line = '<div><div style="width: 70px;float: left;">{0}: <div style="float: left; width: 10px; height: 5px; background-color:{1};"></div></div> <label>Now: </label> <span>{4} <span class="unit">{2}</span><br />{5} <span class="unit">{3}</span></span> <label>Average:</label> <span>{6} <span class="unit">{2}</span><br />{7} <span class="unit">{3}</span></span> <label>Peak:</label> <span>{8} <span class="unit">{2}</span><br />{9} <span class="unit">{3}</span></span></div>';
		for (var i in heartbeat.chart.legend) {
			if (i == heartbeat.data.display_id) {
				var item = heartbeat.chart.legend[i];
				html += String.format(base_line, 'Inbound', '#22f6a6', '(kbit/s)', '(kB/s)', ((item.in.recent * 8) / 1024).toLocaleString(), (item.in.recent / 1024).toLocaleString(), ((item.in.average * 8) / 1024).toLocaleString(), (item.in.average / 1024).toLocaleString(), ((item.in.peak * 8) / 1024).toLocaleString(), (item.in.peak / 1024).toLocaleString());
				html += String.format(base_line, 'Outbound', '#ff6487', '(kbit/s)', '(kB/s)', ((item.out.recent * 8) / 1024).toLocaleString(), (item.out.recent / 1024).toLocaleString(), ((item.out.average * 8) / 1024).toLocaleString(), (item.out.average / 1024).toLocaleString(), ((item.out.peak * 8) / 1024).toLocaleString(), (item.out.peak / 1024).toLocaleString());
			}
		}
		$('.details').html(html);
	}
};

// monitor changes to the device selection drop down
$(document).on('click', '.device button', function (e) {
	e.preventDefault();

	var $this = $(this);

	$('#devices .btn').removeClass('btn-primary').addClass('btn-info');
	$this.removeClass('btn-info').addClass('btn-primary');


	heartbeat.data.device_id = $this.data('id');
	heartbeat.port.show();

	return false;
});
$(document).on('click', '.interface-btn', function (e) {
	heartbeat.chart.status('initial');
	e.preventDefault();

	var $this = $(this);
	heartbeat.data.display_id = $this.data('id');

	heartbeat.chart.reset();
	heartbeat.chart.load();
	heartbeat.chart.show();

	heartbeat.port.click($this);
	return false;
});


if (!String.format) {
	String.format = function (format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != 'undefined'
					? args[number]
					: match
					;
		});
	};
}