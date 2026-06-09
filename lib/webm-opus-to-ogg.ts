/* eslint-disable no-bitwise */
/**
 * WebM/Opus → OGG/Opus remuxer (adapted from Chatwoot, MIT license).
 * Repackages browser-recorded WebM/Opus into WhatsApp-compatible OGG/Opus.
 */

const EBML_IDS = {
  Segment: 0x18538067,
  SegmentInfo: 0x1549a966,
  Tracks: 0x1654ae6b,
  TrackEntry: 0xae,
  CodecPrivate: 0x63a2,
  Audio: 0xe1,
  SamplingFrequency: 0xb5,
  Channels: 0x9f,
  Cluster: 0x1f43b675,
  Timecode: 0xe7,
  SimpleBlock: 0xa3,
  BlockGroup: 0xa0,
  Block: 0xa1,
};

const MASTER_ELEMENTS = new Set([
  0x1a45dfa3,
  EBML_IDS.Segment,
  EBML_IDS.SegmentInfo,
  EBML_IDS.Tracks,
  EBML_IDS.TrackEntry,
  EBML_IDS.Audio,
  EBML_IDS.Cluster,
  EBML_IDS.BlockGroup,
]);

function readVint(data: Uint8Array, pos: number) {
  if (pos >= data.length) return null;
  const first = data[pos];
  if (first === 0) return null;

  let len = 1;
  let mask = 0x80;
  while (len <= 8 && !(first & mask)) {
    len += 1;
    mask >>= 1;
  }
  if (len > 8 || pos + len > data.length) return null;

  let value = first & (mask - 1);
  for (let i = 1; i < len; i += 1) {
    value = value * 256 + data[pos + i];
  }
  return { value, length: len };
}

function readElementId(data: Uint8Array, pos: number) {
  if (pos >= data.length) return null;
  const first = data[pos];
  if (first === 0) return null;

  let len = 1;
  let mask = 0x80;
  while (len <= 4 && !(first & mask)) {
    len += 1;
    mask >>= 1;
  }
  if (len > 4 || pos + len > data.length) return null;

  let id = first;
  for (let i = 1; i < len; i += 1) {
    id = id * 256 + data[pos + i];
  }
  return { id, length: len };
}

function readUintBE(data: Uint8Array, offset: number, length: number) {
  let v = 0;
  for (let i = 0; i < length; i += 1) v = v * 256 + data[offset + i];
  return v;
}

function readFloatBE(data: Uint8Array, offset: number, length: number) {
  if (length !== 4 && length !== 8) return NaN;
  const buf = new ArrayBuffer(length);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < length; i += 1) u8[i] = data[offset + i];
  const view = new DataView(buf);
  return length === 4 ? view.getFloat32(0) : view.getFloat64(0);
}

function extractFrameFromBlock(data: Uint8Array, offset: number, end: number) {
  const trackVint = readVint(data, offset);
  if (!trackVint) return null;
  let pos = offset + trackVint.length;
  pos += 2;
  pos += 1;
  if (pos >= end) return null;
  return data.slice(pos, end);
}

function parseWebM(buffer: ArrayBuffer) {
  const data = new Uint8Array(buffer);
  const result = {
    channels: 1,
    sampleRate: 48000,
    codecPrivate: null as Uint8Array | null,
    frames: [] as Uint8Array[],
  };

  function walk(start: number, end: number) {
    let pos = start;
    while (pos < end) {
      const idRes = readElementId(data, pos);
      if (!idRes) break;
      pos += idRes.length;

      const sizeRes = readVint(data, pos);
      if (!sizeRes) break;
      pos += sizeRes.length;

      const maxVint = 2 ** (7 * sizeRes.length) - 1;
      const elEnd =
        sizeRes.value === maxVint ? end : Math.min(pos + sizeRes.value, end);

      if (MASTER_ELEMENTS.has(idRes.id)) {
        walk(pos, elEnd);
      } else {
        switch (idRes.id) {
          case EBML_IDS.Channels:
            result.channels = readUintBE(data, pos, sizeRes.value);
            break;
          case EBML_IDS.SamplingFrequency:
            result.sampleRate = readFloatBE(data, pos, sizeRes.value);
            break;
          case EBML_IDS.CodecPrivate:
            result.codecPrivate = data.slice(pos, elEnd);
            break;
          case EBML_IDS.SimpleBlock:
          case EBML_IDS.Block: {
            const frame = extractFrameFromBlock(data, pos, elEnd);
            if (frame && frame.length > 0) result.frames.push(frame);
            break;
          }
          default:
            break;
        }
      }
      pos = elEnd;
    }
  }

  walk(0, data.length);
  return result;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i << 24;
    for (let j = 0; j < 8; j += 1) {
      c = ((c << 1) ^ (c & 0x80000000 ? 0x04c11db7 : 0)) >>> 0;
    }
    t[i] = c;
  }
  return t;
})();

function oggCrc32(bytes: Uint8Array) {
  let crc = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (CRC_TABLE[((crc >>> 24) ^ bytes[i]) & 0xff] ^ (crc << 8)) >>> 0;
  }
  return crc;
}

