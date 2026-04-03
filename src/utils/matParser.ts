/**
 * Minimal MATLAB v5 (.mat) binary file parser.
 * Supports: numeric arrays (double, single, int8/16/32, uint8/16/32),
 *           compressed elements (zlib), both little- and big-endian files.
 * Does NOT support: v4 files, HDF5 (v7.3), cell arrays, structs, char arrays.
 */

export interface MatVar {
  name: string;
  dims: number[];     // MATLAB dimension sizes, e.g. [512, 512, 200]
  data: Float64Array; // flat, column-major (MATLAB order)
}

// ─── Data type constants ──────────────────────────────────────────────────────
const MI_INT8       = 1;
const MI_UINT8      = 2;
const MI_INT16      = 3;
const MI_UINT16     = 4;
const MI_INT32      = 5;
const MI_UINT32     = 6;
const MI_SINGLE     = 7;
const MI_DOUBLE     = 9;
const MI_MATRIX     = 14;
const MI_COMPRESSED = 15;

const BYTE_SIZES: Record<number, number> = {
  [MI_INT8]: 1,  [MI_UINT8]: 1,
  [MI_INT16]: 2, [MI_UINT16]: 2,
  [MI_INT32]: 4, [MI_UINT32]: 4,
  [MI_SINGLE]: 4,
  [MI_DOUBLE]: 8,
};

// ─── Tag reading ──────────────────────────────────────────────────────────────

interface Tag {
  type:       number;
  byteCount:  number;
  dataStart:  number; // absolute offset into the buffer
  nextOffset: number;
}

function readTag(view: DataView, offset: number, isLE: boolean): Tag | null {
  if (offset + 8 > view.byteLength) return null;
  const first = view.getUint32(offset, isLE);

  // Small element: upper 16 bits = byte count, lower 16 = type
  if ((first >>> 16) !== 0) {
    return {
      type:      first & 0xFFFF,
      byteCount: (first >>> 16) & 0xFFFF,
      dataStart:  offset + 4,
      nextOffset: offset + 8,
    };
  }

  const type      = first;
  const byteCount = view.getUint32(offset + 4, isLE);
  const padded    = byteCount + ((8 - (byteCount % 8)) % 8);
  return {
    type,
    byteCount,
    dataStart:  offset + 8,
    nextOffset: offset + 8 + padded,
  };
}

// ─── Numeric reading ──────────────────────────────────────────────────────────

function readNumeric(
  view: DataView,
  offset: number,
  type: number,
  count: number,
  isLE: boolean,
): Float64Array {
  const out = new Float64Array(count);
  const bz  = BYTE_SIZES[type] ?? 8;
  for (let i = 0; i < count; i++) {
    const p = offset + i * bz;
    switch (type) {
      case MI_INT8:   out[i] = view.getInt8(p);          break;
      case MI_UINT8:  out[i] = view.getUint8(p);         break;
      case MI_INT16:  out[i] = view.getInt16(p, isLE);   break;
      case MI_UINT16: out[i] = view.getUint16(p, isLE);  break;
      case MI_INT32:  out[i] = view.getInt32(p, isLE);   break;
      case MI_UINT32: out[i] = view.getUint32(p, isLE);  break;
      case MI_SINGLE: out[i] = view.getFloat32(p, isLE); break;
      default:        out[i] = view.getFloat64(p, isLE); break;
    }
  }
  return out;
}

// ─── Matrix element parser ────────────────────────────────────────────────────

