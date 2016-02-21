"use strict";

// OpenTherm Gateway Thermostat Driver

var otgw = require('otg-api');
	
var self = module.exports = {
	
	init: function(devices, callback) {
		devices.forEach(function(device) {
			otgw.addDevice(self, device, 'thermostat');
			self.realtime(device, 'target_temperature', otgw.getValue('CurrentSetpoint'))								
			self.realtime(device, 'measure_temperature', otgw.getValue('CurrentTemperature'))								
		});
		
		// we're ready
		callback();
	},
	
	capabilities: {
		target_temperature: {
			get: function(device, callback) {
					if (typeof callback == 'function') {
						callback(null, otgw.getValue('CurrentSetpoint'));
					}
			},
			set: function(device, target_temperature, callback) {
				
				if (target_temperature < 5) target_temperature = 5;
				if (target_temperature > 30) target_temperature = 30;
				
				var tt = Math.round(target_temperature * 2) / 2;
				otgw.setTargetTemp(device, tt);
				self.realtime(device, 'target_temperature', tt);
			}
		},
		measure_temperature: {
			get: function(device, callback) {
					if (typeof callback == 'function') {
						callback(null, otgw.getValue('CurrentTemperature'));
					}
			}
		},
		thermostat_state: {
			get: function(device, callback) {
					if (typeof callback == 'function') {
						Homey.log(otgw.getThermostatState(device));
						callback(null, otgw.getThermostatState(device));
					}
			}
		}
	},
	
	deleted: function(device_data) {
		// run when the user has deleted the device from Homey
		otgw.deleteDevice(device_data);
	},
	
	pair: function(socket) {
		Homey.log('OpenTherm Gateway pairing has started...');

		// Check if we found it
		socket.emit('authorized', otgw.checkFound());

		// this method is run when Homey.emit('list_devices') is run on the front-end
		// which happens when you use the template `list_devices`
		socket.on('list_devices', function(data, callback) {
			var devices = otgw.getThermostats();
			
			// err, result style
			callback(null, devices);
		});

		// Update driver administration when a device is added
		socket.on('add_device', function(device_data, callback) {
			var device = device_data['data'];
			otgw.addDevice(self, device, 'thermostat');

			callback();
		});
	}
}
