'use strict'

const Homey = require('homey')

// Sensor device

module.exports = class SensorDevice extends Homey.Device {

  log(...data) {
    if (this.api) {
      this.api.debug(1, '[' + this.constructor.name + ']', ...data)
    } else {
      super.log(...data)
    }
  }

  async onInit(ignoreWatch) {
    this.log('Sensor device starting')
    let data = await this.getData()
    this.id = data.id // Device ID
    this.gid = data.gid // Gateway ID
    this.listen = [] // wacthes with functions
    this.api = Homey.app.getGateway(this.gid)

    if (ignoreWatch !== true) {
      this.watches = data.watch // Variables to watch
      let listeners = []
      for (let w in this.watches) {
        // Construct listeners for value updates
        let lvar = 'var:' + this.watches[w].variable
        let lfunc = (value) => this.setCapValue(this.watches[w].event, value);
        this.log('Adding', lvar, 'to listeners')
        listeners.push({ var: lvar, func: lfunc })
      }
      this.once('api_available', () => this.registerListeners(listeners))
    }

    if (this.api) {
      this.emit('api_available')
      this.ready(() => this.setValues())
    } else {
      /* Start code for backward compatibility */
      if (this.gid === undefined) {
        let keys = await Homey.ManagerSettings.getKeys()
    		if (keys.length > 0) {
    			if (keys.indexOf('network') >= 0) {
    				// Old settings - convert to new format
    				let settings = {}
    				for (let k in keys) {
    					settings[keys[k]] = await Homey.ManagerSettings.get(keys[k])
    				}
            this.gid = 'OTG:' + settings.network.ip + ':' + settings.network.port
          }
        }
      }
      /* End code for backward compatibility */
      this.log('Gateway', this.gid || 'Unknown', 'is not available:', this.id)
      this.setUnavailable(Homey.__('error.gateway_unavailable'))
    }

    Homey.app.on('available', id => {
      if (id === this.gid) {
        this.log('Gateway', id, 'has become available')
        this.api = Homey.app.getGateway(this.gid)
        this.emit('api_available')
        this.setAvailable()
        this.setValues()
      }
    })

    Homey.app.on('unavailable', id => {
      this.log('Gateway', id, 'has become unavailable')
      if (id === this.gid) {
        this.setUnavailable(Homey.__('error.gateway_unavailable'))
      }
    })
  }

  // Pre-condition: this.api is available
  registerListeners(listeners) {
    this.log('registerListeners', listeners)
    for (let l in listeners) {
      if (this.listen.find(x => x.var === listeners[l].var) === undefined) {
        this.api.on(listeners[l].var, listeners[l].func)
        this.listen.push(listeners[l])
      }
    }
  }

  setValues() {
    for (let w in this.watches) {
      let cap = this.watches[w].event;
      let value = this.api.getValue(this.watches[w].variable);
      this.setCapValue(cap, value);
    }
  }

  setCapValue(cap, value) {
    if (value === undefined) {
      value = null;
    } else if (cap.indexOf('measure_pressure') === 0) {
      value *= 1000; // Homey value in mbar
    }
    this.setCapabilityValue(cap, value)
      .then(() => this.log('Capability', cap, 'has been set to', value))
      .catch((e) => this.log('Error', e, 'setting value', value, 'for', cap))
  }

  onDeleted() {
    for (let l in this.listen) {
      this.api.removeListener(this.listen[l].var, this.listen[l].func)
    }
  }

}
