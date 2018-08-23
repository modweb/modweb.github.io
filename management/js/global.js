/**
 * @namespace entrypoint
 */
var entrypoint = {
	dataTable: {
		displayButtons: function (table) {
			var row = $(document.createElement('div'));
			row.addClass('row');
			var col = row.append('<div class="col-sm-6"></div>').children().first();
			var btnContainer = table.buttons().container();
			btnContainer.removeClass('btn-group');
			btnContainer.css('margin', '10px 0px 10px 0px');
			btnContainer.appendTo(col);
			row.prependTo($('.row:eq(0)', table.table().container()).parent());
			var btns = btnContainer.find('.btn');
			btns.addClass('btn-primary');
			btns.css('margin-right', '5px');

			var copy = btnContainer.find(".buttons-copy");
			copy.addClass('fa');
			copy.addClass('fa-clipboard');
			entrypoint.tooltip.set(copy, 'Copy Visible Data to Clipboard', 'top');
			var csv = btnContainer.find(".buttons-csv");
			csv.addClass('fa');
			csv.addClass('fa-file-text-o');
			entrypoint.tooltip.set(csv, 'Download Visible Data as a CSV file', 'top');
			var excel = btnContainer.find(".buttons-excel");
			excel.addClass('fa');
			excel.addClass('fa-file-excel-o');
			entrypoint.tooltip.set(excel, 'Download Visible Data as an Excel file', 'top');
			var pdf = btnContainer.find(".buttons-pdf");
			pdf.addClass('fa');
			pdf.addClass('fa-file-pdf-o');
			entrypoint.tooltip.set(pdf, 'Download Visible Data as a PDF file', 'top');

			var copyAll = btnContainer.find(".buttons-all-copy");
			entrypoint.tooltip.set(copyAll, 'Copy All Data to Clipboard', 'top');
			var csvAll = btnContainer.find(".buttons-all-csv");
			entrypoint.tooltip.set(csvAll, 'Download All Data as a CSV file', 'top');
			var excelAll = btnContainer.find(".buttons-all-excel");
			entrypoint.tooltip.set(excelAll, 'Download All Data as an Excel file', 'top');
			var pdfAll = btnContainer.find(".buttons-all-pdf");
			entrypoint.tooltip.set(pdfAll, 'Download All Data as a PDF file', 'top');

			entrypoint.tooltip.show();
		},
		getDefaultBtnsObj: function (filename) {
			return [
				{
					extend: 'csv',
					text: '',
					filename: filename,
					className: 'buttons-all-csv',
					            exportOptions: {
						                modifier: {
							                    search: 'none'
						                }
					            }
				},
				{
					extend: 'pdf',
					text: '',
					filename: filename,
					className: 'buttons-all-pdf',
					            exportOptions: {
						                modifier: {
							                    search: 'none'
						                }
					            }
				}
			];
		}
	},
	deleteModal: {
		deleting_object: null,
		hide: function () {
			$(".modal-delete").modal('hide');
		},
		deleteOnClick(className, func) {
			$('.modal-delete').off('click', '#modal-delete-' + className);
			$('.modal-delete').on('click', '#modal-delete-' + className, func);
		},
		disableOnClick(className, func) {
			$('.modal-delete').off('click', '#modal-disable-' + className);
			$('.modal-delete').on('click', '#modal-disable-' + className, func);
		},
		showDisableOnly: function () {
			$('#disable-dialog-text').html('This item will be disabled.');
			$('.modal-disable-text').html('Disable');
			$('.modal-delete-text').html('Disable');
			$('.modal-button-disable').show();
			$('#disable-dialog').show();
			$('#delete-dialog').hide();
			$('.modal-button-delete').hide();
		},
		showDeleteOnly: function () {
			$('.modal-button-disable').hide();
			$('#disable-dialog').hide();
			$('#delete-dialog-text').html('This item will be deleted.');
			$('.modal-delete-text').html('Delete');
			$('#delete-dialog').show();
			$('.modal-button-delete').show();
		},
		showDisableAndDelete: function () {
			$('#disable-dialog-text').html('Selecting disable will disable the item.');
			$('.modal-disable-text').html('Disable');
			$('.modal-button-disable').show();
			$('#disable-dialog').show()
			$('#delete-dialog-text').html('Selecting delete will permanently delete the item.');
			$('.modal-delete-text').html('Delete');
			$('#delete-dialog').show();
			$('.modal-button-delete').show();
		},
		show: function (id, className, original_button) {
			entrypoint.deleteModal.deleting_object = original_button;
			$(".modal-delete").modal('show');
			$(".modal-button-disable").data('id', id);
			$(".modal-button-disable").attr('id', 'modal-disable-' + className);
			$(".modal-button-delete").data('id', id);
			$(".modal-button-delete").attr('id', 'modal-delete-' + className);
		}
	},
	form: {
		fields: new Object,
		error: false,
		message: '',
		clear: function (parent_element, skip_fields) {
			$(parent_element).find('input,textarea,select').each(function (key, val) {
				if (skip_fields === undefined) {
					//clear everything out.
					$(this).val('');
					$(this).parent().removeClass('has-error');
				} else {
					var id = $(this).attr('id');
					//only clear out fields that are not in the skip list
					if ($.inArray(id, skip_fields) < 0) {
						$(this).val('');
						$(this).parent().removeClass('has-error');
					}
				}
			});
		},
		enableAutoSave: function (form, class_name) {
			$(form + ' :input').on('change', function (e) {
				try {
					var $this = $(this);

					if ($this.val() != '') {
						//only validate if not empty
						var data_type = $this.data('type');
						switch (data_type) {
							case 'url':
								if (!entrypoint.tool.isUrlValid($this.val())) {
									throw new CustomException('Invalid URL provided', 100);
								}
								;
								break;
							case 'email':
								if (!isEmailValid($this.val())) {
									throw new CustomException('Invalid email provided', 100);
								}
								break;
							case 'phone':
//                                if(!isPhonenumberValid($this.val())) {
//                                    throw new CustomException('Invalid phone number provided', 100);
//                                }
							default:
								//let it through
								break;
						}
					}

					saved_function = function (save_resp) {
						var data = save_resp.data;
						var cn = window[class_name];
						if (typeof cn === "object") {
							if (typeof cn.updateRow == "function") {
								cn.updateRow(data);
							}
						}

						$this.parent().removeClass('has-error');
					};
					var fail_function = function (save_resp) {
						//add error class
						$this.parent().addClass('has-error');
						$this.focus();
					};

					var updateArr = $this.serializeArray();
					var idArr = $('#' + class_name + '-id').serializeArray();

					var data = {};
					for (var i in updateArr) {
						if (undefined == data[updateArr[i].name]) {
							data[updateArr[i].name] = updateArr[i].value;
						} else {
							data[updateArr[i].name] += ',' + updateArr[i].value;
						}
					}
					for (var i in idArr) {
						data[idArr[i].name] = idArr[i].value;
					}

					autoSaveObject('/' + class_name + '/save', class_name, data, saved_function, fail_function);
				} catch (err) {
					$this.parent().addClass('has-error');
					$this.focus();
					notify.errorBox(err.message, err.code);
				}
			});
		},
		disableAutoSave: function (form) {
			$(form + ' :input').off('change');
		},
		initToggleButton(button, settings) {
			var settings = $.extend({},
					{
						on: 'Enabled',
						off: 'Disabled',
						onstyle: 'success',
						offstyle: 'danger',
						size: 'small',
						style: 'custom',
						width: 100
					},
					settings
					);
			button.bootstrapToggle(settings);
		},
		validate: function (parent_element) {
			// reset variables if it needs to be run more than once
			entrypoint.form.error = false;
			entrypoint.form.message = '';

			$(parent_element).find('input,textarea,select').each(function (k, v) {
				var i = $(v);
				var type = i.data('type');

				if (i.attr('required') !== undefined && i.val() === '') {
					var field_name = i.attr('name');
					field_name = field_name.replace("]", "");
					field_name = field_name.split('[');
					var obj = field_name[0];
					var field = field_name[1];
					obj = obj.charAt(0).toUpperCase() + obj.slice(1);
					entrypoint.form.message += obj + ' ' + field + ' not provided.</br>';
					entrypoint.form.error = true;
					i.parent().addClass('has-error');
				} else {
					i.parent().removeClass('has-error');
				}
				entrypoint.form.fields[i.attr('name')] = i.val();
			});

			return entrypoint.form.error;
		}
	},
	notification: {
		fields: new Object,
		error: false,
		message: '',
		showAlarmCount: function (parent_element) {
			$.ajax({
				url: "/notification/alarms/count",
				type: 'GET',
				dataType: 'json'
			}).done(function (resp) {
				if ($(parent_element)) {
					var element = $(parent_element);
					if (resp.hasOwnProperty('count')) {
						var count = resp.count;
						if (count > 0) {
							element.text(count);
							element.show();
							$("#header-alarm-li").show();
						}
					}
				}
			}).fail(function (json, error) {
				proces_response(json);
			}).complete(function () {
			});
		}
	},
	/**
	 * @memberOf entrypoint
	 * @param string input The value to search for
	 * @param string url The url for the search request
	 */
	search: function (input, url, proces_response) {
		var input = $(input)[0];
		var search = $.trim($(input).val());
		//only do the search if there are 3 or more characters
		if (search.length >= 3 || search == '*') {
			if (timer) {
				window.clearTimeout(timer);
			}
			timer = window.setTimeout(function () {
				entrypoint.wait.show('Searching...');
				$.ajax({
					url: url,
					type: 'POST',
					dataType: 'json',
					data: {search: search}
				}).done(function (resp) {
					proces_response(resp);
				}).fail(function (json, error) {
					proces_response(json);
				}).complete(function () {
					entrypoint.wait.hide();
				});
			}, 300);
		}
	},
	provider: {
		//these function are required so that js trigger events don't trigger the auto-save
		enableAutoSave: function () {
			$('.tab-pane :input').on('change', function (e) {
				try {
					var $this = $(this);
					//get the parent .tab-pane and get the type for the request.
					var object_type = $this.closest('div[class^="provider-pane"]').data('type');

					if ($this.val() != '') {
						//only validate if not empty
						var data_type = $this.data('type');
						switch (data_type) {
							case 'url':
								if (!entrypoint.tool.isUrlValid($this.val())) {
									throw new CustomException('Invalid URL provided', 100);
								}
								;
								break;
							case 'email':
								if (!isEmailValid($this.val())) {
									throw new CustomException('Invalid email provided', 100);
								}
								break;
							case 'phone':
//                                if(!isPhonenumberValid($this.val())) {
//                                    throw new CustomException('Invalid phone number provided', 100);
//                                }
							default:
								//let it through
								break;
						}
					}

					var saved_function = function (save_resp) {
						//remove error class                    
						$this.parent().removeClass('has-error');
					};
					var fail_function = function (save_resp) {
						//add error class
						$this.parent().addClass('has-error');
						$this.focus();
					};

					switch (object_type) {
						case 'api':
							saved_function = function (save_resp) {
								var data = save_resp.data;
								api.updateRow(data);

								$("#api-name-title").text(data.key);

								$this.parent().removeClass('has-error');
							};
							break;
						case 'contact':
							saved_function = function (save_resp) {
								var data = save_resp.data;
								contact.updateRow(data);
								$("#contact-name-title").text(data.name);

								$this.parent().removeClass('has-error');
							};
							break;
						case 'provider':
							saved_function = function (save_resp) {
								var p = save_resp.data;
								provider.updateRow(p);
								//update the image if it has changed
								if (p.image == '') {
									var file = globals.MEDIA_URL + "/img/noimage.jpg";
								} else {
									var file = globals.MEDIA_URL + "/img/provider/" + p.image;
								}
								$("#provider-img").attr('src', file);
							};
							break;
						case 'service':
							saved_function = function (save_resp) {

								$this.parent().removeClass('has-error');

								var data = save_resp.data;
								service.updateRow(data);

								$("#service-name-title").text(data.name);
								//update the image if it has changed
								if (data.image == '') {
									var file = globals.MEDIA_URL + "/img/noimage.jpg";
								} else {
									var file = globals.MEDIA_URL + "/img/service/" + data.image;
								}
								$("#service-img").attr('src', file);
							};
							break;
						case 'serviceplan':
							saved_function = function (save_resp) {

								$this.parent().removeClass('has-error');

								var data = save_resp.data;
								plan.updateRow(data);

								$("#serviceplan-name-title").text(data.fields.name);
								//update the image if it has changed
								if (data.image == '') {
									var file = globals.MEDIA_URL + "/img/noimage.jpg";
								} else {
									var file = globals.MEDIA_URL + "/img/plan/" + data.image;
								}
								$("#serviceplan-img").attr('src', file);
							};
							break;
						case 'webhook':
							saved_function = function (save_resp) {
								var data = save_resp.data;
								webhook.updateRow(save_resp.data);

								$("#webhook-name-title").text(data.name);

								$this.parent().removeClass('has-error');
							};
							break;
						default:
							//throw an exception
							throw new CustomException('No matching object type for ' + object_type, 100);
					}

					var updateArr = $this.serializeArray();
					var idArr = $('#' + object_type + '-id').serializeArray();

					var data = {};
					for (var i in updateArr) {
						if (undefined == data[updateArr[i].name]) {
							data[updateArr[i].name] = updateArr[i].value;
						} else {
							data[updateArr[i].name] += ',' + updateArr[i].value;
						}
					}
					for (var i in idArr) {
						data[idArr[i].name] = idArr[i].value;
					}

					autoSaveObject('/' + object_type + '/save', object_type, data, saved_function, fail_function);
				} catch (err) {
					$this.parent().addClass('has-error');
					$this.focus();
					notify.errorBox(err.message, err.code);
				}
			});
		},
		disableAutoSave: function () {
			$('.tab-pane :input').off('change');
		}
	},
	status: {
		build: function ($parent, status) {
			var $status = $parent.find('.status-indicator');
			if ($status.length === 0) {
				$parent.prepend('<span class="status-indicator"></span>');
				$status = $parent.find('.status-indicator');
			}
			$status.attr('title', status);
			$status.attr('alt', status);
			$status.attr('title', status);
			$status.removeClass();
			$status.addClass('status-indicator')
			$status.addClass('status-' + status);
		}
	},
	tool: {
		generateGuid: function () {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000)
						.toString(16)
						.substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		},
		highlightElement: function ($element, highlight_color, delay_time, fallback_color) {
			var original_color = $element.css("background-color");
			if (typeof (fallback_color) !== 'undefined') {
				original_color = fallback_color;
			}
			var delay = 500;
			if (typeof (delay_time) !== 'undefined') {
				delay = parseInt(delay_time);
			}
			if (delay < 100) {
				delay = 100;
			}

			$element.animate(
					{
						'background-color': highlight_color
					}
			, 'slow', 'swing').delay(delay).animate(
					{
						'background-color': original_color
					}
			, 'slow', 'swing', function () {
				if (typeof (fallback_color) === 'undefined') {
					$element.css('background-color', '');
				}
			});
		},
		isDomainValid: function (domain) {
			var regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/g;
			return regex.test(domain);

		},
		isFunction: function (functionToCheck) {
			return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
		},
		isJson: function (str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		},
		isIPValid: function (ip) {
			var regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g;
			return regex.test(ip);

		},
		isUndefined: function (variable) {
			return typeof (variable) == 'undefined';
		},
		isUrlValid: function (url) {
			var regex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
			return regex.test(url);
		},
		setSearchTooltip: function () {
			var s = $('#header-search-input').siblings()[0];
			$(s).attr('data-toggle', 'tooltip');
			$(s).attr('data-placement', 'top');
			$(s).attr('title', 'Search');
			$('[data-toggle="tooltip"]').tooltip({
				trigger: 'hover'
			});
		},
		syntaxHighlight: function (json) {
			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
		},
	},
	tooltip: {
		set: function (el, title, placement) {
			el.attr('data-toggle', 'tooltip');
			el.attr('data-placement', placement);
			el.attr('title', title);
		},
		show: function () {
			$('[data-toggle="tooltip"]').tooltip({
				trigger: 'hover'
			});
		}
	},
	wait: {
		default_text: '',
		hide: function () {
			$(".wait").hide();
			$(".wait-text").html(entrypoint.wait.default_text);
		},
		show: function (text) {
			if (entrypoint.wait.default_text === '') {
				entrypoint.wait.default_text = $(".wait-text").html();
			}

			var html_text = text ? text : entrypoint.wait.default_text;

			$(".wait-text").html(html_text);
			$(".wait").show();
		}
	}
};

