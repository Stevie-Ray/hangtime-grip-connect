---
"@hangtime/grip-connect": patch
"@hangtime/cli": patch
---

CLI: stream renamed to live with babar chart; tare for stream devices starts stream first

- CLI: Add `live` command (alias `stream`) with real-time babar chart visualization
- CLI: Tare command for stream devices (Progressor, ForceBoard, Motherboard) now starts a stream first, waits for data,
  then tares
- CLI: Interactive mode gains Settings (Unit, Calibration, Errors), Live Data replaces Stream
- CLI: Use readline keypress events for Esc-to-stop
- Core: Progressor `tareScale()` removed; use shared `tare()` which requires active stream for hardware tare
- Core: Add `clearTareOffset()` and `usesHardwareTare` to Progressor
- Docs: Progressor example and tare docs updated
