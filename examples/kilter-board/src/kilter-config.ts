import holesRaw from "./data/holes.json" with { type: "json" }
import layoutsRaw from "./data/layouts.json" with { type: "json" }
import ledsRaw from "./data/leds.json" with { type: "json" }
import placementsRaw from "./data/placements.json" with { type: "json" }
import productSizesRaw from "./data/product_sizes.json" with { type: "json" }
import productSizesLayoutsSetsRaw from "./data/product_sizes_layouts_sets.json" with { type: "json" }
import setsRaw from "./data/sets.json" with { type: "json" }
import type { BoardDetails } from "./kilter-types.js"

interface LayoutRow {
  id: number
  product_id: number
  name: string
  instagram_caption: string
  is_mirrored: number
  is_listed: number
  password: string | null
  created_at: string
}

interface ProductSizeRow {
  id: number
  product_id: number
  edge_left: number
  edge_right: number
  edge_bottom: number
  edge_top: number
  name: string
  description: string
  image_filename: string
  position: number
  is_listed: number
}

interface SetRow {
  id: number
  name: string
  hsm: number
}

interface ProductSizeLayoutSetRow {
  id: number
  product_size_id: number
  layout_id: number
  set_id: number
  image_filename: string
  is_listed: number
}

interface PlacementRow {
  id: number
  layout_id: number
  hole_id: number
  set_id: number
  default_placement_role_id: number | null
}

interface HoleRow {
  id: number
  product_id: number
  name: string
  x: number
  y: number
  mirrored_hole_id: number | null
  mirror_group: number
}

export interface LayoutData {
  id: number
  name: string
  productId: number
}

export interface ProductSizeData {
  id: number
  name: string
  description: string
  edgeLeft: number
  edgeRight: number
  edgeBottom: number
  edgeTop: number
  productId: number
}

export interface SetData {
  id: number
  name: string
}

export interface KilterConfig {
  layoutId: number
  sizeId: number
  setIds: number[]
}

const BOARD_NAME = "kilter" as const
const DEFAULT_SIZE_FOR_LAYOUT: Record<number, number> = {
  1: 10,
  8: 17,
}

const LAYOUTS = layoutsRaw as unknown as LayoutRow[]
const PRODUCT_SIZES = productSizesRaw as unknown as ProductSizeRow[]
const SETS = setsRaw as unknown as SetRow[]
const PRODUCT_SIZES_LAYOUTS_SETS = productSizesLayoutsSetsRaw as unknown as ProductSizeLayoutSetRow[]
const PLACEMENTS = placementsRaw as unknown as PlacementRow[]
const HOLES = holesRaw as unknown as HoleRow[]
const LEDS = ledsRaw as unknown as { id: number; product_size_id: number; hole_id: number; position: number }[]

const layoutById = new Map(LAYOUTS.map((layout) => [layout.id, layout]))
const setById = new Map(SETS.map((setRow) => [setRow.id, setRow]))
const holeById = new Map(HOLES.map((hole) => [hole.id, hole]))
const placementByLayoutHoleKey = new Map(
  PLACEMENTS.map((placement) => [`${placement.layout_id}-${placement.hole_id}`, placement]),
)

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

function toLayoutData(layout: LayoutRow): LayoutData {
  return {
    id: layout.id,
    name: layout.name,
    productId: layout.product_id,
  }
}

function toProductSizeData(size: ProductSizeRow): ProductSizeData {
  return {
    id: size.id,
    name: size.name,
    description: size.description,
    edgeLeft: size.edge_left,
    edgeRight: size.edge_right,
    edgeBottom: size.edge_bottom,
    edgeTop: size.edge_top,
    productId: size.product_id,
  }
}

function toSetData(setRow: SetRow): SetData {
  return {
    id: setRow.id,
    name: setRow.name,
  }
}

function getKilterImageFilename(layoutId: number, sizeId: number, setId: number): string | null {
  return (
    PRODUCT_SIZES_LAYOUTS_SETS.find(
      (row) =>
        row.layout_id === layoutId && row.product_size_id === sizeId && row.set_id === setId && row.is_listed === 1,
    )?.image_filename ?? null
  )
}

function getKilterHolePlacements(layoutId: number, setId: number): [number, number | null, number, number][] {
  return PLACEMENTS.filter((placement) => placement.layout_id === layoutId && placement.set_id === setId)
    .map((placement) => {
      const hole = holeById.get(placement.hole_id)
      if (!hole) {
        return undefined
      }

      const mirroredPlacementId =
        hole.mirrored_hole_id !== null
          ? (placementByLayoutHoleKey.get(`${layoutId}-${hole.mirrored_hole_id}`)?.id ?? null)
          : null

      return [placement.id, mirroredPlacementId, hole.x, hole.y] as [number, number | null, number, number]
    })
    .filter(isDefined)
}

export function getKilterLayouts(): LayoutData[] {
  return LAYOUTS.filter((layout) => layout.is_listed === 1 && layout.password === null).map(toLayoutData)
}

export function getKilterSizes(layoutId: number): ProductSizeData[] {
  const layout = layoutById.get(layoutId)
  if (!layout) {
    return []
  }

  return PRODUCT_SIZES.filter((size) => size.product_id === layout.product_id && size.is_listed === 1)
    .sort((left, right) => left.position - right.position || left.id - right.id)
    .map(toProductSizeData)
}

