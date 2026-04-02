/// <reference types="w3c-web-serial" />
import { KilterBoard, KilterBoardPlacementRoles } from "@hangtime/grip-connect"

import type { BoardDetails, HoldRenderData } from "./kilter-types.js"
import {
  getDefaultKilterConfig,
  getKilterBoardDetails,
  getKilterImageUrl,
  getKilterLayouts,
  getKilterLedPlacements,
  getKilterSets,
  getKilterSizes,
  resolveKilterConfig,
  type KilterConfig,
} from "./kilter-config.js"

interface ActiveHold {
  placement_id: number
  role_id?: number
  color?: string
}

interface PayloadPlacement {
  position: number
  role_id?: number
  color?: string
}

const device = new KilterBoard()
const svg = document.querySelector<SVGSVGElement>("#svg")
const configuratorElement = document.querySelector<HTMLDivElement>("#board-configurator")

let currentConfig = getDefaultKilterConfig()
let currentBoardDetails: BoardDetails | null = null
let currentBoardDetailsPromise: Promise<BoardDetails> | null = null
let currentLedPlacements = getKilterLedPlacements(currentConfig)
let currentPlacementByLedPosition = new Map<number, number>()
let circlesByPlacementId = new Map<number, SVGCircleElement[]>()
let activeHolds: ActiveHold[] = []
let boardStateRequestId = 0

export async function initializeBoardDemo() {
  currentConfig = getConfigFromUrl()
  await applyConfig(currentConfig, true, false)

  const routeParam = new URL(globalThis.location.href).searchParams.get("route")
  if (routeParam) {
    setFrames(routeParam)
    updateSVG()
    updatePayload()
  } else {
    updateURL()
  }
}

/** Set up the device connection button */
export function setupDevice(element: HTMLButtonElement) {
  element.addEventListener("click", async () => {
    await device.connect(async () => {
      const placement = getPayloadPlacements()
      if (device instanceof KilterBoard) {
        await device.led(placement)
      }
    })
  })
}

export function setupArduino(element: HTMLButtonElement) {
  element.addEventListener("click", async (event) => {
    event.preventDefault()
    await openPort()
  })
}

/**
 * Take an uploaded image and figure out which holds should light up based on pixel colors.
 */
async function processImageToHolds(imageFile: File): Promise<void> {
  const boardDetails = currentBoardDetails ?? (currentBoardDetailsPromise ? await currentBoardDetailsPromise : null)
  if (!boardDetails) {
    throw new Error("Board details are not loaded yet")
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    img.onload = async () => {
      try {
        const { boardWidth, boardHeight, holdsData } = boardDetails

        canvas.width = boardWidth
        canvas.height = boardHeight

        const imgAspect = img.width / img.height
        const boardAspect = boardWidth / boardHeight

        let drawWidth = boardWidth
        let drawHeight = boardHeight
        let drawX = 0
        let drawY = 0

        if (imgAspect > boardAspect) {
          drawHeight = boardWidth / imgAspect
          drawY = (boardHeight - drawHeight) / 2
        } else {
          drawWidth = boardHeight * imgAspect
          drawX = (boardWidth - drawWidth) / 2
        }

        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, boardWidth, boardHeight)
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        const imageData = ctx.getImageData(0, 0, boardWidth, boardHeight)

        activeHolds = []

        for (const hold of holdsData) {
          const pixelX = Math.floor(Math.max(0, Math.min(boardWidth - 1, hold.cx)))
          const pixelY = Math.floor(Math.max(0, Math.min(boardHeight - 1, hold.cy)))
          const pixelIndex = (pixelY * boardWidth + pixelX) * 4

          const r = imageData.data[pixelIndex]
          const g = imageData.data[pixelIndex + 1]
          const b = imageData.data[pixelIndex + 2]
          const a = imageData.data[pixelIndex + 3]

          if (a < 128 || (r < 10 && g < 10 && b < 10)) {
            continue
          }

          activeHolds.push({
            placement_id: hold.id,
            color: findClosestKilterboardColor(r, g, b),
          })
        }

        updateSVG()
        await updatePayload()
        updateURL()

        resolve()
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = URL.createObjectURL(imageFile)
  })
}

