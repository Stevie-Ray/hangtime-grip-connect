import { KilterBoard } from "@hangtime/grip-connect"
import { KilterBoardPlacementRoles } from "@hangtime/grip-connect/src/models/device/kilterboard.model"

const device = new KilterBoard()

export function setupDevice(element: HTMLButtonElement) {
  element.addEventListener("click", async () => {
    await device.connect(async () => {
      // Map activeHolds array to objects with role_id and position properties
      const placement = activeHolds.map((activeHold) => {
        // Return the row from the extraced data with a matching placement ID
        const filteredRow = data.find((row) => row[4] === activeHold.placement_id)
        if (!filteredRow) {
          throw new Error(`Row with id ${activeHold.placement_id} not found in placement_roles`)
        }
        return {
          role_id: activeHold.role_id, // LED Color
          position: filteredRow[3], // LED Position
        }
      })

      if (device instanceof KilterBoard) {
        await device.led(placement)
      }
    })
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
let activeHolds: { placement_id: number; role_id: number }[] = []
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
 * Data extracted from the sqlite database representing holes, LED position and placement id.
 * Get it using: https://github.com/lemeryfertitta/BoardLib
 * [holes.x, holes.y, holes.id, leds.position, placement.id]
 */
const data: number[][] = `140	4	1133	0	1147
136	8	1134	1	1073
132	4	1135	2	1448
128	8	1136	3	1074
124	4	1137	4	1449
120	8	1138	5	1075
116	4	1139	6	1450
112	8	1140	7	1076
108	4	1141	8	1451
104	8	1142	9	1077
100	4	1143	10	1452
96	8	1144	11	1078
92	4	1145	12	1453
88	8	1146	13	1079
84	4	1147	14	1454
80	8	1148	15	1080
76	4	1149	16	1455
72	8	1150	17	1081
68	4	1151	18	1456
64	8	1152	19	1082
60	4	1153	20	1457
56	8	1154	21	1083
52	4	1155	22	1458
48	8	1156	23	1084
44	4	1157	24	1459
40	8	1158	25	1085
36	4	1159	26	1460
32	8	1160	27	1086
28	4	1161	28	1461
24	8	1162	29	1087
20	4	1163	30	1462
16	8	1164	31	1088
12	4	1165	32	1463
4	4	1166	33	1464
8	8	1167	34	1089
8	16	1168	36	1090
4	20	1169	37	1465
8	24	1170	38	1107
12	28	1171	39	1474
8	32	1172	40	1124
4	36	1173	41	1483
8	40	1174	42	1141
12	44	1175	43	1492
8	48	1176	44	1158
4	52	1177	45	1501
8	56	1178	46	1175
12	60	1179	47	1510
8	64	1180	48	1192
4	68	1181	49	1519
8	72	1182	50	1209
12	76	1183	51	1528
8	80	1184	52	1226
4	84	1185	53	1537
8	88	1186	54	1243
12	92	1187	55	1546
8	96	1188	56	1260
4	100	1189	57	1555
8	104	1190	58	1277
12	108	1191	59	1564
8	112	1192	60	1294
4	116	1193	61	1573
8	120	1194	62	1311
12	124	1195	63	1582
8	128	1196	64	1328
4	132	1197	65	1591
8	136	1198	66	1345
8	144	1199	67	1362
8	152	1200	68	1379
16	152	1207	69	1380
16	144	1208	70	1363
16	136	1209	71	1346
20	132	1210	72	1592
16	128	1211	73	1329
16	120	1212	74	1312
20	116	1213	75	1574
16	112	1214	76	1295
16	104	1215	77	1278
20	100	1216	78	1556
16	96	1217	79	1261
16	88	1218	80	1244
20	84	1219	81	1538
16	80	1220	82	1227
16	72	1221	83	1210
20	68	1222	84	1520
16	64	1223	85	1193
16	56	1224	86	1176
20	52	1225	87	1502
16	48	1226	88	1159
16	40	1227	89	1142
20	36	1228	90	1484
16	32	1229	91	1125
16	24	1230	92	1108
20	20	1231	93	1466
16	16	1232	94	1091
24	16	1233	95	1092
24	24	1234	96	1109
28	28	1235	97	1475
24	32	1236	98	1126
24	40	1237	99	1143
28	44	1238	100	1493
24	48	1239	101	1160
24	56	1240	102	1177
28	60	1241	103	1511
24	64	1242	104	1194
24	72	1243	105	1211
28	76	1244	106	1529
24	80	1245	107	1228
24	88	1246	108	1245
28	92	1247	109	1547
24	96	1248	110	1262
24	104	1249	111	1279
28	108	1250	112	1565
24	112	1251	113	1296
24	120	1252	114	1313
28	124	1253	115	1583
24	128	1254	116	1330
24	136	1255	117	1347
24	144	1256	118	1364
24	152	1257	119	1381
32	152	1264	120	1382
32	144	1265	121	1365
32	136	1266	122	1348
36	132	1267	123	1593
32	128	1268	124	1331
32	120	1269	125	1314
36	116	1270	126	1575
32	112	1271	127	1297
32	104	1272	128	1280
36	100	1273	129	1557
32	96	1274	130	1263
32	88	1275	131	1246
36	84	1276	132	1539
32	80	1277	133	1229
32	72	1278	134	1212
36	68	1279	135	1521
32	64	1280	136	1195
32	56	1281	137	1178
36	52	1282	138	1503
32	48	1283	139	1161
32	40	1284	140	1144
36	36	1285	141	1485
32	32	1286	142	1127
32	24	1287	143	1110
36	20	1288	144	1467
32	16	1289	145	1093
40	16	1290	146	1094
40	24	1291	147	1111
44	28	1292	148	1476
40	32	1293	149	1128
40	40	1294	150	1145
44	44	1295	151	1494
40	48	1296	152	1162
40	56	1297	153	1179
44	60	1298	154	1512
40	64	1299	155	1196
40	72	1300	156	1213
44	76	1301	157	1530
40	80	1302	158	1230
40	88	1303	159	1247
44	92	1304	160	1548
40	96	1305	161	1264
40	104	1306	162	1281
44	108	1307	163	1566
40	112	1308	164	1298
40	120	1309	165	1315
44	124	1310	166	1584
40	128	1311	167	1332
40	136	1312	168	1349
40	144	1313	169	1366
40	152	1314	170	1383
48	152	1321	171	1384
48	144	1322	172	1367
48	136	1323	173	1350
52	132	1324	174	1594
48	128	1325	175	1333
48	120	1326	176	1316
52	116	1327	177	1576
48	112	1328	178	1299
48	104	1329	179	1282
52	100	1330	180	1558
48	96	1331	181	1265
48	88	1332	182	1248
52	84	1333	183	1540
48	80	1334	184	1231
48	72	1335	185	1214
52	68	1336	186	1522
48	64	1337	187	1197
48	56	1338	188	1180
52	52	1339	189	1504
48	48	1340	190	1163
48	40	1341	191	1146
52	36	1342	192	1486
48	32	1343	193	1129
48	24	1344	194	1112
52	20	1345	195	1468
48	16	1346	196	1095
56	16	1347	197	1096
56	24	1348	198	1113
60	28	1349	199	1477
56	32	1350	200	1130
56	40	1351	201	1147
60	44	1352	202	1495
56	48	1353	203	1164
56	56	1354	204	1181
60	60	1355	205	1513
56	64	1356	206	1198
56	72	1357	207	1215
60	76	1358	208	1531
56	80	1359	209	1232
56	88	1360	210	1249
60	92	1361	211	1549
56	96	1362	212	1266
56	104	1363	213	1283
60	108	1364	214	1567
56	112	1365	215	1300
56	120	1366	216	1317
60	124	1367	217	1585
56	128	1368	218	1334
56	136	1369	219	1351
56	144	1370	220	1368
56	152	1371	221	1385
64	152	1378	222	1386
64	144	1379	223	1369
64	136	1380	224	1352
68	132	1381	225	1595
64	128	1382	226	1335
64	120	1383	227	1318
68	116	1384	228	1577
64	112	1385	229	1301
64	104	1386	230	1284
68	100	1387	231	1559
64	96	1388	232	1267
64	88	1389	233	1250
68	84	1390	234	1541
64	80	1391	235	1233
64	72	1392	236	1216
68	68	1393	237	1523
64	64	1394	238	1199
64	56	1395	239	1182
68	52	1396	240	1505
64	48	1397	241	1165
64	40	1398	242	1148
68	36	1399	243	1487
64	32	1400	244	1131
64	24	1401	245	1114
68	20	1402	246	1469
64	16	1403	247	1097
72	16	1404	248	1098
72	24	1405	249	1115
76	28	1406	250	1478
72	32	1407	251	1132
72	40	1408	252	1149
76	44	1409	253	1496
72	48	1410	254	1166
72	56	1411	255	1183
76	60	1412	256	1514
72	64	1413	257	1200
72	72	1414	258	1217
76	76	1415	259	1532
72	80	1416	260	1234
72	88	1417	261	1251
76	92	1418	262	1550
72	96	1419	263	1268
72	104	1420	264	1285
76	108	1421	265	1568
72	112	1422	266	1302
72	120	1423	267	1319
76	124	1424	268	1586
72	128	1425	269	1336
72	136	1426	270	1353
72	144	1427	271	1370
72	152	1428	272	1387
80	152	1435	273	1388
80	144	1436	274	1371
80	136	1437	275	1354
84	132	1438	276	1596
80	128	1439	277	1337
80	120	1440	278	1320
84	116	1441	279	1578
80	112	1442	280	1303
80	104	1443	281	1286
84	100	1444	282	1560
80	96	1445	283	1269
80	88	1446	284	1252
84	84	1447	285	1542
80	80	1448	286	1235
80	72	1449	287	1218
84	68	1450	288	1524
80	64	1451	289	1201
80	56	1452	290	1184
84	52	1453	291	1506
80	48	1454	292	1167
80	40	1455	293	1150
84	36	1456	294	1488
80	32	1457	295	1133
80	24	1458	296	1116
84	20	1459	297	1470
80	16	1460	298	1099
88	16	1461	299	1100
88	24	1462	300	1117
92	28	1463	301	1479
88	32	1464	302	1134
88	40	1465	303	1151
92	44	1466	304	1497
88	48	1467	305	1168
88	56	1468	306	1185
92	60	1469	307	1515
88	64	1470	308	1202
88	72	1471	309	1219
92	76	1472	310	1533
88	80	1473	311	1236
88	88	1474	312	1253
92	92	1475	313	1551
88	96	1476	314	1270
88	104	1477	315	1287
92	108	1478	316	1569
88	112	1479	317	1304
88	120	1480	318	1321
92	124	1481	319	1587
88	128	1482	320	1338
88	136	1483	321	1355
88	144	1484	322	1372
88	152	1485	323	1389
96	152	1492	324	1390
96	144	1493	325	1373
96	136	1494	326	1356
100	132	1495	327	1597
96	128	1496	328	1339
96	120	1497	329	1322
100	116	1498	330	1579
96	112	1499	331	1305
96	104	1500	332	1288
100	100	1501	333	1561
96	96	1502	334	1271
96	88	1503	335	1254
100	84	1504	336	1543
96	80	1505	337	1237
96	72	1506	338	1220
100	68	1507	339	1525
96	64	1508	340	1203
96	56	1509	341	1186
100	52	1510	342	1507
96	48	1511	343	1169
96	40	1512	344	1152
100	36	1513	345	1489
96	32	1514	346	1135
96	24	1515	347	1118
100	20	1516	348	1471
96	16	1517	349	1101
104	16	1518	350	1102
104	24	1519	351	1119
108	28	1520	352	1480
104	32	1521	353	1136
104	40	1522	354	1153
108	44	1523	355	1498
104	48	1524	356	1170
104	56	1525	357	1187
108	60	1526	358	1516
104	64	1527	359	1204
104	72	1528	360	1221
108	76	1529	361	1534
104	80	1530	362	1238
104	88	1531	363	1255
108	92	1532	364	1552
104	96	1533	365	1272
104	104	1534	366	1289
108	108	1535	367	1570
104	112	1536	368	1306
104	120	1537	369	1323
108	124	1538	370	1588
104	128	1539	371	1340
104	136	1540	372	1357
104	144	1541	373	1374
104	152	1542	374	1391
112	152	1549	375	1392
112	144	1550	376	1375
112	136	1551	377	1358
116	132	1552	378	1598
112	128	1553	379	1341
112	120	1554	380	1324
116	116	1555	381	1580
112	112	1556	382	1307
112	104	1557	383	1290
116	100	1558	384	1562
112	96	1559	385	1273
112	88	1560	386	1256
116	84	1561	387	1544
112	80	1562	388	1239
112	72	1563	389	1222
116	68	1564	390	1526
112	64	1565	391	1205
112	56	1566	392	1188
116	52	1567	393	1508
112	48	1568	394	1171
112	40	1569	395	1154
116	36	1570	396	1490
112	32	1571	397	1137
112	24	1572	398	1120
116	20	1573	399	1472
112	16	1574	400	1103
120	16	1575	401	1104
120	24	1576	402	1121
124	28	1577	403	1481
120	32	1578	404	1138
120	40	1579	405	1155
124	44	1580	406	1499
120	48	1581	407	1172
120	56	1582	408	1189
124	60	1583	409	1517
120	64	1584	410	1206
120	72	1585	411	1223
124	76	1586	412	1535
120	80	1587	413	1240
120	88	1588	414	1257
124	92	1589	415	1553
120	96	1590	416	1274
120	104	1591	417	1291
124	108	1592	418	1571
120	112	1593	419	1308
120	120	1594	420	1325
124	124	1595	421	1589
120	128	1596	422	1342
120	136	1597	423	1359
120	144	1598	424	1376
120	152	1599	425	1393
128	152	1606	426	1394
128	144	1607	427	1377
128	136	1608	428	1360
132	132	1609	429	1599
128	128	1610	430	1343
128	120	1611	431	1326
132	116	1612	432	1581
128	112	1613	433	1309
128	104	1614	434	1292
132	100	1615	435	1563
128	96	1616	436	1275
128	88	1617	437	1258
132	84	1618	438	1545
128	80	1619	439	1241
128	72	1620	440	1224
132	68	1621	441	1527
128	64	1622	442	1207
128	56	1623	443	1190
132	52	1624	444	1509
128	48	1625	445	1173
128	40	1626	446	1156
132	36	1627	447	1491
128	32	1628	448	1139
128	24	1629	449	1122
132	20	1630	450	1473
128	16	1631	451	1105
136	16	1632	452	1106
136	24	1633	453	1123
140	28	1634	454	1482
136	32	1635	455	1140
136	40	1636	456	1157
140	44	1637	457	1500
136	48	1638	458	1174
136	56	1639	459	1191
140	60	1640	460	1518
136	64	1641	461	1208
136	72	1642	462	1225
140	76	1643	463	1536
136	80	1644	464	1242
136	88	1645	465	1259
140	92	1646	466	1554
136	96	1647	467	1276
136	104	1648	468	1293
140	108	1649	469	1572
136	112	1650	470	1310
136	120	1651	471	1327
140	124	1652	472	1590
136	128	1653	473	1344
136	136	1654	474	1361
136	144	1655	475	1378
136	152	1656	476	1395`
  .split("\n")
  .map((line) => line.split("\t").map((item) => parseInt(item)))
/**
 * SVG element on the DOM where circles will be drawn.
 */
const svg: SVGSVGElement | null = document.querySelector("#svg-kb")

/**
 * Array of SVG circles representing data points.
 */
const circles: SVGCircleElement[] = data.map((item) => {
  // Create an SVG circle element using the SVG namespace
  const circle: SVGCircleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
  // Convert x/y point coordinates to SVG specefic coordinates
  const coordinate: { x: number; y: number } = dbToBoardCoord(item[0], item[1])
  // Set the circles parametes
  circle.setAttribute("cx", coordinate.x.toString())
  circle.setAttribute("cy", coordinate.y.toString())
  circle.setAttribute("r", "30")
  circle.setAttribute("fill", "transparent")
  // circle.setAttribute("stroke", "#4cf0fd")
  circle.setAttribute("stroke", "transparent")
  circle.setAttribute("stroke-width", "8")
  circle.setAttribute("cursor", "pointer")
  circle.setAttribute("fill-opacity", "0.2")
  // Set holes.id as cirle id
  circle.setAttribute("data-holes-id", item[2].toString())
  circle.setAttribute("data-led-position", item[3]?.toString())
  circle.setAttribute("id", item[4]?.toString()) // placement_id
  // Circle click event listener
  circle.addEventListener("click", (event) => {
    const targetElement = event.target as SVGElement | null

    // Get the current stroke color of the clicked circle
    const currentStroke = targetElement?.getAttribute("stroke")?.replace("#", "")

    // Find the current role based on the screen_color
    const currentRoleIndex = KilterBoardPlacementRoles.findIndex((role) => role.screen_color === currentStroke)

    // Determine the next role by cycling through the placement_roles array
    const nextRoleIndex = currentRoleIndex + 1
    const nextRole = KilterBoardPlacementRoles[nextRoleIndex] || null

    if (nextRole) {
      // Update the circle's stroke and fill color to the new role's screen color
      targetElement?.setAttribute("stroke", "#" + nextRole.screen_color)
      targetElement?.setAttribute("fill", "#" + nextRole.screen_color)

      // Update the activeHolds array with the new hold data
      const newHoldData = {
        role_id: nextRole.id, // Placement Role Id
        placement_id: item[4], // Placement Id
      }

      const holdIndex = activeHolds.findIndex((hold) => hold.placement_id === newHoldData.placement_id)
      if (holdIndex === -1) {
        // Add new hold if it doesn't exist
        activeHolds.push(newHoldData)
      } else {
        // Update existing hold
        activeHolds[holdIndex] = newHoldData
      }
    } else {
      // If no next role (after last role), unset the stroke and fill
      targetElement?.setAttribute("stroke", "transparent")
      targetElement?.setAttribute("fill", "transparent")

      // Remove the hold from the activeHolds array
      activeHolds = activeHolds.filter((hold) => hold.placement_id !== item[4])
    }

    // Add selected holds as URL param
    updateURL()

    // Update Bluetooth Payload
    updatePayload()
  })

  return circle
})

// Append circles to the SVG element.
if (svg) {
  circles.forEach((circle) => svg.appendChild(circle))
}

/**
 * Updates the URL based on the activeHolds array.
 */
function updateURL() {
  const routeParam = getFrames()
  const currentUrl = new URL(globalThis.location.href)

  // Set the 'route' parameter
  currentUrl.searchParams.set("route", routeParam)

  // Update the URL without reloading the page
  globalThis.history.pushState({}, "", currentUrl)
}
/**
 * Updates  the inner HTML with the payload in hexadecimal format.
 */
async function updatePayload() {
  const placement = activeHolds.map((activeHold) => {
    // Return the row from the extraced data with a matching placement ID
    const filteredRow = data.find((row) => row[4] === activeHold.placement_id)
    if (!filteredRow) {
      throw new Error(`Row with id ${activeHold.placement_id} not found in placement_roles`)
    }
    return {
      role_id: activeHold.role_id, // placement_roles ID
      position: filteredRow[3], // LED Position
    }
  })
  let payload
  // Send the placement data to light up LEDs on the Kilter Board.
  if (device instanceof KilterBoard) {
    payload = await device.led(placement)
  }

  const activeHoldsHtml = document.querySelector("#active-holds")
  if (activeHoldsHtml !== null && payload) {
    activeHoldsHtml.innerHTML = payload
      // Converts byte array to hexadecimal strings using zfill function.
      .map((x) => zfill(x.toString(16), 2))
      .join("")
  }
}

function clearSVG() {
  activeHolds.forEach((hold) => {
    // Find the corresponding circle element by its `id` attribute
    const circle = document.getElementById(`${hold.placement_id}`)

    if (circle) {
      // Set the circle's stroke and fill color to transparent
      circle.setAttribute("stroke", "transparent")
      circle.setAttribute("fill", "transparent")
    }
  })
}

/**
 * Updates the SVG circles based on the activeHolds array.
 */
function updateSVG() {
  activeHolds.forEach((hold) => {
    // Find the corresponding circle element by its `id` attribute
    const circle = document.getElementById(`${hold.placement_id}`)

    if (circle) {
      // Find the role by its ID to get the color
      const role = KilterBoardPlacementRoles.find((role) => role.id === hold.role_id)

      if (role) {
        // Update the circle's stroke and fill color based on the role's screen color
        circle.setAttribute("stroke", "#" + role.screen_color)
        circle.setAttribute("fill", "#" + role.screen_color)
      }
    }
  })
}
/**
 * Generates a string representing the current active holds and their associated roles.
 * This is how the routes are stored in the `climbs` table.
 * Each frame in the string is formatted as `p<position>r<role_id>` or `p\d{4}r\d{2}`,
 * where `<position>` is the position of the hold, and `<role_id>` is the role's ID.
 *
 * @returns {string} A concatenated string of all active holds formatted as `p<position>r<role_id>`.
 */
function getFrames() {
  const frames = []
  for (const activeHold of activeHolds) {
    frames.push(`p${activeHold.placement_id}r${activeHold.role_id}`)
  }
  return frames.join("")
}

/**
 * Converts a route parameter string into activeHolds array.
 *
 * @param {string} routeParam - The route parameter string.
 */
function setFrames(routeParam: string) {
  // Match all occurrences of p<placement_id>r<role_id> patterns
  const matches = routeParam.match(/p(\d+)r(\d+)/g)

  // Check if matches is null, and return early if no matches are found
  if (!matches) {
    console.error("No valid route patterns found in the routeParam.")
    return
  }

  // Clear existing activeHolds
  activeHolds.length = 0

  // Process each match and update activeHolds
  matches.forEach((match) => {
    // Extract placement_id and role_id from the match
    const [, placement_id, role_id] = match.match(/p(\d+)r(\d+)/) || []

    if (placement_id && role_id) {
      // Add to activeHolds array
      activeHolds.push({
        placement_id: parseInt(placement_id, 10),
        role_id: parseInt(role_id, 10),
      })
    }
  })
}

const currentUrl = new URL(globalThis.location.href)
const routeParam = currentUrl.searchParams.get("route")

if (routeParam) {
  setFrames(routeParam)
  updateSVG()
  updatePayload()
}

export function setupArduino(element: HTMLButtonElement) {
  element.addEventListener("click", async (event) => {
    event.preventDefault()
    await openPort()
  })
}

const BoardState = {
  IDLE: "IDLE",
  BOOTING: "BOOTING",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
}
let currentState = BoardState.IDLE

let writer: WritableStreamDefaultWriter
let reader: ReadableStreamDefaultReader
let port: SerialPort | null
let timeOfLastAPILevelPing = 0
const PING_INTERVAL = 1000 // 1 second
let API_LEVEL = -1

async function readLoop() {
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        console.log("Reader closed.")
        break
      }

      // Log the raw Uint8Array data
      // console.log(value);

      for (const byte of value) {
        if (currentState === BoardState.CONNECTED) {
          newByteIn(byte)
          if (allPacketsReceived) {
            // console.log()
          }
        }
      }
    }
  } catch (err) {
    console.error("Error during reading: ", err)
  }
}

