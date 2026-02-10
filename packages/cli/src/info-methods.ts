/** Info methods to probe on each device, in display order. */
export const INFO_METHODS = [
  { key: "battery", label: "Battery:" },
  { key: "firmware", label: "Firmware:" },
  { key: "progressorId", label: "Progressor ID:" },
  { key: "calibration", label: "Calibration:" },
  { key: "hardware", label: "Hardware:" },
  { key: "manufacturer", label: "Manufacturer:" },
  { key: "serial", label: "Serial:" },
  { key: "model", label: "Model:" },
  { key: "certification", label: "Certification:" },
  { key: "pnp", label: "PnP ID:" },
  { key: "software", label: "Software:" },
  { key: "system", label: "System ID:" },
  { key: "humidity", label: "Humidity:" },
  { key: "temperature", label: "Temperature:" },
] as const
