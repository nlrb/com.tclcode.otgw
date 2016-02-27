"use strict";

// OpenTherm Gateway Sensor Driver

var otgw = require('otg-api');

function createSensorDriver(driver) {
	var self = {

		init: function(devices, callback) {
			devices.forEach(function(device) {
				otgw.addDevice(self, device);
			});
			
			// we're ready
			callback();
		},
		
		capabilities: {
			measure_temperature: {
				get: function(device, callback) {
						// Assumption: sensor devices have only one value
						if (typeof callback == 'function') {
							callback(null, otgw.getValue('measure_temperature', device.watch[0].variable));
						}
				}
			},
			measure_pressure: {
				get: function(device, callback) {
						// Assumption: sensor devices have only one value
						if (typeof callback == 'function') {
							callback(null, otgw.getValue('measure_pressure', device.watch[0].variable));
						}
				}
			}
		},

		deleted: function(device_data) {
			// run when the user has deleted the device from Homey
			otgw.deleteDevice(device_data);
		},
		
		pair: function(socket) {
			otgw.debug('Sensor pairing has started...');

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
				otgw.addDevice(self, device);

				callback();
			});
		}
	}
	return self;
}

module.exports = { createSensorDriver: createSensorDriver };