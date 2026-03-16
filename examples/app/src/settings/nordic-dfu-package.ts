import { unzipSync } from "fflate"

export interface NordicDfuPackageImage {
  type: "application"
  imageFile: string
  initFile: string
  imageData: Uint8Array
  initData: Uint8Array
}

export interface NordicDfuPackage {
  packageName: string
  image: NordicDfuPackageImage
}

interface NordicManifest {
  manifest?: {
    application?: {
      bin_file?: string
      dat_file?: string
    }
  }
}

function getArchiveEntry(archive: Record<string, Uint8Array>, fileName: string): Uint8Array | undefined {
  return archive[fileName] ?? Object.entries(archive).find(([entryName]) => entryName.endsWith(`/${fileName}`))?.[1]
}

function parseManifest(raw: Uint8Array): NordicManifest {
  return JSON.parse(new TextDecoder().decode(raw)) as NordicManifest
}

export async function loadNordicDfuPackage(file: File): Promise<NordicDfuPackage> {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const manifestBytes = getArchiveEntry(archive, "manifest.json")
  if (!manifestBytes) {
    throw new Error('Nordic DFU package is missing "manifest.json".')
  }

  const manifest = parseManifest(manifestBytes)
  const application = manifest.manifest?.application
  if (!application?.bin_file || !application.dat_file) {
    throw new Error("Only Nordic application DFU packages are supported.")
  }

  const imageData = getArchiveEntry(archive, application.bin_file)
  if (!imageData) {
    throw new Error(`Nordic DFU package is missing "${application.bin_file}".`)
  }

  const initData = getArchiveEntry(archive, application.dat_file)
  if (!initData) {
    throw new Error(`Nordic DFU package is missing "${application.dat_file}".`)
  }

  return {
    packageName: file.name,
    image: {
      type: "application",
      imageFile: application.bin_file,
      initFile: application.dat_file,
      imageData,
      initData,
    },
  }
}
