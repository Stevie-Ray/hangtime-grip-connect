import { KilterBoard, connect } from "@hangtime/grip-connect"
import { write } from "@hangtime/grip-connect/src/write"
import type { Device } from "@hangtime/grip-connect/src/types/devices"

const device: Device = KilterBoard

export function setupDevice(element: HTMLButtonElement) {
  element.addEventListener("click", async () => {
    connect(device, async () => {})
  })
}
/**
 * Multiplier for converting between database and board coordinates.
 */
const COORDINATE_MULTIPLIER = 7.5
/**
 * Delta value for X-coordinate offset.
 */
const DELTA_X = 0
/**
 * Delta value for Y-coordinate offset.
 */
const DELTA_Y = 1170
/**
 * Array to store active holds with their colors and positions.
 */
let activeHolds: { color: string; position: number }[] = []

/**
 * The first byte in the data is dependent on where the packet is in the message as a whole:
 */
enum PACKET {
  /** If this packet is in the middle, the byte gets set to 81 (Q). */
  MIDDLE = 81,
  /** If this packet is the first packet in the message, then this byte gets set to 82 (R). */
  FIRST,
  /** If this is the last packet in the message, this byte gets set to 83 (S). */
  LAST,
  /** If this packet is the only packet in the message, the byte gets set to 84 (T). Note that this takes priority over the other conditions. */
  ONLY,
}
/**
 * Maximum length of the message body for byte wrapping.
 */
const MESSAGE_BODY_MAX_LENGTH = 255
/**
 * Maximum length of the the bluetooth chunk.
 */
const MAX_BLUETOOTH_MESSAGE_SIZE = 20

/**
 * Pads a number with leading zeros up to a specified length.
 * @param input - The number to pad.
 * @param number - The desired length of the padded number.
 * @returns The padded string.
 */
function zfill(input: string, number: number) {
  const pad = "0".repeat(number)
  return pad.substring(0, pad.length - input.length) + input
}

/**
 * Calculates the checksum for a byte array by summing up all bytes ot hre packet in a single-byte variable.
 * @param data - The array of bytes to calculate the checksum for.
 * @returns The calculated checksum value.
 */
function checksum(data: number[]) {
  let i = 0
  for (const value of data) {
    i = (i + value) & 255
  }
  return ~i & 255
}

/**
 * Wraps a byte array with header and footer bytes for transmission.
 * @param data - The array of bytes to wrap.
 * @returns The wrapped byte array.
 */
function wrapBytes(data: number[]) {
  if (data.length > MESSAGE_BODY_MAX_LENGTH) {
    return []
  }

  /**
- 0x1
- len(packets)
- checksum(packets)
- 0x2
- *packets
- 0x3

First byte is always 1, the second is a number of packets, then checksum, then 2, packets themselves, and finally 3.
 */
  return [1, data.length, checksum(data), 2, ...data, 3]
}

class ClimbPlacement {
  position: number
  role_id: string

  constructor(position: number, role_id: string) {
    this.position = position
    this.role_id = role_id
  }
}

/**
 * Encodes a position into a byte array.
 * The lowest 8 bits of the position get put in the first byte of the group.
 * The highest 8 bits of the position get put in the second byte of the group.
 * @param position - The position to encode.
 * @returns The encoded byte array representing the position.
 */
function encodePosition(position: number) {
  const position1 = position & 255
  const position2 = (position & 65280) >> 8

  return [position1, position2]
}

/**
 * Encodes a color string into a numeric representation.
 * The rgb color, 3 bits for the R and G components, 2 bits for the B component, with the 3 R bits occupying the high end of the byte and the 2 B bits in the low end (hence 3 G bits in the middle).
 * @param color - The color string in hexadecimal format (e.g., 'FFFFFF').
 * @returns The encoded /compressed color value.
 */
function encodeColor(color: string) {
  const substring = color.substring(0, 2)
  const substring2 = color.substring(2, 4)

  const parsedSubstring = parseInt(substring, 16) / 32
  const parsedSubstring2 = parseInt(substring2, 16) / 32
  const parsedResult = (parsedSubstring << 5) | (parsedSubstring2 << 2)

  const substring3 = color.substring(4, 6)
  const parsedSubstring3 = parseInt(substring3, 16) / 64
  const finalParsedResult = parsedResult | parsedSubstring3

  return finalParsedResult
}

