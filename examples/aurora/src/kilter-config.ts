import auroraHolesRaw from "./data/aurora/holes.json" with { type: "json" }
import auroraLayoutsRaw from "./data/aurora/layouts.json" with { type: "json" }
import auroraLedsRaw from "./data/aurora/leds.json" with { type: "json" }
import auroraPlacementsRaw from "./data/aurora/placements.json" with { type: "json" }
import auroraProductSizesRaw from "./data/aurora/product_sizes.json" with { type: "json" }
import auroraProductSizesLayoutsSetsRaw from "./data/aurora/product_sizes_layouts_sets.json" with { type: "json" }
import auroraSetsRaw from "./data/aurora/sets.json" with { type: "json" }
import decoyHolesRaw from "./data/decoy/holes.json" with { type: "json" }
import decoyLayoutsRaw from "./data/decoy/layouts.json" with { type: "json" }
import decoyLedsRaw from "./data/decoy/leds.json" with { type: "json" }
import decoyPlacementsRaw from "./data/decoy/placements.json" with { type: "json" }
import decoyProductSizesRaw from "./data/decoy/product_sizes.json" with { type: "json" }
import decoyProductSizesLayoutsSetsRaw from "./data/decoy/product_sizes_layouts_sets.json" with { type: "json" }
import decoySetsRaw from "./data/decoy/sets.json" with { type: "json" }
import grasshopperHolesRaw from "./data/grasshopper/holes.json" with { type: "json" }
import grasshopperLayoutsRaw from "./data/grasshopper/layouts.json" with { type: "json" }
import grasshopperLedsRaw from "./data/grasshopper/leds.json" with { type: "json" }
import grasshopperPlacementsRaw from "./data/grasshopper/placements.json" with { type: "json" }
import grasshopperProductSizesRaw from "./data/grasshopper/product_sizes.json" with { type: "json" }
import grasshopperProductSizesLayoutsSetsRaw from "./data/grasshopper/product_sizes_layouts_sets.json" with { type: "json" }
import grasshopperSetsRaw from "./data/grasshopper/sets.json" with { type: "json" }
import kilterHolesRaw from "./data/kilter/holes.json" with { type: "json" }
import kilterLayoutsRaw from "./data/kilter/layouts.json" with { type: "json" }
import kilterLedsRaw from "./data/kilter/leds.json" with { type: "json" }
import kilterPlacementsRaw from "./data/kilter/placements.json" with { type: "json" }
import kilterProductSizesRaw from "./data/kilter/product_sizes.json" with { type: "json" }
import kilterProductSizesLayoutsSetsRaw from "./data/kilter/product_sizes_layouts_sets.json" with { type: "json" }
import kilterSetsRaw from "./data/kilter/sets.json" with { type: "json" }
import soillHolesRaw from "./data/soill/holes.json" with { type: "json" }
import soillLayoutsRaw from "./data/soill/layouts.json" with { type: "json" }
import soillLedsRaw from "./data/soill/leds.json" with { type: "json" }
import soillPlacementsRaw from "./data/soill/placements.json" with { type: "json" }
import soillProductSizesRaw from "./data/soill/product_sizes.json" with { type: "json" }
import soillProductSizesLayoutsSetsRaw from "./data/soill/product_sizes_layouts_sets.json" with { type: "json" }
import soillSetsRaw from "./data/soill/sets.json" with { type: "json" }
import tensionHolesRaw from "./data/tension/holes.json" with { type: "json" }
import tensionLayoutsRaw from "./data/tension/layouts.json" with { type: "json" }
import tensionLedsRaw from "./data/tension/leds.json" with { type: "json" }
import tensionPlacementsRaw from "./data/tension/placements.json" with { type: "json" }
import tensionProductSizesRaw from "./data/tension/product_sizes.json" with { type: "json" }
import tensionProductSizesLayoutsSetsRaw from "./data/tension/product_sizes_layouts_sets.json" with { type: "json" }
import tensionSetsRaw from "./data/tension/sets.json" with { type: "json" }
import touchstoneHolesRaw from "./data/touchstone/holes.json" with { type: "json" }
import touchstoneLayoutsRaw from "./data/touchstone/layouts.json" with { type: "json" }
import touchstoneLedsRaw from "./data/touchstone/leds.json" with { type: "json" }
import touchstonePlacementsRaw from "./data/touchstone/placements.json" with { type: "json" }
import touchstoneProductSizesRaw from "./data/touchstone/product_sizes.json" with { type: "json" }
import touchstoneProductSizesLayoutsSetsRaw from "./data/touchstone/product_sizes_layouts_sets.json" with { type: "json" }
import touchstoneSetsRaw from "./data/touchstone/sets.json" with { type: "json" }
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
  boardName: AuroraBoardName
  layoutId: number
  sizeId: number
  setIds: number[]
}

