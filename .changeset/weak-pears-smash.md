---
"@hangtime/cli": patch
---

Align CLI session/config naming with the new training preset schema (for Repeaters, Endurance, RFD, and Critical Force),
replace old non-interactive flags with the new canonical flags (no backward aliases), and update CLI/docs examples
accordingly. Also make Training Programs `Load Preset` execute Repeaters directly when `repeatersPreset` exists and
localize Training Programs UI/messages across interactive languages.
