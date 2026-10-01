---
"@hangtime/grip-connect": patch
---

CTS500 `zero()` sent the malformed frame `05 00 00 00 00 05` and never reached the device. It now sends opcode `0x86`
and really updates the hardware zero point, which the device can keep after a restart.
