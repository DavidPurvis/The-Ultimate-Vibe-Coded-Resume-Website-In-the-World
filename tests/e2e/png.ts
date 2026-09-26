/** Tiny PNG decoder (8-bit RGB/RGBA, non-interlaced) for pixel assertions — no dependencies. */
import { inflateSync } from 'node:zlib';

export const PNG = {
  decode(buf: Buffer): { width: number; height: number; data: Uint8Array } {
    let pos = 8;
    let width = 0;
    let height = 0;
    let colorType = 6;
    const idat: Buffer[] = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === 'IHDR') {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        colorType = data[9] ?? 6;
      } else if (type === 'IDAT') idat.push(data);
      else if (type === 'IEND') break;
      pos += 12 + len;
    }
    const bpp = colorType === 2 ? 3 : 4;
    const raw = inflateSync(Buffer.concat(idat));
    const stride = width * bpp;
    const out = new Uint8Array(width * height * 4);
    const prev = new Uint8Array(stride);
    const cur = new Uint8Array(stride);
    for (let y = 0; y < height; y++) {
      const f = raw[y * (stride + 1)] ?? 0;
      const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? (cur[x - bpp] ?? 0) : 0;
        const b = prev[x] ?? 0;
        const c = x >= bpp ? (prev[x - bpp] ?? 0) : 0;
        const v = line[x] ?? 0;
        let r: number;
        if (f === 0) r = v;
        else if (f === 1) r = v + a;
        else if (f === 2) r = v + b;
        else if (f === 3) r = v + ((a + b) >> 1);
        else {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        }
        cur[x] = r & 0xff;
      }
      for (let x = 0; x < width; x++) {
        out[(y * width + x) * 4] = cur[x * bpp] ?? 0;
        out[(y * width + x) * 4 + 1] = cur[x * bpp + 1] ?? 0;
        out[(y * width + x) * 4 + 2] = cur[x * bpp + 2] ?? 0;
        out[(y * width + x) * 4 + 3] = bpp === 4 ? (cur[x * bpp + 3] ?? 255) : 255;
      }
      prev.set(cur);
    }
    return { width, height, data: out };
  },
};