function getConfigFromUrl(): KilterConfig {
  const searchParams = new URL(globalThis.location.href).searchParams
  const layoutId = Number.parseInt(searchParams.get("layout_id") ?? "", 10)
  const sizeId = Number.parseInt(searchParams.get("size_id") ?? "", 10)
  const setIds = (searchParams.get("set_ids") ?? "")
    .split(",")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value))

  const partialConfig: Partial<KilterConfig> = { setIds }

  if (Number.isFinite(layoutId)) {
    partialConfig.layoutId = layoutId
  }

  if (Number.isFinite(sizeId)) {
    partialConfig.sizeId = sizeId
  }

  return resolveKilterConfig(partialConfig)
}

async function applyConfig(nextConfig: KilterConfig, preserveRoute = false, updateHistory = true): Promise<void> {
  const requestId = ++boardStateRequestId
  currentConfig = resolveKilterConfig(nextConfig)
  currentLedPlacements = getKilterLedPlacements(currentConfig)
  currentPlacementByLedPosition = buildPlacementByLedPosition(currentLedPlacements)
  currentBoardDetailsPromise = getKilterBoardDetails(currentConfig)
  const nextBoardDetails = await currentBoardDetailsPromise

  if (requestId !== boardStateRequestId) {
    return
  }

  currentBoardDetails = nextBoardDetails

  if (!preserveRoute) {
    activeHolds = []
  } else {
    activeHolds = activeHolds.filter((hold) => circlesByPlacementId.has(hold.placement_id))
  }

  renderConfigurator()
  renderBoard()
  if (updateHistory) {
    updateURL()
  }
}

function renderConfigurator() {
  if (!configuratorElement) {
    return
  }

  const layoutOptions = getKilterLayouts()
  const sizeOptions = getKilterSizes(currentConfig.layoutId)
  const setOptions = getKilterSets(currentConfig.layoutId, currentConfig.sizeId)

  configuratorElement.innerHTML = `
      <label>
        <span>Layout</span>
        <select id="layout-select">
          ${layoutOptions
            .map(
              (layout) =>
                `<option value="${layout.id}" ${layout.id === currentConfig.layoutId ? "selected" : ""}>${layout.name}</option>`,
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Size</span>
        <select id="size-select">
          ${sizeOptions
            .map(
              (size) =>
                `<option value="${size.id}" ${size.id === currentConfig.sizeId ? "selected" : ""}>${size.name}${size.description ? ` • ${size.description}` : ""}</option>`,
            )
            .join("")}
        </select>
      </label>
      <fieldset id="set-options">
        <legend>Sets</legend>
        ${setOptions
          .map(
            (set) => `
              <label>
                <input type="checkbox" value="${set.id}" ${currentConfig.setIds.includes(set.id) ? "checked" : ""} />
                <span>${set.name}</span>
              </label>
            `,
          )
          .join("")}
      </fieldset>
  `

  const layoutSelect = configuratorElement.querySelector<HTMLSelectElement>("#layout-select")
  const sizeSelect = configuratorElement.querySelector<HTMLSelectElement>("#size-select")
  const setInputs = configuratorElement.querySelectorAll<HTMLInputElement>('#set-options input[type="checkbox"]')

  layoutSelect?.addEventListener("change", () => {
    const layoutId = Number.parseInt(layoutSelect.value, 10)
    applyConfig(getDefaultKilterConfig(layoutId))
  })

  sizeSelect?.addEventListener("change", () => {
    const sizeId = Number.parseInt(sizeSelect.value, 10)
    const setIds = getKilterSets(currentConfig.layoutId, sizeId)
      .map((set) => set.id)
      .sort((a, b) => a - b)

    applyConfig({
      layoutId: currentConfig.layoutId,
      sizeId,
      setIds,
    })
  })

  setInputs.forEach((input) => {
    input.addEventListener("change", () => {
      const selectedSetIds = Array.from(setInputs)
        .filter((setInput) => setInput.checked)
        .map((setInput) => Number.parseInt(setInput.value, 10))
        .sort((a, b) => a - b)

      if (selectedSetIds.length === 0) {
        input.checked = true
        return
      }

      applyConfig({
        layoutId: currentConfig.layoutId,
        sizeId: currentConfig.sizeId,
        setIds: selectedSetIds,
      })
    })
  })
}

