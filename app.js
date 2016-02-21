"use strict";

var otgw = require('otg-api');
var net = require('net');

function init() {
	Homey.log("Starting OTG app");
	var ip_addr = Homey.manager('settings').get('ip');
	var ip_port = Homey.manager('settings').get('port');
	var ok = otgw.openComm(ip_addr, ip_port);
	if (ok) {
		var features = Homey.manager('settings').get('features');
		ok = otgw.setFeatures(features);
	}
}

var api = {
	openComm: otgw.openComm,
	found: otgw.checkFound,
	setFeatures: otgw.setFeatures
}

module.exports = { 
	init: init,
	api: api
}