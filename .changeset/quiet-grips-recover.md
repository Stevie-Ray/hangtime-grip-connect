---
"@hangtime/grip-connect": patch
---

Ignore truncated Progressor and Entralpi packets and non-finite Progressor weights so malformed readings cannot throw or
corrupt session statistics. Preserve zero Motherboard zone peaks when force becomes negative, and reset sampling-rate
calculations when starting a new stream.
