export interface HoldRenderData {
  id: number
  mirroredHoldId: number | null
  cx: number
  cy: number
  r: number
}

export interface BoardDetails {
  images_to_holds: Record<string, [number, number | null, number, number][]>
  holdsData: HoldRenderData[]
  edge_left: number
  edge_right: number
  edge_bottom: number
  edge_top: number
  boardHeight: number
  boardWidth: number
  board_name: "kilter"
  layout_id: number
  size_id: number
  set_ids: number[]
  supportsMirroring: boolean
  layout_name?: string | undefined
  size_name?: string | undefined
  size_description?: string | undefined
  set_names: string[]
}