function renderBoard() {
  if (!svg || !currentBoardDetails) {
    return
  }

  const boardDetails = currentBoardDetails

  circlesByPlacementId = new Map()

  svg.innerHTML = ""
  svg.setAttribute("viewBox", `0 0 ${boardDetails.boardWidth} ${boardDetails.boardHeight}`)

  Object.keys(boardDetails.images_to_holds).forEach((imagePath) => {
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image")
    image.setAttribute("href", getKilterImageUrl(imagePath))
    image.setAttribute("width", boardDetails.boardWidth.toString())
    image.setAttribute("height", boardDetails.boardHeight.toString())
    svg.appendChild(image)
  })

  boardDetails.holdsData.forEach((hold) => {
    const circle = createHoldCircle(hold)
    const circlesForPlacement = circlesByPlacementId.get(hold.id) ?? []
    circlesForPlacement.push(circle)
    circlesByPlacementId.set(hold.id, circlesForPlacement)
    svg.appendChild(circle)
  })

  updateSVG()
}

function createHoldCircle(hold: HoldRenderData) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
  circle.setAttribute("cx", hold.cx.toString())
  circle.setAttribute("cy", hold.cy.toString())
  circle.setAttribute("r", hold.r.toString())
  circle.setAttribute("fill", "transparent")
  circle.setAttribute("stroke", "transparent")
  circle.setAttribute("stroke-width", Math.max(4, Math.round(hold.r / 5)).toString())
  circle.setAttribute("cursor", "pointer")
  circle.setAttribute("data-placement-id", hold.id.toString())
  circle.setAttribute("fill-opacity", "0")

  circle.addEventListener("click", () => {
    const currentHold = activeHolds.find((entry) => entry.placement_id === hold.id)
    const currentStroke = currentHold?.role_id
      ? KilterBoardPlacementRoles.find((role) => role.id === currentHold.role_id)?.screen_color
      : undefined
    const currentRoleIndex = KilterBoardPlacementRoles.findIndex((role) => role.screen_color === currentStroke)
    const nextRoleIndex = currentRoleIndex + 1
    const nextRole = KilterBoardPlacementRoles[nextRoleIndex] || null

    if (nextRole) {
      upsertActiveHold({
        placement_id: hold.id,
        role_id: nextRole.id,
      })
    } else {
      activeHolds = activeHolds.filter((entry) => entry.placement_id !== hold.id)
    }

    updateSVG()
    updatePayload()
    updateURL()
  })

  return circle
}

function upsertActiveHold(nextHold: ActiveHold) {
  const currentIndex = activeHolds.findIndex((hold) => hold.placement_id === nextHold.placement_id)
  if (currentIndex === -1) {
    activeHolds.push(nextHold)
    return
  }

  activeHolds[currentIndex] = nextHold
}

function buildPlacementByLedPosition(placements: Record<number, number>) {
  const placementByLedPosition = new Map<number, number>()

  Object.entries(placements).forEach(([placementId, ledPosition]) => {
    placementByLedPosition.set(ledPosition, Number.parseInt(placementId, 10))
  })

  return placementByLedPosition
}