export interface AuroraBoardOption {
  name: AuroraBoardName
  label: string
}

export type AuroraBoardName = "kilter" | "aurora" | "soill" | "tension" | "decoy" | "grasshopper" | "touchstone"

interface BoardDataset {
  label: string
  layouts: LayoutRow[]
  productSizes: ProductSizeRow[]
  sets: SetRow[]
  productSizesLayoutsSets: ProductSizeLayoutSetRow[]
  placements: PlacementRow[]
  holes: HoleRow[]
  leds: { id: number; product_size_id: number; hole_id: number; position: number }[]
}

interface ResolvedBoardDataset extends BoardDataset {
  name: AuroraBoardName
  layoutById: Map<number, LayoutRow>
  setById: Map<number, SetRow>
  holeById: Map<number, HoleRow>
  placementByLayoutHoleKey: Map<string, PlacementRow>
}

const BOARD_DATASETS: Record<AuroraBoardName, BoardDataset> = {
  kilter: createBoardDataset("Kilter Board", {
    holes: kilterHolesRaw,
    layouts: kilterLayoutsRaw,
    leds: kilterLedsRaw,
    placements: kilterPlacementsRaw,
    productSizes: kilterProductSizesRaw,
    productSizesLayoutsSets: kilterProductSizesLayoutsSetsRaw,
    sets: kilterSetsRaw,
  }),
  aurora: createBoardDataset("Aurora Board", {
    holes: auroraHolesRaw,
    layouts: auroraLayoutsRaw,
    leds: auroraLedsRaw,
    placements: auroraPlacementsRaw,
    productSizes: auroraProductSizesRaw,
    productSizesLayoutsSets: auroraProductSizesLayoutsSetsRaw,
    sets: auroraSetsRaw,
  }),
  soill: createBoardDataset("So iLL Board", {
    holes: soillHolesRaw,
    layouts: soillLayoutsRaw,
    leds: soillLedsRaw,
    placements: soillPlacementsRaw,
    productSizes: soillProductSizesRaw,
    productSizesLayoutsSets: soillProductSizesLayoutsSetsRaw,
    sets: soillSetsRaw,
  }),
  tension: createBoardDataset("Tension Board", {
    holes: tensionHolesRaw,
    layouts: tensionLayoutsRaw,
    leds: tensionLedsRaw,
    placements: tensionPlacementsRaw,
    productSizes: tensionProductSizesRaw,
    productSizesLayoutsSets: tensionProductSizesLayoutsSetsRaw,
    sets: tensionSetsRaw,
  }),
  decoy: createBoardDataset("Decoy Board", {
    holes: decoyHolesRaw,
    layouts: decoyLayoutsRaw,
    leds: decoyLedsRaw,
    placements: decoyPlacementsRaw,
    productSizes: decoyProductSizesRaw,
    productSizesLayoutsSets: decoyProductSizesLayoutsSetsRaw,
    sets: decoySetsRaw,
  }),
  grasshopper: createBoardDataset("Grasshopper Board", {
    holes: grasshopperHolesRaw,
    layouts: grasshopperLayoutsRaw,
    leds: grasshopperLedsRaw,
    placements: grasshopperPlacementsRaw,
    productSizes: grasshopperProductSizesRaw,
    productSizesLayoutsSets: grasshopperProductSizesLayoutsSetsRaw,
    sets: grasshopperSetsRaw,
  }),
  touchstone: createBoardDataset("Touchstone Board", {
    holes: touchstoneHolesRaw,
    layouts: touchstoneLayoutsRaw,
    leds: touchstoneLedsRaw,
    placements: touchstonePlacementsRaw,
    productSizes: touchstoneProductSizesRaw,
    productSizesLayoutsSets: touchstoneProductSizesLayoutsSetsRaw,
    sets: touchstoneSetsRaw,
  }),
}

