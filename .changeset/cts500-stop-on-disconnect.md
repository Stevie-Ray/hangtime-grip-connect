---
"@hangtime/grip-connect": patch
"@hangtime/grip-connect-capacitor": patch
"@hangtime/grip-connect-react-native": patch
"@hangtime/cli": patch
---

CTS500 `disconnect()` now returns a promise: it sends stop, waits up to 2 seconds for the answer, and then closes the
link. Before, the scale kept uploading and drained its battery after a client left, because it keeps the upload state
across a power cycle. The CLI waits for the disconnect, at most 3 seconds, before it exits.