function getPayloadPlacements() {
  const payloadPlacements: PayloadPlacement[] = []

  activeHolds.forEach((activeHold) => {
    const position = currentLedPlacements[activeHold.placement_id]
    if (position === undefined) {
      return
    }

    if (activeHold.color && activeHold.color.trim() !== "") {
      payloadPlacements.push({
        position,
        color: activeHold.color.trim(),
      })
      return
    }

    if (typeof activeHold.role_id === "number") {
      payloadPlacements.push({
        position,
        role_id: activeHold.role_id,
      })
    }
  })

  return payloadPlacements
}

/** Update the URL with the current route */
function updateURL() {
  const currentUrl = new URL(globalThis.location.href)

  currentUrl.searchParams.set("layout_id", currentConfig.layoutId.toString())
  currentUrl.searchParams.set("size_id", currentConfig.sizeId.toString())
  currentUrl.searchParams.set("set_ids", currentConfig.setIds.join(","))

  const routeParam = getFrames()
  if (routeParam) {
    currentUrl.searchParams.set("route", routeParam)
  } else {
    currentUrl.searchParams.delete("route")
  }

  globalThis.history.replaceState({}, "", currentUrl)
}

/** Update the payload display with the hex data we're sending */
async function updatePayload() {
  const activeHoldsHtml = document.querySelector("#active-holds")

  if (activeHolds.length === 0) {
    if (activeHoldsHtml) {
      activeHoldsHtml.innerHTML = ""
    }
    return
  }

  const placement = getPayloadPlacements()
  const payload = device instanceof KilterBoard ? await device.led(placement) : null

  if (activeHoldsHtml !== null && payload) {
    const payloadHex = payload.map((value: number) => zfill(value.toString(16), 2)).join("")
    activeHoldsHtml.innerHTML = payloadHex
  }
}

/** Clear all the hold circles */
function clearSVG() {
  circlesByPlacementId.forEach((circles) => {
    circles.forEach((circle) => {
      circle.setAttribute("stroke", "transparent")
      circle.setAttribute("fill", "transparent")
      circle.setAttribute("fill-opacity", "0")
    })
  })
}

/** Update the SVG to show which holds are active */
function updateSVG() {
  clearSVG()

  activeHolds.forEach((hold) => {
    let color: string | null = null

    if (hold.color) {
      color = hold.color
    } else if (hold.role_id) {
      const role = KilterBoardPlacementRoles.find((entry) => entry.id === hold.role_id)
      color = role?.screen_color ?? null
    }

    if (!color) {
      return
    }

    const circles = circlesByPlacementId.get(hold.placement_id) ?? []
    circles.forEach((circle) => {
      circle.setAttribute("stroke", `#${color}`)
      circle.setAttribute("fill", `#${color}`)
      circle.setAttribute("fill-opacity", "0.25")
    })
  })
}

/**
 * Build the route string for the URL/database.
 * Format: p<placement_id>r<role_id> or p<placement_id>c<color>
 */
function getFrames() {
  return [...activeHolds]
    .sort((a, b) => a.placement_id - b.placement_id)
    .map((activeHold) => {
      if (activeHold.color) {
        return `p${activeHold.placement_id}c${activeHold.color}`
      }

      if (activeHold.role_id !== undefined) {
        return `p${activeHold.placement_id}r${activeHold.role_id}`
      }

      return ""
    })
    .join("")
}

/**
 * Parse a route string from the URL and set up activeHolds.
 * Uses placement IDs so it works across all Kilter layouts and sizes.
 */