/**
 * Encodes a placement (requires a 16-bit position and a 24-bit rgb color. ) into a byte array.
 * @param position - The position to encode.
 * @param ledColor - The color of the LED in hexadecimal format (e.g., 'FFFFFF').
 * @returns The encoded byte array representing the placement.
 */
function encodePlacement(position: number, ledColor: string) {
  return [...encodePosition(position), encodeColor(ledColor)]
}

/**
 * Prepares byte arrays for transmission based on a list of climb placements.
 * @param climbPlacementList - The list of climb placements containing position and role ID.
 * @returns The final byte array ready for transmission.
 */
function prepBytesV3(climbPlacementList: ClimbPlacement[]) {
  const resultArray: number[][] = []
  let tempArray: number[] = [PACKET.MIDDLE]

  for (const climbPlacement of climbPlacementList) {
    if (tempArray.length + 3 > MESSAGE_BODY_MAX_LENGTH) {
      resultArray.push(tempArray)
      tempArray = [PACKET.MIDDLE]
    }

    const ledColor = climbPlacement.role_id

    const encodedPlacement = encodePlacement(climbPlacement.position, ledColor)
    tempArray.push(...encodedPlacement)
  }

  resultArray.push(tempArray)

  if (resultArray.length === 1) {
    resultArray[0][0] = PACKET.ONLY
  } else if (resultArray.length > 1) {
    resultArray[0][0] = PACKET.FIRST
    resultArray[resultArray.length - 1][0] = PACKET.LAST
  }

  const finalResultArray: number[] = []
  for (const currentArray of resultArray) {
    finalResultArray.push(...wrapBytes(currentArray))
  }

  return finalResultArray
}

/**
 * Splits a collection into slices of the specified length.
 * https://github.com/ramda/ramda/blob/master/source/splitEvery.js
 * @param {Number} n
 * @param {Array} list
 * @return {Array}
 */
function splitEvery(n: number, list: number[]) {
  if (n <= 0) {
    throw new Error("First argument to splitEvery must be a positive integer")
  }
  const result = []
  let idx = 0
  while (idx < list.length) {
    result.push(list.slice(idx, (idx += n)))
  }
  return result
}

/**
 * The kilter board only supports messages of 20 bytes
 * at a time. This method splits a full message into parts
 * of 20 bytes
 *
 * @param buffer
 */
const splitMessages = (buffer: number[]) =>
  splitEvery(MAX_BLUETOOTH_MESSAGE_SIZE, buffer).map((arr) => new Uint8Array(arr))

// Display Logic

/**
 * Converts database coordinates to board coordinates.
 * @param x - The x-coordinate in the database coordinate system.
 * @param y - The y-coordinate in the database coordinate system.
 * @returns The converted coordinates in the board coordinate system.
 */
function dbToBoardCoord(x: number, y: number): { x: number; y: number } {
  return {
    x: x * COORDINATE_MULTIPLIER + DELTA_X,
    y: -y * COORDINATE_MULTIPLIER + DELTA_Y,
  }
}

// /**
//  * Converts board coordinates to database coordinates.
//  * @param x - The x-coordinate in the board coordinate system.
//  * @param y - The y-coordinate in the board coordinate system.
//  * @returns The converted coordinates in the database coordinate system.
//  */
// function boardToDbCoord(x: number, y: number): { x: number, y: number } {
//     return {
//         x: Math.round((x - DELTA_X) / COORDINATE_MULTIPLIER),
//         y: Math.round((y - DELTA_Y) / COORDINATE_MULTIPLIER),
//     };
// }

/**
 * Kilterboard SVG data representing coordinates and associated IDs.
 */
