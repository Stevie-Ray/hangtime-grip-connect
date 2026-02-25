import { mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import process from "node:process"

const HITS_PER_PAGE = 1000
const GRIP_CONNECT_DIR_PATH = path.join(os.homedir(), ".grip-connect")
const CACHE_FILE_PATH = path.join(GRIP_CONNECT_DIR_PATH, "algolia_training_programs.json")
const TRAINING_PROGRAMS_ENV_FILE_PATHS = [path.resolve(process.cwd(), ".env"), path.join(GRIP_CONNECT_DIR_PATH, ".env")]

for (const envFilePath of TRAINING_PROGRAMS_ENV_FILE_PATHS) {
  if (!existsSync(envFilePath)) continue
  try {
    process.loadEnvFile?.(envFilePath)
  } catch {
    // `.env` is optional; environment variables can also be provided by the shell.
  }
}

export function hasTrainingProgramsEnvFile(): boolean {
  return TRAINING_PROGRAMS_ENV_FILE_PATHS.some((envFilePath) => existsSync(envFilePath))
}

interface AlgoliaTrainingProgramsResponse {
  hits?: unknown[]
  nbPages?: number
}

export interface TrainingProgramRecord {
  objectID?: string
  id?: string
  title?: string
  name?: string
  date?: number
  description?: string
  likes?: number
  tags?: unknown[]
  [key: string]: unknown
}

async function fetchTrainingProgramsPage(page: number): Promise<AlgoliaTrainingProgramsResponse> {
  const appId = process.env["ALGOLIA_APP_ID"]
  const apiKey = process.env["ALGOLIA_API_KEY"]
  if (!appId || !apiKey) {
    throw new Error("Missing ALGOLIA_APP_ID or ALGOLIA_API_KEY in environment (.env or ~/.grip-connect/.env)")
  }

  const trainingProgramsUrl = `https://${appId}-dsn.algolia.net/1/indexes/trainingPrograms/query`

  const response = await fetch(trainingProgramsUrl, {
    method: "POST",
    headers: {
      "x-algolia-application-id": appId,
      "x-algolia-api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ params: `query=&hitsPerPage=${HITS_PER_PAGE}&page=${page}` }),
  })

  if (!response.ok) {
    throw new Error(`Training programs fetch failed (${response.status} ${response.statusText})`)
  }

  return (await response.json()) as AlgoliaTrainingProgramsResponse
}

export async function fetchTrainingPrograms(): Promise<TrainingProgramRecord[]> {
  try {
    const cachedRaw = await readFile(CACHE_FILE_PATH, "utf8")
    const cachedParsed = JSON.parse(cachedRaw) as unknown
    if (Array.isArray(cachedParsed)) {
      return cachedParsed.filter((item): item is TrainingProgramRecord => typeof item === "object" && item !== null)
    }
  } catch {
    // Cache miss or invalid cache; fall through to remote fetch.
  }

  const firstPage = await fetchTrainingProgramsPage(0)
  const nbPagesRaw = typeof firstPage.nbPages === "number" ? firstPage.nbPages : 1
  const nbPages = Math.max(1, Math.trunc(nbPagesRaw))

  const programs: TrainingProgramRecord[] = Array.isArray(firstPage.hits)
    ? firstPage.hits.filter((hit): hit is TrainingProgramRecord => typeof hit === "object" && hit !== null)
    : []

  for (let page = 1; page < nbPages; page += 1) {
    const pageResponse = await fetchTrainingProgramsPage(page)
    if (!Array.isArray(pageResponse.hits)) continue

    const pagePrograms = pageResponse.hits.filter(
      (hit): hit is TrainingProgramRecord => typeof hit === "object" && hit !== null,
    )
    programs.push(...pagePrograms)
  }

  try {
    await mkdir(path.dirname(CACHE_FILE_PATH), { recursive: true })
    await writeFile(CACHE_FILE_PATH, JSON.stringify(programs, null, 2), "utf8")
  } catch {
    // Best-effort cache write; continue even if this fails.
  }

  return programs
}
