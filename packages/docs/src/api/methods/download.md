---
title: download
description: Exports session data as CSV, JSON, or XML.
---

# download

Exports the session data as a file. The filename format is `data-export-YYYY-MM-DD-HH-MM-SS.{format}`. Data must have
been collected during the session (e.g. via `notify()` while streaming).

## Signature

```ts
download(format?: "csv" | "json" | "xml"): void
```

## Parameters

| Parameter | Type                           | Default | Description                            |
| --------- | ------------------------------ | ------- | -------------------------------------- |
| format    | `"csv"` \| `"json"` \| `"xml"` | `"csv"` | Export format for the downloaded file. |

## Returns

`void` - Initiates a browser download.

## Example

```ts
await device.connect(
  async () => {
    device.notify((data) => console.log(data.current))
    await device.stream(30000)
    device.download("json")
    device.disconnect()
  },
  (err) => console.error(err),
)
```