function CustomException(message, code) {
	this.message = message;
	this.code = code;
}

function autoSaveObject(url, object_type, data, functions, input_id) {
	autoSaveStartNotification();
	if (!entrypoint.tool.isUndefined(functions) && !entrypoint.tool.isUndefined(functions['before']) && entrypoint.tool.isFunction(functions['before'])) {
		functions['before'](input_id, data);
	}
	$.ajax({
		url: url,
		dataType: 'json',
		data: data,
		method: 'POST',
		success: function (resp) {
			if (resp.code) {
				notify.errorBox(resp.message, resp.code);
				autoSaveErrorNotification();
				if (!entrypoint.tool.isUndefined(functions) && !entrypoint.tool.isUndefined(functions['error']) && entrypoint.tool.isFunction(functions['error'])) {
					functions['error'](resp, input_id);
				}
			} else {
				autoSaveCompleteNotification();

				if (!entrypoint.tool.isUndefined(functions) && !entrypoint.tool.isUndefined(functions['complete']) && entrypoint.tool.isFunction(functions['complete'])) {
					functions['complete'](resp);
				}
			}
		}
	}).error(function () {
		notify.errorBox('Unable to save ' + object_type);
		autoSaveErrorNotification();
	}).always(function () {
		if (!entrypoint.tool.isUndefined(functions) && !entrypoint.tool.isUndefined(functions['always']) && entrypoint.tool.isFunction(functions['always'])) {
			functions['always'](input_id, data);
		}
	});
}

