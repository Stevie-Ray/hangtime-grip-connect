---
"@hangtime/grip-connect": patch
---

A CTS500 command whose Bluetooth write fails, or whose write outlasts the response timeout, no longer leaves an
unhandled promise rejection behind. The command still rejects with the error. Before, with default Node settings, a
process that uses the runtime or the CLI crashed on the unhandled rejection, even when the caller caught the error.