let currentPacketLength = -1
let currentPacket: number[] = []
let allPacketsReceived = false

function newByteIn(dataByte: number) {
  // Handle new byte as per the logic in the Java class
  if (allPacketsReceived) {
    allPacketsReceived = false
    clearSVG()
    activeHolds = []
  }

  if (currentPacket.length === 0 && dataByte !== 1) return

  currentPacket.push(dataByte)

  if (currentPacket.length === 2) {
    // The second byte determines the packet length
    currentPacketLength = dataByte + 5
  } else if (currentPacket.length === currentPacketLength) {
    // Packet is complete, verify and parse it
    if (verifyAndParsePacket()) {
      // If the packet is valid, check if it's the last one
      allPacketsReceived = isThisTheLastPacket()
    } else {
      // If verification fails, reset current placements
      clearSVG()
      activeHolds = []
    }

    // Clear the current packet and reset length for the next packet
    currentPacket = []
    currentPacketLength = -1
  }
}

function scaledColorToFullColorV3(holdData: number) {
  const fullColor = [0, 0, 0]

  // Adjusting scaling factors to match yellow correctly
  // Extract and scale the red component (bits 5 to 7)
  fullColor[0] = Math.round((((holdData & 0b11100000) >> 5) / 7) * 255)

  // Extract and scale the green component (bits 2 to 4)
  fullColor[1] = Math.round((((holdData & 0b00011100) >> 2) / 7) * 255)

  // Extract and scale the blue component (bits 0 to 1)
  fullColor[2] = Math.round((((holdData & 0b00000011) >> 0) / 3) * 255)

  // Convert RGB values to uppercase hexadecimal format
  const hexColor = fullColor.map((value) => value.toString(16).toUpperCase().padStart(2, "0")).join("")

  return hexColor
}

