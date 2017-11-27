'use strict'

// OpenTherm Gateway Boiler Driver

const Homey = require('homey')
const otgw = require('otg-api')

module.exports = class SensorDriver extends Homey.Driver {

	onPair(socket) {
		this.log('Boiler pairing has started...')

		// Select the OTG
		socket.on('loaded', () => {
			socket.emit('select', Homey.app.getGatewayList())
		})

		socket.on('selected', id => {
			this.log('Selected gateway is', id)
			this.gid = id
			this.api = Homey.app.getGateway(id)
			// Check if we have found and OTG
      this.log('Found:', this.api.checkFound())
			socket.emit('authorized', this.api.checkFound())
		})

		// this method is run when Homey.emit('list_devices') is run on the front-end
		// which happens when you use the template `list_devices`
		socket.on('list_devices', (data, callback) => {
      this.log('Listing devices for', this.gid)
			let devices = [{
				name: 'Boiler',
				data: {
					id: this.gid + ':boiler',
          gid: this.gid
        }
			}]
			// err, result style
			callback(null, devices)
		})

	}
}
