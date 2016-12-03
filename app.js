"use strict";

var otgw = require('otg-api');
var net = require('net');

var locale = Homey.manager('i18n').getLanguage();

// Convert sensor type to display values in Insights
var units = {
	temperature: { en: '&deg;C' },
	pressure: { en: 'bar' },
	humidity: { en: '%' },
	co2: { en: '%' },
	flow: { en: 'l/hr', nl: 'l/uur'	},
	percentage: { en: '%' },
	binary: { en: '' }
}

var statusVars = otgw.getFlagVars('StatusFlags');
var faultVars = otgw.getFlagVars('FaultFlags');

// Insights handler
function insightsHandler(id, data) {
	var value = data.newRawValue;
	otgw.debug('Logging to Insights: ' + data.name + ' = ' + value);
	Homey.manager('insights').createEntry(data.name, value, null, function(err, success) {
		if (err) { otgw.debug('! Insights ' + err + ' (' + typeof value + ')'); }
	});
}

// Handler for status changes
function statusHandler(id, data) {
	if (data.oldValue != null) {
		// Cut of 'Status' and keep remaining part as token (e.g. LowWaterPressure)
		var flag = data.name.substr(6);
		otgw.debug("Sending trigger 'status' with token " + flag);
		Homey.manager('flow').trigger('status', { flag: flag }, { var: data.name });
	}
}

// Handler in case of a boiler fault code
function boilerFaultCodeHandler(id, data) {
	if (data.oldValue != null) {
		var oemFault = otgw.getValue(null, 'OEMFaultCode') || 'Not supported';
		var type = data.name.substr(5); // remove 'Fault'
		otgw.debug('Sending trigger for faultcode of type ' + type);
		Homey.manager('flow').trigger('faultcode', { type: type, OEM: oemFault }, { var: data.name });
	}
}

// Handler for override changes
function overrideHandler(id, data) {
	if (data.oldValue != null) {
		otgw.debug("Sending trigger 'override' with token " + data.newRawValue);
		Homey.manager('flow').trigger('override', { temp: data.newRawValue });
	}
}

// Handler for command responses
function responseHandler(id, data) {
	if (data.newRawValue != '') {
		otgw.debug("Sending trigger 'command' with value " + data.newTxtValue);
		Homey.manager('flow').trigger('command', { response: data.newRawValue, result: data.newTxtValue });
	}
}

// Flow triggers
var flow = {
	stat: { var: statusVars, handler: statusHandler },
	faultcode: { var: faultVars, handler: boilerFaultCodeHandler },
	override: { var: 'RemoteOverrideRoomSetpoint', handler: overrideHandler },
	response: { var: 'CommandResponse', handler: responseHandler }
};

// Default handler for speech input: talk back
function defaultSpeechHandler(id, speech) {
	var val = otgw.getValue(speechInfo[id].capability, speechInfo[id].var);
	if (val == null) {
		otgw.debug(__('speech.dont_know'));
		speech.say(__('speech.dont_know'));
	} else {
		val = val.toFixed(1);
		otgw.debug(__('speech.' + speechInfo[id].text, { arg: val }));
		speech.say(__('speech.' + speechInfo[id].text, { arg: val }));
	}
}

// Handler for boiler error question
function faultSpeechHandler(id, speech) {
	var errors = '';
	var cnt = 0;
	for (var i in speechInfo[id].var) {
		if (otgw.getValue(null, i)) {
			errors += speechInfo[id].var[i].txt[locale] + ' & ';
			cnt++;
		}
	}
	if (cnt == 0) {
		otgw.debug(__('speech.no_error'));
		speech.say(__('speech.no_error'));
	} else {
		errors = errors.slice(0, -3); // remove last ' & ';
		var txt;
		if (cnt == 1) {
			txt = __('speech.has_error', { cnt: cnt, error: errors });
		} else {
			txt = __('speech.has_errors', { cnt: cnt, errors: errors });
		}
		otgw.debug(txt);
		speech.say(txt);
	}
}

// Speech ids and actions
var speechInfo = [
	{ says: ['room', 'temp'], var: 'CurrentTemperature', capability: 'measure_temperature', text: 'room_temp' },
	{ says: ['target', 'temp'], var: 'CurrentSetpoint', capability: 'measure_temperature', text: 'room_target' },
	{ says: ['boiler', 'temp'], var: 'BoilerWaterTemperature', capability: 'measure_temperature', text: 'boiler_temp' },
	{ says: ['boiler', 'pressure'], var: 'CHWaterPressure', text: 'pressure' },
	{ says: ['wrong', 'boiler'], var: faultVars, handler: faultSpeechHandler }
]

