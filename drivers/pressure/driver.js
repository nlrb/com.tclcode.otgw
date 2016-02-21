"use strict";

// OpenTherm Gateway Pressure Sensor Driver

var pressure = require('../sensor.js');
	
module.exports = pressure.createSensorDriver('pressure');
