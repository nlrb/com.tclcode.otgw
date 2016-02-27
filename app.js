"use strict";

var otgw = require('otg-api');
var net = require('net');

function init() {
	Homey.log("Starting OTG app");
	var network = Homey.manager('settings').get('network');
	if (network != null && network.ip != null && network.port != null) {
		var ok = otgw.openComm(network.ip, network.port);
		if (ok) {
			// Read app configuration & refresh back-end config
			var cfg = Homey.manager('settings').get('config');
			var ftr = Homey.manager('settings').get('features');
			otgw.updateConfig([{ var: 'config', val: cfg} , { var: 'features', val: ftr }]);
			// Register actions
			Homey.manager('flow').on('action.setOutsideTemperature', function(callback, args){
				otgw.setOutsideTemperature(args.temperature);
				callback(null, true);
			});
			Homey.manager('flow').on('action.setRoomHumidity', function(callback, args){
				otgw.setRoomHumidity(args);
				callback(null, true);
			});
			Homey.manager('settings').on('set', function(varName){
				if (varName == 'features' || varName == 'config') {
					var value = Homey.manager('settings').get(varName);
					otgw.updateConfig([{ var: varName, val: value }]);
				}
			});
		}
	}
}


var api = {
	openComm: otgw.openComm,
	setFeatures: otgw.setFeatures,
	getGatewayConfig: otgw.getGatewayConfig
}

module.exports = { 
	init: init,
	api: api
}