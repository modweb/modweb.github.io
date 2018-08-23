var socketfuncs = {
	_debug: true,
	_conn: null,

	channels: {},

	init: function (host, port, onopen_function, onmessage_function, onclose_function) {
		$.ajax({
			url: '/ping',
			data: {
				host: host,
				port: port,
				type: 'ws'
			},
			dataType: 'json'
		}).success(function (resp) {
			if (resp.code !== undefined) {
				console.log('Error finding the messaging server.');
			} else {
				var milliseconds = resp.milliseconds;
				if (milliseconds === -1) {
					console.log('Messaging server does not appear to be up');
				} else {
					socketfuncs._conn = new WebSocket('ws://' + host + ':' + port);
					if (entrypoint.tool.isFunction(onopen_function)) {
						socketfuncs._conn.onopen = onopen_function;
					}
					if (entrypoint.tool.isFunction(onmessage_function)) {
						socketfuncs._conn.onmessage = onmessage_function;
					}
					if (entrypoint.tool.isFunction(onclose_function)) {
						socketfuncs._conn.onclose = onclose_function;
					}
				}
			}
		}).error(function (error) {
			console.log('Error finding the messaging server.');

		});
	},
	log: function (message, override) {
		var log_message = override !== undefined ? override : socketfuncs._debug;
		if (log_message) {
			console.log(message);
		}
	},

	subscribe: function (channel, message_function) {
		if (this._checkConnection()) {
			this._waitForSocketConnection(function () {
				var conn = socketfuncs._conn;

				conn.send(JSON.stringify({command: "subscribe", channel: channel}));
				socketfuncs.channels[channel] = message_function;
				socketfuncs.log('Subscribed to ' + channel + ' channel.');
			});
		} else {
			socketfuncs.log('Connection is already closed');
		}
	},

	unsubscribe: function (channel) {

		if (this._checkConnection()) {
			this._waitForSocketConnection(function () {
				var conn = socketfuncs._conn;

				conn.send(JSON.stringify({command: "unsubscribe", channel: channel}));
				socketfuncs.log('Unsubscribed from ' + channel + ' channel.');
			});
		} else {
			socketfuncs.log('Connection is already closed');
		}
	},

	_checkConnection: function () {
		var conn = socketfuncs._conn;

		if (conn.readyState === 2 || conn.readyState === 3) {
			socketfuncs.log('Connection is closed.');
			return false;
		}
		socketfuncs.log('Connection is open.');
		return true;
	},

	_waitForSocketConnection: function (callback) {
		setTimeout(
				function () {
					var conn = socketfuncs._conn;
					if (conn.readyState === 1) {
						if (entrypoint.tool.isFunction(callback) !== false) {
							callback();
							socketfuncs.log('Callback complete');
						}
						socketfuncs.log('Communication complete');
						return;
					} else {
						socketfuncs.log('Waiting for connection to be established');
						socketfuncs._waitForSocketConnection(callback);
					}
				}, 5); // wait 5 milisecond for the connection...
	}

};