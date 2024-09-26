import type { IDevice } from "../interfaces/device.interface"

/**
 * Represents a  Weiheng - WH-C06 (or MAT Muscle Meter) device
 * Enable 'Experimental Web Platform features' Chrome Flags.
 */
export const WHC06: IDevice = {
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
