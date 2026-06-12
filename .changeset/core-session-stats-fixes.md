---
"@hangtime/grip-connect": patch
---

Fix session statistics correctness: track real per-zone minimums for Motherboard distribution measurements instead of
deriving them from peak/current, reset session stats (peak/min/mean/sum) when Motherboard, ForceBoard, and CTS500 start
a new stream, make `activityCheck` synchronous, add the missing `IPB700BT` interface, and fix a service-name typo in
ForceBoard.