function setFrames(routeParam: string) {
  const roleMatches = routeParam.match(/p(\d+)r(\d+)/g)
  const colorMatches = routeParam.match(/p(\d+)c([0-9A-Fa-f]{6})/g)

  activeHolds = []

  roleMatches?.forEach((match) => {
    const [, placement_id, role_id] = match.match(/p(\d+)r(\d+)/) || []
    const placementId = Number.parseInt(placement_id ?? "", 10)
    const roleId = Number.parseInt(role_id ?? "", 10)

    if (!Number.isFinite(placementId) || !Number.isFinite(roleId) || !circlesByPlacementId.has(placementId)) {
      return
    }

    upsertActiveHold({ placement_id: placementId, role_id: roleId })
  })

  colorMatches?.forEach((match) => {
    const [, placement_id, color] = match.match(/p(\d+)c([0-9A-Fa-f]{6})/) || []
    const placementId = Number.parseInt(placement_id ?? "", 10)

    if (!Number.isFinite(placementId) || !color || !circlesByPlacementId.has(placementId)) {
      return
    }

    upsertActiveHold({ placement_id: placementId, color: color.toUpperCase() })
  })
}

/** Pad a string with leading zeros (like Python's zfill) */
function zfill(input: string, number: number) {
  const pad = "0".repeat(number)
  return pad.substring(0, pad.length - input.length) + input
}

/**
 * Generate all 256 colors the Kilterboard can display.
 * The board uses 3 bits for red (0-7), 3 bits for green (0-7), and 2 bits for blue (0-3).
 */
function generateKilterboardColors(): string[] {
  const colors: string[] = []

  for (let rBits = 0; rBits < 8; rBits++) {
    for (let gBits = 0; gBits < 8; gBits++) {
      for (let bBits = 0; bBits < 4; bBits++) {
        const red = Math.min(255, rBits * 32 + 16)
        const green = Math.min(255, gBits * 32 + 16)
        const blue = Math.min(255, bBits * 64 + 32)

        const hex = [
          red.toString(16).toUpperCase().padStart(2, "0"),
          green.toString(16).toUpperCase().padStart(2, "0"),
          blue.toString(16).toUpperCase().padStart(2, "0"),
        ].join("")

        colors.push(hex)
      }
    }
  }

  return colors
}

const KILTERBOARD_COLORS = generateKilterboardColors()

function findClosestKilterboardColor(r: number, g: number, b: number): string {
  let minDistance = Infinity
  let closestColor = "000000"

  for (const colorHex of KILTERBOARD_COLORS) {
    const colorR = Number.parseInt(colorHex.substring(0, 2), 16)
    const colorG = Number.parseInt(colorHex.substring(2, 4), 16)
    const colorB = Number.parseInt(colorHex.substring(4, 6), 16)

    const distance = Math.sqrt(Math.pow(r - colorR, 2) + Math.pow(g - colorG, 2) + Math.pow(b - colorB, 2))

    if (distance < minDistance) {
      minDistance = distance
      closestColor = colorHex
    }
  }

  return closestColor
}

/** Board connection states */
const BoardState = {
  IDLE: "IDLE",
  BOOTING: "BOOTING",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
}

let currentState = BoardState.IDLE
let writer: WritableStreamDefaultWriter
let reader: ReadableStreamDefaultReader
let port: SerialPort | null
let timeOfLastAPILevelPing = 0
const PING_INTERVAL = 1000
let API_LEVEL = -1

async function readLoop() {
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      for (const byte of value) {
        if (currentState === BoardState.CONNECTED) {
          newByteIn(byte)
        }
      }
    }
  } catch (error) {
    console.error("Error during reading: ", error)
  }
}

let currentPacketLength = -1
let currentPacket: number[] = []
let allPacketsReceived = false

function newByteIn(dataByte: number) {
  if (allPacketsReceived) {
    allPacketsReceived = false
    activeHolds = []
    clearSVG()
  }

  if (currentPacket.length === 0 && dataByte !== 1) {
    return
  }

  currentPacket.push(dataByte)

  if (currentPacket.length === 2) {
    currentPacketLength = dataByte + 5
  } else if (currentPacket.length === currentPacketLength) {
    if (verifyAndParsePacket()) {
      allPacketsReceived = isThisTheLastPacket()
    } else {
      clearSVG()
      activeHolds = []
    }

    currentPacket = []
    currentPacketLength = -1
  }
}

