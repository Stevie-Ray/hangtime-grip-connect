import type { Device } from "../types/devices"

/**
 * Represents a Griptonite Motherboard device
 */
export const Motherboard: Device = {
  filters: [{ name: "Motherboard" }],
  services: [
    {
      name: "Device Information",
      id: "device",
      uuid: "0000180a-0000-1000-8000-00805f9b34fb",
      characteristics: [
        // {
        //     name: 'Serial Number (Blocked)',
        //     id: 'serial'
        //     uuid: '00002a25-0000-1000-8000-00805f9b34fb'
        // },
        {
          name: "Firmware Revision",
          id: "firmware",
          uuid: "00002a26-0000-1000-8000-00805f9b34fb",
        },
        {
          name: "Hardware Revision",
          id: "hardware",
          uuid: "00002a27-0000-1000-8000-00805f9b34fb",
        },
        {
          name: "Manufacturer Name",
          id: "manufacturer",
          uuid: "00002a29-0000-1000-8000-00805f9b34fb",
        },
      ],
    },
    {
      name: "Battery Service",
      id: "battery",
      uuid: "0000180f-0000-1000-8000-00805f9b34fb",
      characteristics: [
        {
          name: "Battery Level",
          id: "level",
          uuid: "00002a19-0000-1000-8000-00805f9b34fb",
        },
      ],
    },
    {
      name: "LED Service",
      id: "led",
      uuid: "10ababcd-15e1-28ff-de13-725bea03b127",
      characteristics: [
        {
          name: "Red LED",
          id: "red",
          uuid: "10ab1524-15e1-28ff-de13-725bea03b127",
        },
        {
          name: "Green LED",
          id: "green",
          uuid: "10ab1525-15e1-28ff-de13-725bea03b127",
        },
      ],
    },
    {
      name: "UART Nordic Service",
      id: "uart",
      uuid: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
      characteristics: [
        {
          name: "TX",
          id: "tx",
          uuid: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
        },
        {
          name: "RX",
          id: "rx",
          uuid: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
        },
      ],
    },
  ],
}
