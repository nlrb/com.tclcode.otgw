'use strict'

// OpenTherm Gateway Thermostat Driver
const Homey = require('homey')
const otgw = require('otg-api')


module.exports = class ThermostatDriver extends Homey.Driver {

	log(...data) {
    if (this.api) {
      this.api.debug(1, '[' + this.constructor.name + ']', ...data)
    } else {
      super.log(...data)
    }
  }

	onPair(socket) {
		this.log('OTG Thermostat pairing has started...')

		// Select the OTG
		socket.setHandler('loaded', () => {
			socket.emit('select', this.homey.app.getGatewayList())
		})

		socket.setHandler('selected', id => {
			this.log('Selected gateway is', id)
			this.gid = id
			this.api = this.homey.app.getGateway(id)
			// Check if we have found and OTG
      this.log('Found:', this.api.checkFound())
			socket.emit('authorized', this.api.checkFound())
		})

		// this method is run when Homey.emit('list_devices') is run on the front-end
		// which happens when you use the template `list_devices`
		socket.setHandler('list_devices', (data) => {
			const locale = this.homey.i18n.getLanguage()
			// Create a list of thermostats
			let devices = [{
				name: (locale === 'nl' ? "Thermostaat" : "Thermostat"),
				data: {
					id: this.gid + ':T1',
					gid: this.gid
				},
				settings: {
					temperature: 'temporary',
					ventilation: false
				}
			}]
			if (this.api && this.api.getSupportHeating2()) {
				devices[1] = {
					name: (locale === 'nl' ? "Verwarming 2" : "Heating 2"),
					data: {
						id: this.gid + ':T2',
						gid: this.gid
					},
					capabilities: [ 'target_temperature' ]
				}
			}
			return devices;
		})

	}
}
