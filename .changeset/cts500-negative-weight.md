---
"@hangtime/grip-connect": patch
---

CTS500 weights below zero came out positive. The scale sends the sign as bit `0x10` of the status byte, and the client
ignored it. For example, an empty scale after a tare under 2 kg reported 2.00 kg instead of -2.00 kg. Weight frames and
`weight()` now return negative values.
