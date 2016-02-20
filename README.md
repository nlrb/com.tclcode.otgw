# com.tclcode.otgw

This is the OpenTherm Gateway application for Homey.
More information on the OpenTherm Gateway (OTG) can be found on http://otgw.tclcode.com.
More information on Homey can be found on http://www.athom.nl.

# Versions

0.0.1 Initial release - functionality limited to one thermostat and multiple temperature sensors

# Notes

- Make sure to visit the settings page to enter the IP address and port of the OTG in the network.
- OpenTherm messages can come by in a slow pace, which means that updates can also be slow. E.g. when setting a new temperature on the thermostat, it will not take effect immediately. So when re-opening the device it can still show an old value. There's no other remedy than patience.