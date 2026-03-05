import { isTrainingProgramRecord } from "./model.js"
import type { TrainingProgramRecord } from "./model.js"

const HITS_PER_PAGE = 1000
const TRAINING_PROGRAMS_CACHE_KEY = "grip-connect.chart.algolia_training_programs.v1"

interface AlgoliaTrainingProgramsResponse {
  hits?: unknown[]
  nbPages?: number
}

interface TrainingProgramsCache {
  programs: TrainingProgramRecord[]
}

function getAlgoliaCredentials(): { appId: string; apiKey: string } | null {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  const appId = env?.["VITE_ALGOLIA_APP_ID"]
  const apiKey = env?.["VITE_ALGOLIA_API_KEY"]
  if (!appId || !apiKey) return null
  return { appId, apiKey }
}

export function hasTrainingProgramsEnv(): boolean {
  return getAlgoliaCredentials() != null
}

function readTrainingProgramsCache(): TrainingProgramRecord[] | null {
  try {
    const cachedRaw = localStorage.getItem(TRAINING_PROGRAMS_CACHE_KEY)
    if (!cachedRaw) return null
    const parsed = JSON.parse(cachedRaw) as TrainingProgramsCache
    if (!Array.isArray(parsed.programs)) return null
    return parsed.programs.filter(isTrainingProgramRecord)
  } catch {
    return null
  }
}

function writeTrainingProgramsCache(programs: TrainingProgramRecord[]): void {
  try {
    localStorage.setItem(TRAINING_PROGRAMS_CACHE_KEY, JSON.stringify({ programs }))
  } catch {
    // Best-effort cache write; continue even if this fails.
  }
}

async function fetchTrainingProgramsPage(page: number): Promise<AlgoliaTrainingProgramsResponse> {
  const credentials = getAlgoliaCredentials()
  if (!credentials) {
    throw new Error("Missing credentials.")
  }

  const trainingProgramsUrl = `https://${credentials.appId}-dsn.algolia.net/1/indexes/trainingPrograms/query`
  const response = await fetch(trainingProgramsUrl, {
    method: "POST",
    headers: {
      "x-algolia-application-id": credentials.appId,
      "x-algolia-api-key": credentials.apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ params: `query=&hitsPerPage=${HITS_PER_PAGE}&page=${page}` }),
  })

  if (!response.ok) {
    throw new Error(`Training programs fetch failed (${response.status} ${response.statusText})`)
  }

  return (await response.json()) as AlgoliaTrainingProgramsResponse
}

export async function fetchTrainingPrograms(forceRefresh = false): Promise<TrainingProgramRecord[]> {
  if (!forceRefresh) {
    const cached = readTrainingProgramsCache()
    if (cached) return cached
  }

  const firstPage = await fetchTrainingProgramsPage(0)
  const nbPagesRaw = typeof firstPage.nbPages === "number" ? firstPage.nbPages : 1
  const nbPages = Math.max(1, Math.trunc(nbPagesRaw))
  const programs: TrainingProgramRecord[] = Array.isArray(firstPage.hits)
    ? firstPage.hits.filter(isTrainingProgramRecord)
    : []
  const remainingPages = Array.from({ length: Math.max(0, nbPages - 1) }, (_, index) => index + 1)
  const remainingResponses = await Promise.all(remainingPages.map((page) => fetchTrainingProgramsPage(page)))

  remainingResponses.forEach((pageResponse) => {
    if (!Array.isArray(pageResponse.hits)) return
    programs.push(...pageResponse.hits.filter(isTrainingProgramRecord))
  })

  writeTrainingProgramsCache(programs)
  return programs
}