function parseCurrentPacketToActiveHolds() {
  // Clear the current active holds
  clearSVG()
  activeHolds.length = 0

  // Start from index 5 as the first 4 bytes are header and 5th byte is packet type
  const startIndex = 5

  if (API_LEVEL < 3) {
    // Process each hold data which is 2 bytes long
    for (let i = startIndex; i < currentPacketLength - 1; i += 2) {
      const position = currentPacket[i] + ((currentPacket[i + 1] & 0b11) << 8)
      const roleId = currentPacket[i + 1] // Role ID might be in a specific part of the packet based on API level
      console.log(position, roleId)
      // Find the role ID and position from the currentPacket data
      const filteredRow = data.find((row) => row[3] === position)
      if (filteredRow) {
        activeHolds.push({
          placement_id: filteredRow[4],
          role_id: roleId,
        })
      }
    }
  } else {
    // Process each hold data which is 3 bytes long
    for (let i = startIndex; i < currentPacketLength - 1; i += 3) {
      const position = (currentPacket[i + 1] << 8) + currentPacket[i]
      const colorPacked = scaledColorToFullColorV3(currentPacket[i + 2])

      const roleId = KilterBoardPlacementRoles.find((role) => role.led_color === colorPacked)?.id

      // Find the role ID and position from the currentPacket data
      const filteredRow = data.find((row) => row[3] === position)
      if (filteredRow && roleId) {
        activeHolds.push({
          placement_id: filteredRow[4],
          role_id: roleId,
        })
      }
    }
  }
  updateSVG()
  updatePayload()
  updateURL()
}

