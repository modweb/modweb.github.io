var services = {
	data: {
		devices: [],
		redirect_params: '',
		redirect_url: '',
		service_id: '',
		serviceplan_id: '',
		subscription_id: ''
	},
	device: {
		// list of devices that have been retrieved
		get: function (serviceplan_id) {
			$("#subscribeProcessModal").modal('show');

			services.device.hide();
			services.port.hide();
			if (services.data.devices.length === 0) {
				$.ajax({
					data: {
						serviceplan_id: serviceplan_id
					},
					dataType: 'json',
					method: 'GET',
					url: '/account/devices'
				}).success(function (resp) {
					if (resp.code) {
						notify.errorBox(resp.message, resp.code);
					} else {
						services.data.devices = resp.devices;
						services.data.service_id = resp.Serviceplan.Service.id;
						services.data.serviceplan_id = resp.Serviceplan.id;
						services.device.show();
					}
				});
			} else {
				services.device.show();
			}
		},
		hide: function () {
			$("#device-listing-p").hide();
			$("#device-default-items").hide();
			$("#device-listing .items table").remove();
		},
		// show devices that have already been retrieved with the get function
		show: function () {
			$('#ports-loading').hide();
			var $ports = $('#ports-listing');
			$ports.hide();
			var $listing = $('#device-listing');
			if (services.data.devices.length === 0) {
				notify.errorBox('Your account is not associated with a gateway.<br/>Please contact support for additional assistance.');
				$listing.find('.items').html('<p class="bold">No gateways available</p>');
			} else {
				var $items = $listing.find('.items');
				$items.html($('#device-default-items').html());

				var $select = $items.find('#device-id');
				for (var i in services.data.devices) {
					var dev = services.data.devices[i];

					var name = (dev.serial_number !== '' ? dev.serial_number : (dev.uid !== '' ? dev.uid : (dev.openflow_id !== '' ? dev.openflow_id : dev.id)));
					var content = '';
					var value = dev.id;
					if (dev.PhysicalLocation) {
						var loc = dev.PhysicalLocation;
						content += loc.house_number + ' ' + loc.pre_directional + ' ' + loc.street + ' ' + loc.post_directional + '<br />';
						content += loc.city + ', ' + loc.state + ' ' + loc.zip;
					}

					var html = '<option data-content="' + content + '" value="' + value + '">' + name + '</option>';
					$select.append(html);
				}

				// select the last option in the drop down and trigger the system to show the available ports
				if (services.data.devices.length === 1) {
					$listing.hide();
					$select.find('option').last().prop('selected', true);
					$select.trigger('change');
				} else {
					$select.selectpicker();
					$listing.show();
				}
			}
			$("#device-default-items").show();
			$("#device-listing-p").show();
		}
	},
	port: {
		hide: function () {
			$("#ports-listing-p").hide();
			$("#ports-listing .items table").remove();
		},
		show: function (device_id) {
			var dev = null;

			for (var i in services.data.devices) {
				if (services.data.devices[i].id === device_id) {
					dev = services.data.devices[i];
					break;
				}
			}

			var $listing = $('#ports-listing');
			if (dev === null) {
				alert('Please select a gateway.');
				$listing.hide();
			} else {
				$listing.show();
				$("#ports-listing-p").show();

				var $items = $listing.find('.items');
				$items.html($('#port-table').html());

				var $table_header = $items.find('table thead tr');
				var $table_body = $items.find('table tbody tr');
				var count = 0;

				if (dev.Portinterfaces.length === 0) {
					notify.errorBox('The selected gateway does not have any compatible ports for this service.<br/>Please contact support for additional assistance.');
					$listing.find('.items').html('<p class="bold">No ports available</p>');
				} else {
					var default_selected = false;
					for (var i in dev.Portinterfaces) {
						count++;

						var int = dev.Portinterfaces[i];
						var id = int.id;

						var name = '';
						if (int.Subscriptions !== null && int.Subscriptions.length !== 0) {
							for (var j in int.Subscriptions) {
								var sub = int.Subscriptions[j];
								if (name !== '') {
									name += '<br/>';
								}
								name += sub.Serviceplan.Service.name + ' ' + sub.Serviceplan.fields.Name;
							}
						}

						var header_html = '<td>' + int.display_name + '</td>';
						var body_html = '<td id="port-' + id + '"><input style="vertical-align:super;" class="device-port-id" type="radio" name="device-port-id" id="device-port-' + id + '" value="' + id + '" ';
						if (name === '') {
							if (!default_selected) {
								default_selected = true;
								body_html += 'checked="true"';
							}
							body_html += ' />';
						} else {
							body_html += ' disabled /> <label for="device-port-' + id + '">' + name + '</label>';
						}


						body_html += '</td>';

						$table_header.append(header_html);
						$table_body.append(body_html);
					}

					if (default_selected === false) {
						notify.errorBox('There are no available slots open for you to subscribe to this service.  Please unsubscribe from a service first.');
					} else {
						$("#port_next").prop("disabled", false);
					}

					$table_header.find('td').css('width', ((1 / count) * 100) + '%');

				}
			}
		}
	},
	redirect: function (response) {
		if (services.data.redirect_url) {
			var url = services.data.redirect_url;
			var port = 80;

			setTimeout(ping(url, port, function (milliseconds) {
				if (milliseconds === -1) {
					// let the use know there was a timeout issue
				} else {
					if (services.data.redirect_params !== '') {
						var params = JSON.parse(base64_decode(services.data.redirect_params));
						$.redirect(services.data.redirect_url, params);
					} else {
						$.redirect(services.data.redirect_url);
					}
				}
			}), 5000);
		} else {
			window.location.reload();
		}
	},
	subscribe: function () {
		var plan_id = services.data.serviceplan_id;
		var port_id = $(".device-port-id:checked").val();
		var account_id = '';
		for (var i in services.data.devices) {
			var dev = services.data.devices[i];
			for (var j in dev.Portinterfaces) {
				if (dev.Portinterfaces[j].id == port_id) {
					account_id = dev.Account.id;
				}
			}
		}

		$("#magicModal").find('.modal-title').html('Provisioning Service');
		$("#magicModal").find('.modal-body').html('Create subscription for account.');
		$("#magicModal").modal('show');

		$.ajax({
			url: '/account/subscribe',
			type: 'POST',
			dataType: 'json',
			data: {
				'account_id': account_id,
				'service_plan_id': plan_id,
				'device_port_id': port_id,
				'subscription_id': services.data.subscription_id
			}
		}).done(function (response) {
			if (response.error) {
				$("#magicModal").modal('hide');
				notify.errorBox(response.message, response.code);
			} else {
				services.redirect(response);
			}
		}).fail(function (error) {
			if (error.error) {
				$("#magicModal").modal('hide');
				notify.errorBox(error.message, error.code);
			} else {
				location.reload();
			}
		}).always(function () {
		});
	},
	updateTab: function (tab) {
		$('#subscribe_tabs li').each(function (index) {
			// loop through each tab, activate only the provided one.
			$(this).removeClass('active');
			$(this).removeClass('disabled');

			var clss = $(this).attr('class');

			if (tab === clss) {
				$("." + clss + " a").trigger('click');
			} else {
				$(this).addClass('disabled');
			}
		});
	},
	unsubscribe: {
		complete: function () {
			var subscription_id = $("#unsub-subscription_id").val();
			var id = $("#unsub-service_id").val();
			var plan_id = $("#unsub-service_plan_id").val();

			$('#unsubscribingModal').modal('hide');
			;
			$("#magicModal").find('.modal-title').html('Unsubscribing Service....');
			$("#magicModal").modal('show');

			var url = globals.BASE_URL.replace("http://", "");
			setTimeout(ping(url, '80', function (milliseconds) {
				if (milliseconds === -1) {
					// let the use know there was a timeout issue
				} else {
					$("#magicModal").modal('hide');
					// check if there is an error on the screen
					if ($('#divSmallBoxes div').length === 0) {
						location.reload();
					}
				}
			}), 5000);
			$.ajax({
				url: '/account/unsubscribe',
				type: 'POST',
				dataType: 'json',
				data: {
					'service_id': id,
					'serviceplan_id': plan_id,
					'subscription_id': subscription_id
				}
			}).done(function (response) {
				if (response.error) {
					$("#magicModal").modal('hide');
					notify.errorBox(response.message, response.code);
					$('#unsubscribingModal').modal('hide');
				} else {
					location.reload();
				}
			}).fail(function (error) {
				if (error.error) {
					$("#magicModal").modal('hide');
					notify.errorBox(error.message, error.code);
					$('#unsubscribingModal').modal('hide');
				} else {
					location.reload();
				}
			}).always(function () {
			});
		},
		show: function ($info) {
			var $service_el = $info.parents('.service');

			var service_id = $service_el.data('service_id');
			var service_plan_id = $service_el.data('id');
			var subscription_id = $info.data('id');

			$("#unsub-subscription_id").val(subscription_id);
			$("#unsub-service_id").val(service_id);
			$("#unsub-service_plan_id").val(service_plan_id);

			$('#unsubscribingModal').modal('show');
		}
	},

	next: function () {

	},
	previous: function () {

	}
};

