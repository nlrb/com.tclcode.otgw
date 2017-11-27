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

	onInit(type) {
		this.type = type
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
		this.log('Sensor pairing of type', this.type, 'has started...');

		// Select the OTG
		socket.on('loaded', () => {
			socket.emit('select', Homey.app.getGatewayList())
		})

		socket.on('selected', id => {
			this.log('Selected gateway is', id)
			this.gid = id
			this.api = Homey.app.getGateway(id)
			// Check if we have found and OTG
			socket.emit('authorized', this.api.checkFound())
		})

		// this method is run when Homey.emit('list_devices') is run on the front-end
		// which happens when you use the template `list_devices`
		socket.on('list_devices', async (data, callback) => {
			// Get list of sensors of type <sort>
			let sensors = this.api.getAvailableSensors(this.type)
			let devices = []
			for (let s in sensors) {
				let capability = this.map[sensors[s].type]
				let device = {
					name: sensors[s].name,
					data: {
						id: this.gid + ':' + sensors[s].type + '/' + sensors[s].variable,
						gid: this.gid,
						watch: [{ variable: sensors[s].variable, event: capability }] // array for backward compatibility
					},
					capabilities: [ capability ],
					capabilitiesOptions: {}
				}
				// Change the sensor title name
				device.capabilitiesOptions[capability] = {}
				device.capabilitiesOptions[capability].title = sensors[s].allnames
				// Define custom icons for custom capabilities
				if (capability === 'percentage' || capability === 'counter') {
					let mobile = {
						components: [
							{ id: 'icon' },
	            {
	              id: 'sensor',
	              capabilities: [ capability ],
	              options: { icons: {} }
	            }]
            }
					mobile.components[1].options.icons[capability] = './drivers/sensor/assets/' + capability + '.svg'
					device.mobile = mobile
				}
				devices.push(device)
			}
			// ALso add Flags
			let flagTables = [ 'StatusFlags', 'FaultFlags' ]
			for (let t in flagTables) {
				let flags = this.api.getFlagVariables(flagTables[t])
				for (let f in flags) {
					let device = {
						name: flags[f].name,
						data: {
							id: this.gid + ':' + '/' + f,
							gid: this.gid,
							watch: [{ variable: f, event: 'onoff' }] // array for backward compatibility
						},
						capabilities: [ 'onoff' ],
						capabilitiesOptions: { onoff: { title: {} } },
						mobile: {
							components: [
								{ id: 'icon' },
								{
									id: 'sensor',
									capabilities: [ 'onoff' ],
									options: {
										icons: { onoff: './drivers/sensor/assets/flag.svg' },
										onoff: {
							        noblink: true, // don't blink red
							        label: {
						            true: { en: 'Active', nl: 'Actief' },
								        false: { en: 'Not active', nl: 'Niet actief' }
								      }
										}
									}
								}
							]
						}
					}
					device.capabilitiesOptions.onoff.title = flags[f].allnames
					devices.push(device)
				}
			}
			let appsetting = await Homey.ManagerSettings.get('app')
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
			// err, result style
			callback(null, devices)
		})

	}

}
