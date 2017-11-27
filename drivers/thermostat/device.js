'use strict'


const Homey = require('homey')
const SensorDevice = require('../sensor/device.js')


module.exports = class ThermostatDevice extends SensorDevice {

  targetTempOverride() {
    let override = this.api.getValue('RemoteOverrideRoomSetpoint')
    let setpoint = this.api.getValue('CurrentSetpoint')
    let current = this.api.getValue('CurrentTemperature')
    let target = override !== undefined && override > 0 ? override : setpoint
    let mode = (setpoint !== undefined && override >= current ? 'heat' : (override > 0 && override < current ? 'cool' : 'auto'))
    this.log(override, setpoint, current, mode)
    if (current !== undefined) { this.setCapabilityValue('measure_temperature', current) }
    if (target !== undefined) { this.setCapabilityValue('target_temperature', target) }
    if (mode !== undefined) { this.setCapabilityValue('thermostat_mode', mode) }
  }

  async onInit() {
    this.log('Thermostat device starting')
    // Thermostat device
    await super.onInit(true) // we set our own listeners
    if (this.id.slice(-2) === 'T1') {
      this.once('api_available', async () => { this.registerListeners([
          { var: 'var:CurrentTemperature', func: (val) => { this.targetTempOverride() } },
          { var: 'var:CurrentSetpoint', func: (val) => { this.targetTempOverride() } },
          { var: 'var:RemoteOverrideRoomSetpoint', func: (val) => { this.targetTempOverride() } }
        ])
        // Send ventilation command now if the gateway is available or once it becomes available
        let settings = await this.getSettings()
        /* Start code for backward compatibility */
        if (Object.keys(settings).length === 0) {
          this.log('No thermostat device settings; look for (legacy) app settings')
          let features = await Homey.ManagerSettings.get('features')
          if (features) {
            settings.ventilation = features.ventilation === '1'
            settings.temperature = features.permanent === '1' ? 'continuous' : 'temporary'
            this.setSettings(settings, this.log('Set device settings to', settings))
          }
        }
        /* End code for backward compatibility */
        if (this.api.checkFound()) {
          this.setVentilation(settings.ventilation)
        } else {
          this.api.once('available', () => this.setVentilation(settings.ventilation))
        }
      })
    } else {
      this.once('api_available', () => this.registerListeners([
        { var: 'var:CH2CurrentSetpoint', func: (val) => { this.setCapabilityValue('target_temperature', val) } }
      ]))
    }

    this.registerCapabilityListener('thermostat_mode', (mode) => {
      let result
      if (mode === 'auto') {
        result = this.api.setThermostatAuto()
      } else {
        result = Promise.reject('Not supported')
      }
      return result
    })

    this.registerCapabilityListener('target_temperature', async (temp) => {
      if (temp < 5) { temp = 5 }
			if (temp > 30) { temp = 30 }

			let tt = Math.round(temp * 2) / 2
      let settings = await this.getSettings()
			return this.api.setThermostatTargetTemp(tt, settings.temperature === 'continuous')

      return Promise.resolve(tt)
    })

  }

  setValues() {
    // Set initial value
    if (this.id.slice(-2) === 'T1') {
      this.targetTempOverride()
    } else { // T2
      let value = this.api.getValue('CH2CurrentSetpoint')
      if (value !== undefined) { this.setCapabilityValue('target_temperature', value) }
    }
  }

  setVentilation(ventilation) {
    // Fake ventilation if needed
    if (ventilation) {
      return this.api.writeCommand('SR=70:0,0')
    } else {
      return this.api.writeCommand('CR=70', 'CR: (70|NF)')
    }
  }

  onSettings(oldSettings, newSettings, changedKeys) {
    if (changedKeys.indexOf('ventilation') >= 0) {
      return this.setVentilation(newSettings.ventilation)
    }
    return Promise.resolve()
  }

  onDeleted() {
    if (this.api) {
      this.api.removeAllListeners('var:CurrentTemperature')
      this.api.removeAllListeners('var:CurrentSetpoint')
      this.api.removeAllListeners('var:RemoteOverrideRoomSetpoint')
      this.api.removeAllListeners('var:CH2CurrentSetpoint')
    }
  }

}
