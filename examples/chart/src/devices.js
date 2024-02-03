import { Climbro, Entralpi, Motherboard, SmartBoard, Tindeq, calibration, connect, disconnect, notify, read, stream, stop } from "@hangtime/grip-connect";
import { Chart } from "chart.js/auto";
const chartData = [];
let chartElement = null;
let chart = null;
export function outputValue(element, data) {
    element.innerHTML = data;
}
export function setupDevice(element, stopElement, outputElement) {
    element.addEventListener("change", () => {
        const selectedDevice = element.value;
        if (selectedDevice === "climbro") {
            return connect(Climbro, async () => {
                // Listen for notifications
                notify((data) => {
                    if (data && data.value) {
                        if (data.value.massTotal !== undefined) {
                            outputValue(outputElement, JSON.stringify(data.value));
                        }
                        else {
                            console.log(data.value);
                        }
                    }
                });
                // disconnect from device after we are done
                disconnect(Climbro);
            });
        }
        if (selectedDevice === "entralpi") {
            return connect(Entralpi, async () => {
                // Listen for notifications
                notify((data) => {
                    if (data && data.value) {
                        if (data.value.massTotal !== undefined) {
                            addData(data.value.massTotal);
                            outputValue(outputElement, JSON.stringify(data.value));
                        }
                        else {
                            console.log(data.value);
                        }
                    }
                });
                setTimeout(() => {
                    // the entralpi will automatically start streaming
                }, 60000);
                // disconnect from device after we are done
                disconnect(Entralpi);
            });
        }
        if (selectedDevice === "motherboard") {
            return connect(Motherboard, async () => {
                // Listen for notifications
                notify((data) => {
                    if (data && data.value) {
                        if (data.value.massTotal !== undefined) {
                            addData(data.value.massTotal);
                            outputValue(outputElement, JSON.stringify(data.value));
                        }
                        else {
                            console.log(data.value);
                        }
                    }
                });
                // read battery + device info
                await read(Motherboard, "battery", "level", 250);
                await read(Motherboard, "device", "manufacturer", 250);
                await read(Motherboard, "device", "hardware", 250);
                await read(Motherboard, "device", "firmware", 250);
                // read calibration (required before reading data)
                await calibration(Motherboard);
                // start streaming for a minute
                await stream(Motherboard, 5000);
                // disconnect from device after we are done
                disconnect(Motherboard);
            });
        }
        if (selectedDevice === "smartboard") {
            return connect(SmartBoard, async () => {
                // Listen for notifications
                notify((data) => {
                    if (data && data.value) {
                        if (data.value.massTotal !== undefined) {
                            outputValue(outputElement, JSON.stringify(data.value));
                        }
                        else {
                            console.log(data.value);
                        }
                    }
                });
                // disconnect from device after we are done
                disconnect(SmartBoard);
            });
        }
        if (selectedDevice === "tindeq") {
            return connect(Tindeq, async () => {
                // Listen for notifications
                notify((data) => {
                    if (data && data.value) {
                        console.log(data.value);
                        outputValue(outputElement, data.value);
                    }
                });
                // start streaming for a minute
                await stream(Tindeq, 60000);
                // disconnect from device after we are done
                disconnect(Tindeq);
            });
        }
    });
    stopElement.addEventListener("click", async () => {
        const selectedDevice = element.value;
        if (selectedDevice === "motherboard") {
            await stop(Motherboard);
        }
    });
}
export function setupChart(element) {
    chartElement = element;
    if (chartElement) {
        chart = new Chart(chartElement, {
            type: "line",
            data: {
                labels: [],
                datasets: [
                    {
                        data: chartData,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                animation: false,
                elements: {
                    point: {
                        radius: 0,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {},
                },
                scales: {
                    x: {
                        display: false,
                    },
                    y: {
                        min: 0,
                        max: 100,
                    },
                },
            },
        });
    }
}
function addData(data) {
    if (chart) {
        const numericData = parseFloat(data);
        if (!isNaN(numericData)) {
            chart.data.labels?.push("");
            if (chart.data.labels && chart.data.labels.length >= 100) {
                chart.data.labels.shift();
            }
            chart.data.datasets.forEach((dataset) => {
                dataset.data.push(numericData);
                if (dataset.data.length >= 100) {
                    dataset.data.shift();
                }
            });
            chart.update();
        }
        else {
            console.error("Invalid numeric data:", data);
        }
    }
}
