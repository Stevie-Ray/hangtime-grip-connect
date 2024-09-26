import type { Device } from "./models/device.model"

/**
 * Retrieves the characteristic from the device's service.
 * @param {Device} board - The device.
 * @param {string} serviceId - The UUID of the service.
 * @param {string} characteristicId - The UUID of the characteristic.
 * @returns {BluetoothRemoteGATTCharacteristic | undefined} The characteristic, if found.
 */
export const getCharacteristic = (
  board: Device,
  serviceId: string,
  characteristicId: string,
): BluetoothRemoteGATTCharacteristic | undefined => {
  // Find the service with the specified serviceId
  const boardService = board.services.find((service) => service.id === serviceId)
  if (boardService) {
    // If the service is found, find the characteristic with the specified characteristicId
    const boardCharacteristic = boardService.characteristics.find(
      (characteristic) => characteristic.id === characteristicId,
    )
    if (boardCharacteristic) {
      // If the characteristic is found, return it
      return boardCharacteristic.characteristic
    }
  }
  // Return undefined if the service or characteristic is not found
  return undefined
}
