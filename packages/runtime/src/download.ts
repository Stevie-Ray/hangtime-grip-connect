import { writeFile } from "node:fs/promises"

export type DownloadFormat = "csv" | "json" | "xml"

export async function writeDownloadFile(format: DownloadFormat, content: string): Promise<string> {
  const now = new Date()
  const date = now.toISOString().split("T")[0]
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")
  const fileName = `data-export-${date}-${time}.${format}`

  await writeFile(fileName, content)
  console.log(`File saved as ${fileName}`)

  return fileName
}
