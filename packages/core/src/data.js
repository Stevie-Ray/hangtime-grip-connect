import { notifyCallback } from "./notify";
const PACKET_LENGTH = 32;
const NUM_SAMPLES = 3;
export const CALIBRATION = [[], [], [], []];
/**
 * applyCalibration
 * @param sample
 * @param calibration
 */
const applyCalibration = (sample, calibration) => {
    // Extract the calibrated value for the zero point
    const zeroCalibration = calibration[0][2];
    // Initialize sign as positive
    let sign = 1;
    // Initialize the final calibrated value
    let final = 0;
    // If the sample value is less than the zero calibration point
    if (sample < zeroCalibration) {
        // Change the sign to negative
        sign = -1;
        // Reflect the sample around the zero calibration point
        sample = /* 2 * zeroCalibration */ -sample;
    }
    // Iterate through the calibration data
    for (let i = 1; i < calibration.length; i++) {
        // Extract the lower and upper bounds of the current calibration range
        const calibrationStart = calibration[i - 1][2];
        const calibrationEnd = calibration[i][2];
        // If the sample value is within the current calibration range
        if (sample < calibrationEnd) {
            // Interpolate to get the calibrated value within the range
            final =
                calibration[i - 1][1] +
                    ((sample - calibrationStart) / (calibrationEnd - calibrationStart)) *
                        (calibration[i][1] - calibration[i - 1][1]);
            break;
        }
    }
    // Return the calibrated value with the appropriate sign (positive/negative)
    return sign * final;
};
/**
 * handleMotherboardData
 *
 * @param uuid - Unique identifier
 * @param receivedData - Received data string
 */
export const handleMotherboardData = (uuid, receivedData) => {
    const receivedTime = Date.now();
    // Check if the line is entirely hex characters
    const isAllHex = /^[0-9A-Fa-f]+$/g.test(receivedData);
    // Handle streaming packet
    if (isAllHex && receivedData.length === PACKET_LENGTH) {
        // Base-16 decode the string: convert hex pairs to byte values
        const bytes = Array.from({ length: receivedData.length / 2 }, (_, i) => Number(`0x${receivedData.substring(i * 2, i * 2 + 2)}`));
        // Translate header into packet, number of samples from the packet length
        const packet = {
            received: receivedTime,
            sampleNum: new DataView(new Uint8Array(bytes).buffer).getUint16(0, true),
            battRaw: new DataView(new Uint8Array(bytes).buffer).getUint16(2, true),
            samples: [],
            masses: [],
        };
        const dataView = new DataView(new Uint8Array(bytes).buffer);
        for (let i = 0; i < NUM_SAMPLES; i++) {
            const sampleStart = 4 + 3 * i;
            // Use DataView to read the 24-bit unsigned integer
            const rawValue = dataView.getUint8(sampleStart) |
                (dataView.getUint8(sampleStart + 1) << 8) |
                (dataView.getUint8(sampleStart + 2) << 16);
            // Ensure unsigned 32-bit integer
            packet.samples[i] = rawValue >>> 0;
            if (packet.samples[i] >= 0x7fffff) {
                packet.samples[i] -= 0x1000000;
            }
            // if (!CALIBRATION[0].length) return
            packet.masses[i] = applyCalibration(packet.samples[i], CALIBRATION[i]);
        }
        // invert center and right values
        packet.masses[1] *= -1;
        packet.masses[2] *= -1;
        // map to variables
        const left = packet.masses[0];
        const center = packet.masses[1];
        const right = packet.masses[2];
        if (notifyCallback) {
            notifyCallback({
                uuid,
                value: {
                    massTotal: Math.max(-1000, left + right + center).toFixed(1),
                    massLeft: Math.max(-1000, left).toFixed(1),
                    massRight: Math.max(-1000, right).toFixed(1),
                    massCenter: Math.max(-1000, center).toFixed(1),
                },
            });
        }
    }
    else if ((receivedData.match(/,/g) || []).length === 3) {
        console.log(receivedData);
        // if the returned notification is a calibration string add them to the array
        const parts = receivedData.split(",");
        const numericParts = parts.map((x) => parseFloat(x));
        CALIBRATION[numericParts[0]].push(numericParts.slice(1));
    }
    else {
        // unhanded data
        console.log(receivedData);
    }
};