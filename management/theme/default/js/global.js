$body = $('body');
var nav_object = null;
// CHECK TO SEE IF URL EXISTS
function checkURL() {
    // bootstrap backdrop bug for ajax version
    if ($('.modal-backdrop')[0] && $.navAsAjax) {
        $('.modal-backdrop').remove();
    }

    //get the url by removing the hash
    var url = location.hash.replace(/^#/, '');

    // if the data after the url can be decoded decode it
    var test_url = decodeURIComponent(url);

    //check if the url is json (if it is there there is magic that needs to happen
    if (isJson(test_url)) {
        // hide any modals that are visible
        $('.modal.fv-modal-stack').each(function (k, v) {
            $modal = $(v);
            clearModal($modal);
        });
        $('.modal-backdrop.fv-modal-stack').remove();
        nav_object = JSON.parse(test_url);
        url = nav_object.url;
        // update the hash so that reloads aren't too weird
        window.location.hash = url;
    }

    // load the homepage if the hash is not present
    if (url === 'undefined' || url === '') {
        window.location.hash = '/provider/list';
    }

    container = $('#content');
    // Do this if url exists (for page refresh, etc...)
    if (url) {
        // remove all active class
        $('nav li.active').removeClass("active");
        // match the url and add the active class
        $('nav a[href="' + url + '"]').parent().addClass("active");
        //open up the slider for the page that is being displayed
        $('nav a[href="' + url + '"]').parents('ul').slideDown();
        var title = ($('nav a[href="' + url + '"]').attr('title'));

        // change page title from global var
        document.title = (title || document.title);

        // parse url to jquery
        loadURL(url + location.search, container);
    } else {
        // grab the first URL from nav
        var $this = $('nav > ul > li:first-child > a[href!="#"]');

        //update hash
        window.location.hash = $this.attr('href');
    }

}

// LOAD AJAX PAGES
function loadURL(url, container) {
    $.ajax({
        type: "POST",
        url: url,
        dataType: 'html',
        data: {html: true},
        cache: true, // (warning: setting it to false will cause a timestamp and will call the request twice)
        beforeSend: function () {
            // place cog
            container.html('<h1 class="ajax-loading-animation"><i class="fa fa-spinner fa-spin"></i> Loading...</h1>');
        },
        success: function (data) {
            container.css({
                opacity: '0.0'
            }).html(data).delay(50).animate({
                opacity: '1.0'
            }, 300);

            // after loading the screen see if any actions need to be performed
            if (nav_object != null) {
                // if there is a search parameter and there is a search on the new screen perform the search
                if (nav_object.search !== undefined && $('#header-search-input').length > 0) {
                    $('#header-search-input').val(nav_object.search);
                    $('#header-search-input').trigger('keyup');
                }
                // perform any additional actions
                if (nav_object.actions !== undefined) {
                    performNavigationAction(nav_object.actions);
                }
                nav_object = null;
            }
            if ($("#header-search-input")) {
                $("#header-search-input").focus();
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            container.html('<h4 class="ajax-loading-error"><i class="fa fa-warning txt-color-orangeDark"></i> Error 404! Page not found.</h4>');
        },
        async: true
    });
}

function performNavigationAction(actions) {
    if (actions.length > 0) {
        var act = actions.shift();

        switch (act.action) {
            case 'ajax_wait_click':
                $(document).ajaxStop(function () {
                    $(document).off("ajaxStop");
                    var selector = act.selector.replace(/\+/g, ' ');

                    //wait 1 second before performing the click event
                    setTimeout(function () {
                        var $item = $(selector);
                        if ($item.length === 0) {
                            notify.errorBox('The wait for click action you wanted to be performed could not be performed because the selector is not on the page.');
                        } else {
                            $item.trigger('click');
                            performNavigationAction(actions);
                        }
                    }, 500);
                });
                break;
            case 'click':
                var selector = act.selector.replace(/\+/g, ' ');
                var $item = $(selector);
                if ($item.length === 0) {
                    notify.errorBox('The click action you wanted to be performed could not be performed because the selector is not on the page.');
                } else {
                    $item.trigger('click');
                    performNavigationAction(actions);
                }
                break;
            case 'wait':
                var timeout = (act.timeout !== undefined ? parseInt(act.timeout) : 100);
                setTimeout(function () {
                    performNavigationAction(actions);
                }, timeout);
                break;
        }

    }
}

function ping(host, port, pong) {
    var started = new Date().getTime();

    var http = new XMLHttpRequest();
    http.timeout = 10000;
    http.ontimeout = function () {
        if (pong !== null) {
            pong(-1);
        }
    }

    http.open("GET", "http://" + host + ":" + port, /*async*/true);
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            var ended = new Date().getTime();

            var milliseconds = ended - started;
            if (pong !== null) {
                pong(milliseconds);
            }
        }
    };
    try {
        http.send(null);
    } catch (exception) {
    }
}

