import type { DownloadPacket } from "../interfaces/download.interface"
/**
 * Array of DownloadPacket entries.
 */
export const DownloadPackets: DownloadPacket[] = [] // Initialize an empty array of DownloadPacket entries

// Function to empty DownloadPackets array
export const emptyDownloadPackets = (): void => {
  DownloadPackets.length = 0 // Set the length of the array to 0 to empty it
}

/**
 * Converts an array of DownloadPacket objects to a CSV string.
 * @param data - Array of DownloadPacket objects.
 * @returns CSV string representation of the data.
 */
const packetsToCSV = (data: DownloadPacket[]): string => {
  return data
    .map((packet) =>
      [
        packet.received.toString(),
        packet.sampleNum.toString(),
        packet.battRaw.toString(),
        ...packet.samples.map(String),
        ...packet.masses.map(String),
      ]
        .map((v) => v.replace(/"/g, '""'))
        .map((v) => `"${v}"`)
        .join(","),
    )
    .join("\r\n")
}

/**
 * Converts an array of DownloadPacket objects to a JSON string.
 * @param data - Array of DownloadPacket objects.
 * @returns JSON string representation of the data.
 */
const packetsToJSON = (data: DownloadPacket[]): string => {
  return JSON.stringify(data, null, 2) // Pretty print JSON with 2-space indentation
}

/**
 * Converts an array of DownloadPacket objects to an XML string.
 * @param data - Array of DownloadPacket objects.
 * @returns XML string representation of the data.
 */
const packetsToXML = (data: DownloadPacket[]): string => {
  const xmlPackets = data
    .map((packet) => {
      const samples = packet.samples.map((sample) => `<sample>${sample}</sample>`).join("")
      const masses = packet.masses.map((mass) => `<mass>${mass}</mass>`).join("")
      return `
        <packet>
          <received>${packet.received}</received>
          <sampleNum>${packet.sampleNum}</sampleNum>
          <battRaw>${packet.battRaw}</battRaw>
          <samples>${samples}</samples>
          <masses>${masses}</masses>
        </packet>
      `
    })
    .join("")

  return `<DownloadPackets>${xmlPackets}</DownloadPackets>`
}

/**
 * Exports the data in the specified format (CSV, JSON, XML) with a filename format:
 * 'data-export-YYYY-MM-DD-HH-MM-SS.{format}'.
 *
 * @param {('csv' | 'json' | 'xml')} [format='csv'] - The format in which to download the data.
 * Defaults to 'csv'. Accepted values are 'csv', 'json', and 'xml'.
 *
 * @returns {void} Initiates a download of the data in the specified format.
 */
export const download = (format: "csv" | "json" | "xml" = "csv"): void => {
  let content = ""
  let mimeType = ""
  let fileName = ""

  if (format === "csv") {
    content = packetsToCSV(DownloadPackets)
    mimeType = "text/csv"
  } else if (format === "json") {
    content = packetsToJSON(DownloadPackets)
    mimeType = "application/json"
  } else if (format === "xml") {
    content = packetsToXML(DownloadPackets)
    mimeType = "application/xml"
  }

  const now = new Date()
  // YYYY-MM-DD
  const date = now.toISOString().split("T")[0]
  // HH-MM-SS
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")

  fileName = `data-export-${date}-${time}.${format}`

  // Create a Blob object containing the data
  const blob = new Blob([content], { type: mimeType })

  // Create a URL for the Blob
  const url = window.URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement("a")

  // Set link attributes
  link.href = url
  link.setAttribute("download", fileName)

  // Append link to document body
  document.body.appendChild(link)

  // Programmatically click the link to trigger the download
  link.click()

  // Clean up: remove the link and revoke the URL
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
