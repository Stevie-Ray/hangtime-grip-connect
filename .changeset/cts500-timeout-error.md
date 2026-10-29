---
"@hangtime/grip-connect": patch
---

A CTS500 command timeout now rejects with an error named `CTS500TimeoutError`. The message keeps its old start and now
names the command, for example `0xAB`. The CTS500 docs describe the `setBaudRate()` risk, a troubleshooting section, and
the commands that the client does not wrap. A tare that the device does not confirm now logs with `console.warn` instead
of `console.error`.