function verifyAndParsePacket() {
  // Checksum is not calculated with first 4 header bytes.
  // Checksum byte always the 3rd byte.
  // if (checksum(currentPacket.subList(4, currentPacketLength - 1)) !== currentPacket[2]) {
  //   console.error("ERROR: checksum invalid");
  //   return false;
  // }

  // // If receiving a "first" packet when data exists, or receiving a "non-first" packet when no data exists,
  // // something is wrong with transmission.
  // if (
  //   (activeHolds.length === 0 && !isThisTheFirstPacket()) ||
  //   (cactiveHolds.length > 0 && isThisTheFirstPacket())
  // ) {
  //   console.error("ERROR: invalid packet order");
  //   return false;
  // }

  // Parse the packet data
  parseCurrentPacketToActiveHolds()

  return true
}

function isThisTheLastPacket() {
  // Check the 4th byte of the message to determine if it's the last packet
  if (API_LEVEL < 3) {
    return currentPacket[4] === 80 || currentPacket[4] === 79
  } else {
    return currentPacket[4] === 84 || currentPacket[4] === 83
  }
}

// Call every draw loop. If the board is currently booting or connecting, this function will detect when that process is complete.
// If the board has connected, this functoin returns the API level that should be used. Otherwise returns -1.
async function checkForAPILevel() {
  if (!port) {
    throw new Error("Port is not opened")
  }

  try {
    while (true) {
      // Read data from the serial port
      const { value, done } = await reader.read()

      if (done) {
        break // Reader has been closed
      }

      if (currentState === BoardState.CONNECTING) {
        // Iterate through the Uint8Array to find byte 4 and the next byte as the API level
        for (const [index, byte] of value.entries()) {
          if (byte === 4) {
            if (index + 1 < value.length) {
              const apiLevel = value[index + 1]
              if (apiLevel < 1 || apiLevel > 9) {
                return -1
              }
              currentState = BoardState.CONNECTED
              return apiLevel
            }
          }
        }
        // ESP32 will send a '4' just before it sends us the API level
      } else if (value[0] === 4) {
        console.log(value)
        currentState = BoardState.CONNECTING
      }

      // If we still haven't received by this point then the board didn't boot so send out a ping every 1s.
      // It will know to send the API level once it receives a ping.
      const now = Date.now()
      if (now - timeOfLastAPILevelPing > PING_INTERVAL) {
        await sendPing()
        timeOfLastAPILevelPing = now
      }
    }
  } catch (error) {
    console.error("Error while checking for API level:", error)
  }

  return -1
}
async function sendPing() {
  try {
    const data = new Uint8Array([4])
    await writer.write(data)
    console.log("Ping sent.")
  } catch (err) {
    console.error("Error sending ping: ", err)
  }
}

async function handleCommunication() {
  // Start the communication loop
  const apiLevelPromise = checkForAPILevel() // Start the promise for API level

  await sendPing()

  // Handle the result of checkForAPILevel later
  apiLevelPromise
    .then((apiLevel) => {
      if (apiLevel > -1) {
        API_LEVEL = apiLevel
        console.log("API Level:", apiLevel)

        // Start reading loop
        readLoop()
      }
    })
    .catch((err) => {
      console.error("Error handling API Level:", err)
    })
}

async function openPort() {
  try {
    if (!port) {
      port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x2341 }],
      })
    }
    await port.open({ baudRate: 115200 })
    if (port.writable && port.readable) {
      writer = port.writable.getWriter()
      reader = port.readable.getReader()
    }

    console.log("Port opened.")
    handleCommunication() // Start communication handling
  } catch (err) {
    console.error("Failed to open the port: ", err)
  }
}
