(function (global) {
  "use strict";

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
    crcTable[n] = value >>> 0;
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  function view(size) {
    const bytes = new Uint8Array(size);
    return { bytes, data: new DataView(bytes.buffer) };
  }

  function safePath(path) {
    const value = String(path || "").replaceAll("\\", "/");
    if (!value || value.startsWith("/") || value.includes("\0") || value.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error(`安全でないZIPパスです: ${path}`);
    }
    return value;
  }

  async function toBytes(value) {
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
    return encoder.encode(String(value));
  }

  async function create(entries) {
    if (entries.length > 0xffff) throw new Error("ZIPに保存するファイル数が多すぎます。");
    const locals = [];
    const centrals = [];
    const names = new Set();
    let offset = 0;
    for (const entry of entries) {
      const path = safePath(entry.path);
      if (names.has(path)) throw new Error(`ZIP内のパスが重複しています: ${path}`);
      names.add(path);
      const name = encoder.encode(path);
      const body = await toBytes(entry.data);
      if (body.length > 0xffffffff) throw new Error(`${path} がZIPの上限サイズを超えています。`);
      const crc = crc32(body);
      const local = view(30 + name.length);
      local.data.setUint32(0, 0x04034b50, true);
      local.data.setUint16(4, 20, true);
      local.data.setUint16(6, 0x0800, true);
      local.data.setUint16(8, 0, true);
      local.data.setUint32(14, crc, true);
      local.data.setUint32(18, body.length, true);
      local.data.setUint32(22, body.length, true);
      local.data.setUint16(26, name.length, true);
      local.bytes.set(name, 30);
      locals.push(local.bytes, body);

      const central = view(46 + name.length);
      central.data.setUint32(0, 0x02014b50, true);
      central.data.setUint16(4, 20, true);
      central.data.setUint16(6, 20, true);
      central.data.setUint16(8, 0x0800, true);
      central.data.setUint16(10, 0, true);
      central.data.setUint32(16, crc, true);
      central.data.setUint32(20, body.length, true);
      central.data.setUint32(24, body.length, true);
      central.data.setUint16(28, name.length, true);
      central.data.setUint32(42, offset, true);
      central.bytes.set(name, 46);
      centrals.push(central.bytes);
      offset += local.bytes.length + body.length;
    }

    const centralSize = centrals.reduce((sum, bytes) => sum + bytes.length, 0);
    const end = view(22);
    end.data.setUint32(0, 0x06054b50, true);
    end.data.setUint16(8, entries.length, true);
    end.data.setUint16(10, entries.length, true);
    end.data.setUint32(12, centralSize, true);
    end.data.setUint32(16, offset, true);
    return new Blob([...locals, ...centrals, end.bytes], { type: "application/x-clambon-project" });
  }

  async function read(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let endOffset = -1;
    for (let offset = Math.max(0, bytes.length - 22); offset >= Math.max(0, bytes.length - 65557); offset -= 1) {
      if (data.getUint32(offset, true) === 0x06054b50) { endOffset = offset; break; }
    }
    if (endOffset < 0) throw new Error("ClambonプロジェクトのZIP形式ではありません。");
    const count = data.getUint16(endOffset + 10, true);
    let cursor = data.getUint32(endOffset + 16, true);
    const result = new Map();
    for (let index = 0; index < count; index += 1) {
      if (cursor + 46 > bytes.length || data.getUint32(cursor, true) !== 0x02014b50) throw new Error("ZIPの目次が壊れています。");
      const method = data.getUint16(cursor + 10, true);
      const expectedCrc = data.getUint32(cursor + 16, true);
      const size = data.getUint32(cursor + 24, true);
      const nameLength = data.getUint16(cursor + 28, true);
      const extraLength = data.getUint16(cursor + 30, true);
      const commentLength = data.getUint16(cursor + 32, true);
      const localOffset = data.getUint32(cursor + 42, true);
      const path = safePath(decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength)));
      if (result.has(path)) throw new Error(`ZIP内のパスが重複しています: ${path}`);
      if (method !== 0) throw new Error("未対応の圧縮方式です。");
      if (data.getUint32(localOffset, true) !== 0x04034b50) throw new Error("ZIPのファイル情報が壊れています。");
      const localNameLength = data.getUint16(localOffset + 26, true);
      const localExtraLength = data.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      if (start + size > bytes.length) throw new Error("ZIP内のファイルが途中で切れています。");
      const body = bytes.slice(start, start + size);
      if (crc32(body) !== expectedCrc) throw new Error(`${path} のデータが壊れています。`);
      result.set(path, new Blob([body]));
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return result;
  }

  global.ClambonProjectZip = { create, read, safePath };
})(window);