// monitor changes to the device selection drop down
$(document).on('change', '#device-id', function () {
	var $this = $(this);
	var device_id = $this.val();
	services.port.show(device_id);
});

// if the subscribe button is clicked check
$(document).on('click', '.service-actions .service-subscribe', function (e) {
	e.preventDefault();

	services.device.hide();
	services.port.hide();

	$('#subscribe_tabs .tab-port a').trigger('click');

	$("#port_next").prop("disabled", true);

	$('#ports-loading').show();
	var $this = $(this);
	var serviceplan_id = $this.data('serviceplan-id');
	services.data.redirect_params = '';
	services.data.redirect_url = '';
	services.data.subscription_id = '';

	// update fields in the modal to refect what has been selected
	$(".service_provider_name").html($this.data('provider-name'));
	$(".service_name").html($this.data('service-name'));
	$(".service_plan_name").html($this.data('plan-name'));
	
	var standby = $this.data('service-standby');

	// if this is a standby service then turn on the warning
	if (standby == '1') {
		$('p.standby').show();
	} else {
		$('p.standby').hide();
	}

	// always clear the list of loaded devices so if there are any changes they are refelected in the uri
	services.data.devices = [];
	if ($this.data('redirect')) {
		services.data.redirect_params = $this.data('post-params');
		services.data.redirect_url = $this.data('redirect');
		services.data.subscription_id = $this.data('subscription-id');
	}

	// load the data
	services.device.get(serviceplan_id);

	return false;
});
$(document).on('click', '.service-actions .service-unsubscribe', function (e) {
	e.preventDefault();

	var $this = $(this);
	services.unsubscribe.show($this);

	return false;
});

