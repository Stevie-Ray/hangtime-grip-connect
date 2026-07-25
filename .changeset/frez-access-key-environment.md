---
"@hangtime/grip-connect": patch
---

Read the Frez Dyno access key from `EXPO_PUBLIC_FREZ_ACCESS_KEY` as well as `FREZ_ACCESS_KEY`, and retry the coefficient
lookup after a failed attempt instead of rejecting every later `stream()` call.