function createBoardDataset(
  label: string,
  raw: {
    layouts: unknown
    productSizes: unknown
    sets: unknown
    productSizesLayoutsSets: unknown
    placements: unknown
    holes: unknown
    leds: unknown
  },
): BoardDataset {
  return {
    label,
    layouts: raw.layouts as LayoutRow[],
    productSizes: raw.productSizes as ProductSizeRow[],
    sets: raw.sets as SetRow[],
    productSizesLayoutsSets: raw.productSizesLayoutsSets as ProductSizeLayoutSetRow[],
    placements: raw.placements as PlacementRow[],
    holes: raw.holes as HoleRow[],
    leds: raw.leds as { id: number; product_size_id: number; hole_id: number; position: number }[],
  }
}

function getBoardDataset(boardName: AuroraBoardName): ResolvedBoardDataset {
  const dataset = BOARD_DATASETS[boardName]
  return {
    ...dataset,
    name: boardName,
    layoutById: new Map(dataset.layouts.map((layout) => [layout.id, layout])),
    setById: new Map(dataset.sets.map((setRow) => [setRow.id, setRow])),
    holeById: new Map(dataset.holes.map((hole) => [hole.id, hole])),
    placementByLayoutHoleKey: new Map(
      dataset.placements.map((placement) => [`${placement.layout_id}-${placement.hole_id}`, placement]),
    ),
  }
}

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

export function getAuroraBoardOptions(): AuroraBoardOption[] {
  return Object.entries(BOARD_DATASETS).map(([name, dataset]) => ({
    name: name as AuroraBoardName,
    label: dataset.label,
  }))
}

export function isAuroraBoardName(value: string): value is AuroraBoardName {
  return value in BOARD_DATASETS
}

function getKilterImageFilename(
  dataset: ResolvedBoardDataset,
  layoutId: number,
  sizeId: number,
  setId: number,
): string | null {
  return (
    dataset.productSizesLayoutsSets.find(
      (row) =>
        row.layout_id === layoutId && row.product_size_id === sizeId && row.set_id === setId && row.is_listed === 1,
    )?.image_filename ?? null
  )
}

function getKilterHolePlacements(
  dataset: ResolvedBoardDataset,
  layoutId: number,
  setId: number,
): [number, number | null, number, number][] {
  return dataset.placements
    .filter((placement) => placement.layout_id === layoutId && placement.set_id === setId)
    .map((placement) => {
      const hole = dataset.holeById.get(placement.hole_id)
      if (!hole) {
        return undefined
      }

      const mirroredPlacementId =
        hole.mirrored_hole_id !== null
          ? (dataset.placementByLayoutHoleKey.get(`${layoutId}-${hole.mirrored_hole_id}`)?.id ?? null)
          : null

      return [placement.id, mirroredPlacementId, hole.x, hole.y] as [number, number | null, number, number]
    })
    .filter(isDefined)
}

export function getKilterLayouts(boardName: AuroraBoardName): LayoutData[] {
  const dataset = getBoardDataset(boardName)
  const renderableLayoutIds = new Set(dataset.productSizesLayoutsSets.map((row) => row.layout_id))

  return dataset.layouts
    .filter((layout) => renderableLayoutIds.has(layout.id))
    .sort((left, right) => left.id - right.id)
    .map(toLayoutData)
}

export function getKilterSizes(boardName: AuroraBoardName, layoutId: number): ProductSizeData[] {
  const dataset = getBoardDataset(boardName)
  const layout = dataset.layoutById.get(layoutId)
  if (!layout) {
    return []
  }

  return dataset.productSizes
    .filter((size) => size.product_id === layout.product_id && size.is_listed === 1)
    .sort((left, right) => left.position - right.position || left.id - right.id)
    .map(toProductSizeData)
}

export function getKilterSets(boardName: AuroraBoardName, layoutId: number, sizeId: number): SetData[] {
  const dataset = getBoardDataset(boardName)
  return dataset.productSizesLayoutsSets
    .filter((row) => row.layout_id === layoutId && row.product_size_id === sizeId && row.is_listed === 1)
    .map((row) => dataset.setById.get(row.set_id))
    .filter(isDefined)
    .map(toSetData)
}