function parseMatrix(
  view: DataView,
  offset: number,
  byteCount: number,
  isLE: boolean,
): MatVar | null {
  const end = offset + byteCount;
  let pos = offset;

  // 1. Array flags (miUINT32)
  const flagsTag = readTag(view, pos, isLE);
  if (!flagsTag || flagsTag.type !== MI_UINT32) return null;
  const arrayClass = view.getUint8(flagsTag.dataStart + 3);
  // Only handle numeric classes: 6=mxDOUBLE … 13=mxUINT32
  if (arrayClass < 6 || arrayClass > 13) return null;
  pos = flagsTag.nextOffset;

  // 2. Dimensions (miINT32)
  const dimsTag = readTag(view, pos, isLE);
  if (!dimsTag || pos >= end) return null;
  const dims: number[] = [];
  for (let i = 0; i < dimsTag.byteCount / 4; i++) {
    dims.push(view.getInt32(dimsTag.dataStart + i * 4, isLE));
  }
  pos = dimsTag.nextOffset;

  // 3. Name (miINT8)
  const nameTag = readTag(view, pos, isLE);
  if (!nameTag) return null;
  const name = new TextDecoder().decode(
    new Uint8Array(view.buffer, nameTag.dataStart, nameTag.byteCount),
  );
  pos = nameTag.nextOffset;

  // 4. Real part
  if (pos >= end) return null;
  const realTag = readTag(view, pos, isLE);
  if (!realTag) return null;
  const count = dims.reduce((a, b) => a * b, 1);
  const data  = readNumeric(view, realTag.dataStart, realTag.type, count, isLE);

  return { name, dims, data };
}

// ─── zlib decompression ───────────────────────────────────────────────────────

async function inflate(rawBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes  = new Uint8Array(rawBuffer); // Uint8Array<ArrayBuffer> — satisfies DecompressionStream
  const ds     = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(bytes);
  writer.close();

  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total  = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { merged.set(c, off); off += c.length; }
  return merged.buffer;
}

// ─── Element traversal ────────────────────────────────────────────────────────

