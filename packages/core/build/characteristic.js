/**
 * getCharacteristic
 * @param board
 * @param serviceId
 * @param characteristicId
 */
export const getCharacteristic = (board, serviceId, characteristicId) => {
    const boardService = board.services.find((service) => service.id === serviceId);
    if (boardService) {
        const boardCharacteristic = boardService.characteristics.find((characteristic) => characteristic.id === characteristicId);
        if (boardCharacteristic) {
            return boardCharacteristic.characteristic;
        }
    }
};
