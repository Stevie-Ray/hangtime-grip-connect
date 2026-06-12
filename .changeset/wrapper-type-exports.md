---
"@hangtime/grip-connect-capacitor": patch
"@hangtime/grip-connect-react-native": patch
"@hangtime/grip-connect-runtime": patch
---

Export the missing `AuroraLedPlacement`, `IAurora`, and `IPB700BT` types (Capacitor previously exported no types at
all), and harden React Native notification parsing by constructing `DataView`s with the Buffer's
`byteOffset`/`byteLength`.
