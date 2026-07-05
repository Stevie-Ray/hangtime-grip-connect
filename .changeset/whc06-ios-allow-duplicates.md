---
"@hangtime/grip-connect-react-native": patch
---

Fix WH-C06 weight stream freezing on iOS: pass `allowDuplicates: true` to `startDeviceScan`, so CoreBluetooth reports
every advertisement packet from the broadcast-only scale (matching the Capacitor model's `requestLEScan` options).
