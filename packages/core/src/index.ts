// Export device types
export { Climbro, Entralpi, KilterBoard, Motherboard, mySmartBoard, WHC06, Progressor } from "./devices/index"

// Export calibration function
export { calibration } from "./calibration"

// Export download function
export { download } from "./download"

// Export connection related functions
export { connect } from "./connect"
export { disconnect } from "./disconnect"
export { active, isActive } from "./is-active"
export { isConnected } from "./is-connected"

// Export information retrieval functions
export { battery } from "./battery"
export { firmware } from "./firmware"
// Export "Motherboard exclusive" functions
export { hardware } from "./hardware"
export { manufacturer } from "./manufacturer"
export { text } from "./text"
export { serial } from "./serial"

// Export led retrieval function
export { led } from "./led"

// Export notification related function
export { notify } from "./notify"

// Export stream related functions
export { stop } from "./stop"
export { stream } from "./stream"
export { tare } from "./tare"