async function walkElements(
  buffer: ArrayBuffer,
  startOffset: number,
  isLE: boolean,
  out: MatVar[],
): Promise<void> {
  const view = new DataView(buffer);
  let offset = startOffset;

  while (offset + 8 <= buffer.byteLength) {
    const tag = readTag(view, offset, isLE);
    if (!tag || tag.nextOffset <= offset) break; // safety

    if (tag.type === MI_COMPRESSED) {
      try {
        const dec = await inflate(buffer.slice(tag.dataStart, tag.dataStart + tag.byteCount));
        await walkElements(dec, 0, isLE, out);
      } catch { /* skip undecompressable element */ }
    } else if (tag.type === MI_MATRIX) {
      const v = parseMatrix(view, tag.dataStart, tag.byteCount, isLE);
      if (v) out.push(v);
    }

    offset = tag.nextOffset;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a MATLAB v5 .mat file.
 * Returns an array of numeric variables found in the file.
 */
export async function parseMatFile(buffer: ArrayBuffer): Promise<MatVar[]> {
  if (buffer.byteLength < 128) {
    throw new Error('File too small to be a valid MATLAB v5 .mat file');
  }

  // Check magic bytes (version 0x0100 at offset 124, endian indicator at 126-127)
  const header = new Uint8Array(buffer, 0, 128);
  if (header[124] !== 0x00 || header[125] !== 0x01) {
    throw new Error('Not a MATLAB v5 file (or v7.3 HDF5 format, not supported)');
  }

  // Endian: 'IM' (0x49,0x4D) = little-endian, 'MI' (0x4D,0x49) = big-endian
  const isLE = header[126] === 0x49 && header[127] === 0x4D;

  const vars: MatVar[] = [];
  await walkElements(buffer, 128, isLE, vars);
  return vars;
}

// ─── Spectral cube helpers ────────────────────────────────────────────────────

export interface SpectralCube {
  height:      number;
  width:       number;
  bands:       number;
  wavelengths: number[];
  /** Row-major Float32Array: index = (row * width + col) * bands + band */
  data:        Float32Array;
  displayUrl:  string;
}

const MAX_SPATIAL = 256; // cap spatial resolution for the spectra cube

/**
 * Convert parsed MatVars into a SpectralCube suitable for display + probing.
 * Looks for a 3-D numeric array (the image cube) and an optional wavelengths vector.
 */
export function matVarsToSpectralCube(vars: MatVar[]): SpectralCube | null {
  // Find the best 3-D candidate (largest element count with exactly 3 dims)
  let cube: MatVar | null = null;
  let wlVar: MatVar | null = null;

  for (const v of vars) {
    if (
      v.dims.length === 2 &&
      (Math.min(...v.dims) === 1) &&
      /^(wl|wavelength|wavelengths?|lambda|bands?)$/i.test(v.name)
    ) {
      wlVar = v;
    }
    if (v.dims.length === 3) {
      if (!cube || v.data.length > cube.data.length) cube = v;
    }
  }

  // Fall back to the largest 2-D array if no 3-D found (single band image)
  if (!cube) {
    for (const v of vars) {
      if (v.dims.length === 2) {
        if (!cube || v.data.length > cube.data.length) cube = v;
      }
    }
    if (!cube) return null;
    // Treat 2-D as single-band
    cube = { ...cube, dims: [...cube.dims, 1] };
  }

  // Determine layout: MATLAB stores column-major.
  // Common formats: [H, W, B] where B = band count, or [B, H, W].
  // Heuristic: if d[0] is much smaller than d[1] and d[2], assume [B, H, W].
  const [d0, d1, d2] = cube.dims;
  let srcH: number, srcW: number, srcB: number;
  if (d0 <= d1 && d0 <= d2 && d0 < 500 && (d1 * d2 > d0 * d0)) {
    srcB = d0; srcH = d1; srcW = d2; // [B, H, W]
  } else {
    srcH = d0; srcW = d1; srcB = d2; // [H, W, B]
  }

  // Spatial subsampling if too large
  const scale  = Math.min(1, MAX_SPATIAL / Math.max(srcH, srcW));
  const height = Math.max(1, Math.round(srcH * scale));
  const width  = Math.max(1, Math.round(srcW * scale));
  const bands  = srcB;

  // Build wavelengths
  let wavelengths: number[];
  if (wlVar) {
    wavelengths = Array.from(wlVar.data);
    if (wavelengths.length !== bands) wavelengths = [];
  } else {
    wavelengths = [];
  }
  if (wavelengths.length !== bands) {
    // Fallback: evenly spaced 400–900 nm
    wavelengths = Array.from({ length: bands }, (_, i) =>
      Math.round(400 + (i / Math.max(1, bands - 1)) * 500),
    );
  }

  // Convert column-major [srcH, srcW, srcB] or [srcB, srcH, srcW] to row-major,
  // with optional spatial downsampling.
  const isBWH = d0 === srcB;

  // Access source data: column-major, so:
  //   [H,W,B] → flat[h + w*H + b*H*W]
  //   [B,H,W] → flat[b + h*B + w*B*H]
  const srcData = cube.data;
  const out = new Float32Array(height * width * bands);

  for (let oy = 0; oy < height; oy++) {
    const sy = Math.round(oy / scale);
    for (let ox = 0; ox < width; ox++) {
      const sx = Math.round(ox / scale);
      for (let b = 0; b < bands; b++) {
        const srcIdx = isBWH
          ? b + sy * srcB + sx * srcB * srcH   // [B, H, W] column-major
          : sy + sx * srcH + b * srcH * srcW;  // [H, W, B] column-major
        out[(oy * width + ox) * bands + b] = srcData[srcIdx] ?? 0;
      }
    }
  }

  // ── Generate display image (middle band, normalized) ──────────────────────
  const midBand = Math.floor(bands / 2);
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < height * width; i++) {
    const v = out[i * bands + midBand];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max > min ? max - min : 1;

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx      = canvas.getContext('2d')!;
  const imgData  = ctx.createImageData(width, height);
  for (let i = 0; i < height * width; i++) {
    const norm = Math.round(((out[i * bands + midBand] - min) / range) * 255);
    imgData.data[i * 4]     = norm;
    imgData.data[i * 4 + 1] = norm;
    imgData.data[i * 4 + 2] = norm;
    imgData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  return {
    height,
    width,
    bands,
    wavelengths,
    data: out,
    displayUrl: canvas.toDataURL(),
  };
}
