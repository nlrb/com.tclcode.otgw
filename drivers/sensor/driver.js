'use strict'

// OpenTherm Gateway Sensor Driver
const Homey = require('homey')
const otgw = require('otg-api')


module.exports = class SensorDriver extends Homey.Driver {

	log(...data) {
    if (this.api) {
      this.api.debug(1, '[' + this.constructor.name + ']', ...data)
    } else {
      super.log(...data)
    }
  }

	onInit() {
		this.map = {
			temperature: 'measure_temperature',
			pressure: 'measure_pressure',
			humidity: 'measure_humidity',
			co2: 'measure_co2',
			flow: 'measure_water',
			percentage: 'percentage',
			counter: 'counter'
		}
	}

 	onPair(socket) {
		this.log('Sensor pairing has started...');

		// Select the OTG
		socket.setHandler('loaded', () => {
			socket.emit('select', this.homey.app.getGatewayList())
		})

		socket.setHandler('selected', id => {
			this.log('Selected gateway is', id)
			this.gid = id
			this.api = this.homey.app.getGateway(id)
			// Check if we have found and OTG
			socket.emit('authorized', this.api.checkFound())
		})

		// this method is run when Homey.emit('list_devices') is run on the front-end
		// which happens when you use the template `list_devices`
		socket.setHandler('list_devices', async (data) => {
			// Get list of sensors of type <sort>
			let sensors = this.api.getAvailableSensors(this.type)
			let devices = []
			for (let s in sensors) {
				let capability = this.map[sensors[s].type]
				let device = {
					// not a real device, put all information in the data element
					// as that is all that is usable in the list_devices template
					name: sensors[s].name,
					data: {
						id: this.gid + ':' + sensors[s].type + '/' + sensors[s].variable,
						gid: this.gid,
						watch: [{ variable: sensors[s].variable, event: capability }], // array for backward compatibility
						capabilities: [ capability ],
						capabilitiesOptions: {}
					},
				}
				// Change the sensor title name
				device.data.capabilitiesOptions[capability] = {}
				device.data.capabilitiesOptions[capability].title = sensors[s].allnames
				devices.push(device)
			}
			// Also add Flags
			let flagTables = [ 'StatusFlags', 'FaultFlags' ]
			for (let t in flagTables) {
				let flags = this.api.getFlagVariables(flagTables[t])
				for (let f in flags) {
					let device = {
						name: flags[f].name,
						data: {
							id: this.gid + ':' + '/' + f,
							gid: this.gid,
							watch: [{ variable: f, event: 'flag' }], // array for backward compatibility
							capabilities: [ 'flag' ],
							capabilitiesOptions: { flag: { title: {} } }
						}
					}
					device.data.capabilitiesOptions.flag.title = flags[f].allnames
					devices.push(device)
				}
			}
			let appsetting = await this.homey.settings.get('app')
			if (appsetting != null && appsetting.duplicates !== true) {
				// Identify which sensor values are already in other sensor add_devices and remove these from the list
				let hdevices = await this.getDevices()
				for (let i = 0; i < hdevices.length; i++) {
					let data = await hdevices[i].getData()
					for (let w in data.watch) {
						this.log('Variable', data.watch[w].variable, 'is already present')
						let idx = devices.findIndex(x => x.data.watch[0].variable === data.watch[w].variable)
						if (idx >= 0) {
							this.log('Removing variable', data.watch[w].variable)
							devices.splice(idx, 1)
						}
					}
				}
			}
			return devices;
		})

	}

}
