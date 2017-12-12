### Homey OpenTherm Gateway application
This is the OpenTherm Gateway application for Homey.
More information on the OpenTherm Gateway (OTG) can be found on http://otgw.tclcode.com.

##### Hardware
You can order the gateway hardware e.g. via:
[KIWI electronics](https://www.kiwi-electronics.nl/opentherm-gateway-kit)
or
[NODO-SHOP](https://www.nodo-shop.nl/nl/opentherm-gateway/188-opentherm-gateway.html)
.

#### Migration: Important note
If you have version 1.0.x of the application installed, please read these notes before switching to version 2.
* A Gateway device is needed for the application to work. You will need to add this device after the upgrade.
* The Temperature and Pressure devices are no longer supported. They will need to be replaced by Sensor devices.
* Only the Thermostat device can be re-used, but it is adviced to remove this and pair a new one as well.
* Logging values to Insights can no longer be selected separately; to log data to Insights it will need to be a part of a Sensor device
* Application settings have been moved to the Gateway and Thermostat devices
* Be aware when installing version 2 that Insights data will be lost and flows will be broken


### Devices
The following Homey devices are currently supported.
* Gateway
* Thermostat
* Boiler
* Sensor

You can add a device by clicking the '+' and selecting the 'OpenTherm Gateway'

![](http://homey.ramonbaas.nl/otgw/2_add_device.png)

#### Gateway device
After installing the application, the first device that needs to be paired is the Gateway device.

There is no automatic way of finding an OpenTherm Gateway in your network, hence you will need to show the app where it can be found.

![](http://homey.ramonbaas.nl/otgw/2_add_gateway.png)

After entering the ip address and port number, press 'Start gateway search'. The application will start searching for the OTG and once found the Gateway device will be added to Homey.

The Gateway device will show whether it is in 'Monitoring only' mode. In order to be able to use all functionality this should normally be 'No', which indicates the OTG is in Gateway mode.

![](http://homey.ramonbaas.nl/otgw/2_device_gateway.png)

The Gateway device will also give you the option to change the current 'Domestic Hot Water' setting directly from the mobile card.


##### Gateway device settings
All other OTG configuration options can be set from the device settings page. Once they are saved, the configuration is sent to the OTG.

![](http://homey.ramonbaas.nl/otgw/2_device_gateway_settings.png)

#### Thermostat device
Normally you can only add one thermostat device, except if you have a second circuit and it is supported by the boiler.

![](http://homey.ramonbaas.nl/otgw/device_thermostat.png)

On the Thermostat device you change the temperature, which will either send a 'TT' or 'TC' command (depending on the setting) with the new temperature.
If the new temperature is higher or equal to the current temperature, the thermostat mode will display 'Heat'. If the new set temperature is lower, the state will show 'Cool'.
Adjusting the state to 'Cool' or 'Heat' manually has no effect. However, setting the state to 'Automatic' will send a 'TT=0' command, which results in the thermostat returning to the regular program.

##### Thermostat device settings
The following features are available.

![](http://homey.ramonbaas.nl/otgw/2_device_thermostat_settings.png)

When a temperature change on the thermostat device is made, either a 'TC' or 'TT' can be send to the OTG. A 'TC' will make it a permanent ('constant') change, until you change a setting on the thermostat. A 'TT' will make the temperature setting 'temporary'. In this case a program change (e.g. at 17.00 or so) will undo the settings, and the program will resume.

**Please note that not all thermostats support these commands. Check the [Equipment matrix](http://otgw.tclcode.com/matrix.cgi#thermostats "Equipment matrix") on the OTG website for message 9 and 100.**

The second option allows you to have the app send a 'SR=70:0,0' command. This results the thermostat believing that a ventilation device is supported. Some thermostats (like e.g. the Honeywell Chronotherm Modulation) can show the air humidity. But it will show it only when this option is set to 'Yes'. You can send a humidity value to the OTG via a Homey Flow card.

#### Boiler device
A pre-defined sensor-type device is available for pairing, called the Boiler device. When this device is added, you can view the following status items of the boiler:
* Flame on/off
* Heating on/off
* Modulation level
* Heating water on/off
* Boiler error true/false

![](http://homey.ramonbaas.nl/otgw/2_device_boiler.png)

#### Sensor device
You can create and add your own sensor devices, containing values that are supported by your thermostat or boiler. During pairing a list is shown of available variables that can be added to your sensor.

![](http://homey.ramonbaas.nl/otgw/2_add_sensor_select.png)

You can add as many entries to one sensor device as you like. They are added in the order the tick-marks are placed.

However, only messages that are supported by the boiler and/or thermostat will show up in the list. When fist starting up, it will take some time before the app knows which messages give valid values. So make sure the app is running for some time before configuring the sensor device.

![](http://homey.ramonbaas.nl/otgw/2_device_sensor_flags.png)

![](http://homey.ramonbaas.nl/otgw/2_device_sensor_temperature.png)

*Note*: OpenTherm messages can come by in a slow pace, which means that updates can also be slow. E.g. when setting a new temperature on the thermostat, it will not take effect immediately. So when re-opening the device it can still show an old value. There's no other remedy than patience.

### Flows
The Gateway device offers cards for triggers, conditions and actions. Note that also your thermostat device can be used in flows.

![](http://homey.ramonbaas.nl/otgw/flow_status.png)
##### Triggers
The following triggers are available:

* Status flag changes (becomes active or inactive)
  * token 'Status': the status flag that gets active/inactive, which can be:
    * 'CHEnabled' (Central heating enable)
    * 'DHWEnabled' (Domestic hot water enable)
    * 'CoolEnabled' (Cooling enable)
    * 'OTCActive' (Outside temp. comp. active)
    * 'CH2Enabled' (Central heating 2 enable)
    * 'SummerWinter' (Summer/winter mode)
    * 'DHWBlocked' (Domestic hot water blocking)
    * 'Fault' (Fault indication)
    * 'CHMode' (Central heating mode)
    * 'DHWMode' (Domestic hot water mode)
    * 'Flame' (Flame status)
    * 'Cooling' (Cooling status)
    * 'CH2Mode' (Central heating 2 mode)
    * 'Diagnostic' (Diagnostic indication)

    ![](http://homey.ramonbaas.nl/otgw/trigger_status.png)
    ![](http://homey.ramonbaas.nl/otgw/condition_status.png)
    ![](http://homey.ramonbaas.nl/otgw/action_status.png)
* Fault flag changes (becomes active or inactive)
  * token 'Fault': the fault flag that gets active/inactive, which can be:
    * 'ServiceRequest' (Service request)
    * 'LockoutReset' (Lockout-reset)
    * 'LowWaterPressure' (Low water pressure)
    * 'GasFlame' (Gas/flame fault)
    * 'AirPressure' (Air pressure fault)
    * 'OverTemperature' (Water over-temperature)
  * token 'OEM': the OEM fault code (if supported)

    ![](http://homey.ramonbaas.nl/otgw/trigger_faultcode.png)
    ![](http://homey.ramonbaas.nl/otgw/action_faultcode.png)
* Temperature override (becomes active or inactive)
  * token 'Temperature': the override temperature, e.g. '21.00'

    ![](http://homey.ramonbaas.nl/otgw/trigger_override.png)
    ![](http://homey.ramonbaas.nl/otgw/action_override.png)
* A response is received to a command that has been sent
  * token 'Response': the full response text, e.g. 'PR=A: OpenTherm Gateway 4.2.3'
  * token 'Result': the result part only, e.g. 'OpenTherm Gateway 4.2.3'

    ![](http://homey.ramonbaas.nl/otgw/trigger_response.png)

##### Conditions
Only one condition currently exists, which is to check whether the Remote Override is (in-)active (i.e. whether a temperature has been set via the application or not).

##### Actions
The following actions are supported. The actions are available on the Gateway device.

* *Send Gateway command*. This should be a command as supported by the OTG. For a list of commands see the [OTG website](http://otgw.tclcode.com/firmware.html#dataids "Data ids"). Once the command is received the trigger 'Response received' will be fired.

    ![](http://homey.ramonbaas.nl/otgw/action_command.png)
* *Set hot water mode*. The DHW (Domestic Hot Water) mode can be set to be either 'Thermostat controlled', 'Keep water hot' or 'Don't pre-heat'. You can use this to save energy when e.g. you are not home or at night, as you likely don't need hot water right away.

    ![](http://homey.ramonbaas.nl/otgw/action_dhw.png)
* *Set current thermostat time*. For thermostats that support message ids 21 and 22, you have the option to synchronize the time from Homey to the thermostat.

    ![](http://homey.ramonbaas.nl/otgw/action_time.png)
* *Set outside temperature*. If there is a temperature sensor device in Homey that measures the outside temperature, you can use this to send that information to the thermostat. This can enable an option like 'Optimal Comfort', which can heat the room independent of the temperature measured by the thermostat itself.

    ![](http://homey.ramonbaas.nl/otgw/action_outside.png)
* *Set humidity level*. Send a humidity percentage measurement to the thermostat, as it would be measured by a ventilation system.

    ![](http://homey.ramonbaas.nl/otgw/action_humidity.png)

### Speech
You can ask Homey a number of questions related to the thermostat or boiler, e.g.

* "What is the room temperature?"
* "What is the target temperature?"
* "Is there a boiler problem?"
* "What is the boiler pressure?"
* "What is the boiler water temperature?"

### Application settings

![](http://homey.ramonbaas.nl/otgw/2_app_settings.png)

##### Device
On the app settings page there is one option available, which is relevant when adding a sensor device. If the tick-mark is not present, sensor values can appear in only one sensor device. They will not be in the list when adding a new sensor device if it already has been used. When the option is set to true, a value can appear in multiple sensor devices. Be aware however that this also causes Insights to log the same data multiple times.

##### Debug
It is possible to view debugging info generated by different parts of the application. Data is shown in the order as it comes in. Select a combination of the following debug components:
* Traffic: this is communication between the OTG and either boiler or thermostat (see http://otgw.tclcode.com for details)
* API: this is information from the low-level nodejs API that communicates with the OTG
* Application: this debug info is generated by the Homey application

### API
To enable usage of the values read from the OpenTherm Gateway outside of the app, there is are 2 API function available. They can be used unauthenticated.

* `getOtgwConfig`: returns the configuration settings of the OpenTherm Gateway
* `getOtgwVars`: returns all values read from the OpenTherm Gateway

##### Examples
An example how to invoke `getOtgwVars`

* from the console (returns object):
`api('GET', '/app/com.tclcode.otgw/getOtgwVars', function(err, x) { console.log(x) })`
* direct URL (returns JSON):
`<homey_ip>/api/app/com.tclcode.otgw/getOtgwVars`


### Versions
* 2.0.0 Complete re-write to Athom SDK v2
  * Adds support for multiple gateways
  * Adds support for changing gateway hardware configuration
  * Adds support for user defined sensor devices
  * Removed temperature and pressure devices
* 1.0.2 Process intermediate settings updates
* 1.0.1 Fix for failed startup on Homey booting
* 1.0.0 Updates for thermostat_mode and Homey FW 1.0.1
* 0.6.2 Fixes for API changes of Homey FW 0.9.1 (custom capabilities)
* 0.6.1 Custom state capability added since Athom removed the 'thermostat_state' device capability
* 0.6.0 Added speech, using booleans for Insights, fix override temperature display
* 0.5.2 Fixes for API changes of Homey FW 0.8.24
* 0.5.1 Bug fix, improved settings page
* 0.5.0 Second app-store release - adds better flow support, insights logging & re-connect
* 0.1.0 First app-store release - added gateway config (RO), language support, flow actions, fixes/refactoring
* 0.0.2 Second release - added pressure sensor, 2nd thermostat, flags, fixes & code refactoring
* 0.0.1 Initial release - functionality limited to one thermostat and multiple temperature sensors
