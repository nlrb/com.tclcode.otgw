'use strict'

const Homey = require('homey')

const APP_DBG = 1

// Speech ids and actions
const speechInfo = {
	roomtemp: { var: 'CurrentTemperature', text: 'room_temp' },
	targettemp: { var: 'CurrentSetpoint', text: 'room_target' },
	boilertemp: { var: 'BoilerWaterTemperature', text: 'boiler_temp' },
	pressure: { var: 'CHWaterPressure', text: 'pressure' },
	problem: { handler: 'faultSpeechHandler' }
}

class OpenThermGatewayApp extends Homey.App {

	/** addGateway
	 ** @param api {class}
	 ** @param id {string} (optional) Homey ID of the Gateway device
	 */
	addGateway(api, id) {
		id = id || ('OTG:' + api.ip.addr + ':' + api.ip.port)
		this.log('Adding gateway with ID', id)
		if (this.gateways[id] === undefined) {
			this.gateways[id] = api
			this.gateways[id].on('debug', data => {
				this.debug(data)
			})
			this.gateways[id].on('found', data => {
				if (data.found) {
					this.emit('available', id)
				} else {
					this.emit('unavailable', id)
				}
			})
			this.gateways[id].setDebug(this.logLevel || 3)
			this.emit('available', id)
		} else {
			throw new Error('Gateway ' + id + ' already present')
		}
		return id
	}

	deleteGateway(id) {
		if (this.gateways[id] !== undefined) {
			this.gateways[id].closePort()
			this.emit('unavailable', id)
			delete this.gateways[id]
		}
	}

	getGateway(id) {
		return this.gateways[id]
	}

	getGatewayList() {
		let gateways = []
		for (let g in this.gateways) {
			gateways.push({ id: g, ip: this.gateways[g].ip.addr, port: this.gateways[g].ip.port })
		}
		return gateways
	}

	debug(data) {
		console.log(data.time, data.msg)
		this.debugBuf.unshift({ time: data.time, msg: data.msg })
		if (this.debugBuf.length > 50) {
			this.debugBuf.pop()
		}
		this.homey.api.realtime('debug', this.debugBuf)
	}

	// Default handler for speech input: talk back
	defaultSpeechHandler(id, speech) {
		let gateways = this.getGatewayList()
		for (let g in gateways) {
			let gw = this.getGateway(gateways[g].id)
			let val = gw.getValue(speechInfo[id].var)
			if (val == null) {
				gw.debug(APP_DBG, this.homey.__('speech.dont_know'))
				speech.say(this.homey.__('speech.dont_know'))
			} else {
				val = val.toFixed(1)
				gw.debug(APP_DBG, this.homey.__('speech.' + speechInfo[id].text, { arg: val }))
				speech.say(this.homey.__('speech.' + speechInfo[id].text, { arg: val }))
			}
		}
	}

	// Handler for boiler error question
	async faultSpeechHandler(id, speech) {
		let gateways = this.getGatewayList()
		for (let g in gateways) {
			let gw = this.getGateway(gateways[g].id)
			let errors = ''
			let cnt = 0
			const locale = await this.homey.i18n.getLanguage()
			const faultVars = gw.getFlagVariables('FaultFlags')
			for (let i in faultVars) {
				if (gw.getValue(i)) {
					errors += faultVars[i].txt[locale] + ' & '
					cnt++
				}
			}
			if (cnt === 0) {
				gw.debug(APP_DBG, this.homey.__('speech.no_error'))
				speech.say(this.homey.__('speech.no_error'))
			} else {
				errors = errors.slice(0, -3) // remove last ' & '
				let txt
				if (cnt === 1) {
					txt = this.homey.__('speech.has_error', { cnt: cnt, error: errors })
				} else {
					txt = this.homey.__('speech.has_errors', { cnt: cnt, errors: errors })
				}
				gw.debug(APP_DBG, txt)
				speech.say(txt)
			}
		}
	}

	// App start
	async onInit() {
		this.log('Starting OpenThermGatewayApp')
		this.locale = await this.homey.i18n.getLanguage()
		this.gateways = []
		this.debugBuf = []
		this.logLevel = await this.homey.settings.get('logLevel')

		// Catch app settings updates
		this.homey.settings.on('set', async key => {
			if (key ==='logLevel') {
				this.logLevel = await this.homey.settings.get('logLevel')
				for (let g in this.gateways) {
					this.gateways[g].setDebug(this.logLevel)
				}
			}
		})

	}

	// Web API
	getGatewayConfiguration() {
		let result = {}
		let gateways = this.getGatewayList()
		for (let g in gateways) {
			let gw = this.getGateway(gateways[g].id)
			result[gateways[g].id] = gw.getGatewayConfig()
		}
		return result
	}

	getGatewayVariables() {
		let result = {}
		let gateways = this.getGatewayList()
		for (let g in gateways) {
			let gw = this.getGateway(gateways[g].id)
			result[gateways[g].id] = gw.getGatewayVariables()
		}
		return result
	}
}

module.exports = OpenThermGatewayApp
