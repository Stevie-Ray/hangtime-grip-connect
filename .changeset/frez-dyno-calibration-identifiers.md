---
"@hangtime/grip-connect": patch
"@hangtime/grip-connect-capacitor": patch
"@hangtime/grip-connect-react-native": patch
---

Correct Frez Dyno's transport: use the `0x01`/`0x02` command bytes with acknowledged writes, parse its raw ADC packet
counters, tare in software, and load calibration by serial before Bluetooth remote ID. Add an explicit serial override
for browsers that cannot read the standard serial characteristic. The example app offers this recovery directly in the
tare dialog and remembers the serial for later sessions.

Add Frez Dyno to the Capacitor and React Native packages and examples. Native transports read the device serial and use
it for automatic factory-calibration lookup before streaming.
