import { Device } from "./devices/types"

/**
 * getCharacteristic
 * @param board
 * @param serviceId
 * @param characteristicId
 */
export const getCharacteristic = (board: Device, serviceId: string, characteristicId: string) => {
  const boardService = board.services.find((service) => service.id === serviceId)
  if (boardService) {
    const boardCharacteristic = boardService.characteristics.find(
      (characteristic) => characteristic.id === characteristicId,
    )
    if (boardCharacteristic) {
      return boardCharacteristic.characteristic
    }
  }
}