function autoSaveResetNotification() {
	var $info = $('#saving-status');
	if ($info.length > 0) {
		$('#saving-status').attr('class', '');
		$('#saving-status').attr('class', 'alert alert-success');
		$info.html('Status');//.fadeOut(1500);        
	}
}
function autoSaveCompleteNotification() {
	var $info = $('#saving-status');
	if ($info.length > 0) {
		$('#saving-status').attr('class', '');
		$('#saving-status').attr('class', 'alert alert-success');
		$info.html('Saved.');//.fadeOut(1500);        
	}
}
function autoSaveErrorNotification() {
	var $info = $('#saving-status');
	if ($info.length > 0) {
		$('#saving-status').attr('class', '');
		$('#saving-status').attr('class', 'alert alert-danger');
		$info.html('Error Saving.');
	}
}

function autoSaveStartNotification() {
	var $info = $('#saving-status');
	if ($info.length > 0) {
		$('#saving-status').attr('class', '');
		$('#saving-status').attr('class', 'alert alert-warning');
		$info.html('Saving...');
	}
}

function isEmailValid(email) {
	var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return regex.test(email);
}

function isJson(item) {
	item = typeof item !== "string"
			? JSON.stringify(item)
			: item;

	try {
		item = JSON.parse(item);
	} catch (e) {
		return false;
	}

	if (typeof item === "object" && item !== null) {
		return true;
	}

	return false;
}

function isPhonenumberValid(phone) {
	var regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
	return regex.test(phone);
}

function verifyFormRequired(form_element) {
	var error = false;
	var message = '';
	$(form_element + ' input,textarea,select').each(function (k, v) {
		var i = $(v);
		if (i.attr('required') !== undefined && i.val() === '') {
			message += i.attr('name') + ' not provided.</br>';
			error = true;
			i.parent().addClass('has-error');
		} else {
			i.parent().removeClass('has-error');
		}
	});

	if (error) {
		notify.errorBox('Required field(s) not provided.</br>' + message);
		throw '';
	}
}
