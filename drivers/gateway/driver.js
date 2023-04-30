'use strict'

// OpenTherm Gateway Driver
const Homey = require('homey')
const otgw = require('otg-api')


module.exports = class GatewayDriver extends Homey.Driver {

	log(...data) {
    if (this.api) {
      this.api.debug(1, '[' + this.constructor.name + ']', ...data)
    } else {
      super.log(...data)
    }
  }

	onInit() {
  }

  async onPair(socket) {
		this.log('Gateway pairing has started...')

		/* Start code for backward compatibility */
		let network = await this.homey.settings.get('network')
		if (network && network.ip && network.port) {
			// We've found (legacy) network app settings; use these as default value
			socket.emit('try', network)
		}
		/* End code for backward compatibility */

		socket.setHandler('search', (data) => {
      if (data && data.ip && data.port) {
        let api = new otgw(this.homey.app.locale)
        this.log('Starting search on', data)
				const tempDebugListener = data => this.log(data.msg)
				api.setDebug(3) // APP & API
				api.on('debug', tempDebugListener)
        api.openPort(data.ip, Number(data.port))

        const listener = (data) => {
          this.log('Result of search', data)
          if (data.found) {
            data.device = {
              name: 'OTG ' + data.version,
              data: {
                id: 'OTG:' + data.ip + ':' + data.port
              },
              settings: {
                ip: data.ip,
                port: data.port
              }
            }
            try {
              this.homey.app.addGateway(api)
            } catch (e) {
              socket.emit('available', { found: false, error: e })
              api.closePort()
            }
          } else {
            api.closePort()
          }
          socket.emit('available', data)
          // Remove this listener, we don't need it anymore
          api.removeListener('found', listener)
					api.removeListener('debug', tempDebugListener)
        }
        api.on('found', listener)
      } else {
        socket.emit('available', { found: false })
      }

		})
  }

}
