var connectivity = {
	data: {
		device_id: '',
		devices: [],
		interface_id: ''
	},
	device: {
		// list of devices that have been retrieved
		get: function () {
			if (connectivity.data.devices.length === 0) {
				entrypoint.wait.show('Getting Gateways....');
				$.ajax({
					dataType: 'json',
					method: 'GET',
					url: '/system/devices'
				}).success(function (resp) {
					if (resp.code) {
						notify.errorBox(resp.message, resp.code);
					} else {
						connectivity.data.devices = resp.devices;
						connectivity.device.show();
					}
				}).always(function () {
					entrypoint.wait.hide();
				});
			} else {
				connectivity.device.show();
			}
		},
		// show devices that have already been retrieved with the get function
		show: function () {
			var $ports = $('#ports');
			$ports.hide();
			var $listing = $('#devices .list');
			if (connectivity.data.devices.length === 0) {
				notify.errorBox('Your account is not associated with a gateway.<br/>Please contact support for additional assistance.');
				$listing.find('.items').html('<p class="bold">No gateways available</p>');
			} else {
				$listing.html('');
				for (var i in connectivity.data.devices) {
					var dev = connectivity.data.devices[i];
					var name = (dev.serial_number !== '' ? dev.serial_number : (dev.uid !== '' ? dev.uid : (dev.openflow_id !== '' ? dev.openflow_id : dev.id)));
					var content = '';
					if (dev.Physicallocation) {
						var loc = dev.Physicallocation;
						content += loc.house_number + ' ' + loc.pre_directional + ' ' + loc.street + ' ' + loc.post_directional + '<br />';
						content += loc.city + ', ' + loc.state + ' ' + loc.zip;
					}

					var html = '<div class="device"><button type="button" class="btn btn-info device-btn" data-id="' + dev.id + '">' + name + ' - ' + content + '</button></div>';
					$listing.append(html);
				}

				// select the last option in the drop down and trigger the system to show the available ports
				if (connectivity.data.devices.length === 1) {
					$('#devices').hide();
					$listing.find('button').trigger('click');
				} else {
					$('#devices').show();
				}
			}
		}
	},
	init: function () {
		$('#output .error').hide();
		$('#output .getting').hide();
		$('#output .main').hide();
		$('#output').hide();

		connectivity.device.get();
	},
	port: {
		check: function ($button) {
			entrypoint.wait.show('Checking Connection....');
			
			// get device id
			var device_id = connectivity.data.device_id;
			
			// getport id
			var interface_id = connectivity.data.interface_id;

			// make request to server
			$.ajax({
					dataType: 'json',
					data: {
						device_id: device_id,
						port_interface_id: interface_id
					},
					method: 'GET',
					url: '/system/connection'
				}).success(function (resp) {
					if (resp.code) {
						notify.errorBox(resp.message, resp.code);
					} else {
						connectivity.port.connection(resp);
					}
				}).always(function () {
					entrypoint.wait.hide();
				});

			// update response with results from check
		},
		click: function ($button) {
			// update the display of the buttons to indicate which one is active
			var $ports = $('#ports .btn');
			$ports.removeClass('btn-primary');
			$ports.addClass('btn-info');
			
			$button.removeClass('btn-info').addClass('btn-primary');

			connectivity.data.interface_id = $button.data('id');

			$('.results > h2').html('Network Connectivity for ' + $button.text());

			connectivity.port.check();
		},
		connection: function (details) {
			var $output = $('#output');
			$output.html('').show();
			var template = '<div class="connection"><div class="name"></div><div class="status"></div></div>';
			for(var i in details) {
				var $item = $(template);
				$item.find('.name').html(details[i].name);
				var status_html = '<i class="fa fa-circle" style="color: #e00f0f;"></i> OFFLINE';
				if(details[i].status === 'ONLINE') {
					status_html = '<i class="fa fa-circle" style="color: #1aad06;"></i> ONLINE';
				}
				$item.find('.status').html(status_html);
				
				$output.append($item);
			}
		},
		show: function () {
			$('#output').html('');
			var dev = null;
			for (var i in connectivity.data.devices) {
				if (connectivity.data.devices[i].id === connectivity.data.device_id) {
					dev = connectivity.data.devices[i];
					break;
				}
			}

			var $listing = $('#ports');
			$listing.html('');
			if (dev === null) {
				alert('Please select a gateway.');
				$listing.hide();
			} else {
				connectivity.data.device_id = dev.id;
				$listing.show();
				if (dev.Portinterfaces.length === 0) {
					notify.errorBox('The selected gateway does not have any compatible ports for this service.<br/>Please contact support for additional assistance.');
					$listing.html('<p class="bold">No ports available</p>');
				} else {
					// update legend with ports form the device that was selected
					connectivity.data.interface_id = '';
					for (var i in dev.Portinterfaces) {
						var int = dev.Portinterfaces[i];
						if (int.type === 'LAN') {
							var html = '<div class="interface"><button type="button" class="btn btn-info interface-btn" data-id="' + int.id + '">' + int.display_name + '</button></div>';
							$listing.append(html);
						}
					}
					$('.results > h2').html('Select which port you want to check the network connectivity.');
				}
			}
		}
	}
};

// monitor changes to the device selection drop down
$(document).on('click', '.device button', function (e) {
	e.preventDefault();

	var $this = $(this);

	$('#devices .btn').removeClass('btn-primary').addClass('btn-info');
	$this.removeClass('btn-info').addClass('btn-primary');

	connectivity.data.device_id = $this.data('id');
	connectivity.port.show();

	return false;
});
$(document).on('click', '.interface-btn', function (e) {
	e.preventDefault();

	var $this = $(this);
	connectivity.port.click($this);
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