'use strict'


const Homey = require('homey')
const otga = require('otg-api')


module.exports = class GatewayDevice extends Homey.Device {

  log(...data) {
    if (this.api) {
      this.api.debug(1, '[' + this.constructor.name + ']', ...data)
    } else {
      super.log(...data)
    }
  }

  async onInit() {
    this.log('Starting gateway device')
    this.id = await this.getData().id
    this.api = this.homey.app.getGateway(this.id)
    if (!this.api) {
      this.log('Opening communication to gateway device')
      this.api = new otga(this.homey.app.locale)
      this.homey.app.addGateway(this.api, this.id)
    }

    this.homey.app.on('unavailable', id => {
      this.log('Gateway', id, 'has become unavailable')
      if (id === this.id) {
        this.setUnavailable(this.homey.__('error.gateway_unavailable'))
      }
    })

    this.homey.app.on('available', id => {
      this.log('Gateway', id, 'has become unavailable')
      if (id === this.id) {
        this.setAvailable()
      }
    })

    // Register listeners for value updates
    this.api.on('config', async config => {
      // Set the values in the mobile card
      this.setValues(config)
    })

    // Register Domestic Hot Water capability listener
    this.registerCapabilityListener('dhw_setting', dhw => {
      return this.api.setBoilerHotWater(dhw)
    })

    // Flow handling
    /*
     * 1. Triggers
     *   a. status (on/off); token: flag
     *   b. faultcode (on/off); tokens: OEM, name
     *   c. override (on/off); token: temp
     *   d. command; tokens: response, result
     */
    const flowCheck = (args, state) => {
      let onOff = state.value === true ? 'on' : 'off'
      this.log('flowCheck', onOff, args.values, state.value)
      // If true, this flow should run
      return Promise.resolve(args.values === onOff)
    }

    // 1a-1b
    const triggers = [ 'status', 'faultcode' ]
    let handlers = {}

    for (let t in triggers) {
      handlers[triggers[t]] = this.homey.flow.getDeviceTriggerCard(triggers[t])
      handlers[triggers[t]]
        .registerRunListener(flowCheck)
    }

    // 1a. Register all status variables
    const statusHandler = (flag, value) => {
      this.log("Sending trigger 'status' with token", flag)
      handlers.status.trigger(this, { flag: flag }, { value: value })
        .catch(this.error)
    }

    let vars = this.api.getFlagVariables('StatusFlags')
    for (let v in vars) {
      // Cut of 'Status' and keep remaining part as token (e.g. LowWaterPressure)
      let flag = v.slice(6)
      this.api.on('var:' + v, (value) => statusHandler(flag, value))
    }

    // 1b. faultcode (on/off); tokens: OEM, name
    const faultHandler = (flag, value) => {
      this.log("Sending trigger 'faultcode' of type", flag)
      let oemFault = this.api.getValue('OEMFaultCode') || 0
      handlers.faultcode.trigger(this, { type: flag, OEM: oemFault }, { value: value })
        .catch(this.error)
    }

    vars = this.api.getFlagVariables('FaultFlags')
    for (let v in vars) {
      let flag = v.slice(5) // Remove 'Fault'
      this.api.on('var:' + v, (value) => faultHandler(flag, value))
    }

    // 1c. override (on/off); token: temp
    handlers.override = this.homey.flow.getDeviceTriggerCard('override')
    handlers.override
      .registerRunListener((args, state) => {
        let result = (state.value === 0) !== (args.values === 'on')
        this.log('Check on/off condition for action override', result, args.values, state.value)
        // If true, this flow should run
        return Promise.resolve(result)
      })

    this.api.on('var:RemoteOverrideRoomSetpoint', value => {
      this.log('Sending trigger override with token temp:', value)
      handlers.override.trigger(this, { temp: value }, { value: value })
        .catch(this.error)
    })

    // 1d. command; tokens: response, result
    let commandTrigger = this.homey.flow.getDeviceTriggerCard('command')

    this.api.on('response', (response, result) => {
      this.log("Sending trigger 'response' with tokens", response, 'and', result)
      commandTrigger.trigger(this, { response: response, result: result })
    })

    /*
     * 2. Conditions
     *   a. override
     */
     let condition = this.homey.flow.getConditionCard('override')
     condition
       .registerRunListener((args, state) => {
         let override = this.api.getValue('RemoteOverrideRoomSetpoint')
         let active = (override !== undefined && override !== '0.00')
         return Promise.resolve(active)
       })

    /*
     * 3. Actions
     *   a. setHotWater (arg: mode)
     *   b. setClock
     *   c. setOutsideTemperature (arg: temperature)
     *   d. setRoomHumidity (arg: humidity)
     *   e. sendCommand (arg: command)
     */
    const actions = [
      { id: 'setHotWater', fn: 'setBoilerHotWater', arg: 'mode' },
      { id: 'setClock', fn: 'setClock' },
      { id: 'setOutsideTemperature', fn: 'setOutsideTemperature', arg: 'temperature' },
      { id: 'setRoomHumidity', fn: 'setRoomHumidity', arg: 'humidity' },
      { id: 'sendCommand', fn: 'sendCommand', arg: 'command' }
    ]
    for (let a in actions) {
      let action = this.homey.flow.getActionCard(actions[a].id)
      try {
        let fn = 'this.api.' + actions[a].fn
        let arg = actions[a].arg
        action
          .registerRunListener((args, state) => {
            return (arg ? eval(fn + '(args.' + arg + ')') : eval(fn))
          })
      } catch (e) {
        this.log('Error:', e)
      }
    }

    // Open communication (if not already open)
    if (!this.api.checkFound()) {
      let settings = this.getSettings()
      this.api.openPort(settings.ip, settings.port)
    } else {
      // Set initial value
      let config = this.api.getGatewayConfig()
      this.setValues(config)
    }

  }

  onDeleted() {
    this.homey.app.deleteGateway(this.id)
  }

  onSettings({ oldSettings, newSettings, changedKeys }) {
    let ip = {}
    let gateway = []
    for (let k in changedKeys) {
      let entry = changedKeys[k]
      if (entry === 'ip' || entry === 'port') {
        ip.addr = newSettings.ip
        ip.port = newSettings.port
      } else {
        // Gateway hardware settings; note: json ID should be the same as variable name!
        gateway.push({ var: entry, val: newSettings[entry] })
      }
    }
    // Update the Gateway hardware settings
    if (gateway.length > 0) {
      this.api.setGatewayConfig(gateway)
    }
    if (ip.addr) {
      this.api.closePort()
      setTimeout(() => this.api.openPort(ip.addr, ip.port), 1000) // wait a second before re-opening
    }
  }

  setValues(config) {
    config.GatewayMode && this.setCapabilityValue('monitor_mode', config.GatewayMode.val === 0).catch(this.error)
    let value = this.api.getBoilerHotWater()
    if (value !== undefined) { this.setCapabilityValue('dhw_setting', value).catch(this.error) }
    // Update the device configuration
    if (Object.keys(config).length === 16) { // Not showing: DHWSetting
      let newSettings = {
        FirmwareVersion: config.FirmwareVersion.val,
        GatewayMode: config.GatewayMode.val.toString(),
        PowerLevel: config.PowerLevel.txtVal,
        GPIOConfiguration0: config.GPIOConfiguration0.val,
        GPIOConfiguration1: config.GPIOConfiguration1.val,
        IgnoreTransitions: config.IgnoreTransitions.val,
        ReferenceVoltage: config.ReferenceVoltage.val,
        ROFInBothBytes: config.ROFInBothBytes.val,
        SetbackTemperature: Number(config.SetbackTemperature.val),
        LEDFunctions0: config.LEDFunctions0.val,
        LEDFunctions1: config.LEDFunctions1.val,
        LEDFunctions2: config.LEDFunctions2.val,
        LEDFunctions3: config.LEDFunctions3.val,
        LEDFunctions4: config.LEDFunctions4.val,
        LEDFunctions5: config.LEDFunctions5.val
      }
      try {
        this.setSettings(newSettings)
      } catch (e) {
        this.log('Error', e)
      }
    }
  }

}
