'use strict'


const Homey = require('homey')
const SensorDevice = require('../sensor/device.js')

// Boiler device

const modulation = (context, x) => {
  let max = context.api.getValue('MaxRelativeModulationLevel') || 100
  return 100 * x / max
}

module.exports = class BoilerDevice extends SensorDevice {

  onInit() {
    this.log('Boiler device starting')
    super.onInit()
    this.once('api_available', () => this.registerListeners([
      { var: 'var:StatusFlame', func: val => { this.setCapabilityValue('flame_on', val) } },
      { var: 'var:StatusCHMode', func: val => { this.setCapabilityValue('heating_on', val) } },
      { var: 'var:StatusDHWMode', func: val => { this.setCapabilityValue('heating_water', val) } },
      { var: 'var:StatusFault', func: val => { this.setCapabilityValue('fault', val) } },
      { var: 'var:RelativeModulationLevel', func: val => { this.setCapabilityValue('modulation', modulation(this, val)) } }
    ]))
  }

  setValues() {
    // Set initial value
    let state = this.api.getBoilerState()
    if (state.flame !== undefined) { this.setCapabilityValue('flame_on', state.flame) }
    if (state.mode_ch !== undefined) { this.setCapabilityValue('heating_on', state.mode_ch) }
    if (state.mode_dhw !== undefined) { this.setCapabilityValue('heating_water', state.mode_dhw) }
    if (state.fault !== undefined) { this.setCapabilityValue('fault', state.fault) }
    let value = this.api.getValue('RelativeModulationLevel')
    if (value !== undefined) { this.setCapabilityValue('modulation', modulation(this, value)) }
  }

}