export function getKilterSets(layoutId: number, sizeId: number): SetData[] {
  return PRODUCT_SIZES_LAYOUTS_SETS.filter(
    (row) => row.layout_id === layoutId && row.product_size_id === sizeId && row.is_listed === 1,
  )
    .map((row) => setById.get(row.set_id))
    .filter(isDefined)
    .map(toSetData)
}

export function getDefaultKilterConfig(layoutId?: number): KilterConfig {
  const selectedLayoutId = layoutId ?? getKilterLayouts()[0]?.id ?? 1
  const sizeId = DEFAULT_SIZE_FOR_LAYOUT[selectedLayoutId] ?? getKilterSizes(selectedLayoutId)[0]?.id ?? 10
  const setIds = getKilterSets(selectedLayoutId, sizeId)
    .map((set) => set.id)
    .sort((a, b) => a - b)

  return {
    layoutId: selectedLayoutId,
    sizeId,
    setIds,
  }
}

export function resolveKilterConfig(partial: Partial<KilterConfig>): KilterConfig {
  const fallback = getDefaultKilterConfig(partial.layoutId)
  const availableLayouts = getKilterLayouts()
  const layoutId =
    partial.layoutId !== undefined && availableLayouts.some((layout) => layout.id === partial.layoutId)
      ? partial.layoutId
      : fallback.layoutId

  const availableSizes = getKilterSizes(layoutId)
  const sizeId =
    partial.sizeId !== undefined && availableSizes.some((size) => size.id === partial.sizeId)
      ? partial.sizeId
      : getDefaultKilterConfig(layoutId).sizeId

  const availableSetIds = getKilterSets(layoutId, sizeId)
    .map((set) => set.id)
    .sort((a, b) => a - b)

  const selectedSetIds = (partial.setIds ?? availableSetIds)
    .filter((setId, index, source) => availableSetIds.includes(setId) && source.indexOf(setId) === index)
    .sort((a, b) => a - b)

  return {
    layoutId,
    sizeId,
    setIds: selectedSetIds.length > 0 ? selectedSetIds : availableSetIds,
  }
}

export async function getKilterBoardDetails(config: KilterConfig): Promise<BoardDetails> {
  const size = PRODUCT_SIZES.find((entry) => entry.id === config.sizeId)
  if (!size) {
    throw new Error("Size dimensions not found")
  }

  const layout = layoutById.get(config.layoutId)
  const sets = getKilterSets(config.layoutId, config.sizeId)

  const imagesToHolds: Record<string, [number, number | null, number, number][]> = {}
  for (const setId of config.setIds) {
    const imageFilename = getKilterImageFilename(config.layoutId, config.sizeId, setId)
    if (!imageFilename) {
      throw new Error(
        `Could not find image for set_id ${setId} for layout_id: ${config.layoutId} and size_id: ${config.sizeId}`,
      )
    }

    imagesToHolds[imageFilename] = getKilterHolePlacements(config.layoutId, setId)
  }

  const edge_left = size.edge_left
  const edge_right = size.edge_right
  const edge_bottom = size.edge_bottom
  const edge_top = size.edge_top

  const firstImagePath = Object.keys(imagesToHolds)[0]
  const { width: boardWidth, height: boardHeight } = firstImagePath
    ? await getImageDimensions(firstImagePath)
    : { width: 1080, height: 1920 }
  const xSpacing = boardWidth / (edge_right - edge_left)
  const ySpacing = boardHeight / (edge_top - edge_bottom)

  const holdsData = Object.values(imagesToHolds).flatMap((holds) =>
    holds
      .filter(([, , x, y]) => x > edge_left && x < edge_right && y > edge_bottom && y < edge_top)
      .map(([holdId, mirroredHoldId, x, y]) => ({
        id: holdId,
        mirroredHoldId,
        cx: (x - edge_left) * xSpacing,
        cy: boardHeight - (y - edge_bottom) * ySpacing,
        r: xSpacing * 4,
      })),
  )

  const selectedSets = sets.filter((setData) => config.setIds.includes(setData.id))

  return {
    images_to_holds: imagesToHolds,
    holdsData,
    edge_left,
    edge_right,
    edge_bottom,
    edge_top,
    boardHeight,
    boardWidth,
    board_name: BOARD_NAME,
    layout_id: config.layoutId,
    size_id: config.sizeId,
    set_ids: config.setIds,
    supportsMirroring: false,
    layout_name: layout?.name,
    size_name: size.name,
    size_description: size.description,
    set_names: selectedSets.map((setData) => setData.name),
  }
}

export function getKilterLedPlacements(config: KilterConfig): Record<number, number> {
  const ledPlacements: Record<number, number> = {}

  for (const led of LEDS) {
    if (led.product_size_id !== config.sizeId) {
      continue
    }

    const placement = placementByLayoutHoleKey.get(`${config.layoutId}-${led.hole_id}`)
    if (placement) {
      ledPlacements[placement.id] = led.position
    }
  }

  return ledPlacements
}

export function getKilterImageUrl(imagePath: string): string {
  return `/img/kilter/${imagePath}`
}

const imageDimensionsByUrl = new Map<string, Promise<{ width: number; height: number }>>()

function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
  const imageUrl = getKilterImageUrl(imagePath)
  const cachedDimensions = imageDimensionsByUrl.get(imageUrl)
  if (cachedDimensions) {
    return cachedDimensions
  }

  const dimensionsPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      imageDimensionsByUrl.delete(imageUrl)
      reject(new Error(`Failed to load board image: ${imageUrl}`))
    }

    image.src = imageUrl
  })

  imageDimensionsByUrl.set(imageUrl, dimensionsPromise)
  return dimensionsPromise
}
