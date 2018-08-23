$body = $('body');
var disable_nav = false;

// CHECK TO SEE IF URL EXISTS
function checkURL() {
    if(!disable_nav) {        
        // bootstrap backdrop bug for ajax version
        if ($('.modal-backdrop')[0] && $.navAsAjax) {
            $('.modal-backdrop').remove();
        }

        //get the url by removing the hash
        var url = location.hash.replace(/^#/, '');
        // load the homepage if the hash is not present
        if (url === 'undefined' || url === '') {
            window.location.hash = '/account/services';
        }

        container = $('#content');
        // Do this if url exists (for page refresh, etc...)
        if (url) {
            // remove all active class
            $('nav li.active').removeClass("active");
            // match the url and add the active class
            $('nav li:has(a[href="' + url + '"])').addClass("active");
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
        },
        error: function (xhr, ajaxOptions, thrownError) {
            container.html('<h4 class="ajax-loading-error"><i class="fa fa-warning txt-color-orangeDark"></i> Error 404! Page not found.</h4>');
        },
        async: true
    });
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
    } catch (exception) {}
}

function processSearch(input, url) {
    var input = $(input)[0];
    var search = $.trim($(input).val());
    //only do the search if there are 3 or more characters
    if(search.length >= 3 || search == '*' || search == '') {
        if(search == '') {
            search = '*';
        }
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'html',
            data: {search: search}
        }).done(function (resp) {
            if (resp.code) {
                notify.title = 'An Error Occurred';
                notify.content = resp.message + '<br/>Code: ' + resp.code;
                notify.color = '#C46A69';
                notify.timeout = '6000';
                notify.icon = 'fa fa-warning';
                notify.number = 1;
                notify.smallBox();
                return;
            }
            $("#search-list").empty();
            //update values on the page
            $('#search-list').html(resp);
        }).fail(function (json, error) {
            if (json.message) {
                notify.content = json.message + '<br/>Code: ' + json.code;
            } else {
                notify.content = 'An unknown issue occurred. ' + error;
            }
            notify.title = 'An Error Occurred';
            notify.color = '#C46A69';
            notify.timeout = '6000';
            notify.icon = 'fa fa-warning';
            notify.number = 1;
            notify.smallBox();
        }).always(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });
    }
}

$(document).on('click', 'nav a[href!="#"], a.nav[href!="#"]', function (e) {
    e.preventDefault();
    var $this = $(e.currentTarget);

    // if parent is not active then get hash, or else page is assumed to be loaded
    if (disable_nav == false && !$this.parent().hasClass("active") && !$this.attr('target')) {

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
