function startGatewaySelection(title) {
	$('#all').hide();
	Homey.on('select', function(gateways) {
		if (gateways.length > 1) {
			Homey.setTitle(__(title));
			for (var i = 0; i < gateways.length; i++) {
				var gateway = gateways[i];
				var checked = i == 0 ? ' checked' : '';
				var radioBtn = $('<input type="radio" name="select" id="' + gateway.id + '" value="' + gateway.id + '"' + checked + '>' +
					' <label>' + gateway.ip + ':' + gateway.port + '</label><br>');
				radioBtn.appendTo('#gatewayList');
			}
			$("input").on('click', function() {
				var sel = $('input:checked').val();
				Homey.emit('selected', sel);
			});
			Homey.emit('selected', gateways[0].id); // default is first gateway
			$('#all').show();
		} else if (gateways.length == 1) {
			Homey.on('authorized', function(found) {
				if (found) {
					Homey.showView('list_sensors');
				} else {
					Homey.alert(__('error.gateway_unavailable'), 'error');
					Homey.setNavigationClose();
				}
			});
			Homey.emit('selected', gateways[0].id)
		} else {
			$('#gatewayList').text(__('pair.select.add_gateway'));
			$('#all').show();
			Homey.setNavigationClose();
		}
	});
	Homey.emit('loaded');
}
