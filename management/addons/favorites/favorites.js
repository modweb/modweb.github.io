;
(function($) {
	"use strict";

	function Favorites($el, opts) {
		var defaultOptions = {
			/*####### FUNCTIONS ########*/
			afterSelect: function() {
			},
			/*####### VARIABLES ########*/
			key: '',
			list: {},
			/*####### TEMPLATES ########*/
			dropdownTemplate: 'shared/favorites/dropdown',
			editTemplate: 'shared/favorites/edit',
			popupTemplate: 'shared/favorites/popup'
		};

		// set variables
		this.opts = $.extend({}, defaultOptions, opts);
		this.$el = $el;
		this.$dropdown = null;
		this.$favorites = null;

		this.$el.data('favorites', this);

		// initialize object
		this.init();
	}

	Favorites.prototype.erase = function($element) {
		// get id of the favorite so that the right one will  be turned on and off
		var id = $element.parents('.favorite').data('id');
		//send information to backend to update the histoyr
		global.updatePreference({'action': 'remove', 'preference': {'id': id, 'key': this.opts.key}}, 'Favorite', function() {
			$('body .tooltip').hide();
			$element.parents('.favorite').parent().remove();
		});
	};
	Favorites.prototype.edit = function($element) {
		// load the edit template and put it in the body
		var edit_template = global.getTemplate(this.opts.editTemplate);
		$('body').append(edit_template);

		var modal = $('#favorite_edit_modal');
		var item = $element.parents('.favorite');
		var id = item.data('id');
		var name = item.find('.name').html();
		name = name.replace(/\s+/g, ' ');
		if (item.find('.icon-star').length === 0) {
			modal.find('#inputFavorite').attr('checked', '');
		} else {
			modal.find('#inputFavorite').attr('checked', 'checked');
		}
		modal.find('#hiddenId').val(id);
		modal.find('#inputName').val(name);
		modal.modal('show');
		setTimeout(function() {
			modal.find('#inputName').select();
		}, 250);
		var fav = this;
		$('#edit_modal_save').on('click', function(e) {
			e.stopPropagation();

			fav.editSave();

			var modal = $('#favorite_edit_modal');
			modal.modal('hide');
			modal.remove();
		});
	};
	Favorites.prototype.editSave = function() {
		var id = $('#hiddenId').val();
		var name = $('#inputName').val();
		var favorite = $('#inputFavorite').is(':checked');

		var perf = {'action': 'update', 'preference': {'id': id, 'name': name, 'favorite': favorite, 'key': this.opts.key}};
		var fav = this;
		global.updatePreference(perf, 'Update Favorite', function(favorite) {
			// update the favorite in the list
			for (var i in fav.opts.list) {
				if (i === favorite.id) {
					fav.opts.list[i] = favorite;
				}
			}
			// update the dropdown to reflect the changes
			fav.updateDropdown();
		});

	};
	Favorites.prototype.favorite = function($element) {
		var id = $element.parents('.favorite').data('id');
		//send information to backend to update the histoyr
		global.updatePreference({'action': 'favorite', 'preference': {'id': id, 'key': this.opts.key}}, 'Favorite', function(favorite) {
			if (favorite.favorite === 1 || favorite.favorite === 'true') {
				$element.removeClass('icon-star-empty ').addClass('icon-star icon-orange');
			} else {
				$element.addClass('icon-star-empty').removeClass('icon-star icon-orange');
			}
		});
	};
	Favorites.prototype.init = function() {
		// load the dropdown
		this.$favorites = $(global.getTemplate(this.opts.dropdownTemplate));
		this.$el.before(this.$favorites);

		// update the dropdown with the favorites
		this.updateDropdown();

		// set up the live functions
		this.live();
	};
	Favorites.prototype.live = function() {
		var fav = this;
		this.$dropdown.on('click', 'a.favorite', function(e) {
			fav.select($(this));
		});
		this.$dropdown.on('click', 'a.favorite .delete', function(e) {
			// stop from propagating because it is inside of an anchor tag
			e.stopPropagation();
			// remove favorite
			fav.erase($(this));
		});
		this.$dropdown.on('click', 'a.favorite .edit', function(e) {
			// stop from propagating because it is inside of an anchor tag
			e.stopPropagation();
			// remove favorite
			fav.edit($(this));
		});
		this.$dropdown.on('click', 'a.favorite .favorite', function(e) {
			// stop from propagating because it is inside of an anchor tag
			e.stopPropagation();
			// remove favorite
			fav.favorite($(this));
		});
	};
	Favorites.prototype.refresh = function() {
		this.$favorites.find('.favorites a.favorite').popover({html: true});
		this.$favorites.find('.favorites a.favorite i').tooltip({container: 'body'});
	};
	Favorites.prototype.select = function($element) {
		var id = $element.data('id');
		var fav = null;
		for (var i in this.opts.list) {
			if (this.opts.list[i].id === id) {
				fav = this.opts.list[i];
				break;
			}
		}
		if (typeof(this.opts.afterSelect) === 'function') {
			this.opts.afterSelect(fav);
		}
	};
	Favorites.prototype.updateDropdown = function(list) {
		var myList = list === undefined ? this.opts.list : list;
		if (this.$dropdown === null) {
			this.$dropdown = this.$favorites.find('.favorites');
		}
		var html = global.populateTemplate(this.opts.popupTemplate, {'favorites': myList});
		this.$dropdown.html(html);

		this.refresh();
	};

	$.fn.extend({
		favorites: function(command, options) {
			var opts = options;
			var com = command;
			if (options === undefined) {
				opts = command;
				com = 'init';
			}
			try {
				if (com === 'init' && typeof(command) !== 'string') {
					if (typeof(global) === 'undefined') {
						throw 'Global Functions are required for favorites to work.';
					}
					if (!$().modal) {
						throw 'Modal Popup is required for favorites to work.';
					}
					if (opts.key === '') {
						throw 'Missing favorites key for favorites to work.';
					}
					if (typeof(opts.list) !== 'object') {
						throw 'Missing favorites list for favorites to work.';
					}
				}
			} catch (e) {
				alert(e);
			}
			return this.each(function() {
				var element = $(this);
				var favs = element.data('favorites');
				if (favs === undefined) {
					new Favorites(element, opts);
				} else {
					switch (command) {
						case 'update':
							favs.updateDropdown(options.list);
							break;
						default:
							purr.warning('Unable to process favorites request [' + command + ']', 'Favorites');
							break;
					}
				}
			});
		}
	});
})(jQuery);