const rechk: RegExp = /^([<>])?(([1-9]\d*)?([xcbB?hHiIfdsp]))*$/
const refmt: RegExp = /([1-9]\d*)?([xcbB?hHiIfdsp])/g

const str = (v: DataView, o: number, c: number): string =>
  String.fromCharCode(...Array.from(new Uint8Array(v.buffer, v.byteOffset + o, c)))

const rts = (v: DataView, o: number, c: number, s: string): void =>
  new Uint8Array(v.buffer, v.byteOffset + o, c).set(s.split("").map((str) => str.charCodeAt(0)))

const pst = (v: DataView, o: number, c: number): string => str(v, o + 1, Math.min(v.getUint8(o), c - 1))

const tsp = (v: DataView, o: number, c: number, s: string): void => {
  v.setUint8(o, s.length)
  rts(v, o + 1, c - 1, s)
}

interface FormatFn {
  u: (v: DataView) => unknown
  p: (v: DataView, value: unknown) => void
}

interface LUT {
  [key: string]: (c: number) => [number, number, (o: number) => FormatFn]
}

const lut = (le: boolean): LUT => ({
  x: (c: number) =>
    [
      1,
      c,
      () => ({
        u: () => undefined,
        p: () => undefined,
      }),
    ] as [number, number, (o: number) => FormatFn],
  c: (c: number) =>
    [
      c,
      1,
      (o: number) => ({
        u: (v: DataView) => str(v, o, 1),
        p: (v: DataView, s: string) => rts(v, o, 1, s),
      }),
    ] as [number, number, (o: number) => FormatFn],
  "?": (c: number) =>
    [
      c,
      1,
      (o: number) => ({
        u: (v: DataView) => Boolean(v.getUint8(o)),
        p: (v: DataView, B: boolean) => v.setUint8(o, B ? 1 : 0),
      }),
    ] as [number, number, (o: number) => FormatFn],
  b: (c: number) =>
    [
      c,
      1,
      (o: number) => ({
        u: (v: DataView) => v.getInt8(o),
        p: (v: DataView, b: number) => v.setInt8(o, b),
      }),
    ] as [number, number, (o: number) => FormatFn],
  B: (c: number) =>
    [
      c,
      1,
      (o: number) => ({
        u: (v: DataView) => v.getUint8(o),
        p: (v: DataView, B: number) => v.setUint8(o, B),
      }),
    ] as [number, number, (o: number) => FormatFn],
  h: (c: number) =>
    [
      c,
      2,
      (o: number) => ({
        u: (v: DataView) => v.getInt16(o, le),
        p: (v: DataView, h: number) => v.setInt16(o, h, le),
      }),
    ] as [number, number, (o: number) => FormatFn],
  H: (c: number) =>
    [
      c,
      2,
      (o: number) => ({
        u: (v: DataView) => v.getUint16(o, le),
        p: (v: DataView, H: number) => v.setUint16(o, H, le),
      }),
    ] as [number, number, (o: number) => FormatFn],
  i: (c: number) =>
    [
      c,
      4,
      (o: number) => ({
        u: (v: DataView) => v.getInt32(o, le),
        p: (v: DataView, i: number) => v.setInt32(o, i, le),
      }),
    ] as [number, number, (o: number) => FormatFn],
  I: (c: number) =>
    [
      c,
      4,
      (o: number) => ({
        u: (v: DataView) => v.getUint32(o, le),
        p: (v: DataView, I: number) => v.setUint32(o, I, le),
      }),
    ] as [number, number, (o: number) => FormatFn],
  f: (c: number) =>
    [
      c,
      4,
      (o: number) => ({
        u: (v: DataView) => v.getFloat32(o, le),
        p: (v: DataView, f: number) => v.setFloat32(o, f, le),
      }),
    ] as [number, number, (o: number) => FormatFn],
  d: (c: number) =>
    [
      c,
      8,
      (o: number) => ({
        u: (v: DataView) => v.getFloat64(o, le),
        p: (v: DataView, d: number) => v.setFloat64(o, d, le),
      }),
    ] as [number, number, (o: number) => FormatFn],
  s: (c: number) =>
    [
      1,
      c,
      (o: number) => ({
        u: (v: DataView) => str(v, o, c),
        p: (v: DataView, s: string) => rts(v, o, c, s.slice(0, c)),
      }),
    ] as [number, number, (o: number) => FormatFn],
  p: (c: number) =>
    [
      1,
      c,
      (o: number) => ({
        u: (v: DataView) => pst(v, o, c),
        p: (v: DataView, s: string) => tsp(v, o, c, s.slice(0, c - 1)),
      }),
    ] as [number, number, (o: number) => FormatFn],
})

const errbuf: RangeError = new RangeError("Structure larger than remaining buffer")
const errval: RangeError = new RangeError("Not enough values for structure")

export default function struct(format: string) {
  const fns: FormatFn[] = []
  let size: number = 0
  let m: RegExpExecArray | null = rechk.exec(format)

  if (!m) {
    throw new RangeError("Invalid format string")
  }

  const t: LUT = lut("<" === m[1])
  const lu = (n: string, c: string): [number, number, (o: number) => FormatFn] => t[c](n ? parseInt(n, 10) : 1)

  while ((m = refmt.exec(format))) {
    ;((r: number, s: number, f: (o: number) => FormatFn) => {
      for (let i = 0; i < r; ++i, size += s) {
        if (f) {
          fns.push(f(size))
        }
      }
    })(...lu(...(m.slice(1) as [string, string])))
  }

  const unpack_from = (arrb: ArrayBuffer, offs: number): unknown[] => {
    if (arrb.byteLength < (offs | 0) + size) {
      throw errbuf
    }
    const v = new DataView(arrb, offs | 0)
    return fns.map((f) => f.u(v))
  }

  const pack_into = (arrb: ArrayBuffer, offs: number, ...values: unknown[]): void => {
    if (values.length < fns.length) {
      throw errval
    }
    if (arrb.byteLength < offs + size) {
      throw errbuf
    }
    const v = new DataView(arrb, offs)
    new Uint8Array(arrb, offs, size).fill(0)
    fns.forEach((f, i) => f.p(v, values[i]))
  }

  const pack = (...values: unknown[]): ArrayBuffer => {
    const b = new ArrayBuffer(size)
    pack_into(b, 0, ...values)
    return b
  }

  const unpack = (arrb: ArrayBuffer): unknown[] => unpack_from(arrb, 0)

  function* iter_unpack(arrb: ArrayBuffer): IterableIterator<unknown[]> {
    for (let offs = 0; offs + size <= arrb.byteLength; offs += size) {
      yield unpack_from(arrb, offs)
    }
  }

  return Object.freeze({
    unpack,
    pack,
    unpack_from,
    pack_into,
    iter_unpack,
    format,
    size,
  })
}
