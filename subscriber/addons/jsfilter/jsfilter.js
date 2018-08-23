(function ($) {
    var methods = {
        opt: null,
        init: function (options) {
            this.opt = $.extend({}, options);

            var $parent = $(this.opt.filter_location);
            var filters = this.opt.filters;
            var $holder = $(this.opt.items);

            // loop through filters and add them to the parent
            for (var i in filters) {
                var filter = filters[i];

                var $select = $('<select class="form-control form-control-sm"><option>Show All</option></select>');
                for (var j in filter.values) {
                    var val = filter.values[j];
                    $select.data('classname', filter.classname).append($("<option></option>")
                            .attr("value", val.value)
                            .text(val.display + '(' + val.count + ')'));
                }
                $select.on('change', function (e) {
                    e.preventDefault();

                    var $select = $(this);
                    var classname = '.' + $select.data('classname');
                    var value = $select.val();

                    if (value == 'Show All') {
                        $holder.find(classname + '.masonry-hidden').show('slow').removeClass('masonry-hidden');
                    } else {
                        //find currently hidden elements
                        $holder.find(classname).addClass('masonry-hidden');
                        $holder.find(classname + '-' + value).removeClass('masonry-hidden');
                        $holder.find(classname + '.masonry-hidden').hide('slow');
                        $holder.find(classname).not('.masonry-hidden').show('slow');
                    }
                    return false;
                });

                var $filter = $('<div class="form-group filter" />').html('<label>' + filter.name + '</label>').append($select);
                $parent.append($filter);
            }

            // loop through the items
            var func = this.opt.get_id;
            this.each(function (index, item) {
                var $item = $(item);

                var id = func($item);
                for (var i in filters) {
                    var filter = filters[i];
                    for (var j in filter.items) {
                        if (j == id) {
                            var it = filter.items[j];
                            var $div = $('<div />').addClass(filter.classname).addClass(filter.classname + '-' + it);
                            $item.wrap($div);
                        }
                    }
                }
            });

            return this;
        },
        show: function ( ) { }, // IS
        hide: function ( ) { }, // GOOD
        update: function (content) { }// !!!
    };

    $.fn.jsfilter = function (methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[ methodOrOptions ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.jsfilter');
        }
    };


})(jQuery);