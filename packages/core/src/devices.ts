import { Device } from "./types"

export const Motherboard: Device = {
  name: "Motherboard",
  companyId: 0x2a29,
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
      name: "Unknown Service",
      id: "unknown",
      uuid: "10ababcd-15e1-28ff-de13-725bea03b127",
      characteristics: [
        {
          name: "Unknown 01",
          id: "01",
          uuid: "10ab1524-15e1-28ff-de13-725bea03b127",
        },
        {
          name: "Unknown 02",
          id: "02",
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

export const Entralpi: Device = {
  name: "ENTRALPI",
  services: [
    {
      name: "Device Information",
      id: "device",
      uuid: "0000180a-0000-1000-8000-00805f9b34fb",
      characteristics: [],
    },
    {
      name: "Battery Service",
      id: "battery",
      uuid: "0000180f-0000-1000-8000-00805f9b34fb",
      characteristics: [],
    },
    {
      name: "Generic Attribute",
      id: "attribute",
      uuid: "00001801-0000-1000-8000-00805f9b34fb",
      characteristics: [],
    },
    {
      name: "UART ISSC Transparent Service",
      id: "uart",
      uuid: "0000fff0-0000-1000-8000-00805f9b34fb",
      characteristics: [
        {
          name: "TX",
          id: "tx",
          uuid: "0000fff5-0000-1000-8000-00805f9b34fb",
        },
        {
          name: "RX",
          id: "rx",
          uuid: "0000fff4-0000-1000-8000-00805f9b34fb",
        },
      ],
    },
    {
      name: "Weight Scale",
      id: "weight",
      uuid: "0000181d-0000-1000-8000-00805f9b34fb",
      characteristics: [],
    },
    {
      name: "Generic Access",
      id: "access",
      uuid: "00001800-0000-1000-8000-00805f9b34fb",
      characteristics: [],
    },
  ],
}

export const Tindeq: Device = {
  name: "Tindeq",
  services: [
    {
      name: "Progressor Service",
      id: "progressor",
      uuid: "7e4e1701-1ea6-40c9-9dcc-13d34ffead57",
      characteristics: [
        {
          name: "Write",
          id: "tx",
          uuid: "7e4e1703-1ea6-40c9-9dcc-13d34ffead57",
        },
        {
          name: "Notify",
          id: "rx",
          uuid: "7e4e1702-1ea6-40c9-9dcc-13d34ffead57",
        },
      ],
    },
  ],
}