export function getDefaultKilterConfig(boardName: AuroraBoardName = "kilter", layoutId?: number): KilterConfig {
  const selectedLayoutId = layoutId ?? getKilterLayouts(boardName)[0]?.id ?? 1
  const sizeId = getKilterSizes(boardName, selectedLayoutId)[0]?.id ?? 1
  const setIds = getKilterSets(boardName, selectedLayoutId, sizeId)
    .map((set) => set.id)
    .sort((a, b) => a - b)

  return {
    boardName,
    layoutId: selectedLayoutId,
    sizeId,
    setIds,
  }
}

export function resolveKilterConfig(partial: Partial<KilterConfig>): KilterConfig {
  const boardName = partial.boardName ?? "kilter"
  const fallback = getDefaultKilterConfig(boardName, partial.layoutId)
  const availableLayouts = getKilterLayouts(boardName)
  const layoutId =
    partial.layoutId !== undefined && availableLayouts.some((layout) => layout.id === partial.layoutId)
      ? partial.layoutId
      : fallback.layoutId

  const availableSizes = getKilterSizes(boardName, layoutId)
  const sizeId =
    partial.sizeId !== undefined && availableSizes.some((size) => size.id === partial.sizeId)
      ? partial.sizeId
      : getDefaultKilterConfig(boardName, layoutId).sizeId

  const availableSetIds = getKilterSets(boardName, layoutId, sizeId)
    .map((set) => set.id)
    .sort((a, b) => a - b)

  const selectedSetIds = (partial.setIds ?? availableSetIds)
    .filter((setId, index, source) => availableSetIds.includes(setId) && source.indexOf(setId) === index)
    .sort((a, b) => a - b)

  return {
    boardName,
    layoutId,
    sizeId,
    setIds: selectedSetIds.length > 0 ? selectedSetIds : availableSetIds,
  }
}

export async function getKilterBoardDetails(config: KilterConfig): Promise<BoardDetails> {
  const dataset = getBoardDataset(config.boardName)
  const size = dataset.productSizes.find((entry) => entry.id === config.sizeId)
  if (!size) {
    throw new Error("Size dimensions not found")
  }

  const layout = dataset.layoutById.get(config.layoutId)
  const sets = getKilterSets(config.boardName, config.layoutId, config.sizeId)

  const imagesToHolds: Record<string, [number, number | null, number, number][]> = {}
  for (const setId of config.setIds) {
    const imageFilename = getKilterImageFilename(dataset, config.layoutId, config.sizeId, setId)
    if (!imageFilename) {
      throw new Error(
        `Could not find image for set_id ${setId} for layout_id: ${config.layoutId} and size_id: ${config.sizeId}`,
      )
    }

    imagesToHolds[imageFilename] = getKilterHolePlacements(dataset, config.layoutId, setId)
  }

  const edge_left = size.edge_left
  const edge_right = size.edge_right
  const edge_bottom = size.edge_bottom
  const edge_top = size.edge_top

  const firstImagePath = Object.keys(imagesToHolds)[0]
  const { width: boardWidth, height: boardHeight } = firstImagePath
    ? await getImageDimensions(config.boardName, firstImagePath).catch(() => getFallbackDimensions(size))
    : getFallbackDimensions(size)
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
    board_name: config.boardName,
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
  const dataset = getBoardDataset(config.boardName)
  const ledPlacements: Record<number, number> = {}

  for (const led of dataset.leds) {
    if (led.product_size_id !== config.sizeId) {
      continue
    }

    const placement = dataset.placementByLayoutHoleKey.get(`${config.layoutId}-${led.hole_id}`)
    if (placement) {
      ledPlacements[placement.id] = led.position
    }
  }

  return ledPlacements
}

export function getKilterImageUrl(boardName: AuroraBoardName, imagePath: string): string {
  return `/img/${boardName}/${imagePath}`
}

const imageDimensionsByUrl = new Map<string, Promise<{ width: number; height: number }>>()

function getFallbackDimensions(size: ProductSizeRow): { width: number; height: number } {
  const coordinateWidth = Math.max(1, size.edge_right - size.edge_left)
  const coordinateHeight = Math.max(1, size.edge_top - size.edge_bottom)
  const width = 1080

  return {
    width,
    height: Math.round((width * coordinateHeight) / coordinateWidth),
  }
}

function getImageDimensions(boardName: AuroraBoardName, imagePath: string): Promise<{ width: number; height: number }> {
  const imageUrl = getKilterImageUrl(boardName, imagePath)
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
