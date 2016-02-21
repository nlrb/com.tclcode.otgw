"use strict";

// OpenTherm Gateway Sensor Driver

var otgw = require('otg-api');

function createSensorDriver(driver) {
	var self = {
	
		init: function(devices, callback) {
			devices.forEach(function(device) {
				otgw.addDevice(self, device, 'temperature');
				// Assumption: sensor devices have only one value
				var val = otgw.getValue(device.watch[0].variable);
				if (val) {
					self.realtime(device, 'measure_temperature', val);
				}
			});
			
			// we're ready
			callback();
		},
		
		capabilities: {
			measure_temperature: {
				get: function(device, callback) {
						if (typeof callback == 'function') {
							// Assumption: sensor devices have only one value
							callback(null, otgw.getValue(device.watch[0].variable));
						}
				}
			}
		},

		deleted: function(device_data) {
			// run when the user has deleted the device from Homey
			otgw.deleteDevice(device_data);
		},
		
		pair: function(socket) {
			Homey.log('Sensor pairing has started...');

			// Check if we have found and OTG
			socket.emit('authorized', otgw.checkFound());

			// this method is run when Homey.emit('list_devices') is run on the front-end
			// which happens when you use the template `list_devices`
			socket.on('list_devices', function(data, callback) {
				var devices = otgw.getSensors(driver);

				// err, result style
				callback(null, devices);
			});

			// Update driver administration when a device is added
			socket.on('add_device', function(device_data, callback) {
				var device = device_data['data'];
				otgw.addDevice(self, device, driver);

				callback();
			});
		}
	}
	return self;
}

module.exports = { createSensorDriver: createSensorDriver };
