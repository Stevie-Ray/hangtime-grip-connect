import type { Device } from "../types/devices"

/**
 * Represents a  Weiheng - WH-C06 (or MAT Muscle Meter) device
 * Enable 'Experimental Web Platform features' Chrome Flags.
 */
export const WHC06: Device = {
  filters: [
    {
      // namePrefix: "IF_B7",
      manufacturerData: [
        {
          companyIdentifier: 0x0100, // 256
        },
      ],
    },
  ],
  services: [],
}
