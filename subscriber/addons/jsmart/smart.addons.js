/************************* HAS ACCESS ********************************/
jSmart.prototype.registerPlugin(
		'block',
		'hasaccess',
		function(params, content, data, repeat) {
			console.log('jsmart block hasaccess');
			console.log(params);
			console.log(content);
			console.log(data);
			console.log(repeat);
			return 'You do not have access';
		}
);

/************************* IN LIST ********************************/
jSmart.prototype.registerPlugin(
		'function',
		'inlist',
		function(params, data) {
			console.log('jsmart function inlist');
			console.log(params);
			console.log(data);
			return '';
		}
);

/************************* IN SELECTED ********************************/
jSmart.prototype.registerPlugin(
		'function',
		'isselected',
		function(params, data) {
			console.log('jsmart function isselected');
			console.log(params);
			console.log(data);
			return '';
		}
);

/************************* IS ARRAY ********************************/
jSmart.prototype.registerPlugin(
		'modifier',
		'is_array',
		function(data) {
			var return_value = false;
			var type = global.type(data);
			if(type === 'Array' || type === 'Object') {
				return_value = true;
			}
			return return_value;
		}
);

/************************* PURR ********************************/
jSmart.prototype.registerPlugin(
		'function',
		'purr',
		function(params, data) {
			console.log('jsmart function purr');
			console.log(params);
			console.log(data);
			return '';
		}
);