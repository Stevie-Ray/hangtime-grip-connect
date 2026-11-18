---
"@hangtime/grip-connect": patch
---

Some CTS500 units answer commands with a typed `05 80 <opcode>` frame instead of a 6-byte echo. The tested unit has an
MCU that answers `20 3A 96` to `GET_FIRMWARE_VERSION` (`0xA4`) and a MY-BT102 module with software revision 2.1.3 and
firmware revision 109a. `stop()`, `zero()`, `peakMode()` and `powerOnReset()` now accept this typed answer. `tare()`
accepts the single weight frame that this unit sends as its tare answer, and `stream(duration)` no longer fails at the
end. An unmatched typed answer now reaches the `write()` callback as `"OK"`, the same as an unmatched echo, instead of
raw hex.