function createOggPage(
  headerType: number,
  granulePosition: number,
  serialNumber: number,
  pageSeq: number,
  packets: Uint8Array[]
) {
  const segTable: number[] = [];
  let dataLen = 0;
  packets.forEach((pkt) => {
    let rem = pkt.length;
    while (rem >= 255) {
      segTable.push(255);
      rem -= 255;
    }
    segTable.push(rem);
    dataLen += pkt.length;
  });

  const hdrLen = 27 + segTable.length;
  const page = new Uint8Array(hdrLen + dataLen);
  const dv = new DataView(page.buffer);

  page.set([0x4f, 0x67, 0x67, 0x53]);
  page[4] = 0;
  page[5] = headerType;

  dv.setUint32(6, granulePosition & 0xffffffff, true);
  dv.setUint32(10, Math.floor(granulePosition / 0x100000000) & 0xffffffff, true);
  dv.setUint32(14, serialNumber, true);
  dv.setUint32(18, pageSeq, true);
  dv.setUint32(22, 0, true);

  page[26] = segTable.length;
  for (let i = 0; i < segTable.length; i += 1) page[27 + i] = segTable[i];

  let off = hdrLen;
  packets.forEach((pkt) => {
    page.set(pkt, off);
    off += pkt.length;
  });

  dv.setUint32(22, oggCrc32(page), true);
  return page;
}

const OPUS_FRAME_MS = [
  10, 20, 40, 60, 10, 20, 40, 60, 10, 20, 40, 60, 10, 20, 10, 20,
  2.5, 5, 10, 20, 2.5, 5, 10, 20, 2.5, 5, 10, 20, 2.5, 5, 10, 20,
];

function opusPacketSamples(pkt: Uint8Array) {
  if (!pkt || pkt.length === 0) return 960;
  const toc = pkt[0];
  const config = (toc >> 3) & 0x1f;
  const code = toc & 0x03;
  const samplesPerFrame = ((OPUS_FRAME_MS[config] || 20) * 48000) / 1000;
  let frameCount;
  if (code <= 1) frameCount = code + 1;
  else if (code === 2) frameCount = 2;
  else frameCount = pkt.length >= 2 ? pkt[1] & 0x3f : 1;
  return samplesPerFrame * frameCount;
}

function buildOpusHead(channels: number, sampleRate: number, preSkip: number) {
  const buf = new Uint8Array(19);
  const dv = new DataView(buf.buffer);
  buf.set(new TextEncoder().encode("OpusHead"));
  buf[8] = 1;
  buf[9] = channels;
  dv.setUint16(10, preSkip, true);
  dv.setUint32(12, sampleRate, true);
  dv.setInt16(16, 0, true);
  buf[18] = 0;
  return buf;
}

function buildOpusTags() {
  const vendor = new TextEncoder().encode("pure-herbex");
  const buf = new Uint8Array(8 + 4 + vendor.length + 4);
  const dv = new DataView(buf.buffer);
  buf.set(new TextEncoder().encode("OpusTags"));
  dv.setUint32(8, vendor.length, true);
  buf.set(vendor, 12);
  dv.setUint32(12 + vendor.length, 0, true);
  return buf;
}

const MAX_FRAMES_PER_PAGE = 50;
const MAX_SEGMENTS_PER_PAGE = 255;

export async function remuxWebmToOgg(inputBlob: Blob): Promise<Blob> {
  const buffer = await inputBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return new Blob([bytes], { type: "audio/ogg; codecs=opus" });
  }

  const { channels, sampleRate, codecPrivate, frames } = parseWebM(buffer);
  if (frames.length === 0) {
    throw new Error("No Opus frames found in recording");
  }

  let preSkip = 312;
  if (codecPrivate && codecPrivate.length >= 12) {
    const magic = new TextDecoder().decode(codecPrivate.slice(0, 8));
    if (magic === "OpusHead") {
      preSkip = new DataView(
        codecPrivate.buffer,
        codecPrivate.byteOffset,
        codecPrivate.length
      ).getUint16(10, true);
    }
  }

  const serial = (Math.random() * 0x100000000) >>> 0;
  let pageSeq = 0;
  const pages: Uint8Array[] = [];

  pages.push(
    createOggPage(0x02, 0, serial, pageSeq, [
      buildOpusHead(channels, sampleRate, preSkip),
    ])
  );
  pageSeq += 1;

  pages.push(createOggPage(0x00, 0, serial, pageSeq, [buildOpusTags()]));
  pageSeq += 1;

  let granule = 0;
  let idx = 0;

  while (idx < frames.length) {
    const packets: Uint8Array[] = [];
    let segs = 0;

    while (idx < frames.length && packets.length < MAX_FRAMES_PER_PAGE) {
      const pkt = frames[idx];
      const pktSegs = Math.floor(pkt.length / 255) + 1;
      if (segs + pktSegs > MAX_SEGMENTS_PER_PAGE && packets.length > 0) break;

      packets.push(pkt);
      segs += pktSegs;
      granule += opusPacketSamples(pkt);
      idx += 1;
    }

    const isLast = idx >= frames.length;
    pages.push(
      createOggPage(isLast ? 0x04 : 0x00, granule, serial, pageSeq, packets)
    );
    pageSeq += 1;
  }

  const total = pages.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  pages.forEach((p) => {
    out.set(p, off);
    off += p.length;
  });

  return new Blob([out], { type: "audio/ogg; codecs=opus" });
}
