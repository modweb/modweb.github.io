var entrypoint = {
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
	notify: {
		color: {
			error: '#C46A69',
			info: '#00ccff',
			info_accent: '',
			success: '#739E73'
		},
		hanger: {
			dismiss: function (message, type) {
				$("body").overhang({
					type: "confirm",
					primary: "#40D47E",
					accent: "#27AE60",
					yesColor: "#3498DB",
					message: "Do you want to continue?",
					overlay: true,
					callback: function (value) {
						var response = value ? "Yes" : "No";
						alert("You made your selection of: " + response);
					}
				});
			}
		}
	},
	tool: {
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
		isIPValid: function (ip) {
			var regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g;
			return regex.test(ip);

		},
		isJson: function (str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
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
	},
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