const data: number[][] = `140	4	1133	0
136	8	1134	1
132	4	1135	2
128	8	1136	3
124	4	1137	4
120	8	1138	5
116	4	1139	6
112	8	1140	7
108	4	1141	8
104	8	1142	9
100	4	1143	10
96	8	1144	11
92	4	1145	12
88	8	1146	13
84	4	1147	14
80	8	1148	15
76	4	1149	16
72	8	1150	17
68	4	1151	18
64	8	1152	19
60	4	1153	20
56	8	1154	21
52	4	1155	22
48	8	1156	23
44	4	1157	24
40	8	1158	25
36	4	1159	26
32	8	1160	27
28	4	1161	28
24	8	1162	29
20	4	1163	30
16	8	1164	31
12	4	1165	32
4	4	1166	33
8	8	1167	34
8	16	1168	36
4	20	1169	37
8	24	1170	38
12	28	1171	39
8	32	1172	40
4	36	1173	41
8	40	1174	42
12	44	1175	43
8	48	1176	44
4	52	1177	45
8	56	1178	46
12	60	1179	47
8	64	1180	48
4	68	1181	49
8	72	1182	50
12	76	1183	51
8	80	1184	52
4	84	1185	53
8	88	1186	54
12	92	1187	55
8	96	1188	56
4	100	1189	57
8	104	1190	58
12	108	1191	59
8	112	1192	60
4	116	1193	61
8	120	1194	62
12	124	1195	63
8	128	1196	64
4	132	1197	65
8	136	1198	66
8	144	1199	67
8	152	1200	68
16	152	1207	69
16	144	1208	70
16	136	1209	71
20	132	1210	72
16	128	1211	73
16	120	1212	74
20	116	1213	75
16	112	1214	76
16	104	1215	77
20	100	1216	78
16	96	1217	79
16	88	1218	80
20	84	1219	81
16	80	1220	82
16	72	1221	83
20	68	1222	84
16	64	1223	85
16	56	1224	86
20	52	1225	87
16	48	1226	88
16	40	1227	89
20	36	1228	90
16	32	1229	91
16	24	1230	92
20	20	1231	93
16	16	1232	94
24	16	1233	95
24	24	1234	96
28	28	1235	97
24	32	1236	98
24	40	1237	99
28	44	1238	100
24	48	1239	101
24	56	1240	102
28	60	1241	103
24	64	1242	104
24	72	1243	105
28	76	1244	106
24	80	1245	107
24	88	1246	108
28	92	1247	109
24	96	1248	110
24	104	1249	111
28	108	1250	112
24	112	1251	113
24	120	1252	114
28	124	1253	115
24	128	1254	116
24	136	1255	117
24	144	1256	118
24	152	1257	119
32	152	1264	120
32	144	1265	121
32	136	1266	122
36	132	1267	123
32	128	1268	124
32	120	1269	125
36	116	1270	126
32	112	1271	127
32	104	1272	128
36	100	1273	129
32	96	1274	130
32	88	1275	131
36	84	1276	132
32	80	1277	133
32	72	1278	134
36	68	1279	135
32	64	1280	136
32	56	1281	137
36	52	1282	138
32	48	1283	139
32	40	1284	140
36	36	1285	141
32	32	1286	142
32	24	1287	143
36	20	1288	144
32	16	1289	145
40	16	1290	146
40	24	1291	147
44	28	1292	148
40	32	1293	149
40	40	1294	150
44	44	1295	151
40	48	1296	152
40	56	1297	153
44	60	1298	154
40	64	1299	155
40	72	1300	156
44	76	1301	157
40	80	1302	158
40	88	1303	159
44	92	1304	160
40	96	1305	161
40	104	1306	162
44	108	1307	163
40	112	1308	164
40	120	1309	165
44	124	1310	166
40	128	1311	167
40	136	1312	168
40	144	1313	169
40	152	1314	170
48	152	1321	171
48	144	1322	172
48	136	1323	173
52	132	1324	174
48	128	1325	175
48	120	1326	176
52	116	1327	177
48	112	1328	178
48	104	1329	179
52	100	1330	180
48	96	1331	181
48	88	1332	182
52	84	1333	183
48	80	1334	184
48	72	1335	185
52	68	1336	186
48	64	1337	187
48	56	1338	188
52	52	1339	189
48	48	1340	190
48	40	1341	191
52	36	1342	192
48	32	1343	193
48	24	1344	194
52	20	1345	195
48	16	1346	196
56	16	1347	197
56	24	1348	198
60	28	1349	199
56	32	1350	200
56	40	1351	201
60	44	1352	202
56	48	1353	203
56	56	1354	204
60	60	1355	205
56	64	1356	206
56	72	1357	207
60	76	1358	208
56	80	1359	209
56	88	1360	210
60	92	1361	211
56	96	1362	212
56	104	1363	213
60	108	1364	214
56	112	1365	215
56	120	1366	216
60	124	1367	217
56	128	1368	218
56	136	1369	219
56	144	1370	220
56	152	1371	221
64	152	1378	222
64	144	1379	223
64	136	1380	224
68	132	1381	225
64	128	1382	226
64	120	1383	227
68	116	1384	228
64	112	1385	229
64	104	1386	230
68	100	1387	231
64	96	1388	232
64	88	1389	233
68	84	1390	234
64	80	1391	235
64	72	1392	236
68	68	1393	237
64	64	1394	238
64	56	1395	239
68	52	1396	240
64	48	1397	241
64	40	1398	242
68	36	1399	243
64	32	1400	244
64	24	1401	245
68	20	1402	246
64	16	1403	247
72	16	1404	248
72	24	1405	249
76	28	1406	250
72	32	1407	251
72	40	1408	252
76	44	1409	253
72	48	1410	254
72	56	1411	255
76	60	1412	256
72	64	1413	257
72	72	1414	258
76	76	1415	259
72	80	1416	260
72	88	1417	261
76	92	1418	262
72	96	1419	263
72	104	1420	264
76	108	1421	265
72	112	1422	266
72	120	1423	267
76	124	1424	268
72	128	1425	269
72	136	1426	270
72	144	1427	271
72	152	1428	272
80	152	1435	273
80	144	1436	274
80	136	1437	275
84	132	1438	276
80	128	1439	277
80	120	1440	278
84	116	1441	279
80	112	1442	280
80	104	1443	281
84	100	1444	282
80	96	1445	283
80	88	1446	284
84	84	1447	285
80	80	1448	286
80	72	1449	287
84	68	1450	288
80	64	1451	289
80	56	1452	290
84	52	1453	291
80	48	1454	292
80	40	1455	293
84	36	1456	294
80	32	1457	295
80	24	1458	296
84	20	1459	297
80	16	1460	298
88	16	1461	299
88	24	1462	300
92	28	1463	301
88	32	1464	302
88	40	1465	303
92	44	1466	304
88	48	1467	305
88	56	1468	306
92	60	1469	307
88	64	1470	308
88	72	1471	309
92	76	1472	310
88	80	1473	311
88	88	1474	312
92	92	1475	313
88	96	1476	314
88	104	1477	315
92	108	1478	316
88	112	1479	317
88	120	1480	318
92	124	1481	319
88	128	1482	320
88	136	1483	321
88	144	1484	322
88	152	1485	323
96	152	1492	324
96	144	1493	325
96	136	1494	326
100	132	1495	327
96	128	1496	328
96	120	1497	329
100	116	1498	330
96	112	1499	331
96	104	1500	332
100	100	1501	333
96	96	1502	334
96	88	1503	335
100	84	1504	336
96	80	1505	337
96	72	1506	338
100	68	1507	339
96	64	1508	340
96	56	1509	341
100	52	1510	342
96	48	1511	343
96	40	1512	344
100	36	1513	345
96	32	1514	346
96	24	1515	347
100	20	1516	348
96	16	1517	349
104	16	1518	350
104	24	1519	351
108	28	1520	352
104	32	1521	353
104	40	1522	354
108	44	1523	355
104	48	1524	356
104	56	1525	357
108	60	1526	358
104	64	1527	359
104	72	1528	360
108	76	1529	361
104	80	1530	362
104	88	1531	363
108	92	1532	364
104	96	1533	365
104	104	1534	366
108	108	1535	367
104	112	1536	368
104	120	1537	369
108	124	1538	370
104	128	1539	371
104	136	1540	372
104	144	1541	373
104	152	1542	374
112	152	1549	375
112	144	1550	376
112	136	1551	377
116	132	1552	378
112	128	1553	379
112	120	1554	380
116	116	1555	381
112	112	1556	382
112	104	1557	383
116	100	1558	384
112	96	1559	385
112	88	1560	386
116	84	1561	387
112	80	1562	388
112	72	1563	389
116	68	1564	390
112	64	1565	391
112	56	1566	392
116	52	1567	393
112	48	1568	394
112	40	1569	395
116	36	1570	396
112	32	1571	397
112	24	1572	398
116	20	1573	399
112	16	1574	400
120	16	1575	401
120	24	1576	402
124	28	1577	403
120	32	1578	404
120	40	1579	405
124	44	1580	406
120	48	1581	407
120	56	1582	408
124	60	1583	409
120	64	1584	410
120	72	1585	411
124	76	1586	412
120	80	1587	413
120	88	1588	414
124	92	1589	415
120	96	1590	416
120	104	1591	417
124	108	1592	418
120	112	1593	419
120	120	1594	420
124	124	1595	421
120	128	1596	422
120	136	1597	423
120	144	1598	424
120	152	1599	425
128	152	1606	426
128	144	1607	427
128	136	1608	428
132	132	1609	429
128	128	1610	430
128	120	1611	431
132	116	1612	432
128	112	1613	433
128	104	1614	434
132	100	1615	435
128	96	1616	436
128	88	1617	437
132	84	1618	438
128	80	1619	439
128	72	1620	440
132	68	1621	441
128	64	1622	442
128	56	1623	443
132	52	1624	444
128	48	1625	445
128	40	1626	446
132	36	1627	447
128	32	1628	448
128	24	1629	449
132	20	1630	450
128	16	1631	451
136	16	1632	452
136	24	1633	453
140	28	1634	454
136	32	1635	455
136	40	1636	456
140	44	1637	457
136	48	1638	458
136	56	1639	459
140	60	1640	460
136	64	1641	461
136	72	1642	462
140	76	1643	463
136	80	1644	464
136	88	1645	465
140	92	1646	466
136	96	1647	467
136	104	1648	468
140	108	1649	469
136	112	1650	470
136	120	1651	471
140	124	1652	472
136	128	1653	473
136	136	1654	474
136	144	1655	475
136	152	1656	476`
  .split("\n")
  .map((line) => line.split("\t").map((item) => parseInt(item)))

