$(document).on('click', ".service-action", function (e) {
    e.preventDefault();

    var type = $(this).data('tab');
    switch (type) {
        case 'billing':
            var id = $(this).data('id');
            $("#billing-service-id").val(id);
            $('.port-service').remove();
            $('#ports-listing').hide();
            $('#ports-loading').show();
            // show the port tab
            updateTab('tab-port');
            $(".subscribe-button").hide();
            $("#subscribe-next").show();
            $("#billingModal").modal('show');
            $.ajax({
                url: '/account/services',
                type: 'POST',
                dataType: 'json',
                data: {
                    'json': true
                }}).done(function (response) {
                if (response.message) {
                    notify.content = response.message + '<br/>Code: ' + response.code;
                    notify.title = 'An Error Occurred';


                    notify.icon = 'fa fa-exclamation-triangle';


                } else {
                    // check and see what services have been subscribed to and put a descirption on the port screen
                    if (response.services !== undefined && response.services.length > 0) {
                        for (var i in response.services) {
                            var service = response.services[i];
                            $('#port-' + service.Subscription['0'].Port.guid).append('<span class="port-service">' + service.name + '</span>');
                        }
                    }

                    // move the selected item to the next available service
                    $('#tab-port table tbody tr td').each(function () {
                        $this = $(this);
                        if ($this.children().length === 1) {
                            $this.find('input').prop('checked', true);
                            return false;
                        }
                    });

                    $('#ports-loading').hide();
                    $('#ports-listing').show();
                }
            }).fail(function (error) {
                location.reload();
            }).always(function () {
            });
            break;
        case 'subscribe':
            var id = $("#billing-service-id").val();

            var port_id = $(".device-port-id:checked").val();
            $("#magicModal").find('.modal-title').html('Provisioning Service');
            $("#magicModal").modal('show');
            $("#billingModal").modal('hide');
            setTimeout(ping('{/literal}{$smarty.const.BASE_URL}{literal}', '80', function (milliseconds) {
                if (milliseconds === -1) {
                    // let the use know there was a timeout issue
                } else {
                    $("#magicModal").modal('hide');
                    location.reload();
                }
            }), 3000);
            $.ajax({
                url: '/account/subscribe',
                type: 'POST',
                dataType: 'json',
                data: {
                    'service_id': id,
                    'device_port_id': port_id
                }}).done(function (response) {
                if (response.message) {
                    notify.content = response.message + '<br/>Code: ' + response.code;
                    notify.title = 'An Error Occurred';


                    notify.icon = 'fa fa-exclamation-triangle';


                } else {
                    location.reload();
                }
            }).fail(function (error) {
                if (error.message) {
                    message = error.message + '<br/>Code: ' + error.code;
                    notify.title = 'An Error Occurred';


                    notify.icon = 'fa fa-exclamation-triangle';


                } else {
                    location.reload();
                }
            }).always(function () {
            });
            break;
        case 'unsubscribe':
            var id = $(this).data('id');
            $('#unsubscribingModal').modal('show');

            $("#unsubscribe-button").on('click', function () {
                $('#unsubscribingModal').modal('hide');
                ;
                $("#magicModal").find('.modal-title').html('Unsubscribing....');
                $("#magicModal").modal('show')
                setTimeout(ping('{/literal}{$smarty.const.BASE_URL}{literal}', '80', function (milliseconds) {
                    if (milliseconds === -1) {
                        // let the use know there was a timeout issue
                    } else {
                        $("#magicModal").modal('hide');
                        location.reload();
                    }
                }), 5000);
                $.ajax({
                    url: '/account/unsubscribe',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        'service_id': id
                    }
                }).done(function (response) {
                    if (response.code) {
                        notify.content = response.message + '<br/>Code: ' + response.code;
                        notify.title = 'An Error Occurred';


                        notify.icon = 'fa fa-exclamation-triangle';


                    } else {
                        location.reload();
                    }
                }).fail(function (error) {
                    if (error.code) {
                        message = error.message + '<br/>Code: ' + error.code;
                        notify.title = 'An Error Occurred';


                        notify.icon = 'fa fa-exclamation-triangle';


                    } else {
                        location.reload();
                    }
                }).always(function () {
                    $('#unsubscribingModal').modal('hide');
                });

            });
            break;
    }
    return false;
});