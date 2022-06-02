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
      { var: 'var:StatusFlame', func: val => { this.setCapabilityValue('flame_on', val).catch(this.error) } },
      { var: 'var:StatusCHMode', func: val => { this.setCapabilityValue('heating_on', val).catch(this.error) } },
      { var: 'var:StatusDHWMode', func: val => { this.setCapabilityValue('heating_water', val).catch(this.error) } },
      { var: 'var:StatusFault', func: val => { this.setCapabilityValue('fault', val).catch(this.error) } },
      { var: 'var:RelativeModulationLevel', func: val => { this.setCapabilityValue('modulation', modulation(this, val)).catch(this.error) } }
    ]))
  }

  setValues() {
    // Set initial value
    let state = this.api.getBoilerState()
    if (state.flame !== undefined) { this.setCapabilityValue('flame_on', state.flame).catch(this.error) }
    if (state.mode_ch !== undefined) { this.setCapabilityValue('heating_on', state.mode_ch).catch(this.error) }
    if (state.mode_dhw !== undefined) { this.setCapabilityValue('heating_water', state.mode_dhw).catch(this.error) }
    if (state.fault !== undefined) { this.setCapabilityValue('fault', state.fault).catch(this.error) }
    let value = this.api.getValue('RelativeModulationLevel')
    if (value !== undefined) { this.setCapabilityValue('modulation', modulation(this, value)).catch(this.error) }
  }

}