// Start of the app
function init() {
	Homey.log("Starting OTG app");
	
	var network = Homey.manager('settings').get('network');
	if (network != null && network.ip != null && network.port != null) {
		var ok = otgw.openComm(network.ip, network.port);
		if (ok) {
			// Read app configuration & refresh back-end config
			var cfg = Homey.manager('settings').get('config');
			var ftr = Homey.manager('settings').get('features');
			var log = Homey.manager('settings').get('logging');
			otgw.updateConfig([{ var: 'config', val: cfg} , { var: 'features', val: ftr }]);
			
			// Register callback functions for value change triggers
			for (var f in flow) {
				// Variable, id, callback
				if (typeof flow[f].var == 'string') {
					otgw.registerWatch(flow[f].var, f, flow[f].handler);
				} else {
					for (var v in flow[f].var) {
						otgw.registerWatch(v, f, flow[f].handler);
					}
				}
			}
			// Register callback functions for Insights monitoring
			for (var l in log) {
				otgw.registerWatch(l, l, insightsHandler);
			}
			
			// Catch triggers
			Homey.manager('flow').on('trigger.status', function(callback, args, state) {
				var result = (otgw.getValue(null, state.var) == '0') != (args.values == 'on');
				otgw.debug('Checked action status for ' + state.var + ' = ' + args.values + ', result = ' + result);
				callback(null, result);
			});
			Homey.manager('flow').on('trigger.faultcode', function(callback, args, state) {
				var result = (otgw.getValue(null, state.var) == '0') != (args.values == 'on');
				otgw.debug('Checked action fault for ' + state.var + ' = ' + args.values + ', result = ' + result);
				callback(null, result);
			});
			Homey.manager('flow').on('trigger.override', function(callback, args, state) {
				var result = (otgw.getValue(null, 'RemoteOverrideRoomSetpoint') == '0.00') != (args.values == 'on');
				otgw.debug('Checked action override for ' + args.values + ', result = ' + result);
				callback(null, result);
			});
			
			// Check conditions
			Homey.manager('flow').on('condition.override', function(callback, args) {
				var override = otgw.getValue('measure_temperature', 'RemoteOverrideRoomSetpoint');
				var result = (override != null && override != '0.00');
				callback(null, result);
			});
			
			// Register actions
			Homey.manager('flow').on('action.setHotWater', function(callback, args) {
				var ok = otgw.setHotWater(args.mode);
				callback(null, ok);
			});
			Homey.manager('flow').on('action.setClock', function(callback, args) {
				var ok = otgw.setClock();
				callback(null, ok);
			});
			Homey.manager('flow').on('action.setOutsideTemperature', function(callback, args) {
				var ok = otgw.setOutsideTemperature(args.temperature);
				callback(null, ok);
			});
			Homey.manager('flow').on('action.setRoomHumidity', function(callback, args) {
				var ok = otgw.setRoomHumidity(args.humidity);
				callback(null, ok);
			});
			Homey.manager('flow').on('action.sendCommand', function(callback, args) {
				otgw.debug('Received sendCommand action trigger');
				var ok = otgw.sendCommand(args.command);
				callback(null, ok);
			});

			// Register speech action
			Homey.manager('speech-input').on('speech', function(list, callback) {
				var matched = false;
				otgw.debug('Received speech trigger');
				for (var i = 0; i < speechInfo.length; i++) {
					var match = 0;
					list.triggers.forEach(function(trigger) {
						for (var m = 0; m < speechInfo[i].says.length; m++) {
							if (trigger.id == speechInfo[i].says[m]) {
								match++;
							}
						}
					});
					matched = match == speechInfo[i].says.length;
					if (matched) {
						otgw.debug('Match on ' + speechInfo[i].says);
						var handler = speechInfo[i].handler || defaultSpeechHandler;
						handler(i, list);
					}
				}
				callback(matched ? null : true, matched ? true : null);
			});
			
			// Catch update of settings
			Homey.manager('settings').on('set', function(varName) {
				if (varName == 'features' || varName == 'config') {
					var value = Homey.manager('settings').get(varName);
					otgw.updateConfig([{ var: varName, val: value }]);
				} else if (varName == 'logging') {
					// Update Homey Insights; remove & add logs
					var logging = Homey.manager('settings').get(varName);
					Homey.manager('insights').getLogs(function(err, logs) {
						// Remove entries if needed
						for (var l in logs) {
							//otgw.debug(logs[l]);
							var name = logs[l].name;
							if (logging[name] == null) {
								// Remove entry
								otgw.debug('Removing log ' + name);
								Homey.manager('insights').deleteLog(name, function(err, success) {
									otgw.debug('deleteLog: ' + err + ' ' + success);
								});
								// TODO: do we need ID as well (don't have it)?
								otgw.removeWatch(name); 
							} 
						}
						// Add entries (even if they exist)
						// Workaround for async callbacks; hence needs separate function
						for (var l in logging) {
							var info = otgw.getVarDetails(l).data;
							if (info != null) {
								var label = { en: info.en, nl: info.nl };
								// Assumption: flags don't specify 'val' field
								var type = info.val == null ? 'boolean' : 'number';
								var unit = '';
								var decimals = (info.val == 'f8.8') ? 2 : 0;
								if (info.sensor != null) {
									unit = units[info.sensor];
								}
								// Version 0.8.23 or higher
								var options = { label: label, type: type, units: unit, decimals: decimals };
								Homey.manager('insights').createLog(l, options, function(err, logObj) {
									if (!err) {
										otgw.debug('createLog adding watch for ' + logObj.name);
										otgw.registerWatch(logObj.name, logObj.name, insightsHandler);
									}
								})
							} else {
								otgw.debug("How can we log " + l + " if it doesn't exist?");
							}
						}
					});
				}
			});
		}
	}
}


var api = {
	openComm: otgw.openComm,
	setFeatures: otgw.setFeatures,
	getGatewayConfig: otgw.getGatewayConfig,
	getGatewayVariables: otgw.getGatewayVariables,
	getLoggableVars: otgw.getLoggableVars
}

module.exports = { 
	init: init,
	api: api
}