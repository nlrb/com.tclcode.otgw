'use strict'

const OTGateway = require('../index.js')

var testExecuting = false;

function otgTest(cases) {
	if (!testExecuting) {
		// After 8 seconds, make sure all values needed for the tests are initialized
		setTimeout(function() {
			testExecuting = true;
			otg.debug(1, '>> Executing test case preparation: Reset Fault Flags');
			otg.processData('A60000000'); // reset status flags
			otg.processData('A60050000'); // reset fault flags
		}, 8000);
		// After 10 seconds
		if (cases == null || 'fault' in cases) {
			// Test action by creating a Low Water Pressure fault after 10 secs.
			setTimeout(function() {
				testExecuting = true;
				otg.debug(1, '>> Executing test case 1: Generic Fault');
				otg.processData('A60000001');
			}, 10000);
		}
		if (cases == null || 'lowpressure' in cases) {
			// Test action by creating a Low Water Pressure fault after 12 secs.
			setTimeout(function() {
				testExecuting = true;
				otg.debug(1, '>> Executing test case 2: Low Water Pressure Fault');
				otg.processData('A60050400');
			}, 12000);
		}
		// After 15 seconds
		if (cases == null || 'connection' in cases) {
			// Test lost connection by closing connection after 15 secs.
			setTimeout(function() {
				testExecuting = true;
				otg.debug(1, '>> Executing test case 3: Lost Connection');
				otg.client.pause();
			}, 15000);
		}
	}
	testExecuting = false;
}

const testcases = [
	{ time: 4, call: 'setDebug(2+8)', txt: 'Set debug level to API & test cases only' },
  { time: 5, call: 'setRoomHumidity(40)', txt: 'Set room humidity value' },
	{ time: 6, call: 'getValue("BoilerWaterTemperature")', txt: 'Get temperature of boiler water'},
	{ time: 7, call: 'getThermostatOverrideActive()', txt: 'Check if temperature override is active' },
	{ time: 8, call: 'setThermostatClock()', txt: 'Try to set the clock of the thermostat'},
	{ time: 10, call: 'getBoilerState()', txt: 'Check the state of the boiler' },
	{ time: 12, call: 'sendCommand("PR=A")', txt: 'Send a free-format command'},
	{ time: 20, call: 'getGatewayConfig()', txt: 'Get the configuration of the OTG'},
	{ time: 60, call: 'getAvailableVariables()', txt: 'Show all available variables' },
	{ time: 65, call: 'getAvailableSensors()', txt: 'Get a list of available sensors' },
	{ time: 80, call: 'setDebug(255)', txt: 'Turn on full logging'}
]

// Replace string below with own IP:port settings
var otg = new OTGateway('nl')

// Set debug level to all, buffer depth 5
otg.setDebug(255, 5)

// Log debug messages to console
otg.on('debug', (data) => {
  console.log(data.time, data.msg)
})

otg.on('response', (result, parsed) => {
	console.log('Received response', parsed, '(' + result + ')')
})

otg.openPort('192.168.1.71', 20108)

// Run all the tests
//otgTest(['fault', 'lowpressure', 'connection'])

for (let i = 0; i < testcases.length; i++) {
  setTimeout(() => {
    otg.debug(8, '>> Executing test case ' + (i+1) + ': ' + testcases[i].txt)
    var result = eval('otg.' + testcases[i].call)
    otg.debug(8, '>> Result:', result)
  }, testcases[i].time * 1000)
}
