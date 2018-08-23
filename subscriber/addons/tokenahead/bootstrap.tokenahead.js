!function($) {

	"use strict"; // jshint ;_;


	/* TOKENAHEAD PUBLIC CLASS DEFINITION
	 * ================================== */

	var Tokenahead = function(element, options) {
		this.$wrapper = $(element);
		this.$measurer = $('.measurer', this.$wrapper);
		this.$tokens = $('.tokens', this.$wrapper);
		$.fn.typeahead.Constructor.call(this, $('input', this.$wrapper), options);
	};

	Tokenahead.prototype = $.extend({}, $.fn.typeahead.Constructor.prototype, {
		constructor: Tokenahead,
		updater: function(item) {
			this.addToken(item);
			return '';
		},
		addToken: function(item) {
			if(typeof this.options.addToken === 'function') {
				this.options.addToken(item, this.$tokens);
			} else {
				var token = $(this.options.token);
				var text = $('<span></span>').text(item).appendTo(token);
				token.appendTo(this.$tokens);
			}
		},
		listen: function() {
			var that = this;

			$.fn.typeahead.Constructor.prototype.listen.call(this);

			this.$wrapper.on('click', 'a', function(e) {
				e.stopPropagation();
			}).on('click', '.close', function(e) {
				$(this).parent().remove();
			}).on('click', function() {
				that.$element.focus();
			});

			this.$element.on('focus', function(e) {
				if (!that.$element.val()) {
					return that.isEmpty = true;
				}
			}).on('keyup', function(e) {
				var tokens, value;

				if (e.keyCode === 13 && !that.shown && (value = that.$element.val())) { //enter with no menu and val
					that.$element.val('').change();
					that.addToken(value);
					return that.$element.focus();
				}

				if (e.keyCode !== 8 || that.$element.val()) {
					return that.isEmpty = false;//backspace
				}
				if (!that.isEmpty) {
					return that.isEmpty = true;
				}
				tokens = $('a', that.$wrapper);
				if (!tokens.length) {
					return;
				}
				tokens.last().remove();
			}).on('keypress keydown paste', function() {
				var value = that.$element.val();
				that.$measurer.text(value);
				that.$element.css('width', that.$measurer.width() + 30);
			});
		}

	});

	/* TOKENAHEAD PLUGIN DEFINITION
	 * ============================ */

	$.fn.tokenahead = function(option) {
		return this.each(function() {
			var $this = $(this);
			var data = $this.data('tokenahead');
			var options = typeof option === 'object' && option;
			if (!data)
				$this.data('tokenahead', (data = new Tokenahead(this, options)));
			if (typeof option === 'string')
				data[option]();
		});
	};

	$.fn.tokenahead.Constructor = Tokenahead;

	$.fn.tokenahead.defaults = $.extend({}, $.fn.typeahead.defaults, {
		token: '<a><button class="close">&times;</button></a>'
	});

}(window.jQuery);