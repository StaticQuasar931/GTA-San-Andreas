"use strict";

let accessHandle = null;

self.onmessage = async event => {
  const { id, type } = event.data;
  try {
    let value = null;
    if (type === "open") {
      const root = await navigator.storage.getDirectory();
      const folder = await root.getDirectoryHandle(event.data.folder, { create: true });
      const file = await folder.getFileHandle(event.data.file, { create: true });
      accessHandle = await file.createSyncAccessHandle();
      value = accessHandle.getSize();
    } else if (type === "write") {
      if (!accessHandle) throw new Error("The ISO storage file is not open.");
      const bytes = new Uint8Array(event.data.bytes);
      const written = accessHandle.write(bytes, { at: event.data.offset });
      if (written !== bytes.byteLength) throw new Error(`Only ${written} of ${bytes.byteLength} bytes were written.`);
      accessHandle.flush();
      value = written;
    } else if (type === "truncate") {
      if (!accessHandle) throw new Error("The ISO storage file is not open.");
      accessHandle.truncate(event.data.size);
      accessHandle.flush();
    } else if (type === "close") {
      accessHandle?.close();
      accessHandle = null;
    }
    self.postMessage({ id, value });
  } catch (error) {
    self.postMessage({ id, error: error.message || String(error) });
  }
};