var timer = null;
function processSearch(input, url) {
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
                dataType: 'html',
                data: {search: search}
            }).done(function (resp) {
                if (resp.code) {
                    notify.errorBox(resp.message, resp.code);
                    return;
                }
                $("#search-list").empty();
                //update values on the page
                $('#search-list').html(resp);
                //$(".pagination li.first").trigger('click');
            }).fail(function (json, error) {
                if (json.message) {
                    message = json.message;
                    ;
                } else {
                    message = 'An unknown issue occurred. ' + error;
                }
                notify.errorBox(message, json.code);
            }).always(function () {
                $('[data-toggle="tooltip"]').tooltip();
            }).complete(function () {
                entrypoint.wait.hide();
            });
        }, 300);
    }
}

function showProcessing() {
    var $processing = $('.processing');
    if ($processing.length == 0) {
        $(document).find('body').append('<div class="processing"><div class="wait-overlay"></div><h1 class="wait-text"><i class="fa fa-spinner fa-spin"></i> Processing...</h1></div>');
        $processing = $('.processing');
    }
    $processing.show();
}

function hideProcessing() {
    $(".processing").hide();
}
$(document).on('click', 'nav a[href!="#"], a.nav[href!="#"]', function (e) {
    e.preventDefault();
    var $this = $(e.currentTarget);

    // if parent is not active then get hash, or else page is assumed to be loaded
    if (!$this.parent().hasClass("active") && !$this.attr('target')) {

        // update window with hash
        // you could also do here:  $.device === "mobile" - and save a little more memory

        if ($body.hasClass('mobile-view-activated')) {
            $body.removeClass('hidden-menu');
            window.setTimeout(function () {
                if (window.location.search) {
                    window.location.href =
                            window.location.href.replace(window.location.search, '')
                            .replace(window.location.hash, '') + '#' + $this.attr('href');
                } else {
                    window.location.hash = $this.attr('href');
                }
            }, 150);
            // it may not need this delay...
        } else {
            if (window.location.search) {
                window.location.href =
                        window.location.href.replace(window.location.search, '')
                        .replace(window.location.hash, '') + '#' + $this.attr('href');
            } else {
                window.location.hash = $this.attr('href');
            }
        }
    }
});

// fire links with targets on different window
$(document).on('click', 'nav a[target="_blank"], a.nav[target="_blank"]', function (e) {
    e.preventDefault();
    var $this = $(e.currentTarget);

    var newWnd = window.open($this.attr('href'));
	newWnd.opener = null;
});

// fire links with targets on same window
$(document).on('click', 'nav a[target="_top"], a.nav[target="_top"]', function (e) {
    e.preventDefault();
    var $this = $(e.currentTarget);

    window.location = ($this.attr('href'));
});

// all links with hash tags are ignored
$(document).on('click', 'nav a[href="#"], a.nav[href="#"]', function (e) {
    e.preventDefault();
});

// DO on hash change
$(window).on('hashchange', function () {
    checkURL();
});

$(document).ready(function () {
    if ($('#login-form').length === 0) {
        checkURL();
    }
});

$.fn.OneClickSelect = function () {
    return $(this).on('click', function () {

        var element = this;
        var range, selection;

        if($(element).hasClass('clipboard')) {            
            // get / create empty span
            if($("#clipboard-text").length == 0) {                
                $('<span>').attr({
                    id: 'clipboard-text'
                }).appendTo('body');
            }
            
            if($(element).data('clipboard-text')) {
                var $span = $(document).find("#clipboard-text");
                $span.text($(element).data('clipboard-text'))
                element = $span.get(0);
            }
        }
        
        if (window.getSelection) {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText(element);
            range.select();
        }

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
        } catch (err) {
            console.log('Oops, unable to copy');
        }
    });
};

$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};    