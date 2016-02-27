"use strict"; 

// OpenTherm Gateway Temperature Sensor Driver 
 
var temperature = require('../sensor.js'); 
	 
module.exports = temperature.createSensorDriver('temperature'); 
