purr = {
	error: function (message, title, sticky) {
		message = message == undefined ? 'There is a error' : message;
		title = title == undefined ? '' : title;
		sticky = sticky == undefined ? false : sticky;

		var popup = this._buildPopup('notice', '/img/error-icon.png', message, title, sticky);
		this._triggerPopup(popup, sticky, 10000);
	},

	info: function (message, title, sticky) {
		message = message == undefined ? 'There is a notice' : message;
		title = title == undefined ? '' : title;
		sticky = sticky == undefined ? false : sticky;

		var popup = this._buildPopup('notice', '/img/info-icon.png', message, title, sticky);
		this._triggerPopup(popup, sticky, 3000);
	},

	warning: function (message, title, sticky) {
		message = message == undefined ? 'There is a warning' : message;
		title = title == undefined ? '' : title;
		sticky = sticky == undefined ? false : sticky;

		var popup = this._buildPopup('notice', '/img/warning-icon.png', message, title, sticky);
		this._triggerPopup(popup, sticky, 5000);
	},

	_buildPopup: function (type, image, message, title, sticky) {
		var popup = '<div class="' + type + '">';
		popup += '<div class="' + type + '-body">';
		popup += '<img src="' + image + '" width="50" heigth="50" />';
		if(title != '') {
			popup += '<h4>' + title + '</h4>';
		}
		popup += '<p>' + message + '</p>';
		popup += '</div>';
		popup += '<div class="' + type + '-bottom">';
		popup += '</div>';
		popup += '</div>';

		return popup;
	},

	_triggerPopup: function (html, sticky, timeout) {
		timeout = timeout == undefined ? 1500 : timeout;
		if(sticky) {
			$(html).purr({
				isSticky: true,
				usingTransparentPNG: true
			});
		} else {
			$(html).purr({
				fadeOutSpeed: timeout,
				usingTransparentPNG: true
			});
		}
	}
};