function scaledColorToFullColorV3(holdData: number) {
  const fullColor = [0, 0, 0]

  fullColor[0] = Math.round((((holdData & 0b11100000) >> 5) / 7) * 255)
  fullColor[1] = Math.round((((holdData & 0b00011100) >> 2) / 7) * 255)
  fullColor[2] = Math.round((((holdData & 0b00000011) >> 0) / 3) * 255)

  return fullColor.map((value) => value.toString(16).toUpperCase().padStart(2, "0")).join("")
}

function parseCurrentPacketToActiveHolds() {
  activeHolds = []

  const startIndex = 5

  if (API_LEVEL < 3) {
    for (let index = startIndex; index < currentPacketLength - 1; index += 2) {
      const position = currentPacket[index] + ((currentPacket[index + 1] & 0b11) << 8)
      const roleId = currentPacket[index + 1]
      const placementId = currentPlacementByLedPosition.get(position)

      if (placementId !== undefined) {
        upsertActiveHold({
          placement_id: placementId,
          role_id: roleId,
        })
      }
    }
  } else {
    for (let index = startIndex; index < currentPacketLength - 1; index += 3) {
      const position = (currentPacket[index + 1] << 8) + currentPacket[index]
      const colorPacked = scaledColorToFullColorV3(currentPacket[index + 2])
      const roleId = KilterBoardPlacementRoles.find((role) => role.led_color === colorPacked)?.id
      const placementId = currentPlacementByLedPosition.get(position)

      if (placementId === undefined) {
        continue
      }

      if (roleId) {
        upsertActiveHold({
          placement_id: placementId,
          role_id: roleId,
        })
      } else {
        upsertActiveHold({
          placement_id: placementId,
          color: colorPacked,
        })
      }
    }
  }

  updateSVG()
  updatePayload()
  updateURL()
}

function verifyAndParsePacket() {
  parseCurrentPacketToActiveHolds()
  return true
}

function isThisTheLastPacket() {
  if (API_LEVEL < 3) {
    return currentPacket[4] === 80 || currentPacket[4] === 79
  }

  return currentPacket[4] === 84 || currentPacket[4] === 83
}

async function checkForAPILevel() {
  if (!port) {
    throw new Error("Port is not opened")
  }

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        break
      }

      if (currentState === BoardState.CONNECTING) {
        for (const [index, byte] of value.entries()) {
          if (byte === 4 && index + 1 < value.length) {
            const apiLevel = value[index + 1]
            if (apiLevel < 1 || apiLevel > 9) {
              return -1
            }

            currentState = BoardState.CONNECTED
            return apiLevel
          }
        }
      } else if (value[0] === 4) {
        currentState = BoardState.CONNECTING
      }

      const now = Date.now()
      if (now - timeOfLastAPILevelPing > PING_INTERVAL) {
        await sendPing()
        timeOfLastAPILevelPing = now
      }
    }
  } catch (error) {
    console.error("Error while checking for API level:", error)
  }

  return -1
}

async function sendPing() {
  try {
    await writer.write(new Uint8Array([4]))
  } catch (error) {
    console.error("Error sending ping: ", error)
  }
}

async function handleCommunication() {
  const apiLevelPromise = checkForAPILevel()

  await sendPing()

  apiLevelPromise
    .then((apiLevel) => {
      if (apiLevel > -1) {
        API_LEVEL = apiLevel
        readLoop()
      }
    })
    .catch((error) => {
      console.error("Error handling API Level:", error)
    })
}

async function openPort() {
  try {
    if (!port) {
      port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x2341 }],
      })
    }

    await port.open({ baudRate: 115200 })
    currentState = BoardState.BOOTING

    if (port.writable && port.readable) {
      writer = port.writable.getWriter()
      reader = port.readable.getReader()
    }

    await handleCommunication()
  } catch (error) {
    console.error("Failed to open the port: ", error)
  }
}

export { processImageToHolds }
