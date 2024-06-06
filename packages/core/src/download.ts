import type { DownloadPacket } from "./types/download"
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
 * Exports the data as a CSV file.
 */
export const download = (): void => {
  // Generate CSV string from DownloadPackets array
  const csvContent: string = packetsToCSV(DownloadPackets)

  // Create a Blob object containing the CSV data
  const blob = new Blob([csvContent], { type: "text/csv" })

  // Create a URL for the Blob
  const url = window.URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement("a")

  // Set link attributes
  link.href = url
  link.setAttribute("download", "data.csv")

  // Append link to document body
  document.body.appendChild(link)

  // Programmatically click the link to trigger the download
  link.click()

  // Clean up: remove the link and revoke the URL
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
