'use strict'

// OpenTherm Gateway Boiler Driver

const Homey = require('homey')
const otgw = require('otg-api')

module.exports = class SensorDriver extends Homey.Driver {

	onPair(socket) {
		this.log('Boiler pairing has started...')

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
      this.log('Listing devices for', this.gid)
			let devices = [{
				name: 'Boiler',
				data: {
					id: this.gid + ':boiler',
          gid: this.gid
        }
			}]
			return devices;
		})

	}
}