// move next button click
$(document).on('click', ".btn-move", function (e) {
	//find the next tab and move to it
	e.preventDefault();

	var $this = $(this);

	var active_tab = $this.parents('.tab-pane').attr('id');
	var move_tab = $this.data('tab');

	if (active_tab !== move_tab) {
		services.updateTab(move_tab);
	}
});

// monitor changes to the device selection drop down
$(document).on('click', '.service-complete-subscribe', function () {
	var $this = $(this);
	services.subscribe();
});

$(document).on('click', "#unsubscribe-button", function (e) {
	e.preventDefault();

	services.unsubscribe.complete();

	return false;
});

$(document).on('click', '#iframeClose', function (e) {
	var $modal = $('#iframeModal');
	$modal.modal('hide');
});

$(document).on('click', ".service-url", function (e) {
	e.preventDefault();

	var $this = $(this);

	if ($this.data('empty')) {
		return;
	}
	entrypoint.wait.show('Retrieving webpage........');

	var $modal = $('#iframeModal');
	var img_html = '<img src="' + globals.MEDIA_URL + '/img/retrievingData.gif" />';
	$modal.find('.modal-body').html(img_html);

	var $modalClose = $('#iframeClose').hide();

	var service_id = $this.data('service_id');
	var type = $this.data('type');

	$.ajax({
		url: '/service/url',
		data: {service_id: service_id, type: type},
		type: 'GET',
		dataType: 'json'
	}).done(function (resp) {
		if (resp.code) {
			notify.errorBox(resp.message, resp.code);
		} else {
			$("#iframe-modal-title").html(resp.name);
			$modal.modal('show');
			$modalClose.show();
			var iframe_html = '<iframe src="' + resp.url + '" id="iframe-modal" style="width:100%; height: 600px; border: none;"></iframe>';
			$modal.find('.modal-body').html(iframe_html);
		}
	}).always(function () {
		entrypoint.wait.hide();
	});
	return false;
});

