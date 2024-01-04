export const Tindeq = {
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
};
export const Commands = {
    TARE_SCALE: 0x64,
    START_MEASURING: 0x65,
    STOP_MEASURING: 0x66,
    GET_APP_VERSION: 0x6b,
    GET_ERROR_INFO: 0x6c,
    CLEAR_ERR_INFO: 0x6d,
    GET_BATTERY_LEVEL: 0x6f,
    SLEEP: 0x6e,
};
export const NotificationTypes = {
    COMMAND_RESPONSE: 0,
    WEIGHT_MEASURE: 1,
    LOW_BATTERY_WARNING: 2,
};