// const data = [[56, 8], [112, 152]]

/**
 * SVG element on the DOM where circles will be drawn.
 */
const svg: SVGSVGElement | null = document.querySelector("#svg-kb")

/**
 * Array of colors mapped to their respective hex codes.
 */
const colors = [
  "transparent", //     - DEFAULT
  "#00FFFF", // blue    - MIDDLE
  "#00FF00", // green   - START
  "#FFA500", // yellow  - FEET-ONLY
  "#FF00FF", // purple  - FINISH
]

/**
 * Array of SVG circles representing data points.
 */
const circles: SVGCircleElement[] = data.map((item) => {
  const circle: SVGCircleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
  const coordinate: { x: number; y: number } = dbToBoardCoord(item[0], item[1])
  circle.setAttribute("cx", coordinate.x.toString())
  circle.setAttribute("cy", coordinate.y.toString())
  circle.setAttribute("r", "30")
  circle.setAttribute("fill", "transparent")
  // circle.setAttribute("stroke", "#4cf0fd")
  circle.setAttribute("stroke", "transparent")
  circle.setAttribute("stroke-width", "8")
  circle.setAttribute("cursor", "pointer")
  circle.setAttribute("fill-opacity", "0.2")

  // @ts-expect-error it's a number
  circle.setAttribute("id", item[2])

  circle.addEventListener("click", (event) => {
    const targetElement = event.target as SVGElement | null
    const currentStroke = targetElement?.getAttribute("stroke")
    const newStroke = colors[(colors.indexOf(currentStroke!) + 1) % colors.length]
    targetElement?.setAttribute("stroke", newStroke)
    circle.setAttribute("fill", newStroke)

    const newHoldData = {
      color: newStroke.slice(1),
      position: item[3],
    }

    if (newStroke === "transparent") {
      activeHolds = activeHolds.filter((hold) => hold.position !== newHoldData.position)
    } else {
      const holdIndex = activeHolds.findIndex((hold) => hold.position === newHoldData.position)

      if (holdIndex === -1) {
        activeHolds.push(newHoldData)
      } else {
        activeHolds[holdIndex] = newHoldData
      }
    }

    const payload = prepBytesV3(
      // Map activeHolds array to objects with role_id and position properties
      activeHolds.map((x) => ({
        role_id: x.color,
        position: x.position,
      })),
    )

    // Updates the inner HTML with the payload in hexadecimal format.
    const activeHoldsHtml = document.querySelector("#active-holds")
    if (activeHoldsHtml !== null) {
      activeHoldsHtml.innerHTML = payload
        // Converts byte array to hexadecimal strings using zfill function.
        .map((x) => zfill(x.toString(16), 2))
        .join("")
    }

    /**
     * Sends a series of messages to a device.
     */
    async function writeMessageSeries(messages: Uint8Array[]) {
      for (const message of messages) {
        await write(KilterBoard, "uart", "tx", message)
      }
    }

    // Sends the payload to the device by splitting it into messages and writing each message.
    writeMessageSeries(splitMessages(payload))
  })

  return circle
})

// Append circles to the SVG element.
circles.forEach((circle) => svg!.appendChild(circle))
