# GTA: San Andreas Browser Edition

This repository hosts a standalone GitHub Pages browser build powered by the open-source Play! PlayStation 2 emulator.

## Runtime flow

1. The page initializes the included Play!.js WebAssembly runtime.
2. It downloads `SplitFiles/gtasan.ISO.001` through `gtasan.ISO.226` from the same GitHub Pages project. No third-party CDN is used.
3. Every piece is checked against its expected byte length and SHA-256 hash in `iso-parts.json`.
4. An inline storage worker writes and flushes verified pieces into one ISO in Origin Private File System storage, so no separate worker file can be missed during deployment.
5. Firefox and browsers without synchronous OPFS automatically use a compatible writable-stream path.
6. Interrupted downloads resume at the last fully verified piece.
7. The completed ISO is identified by its total byte length and manifest fingerprint, then reused on later visits.
8. The loader keeps the artwork visible until Play!.js reports real game frames.

Service-worker version 32 applies cross-origin isolation to both the page and Play!.js's Emscripten pthread worker. Runtime failures display stable diagnostic codes and a copyable environment report instead of waiting silently.

The browser requests persistent storage when available. Emulator memory-card files under Play!'s virtual filesystem are mirrored to IndexedDB after the game starts, when the page is hidden, and when the page closes.

## Requirements

- A recent 64-bit Chrome or Edge browser
- At least 5 GB of available browser storage
- Enough system memory and graphics performance for experimental PS2 emulation

The first load transfers approximately 4.19 GB. Later loads reuse the on-device ISO unless site storage is cleared. Chrome may throttle visual updates in a background tab, but the network and storage worker continue processing while the page remains open.

## Local test

Run `serve-local.ps1`, then open `http://127.0.0.1:8765/`.

Play! source: https://github.com/jpd002/Play-

Play!.js: https://playjs.purei.org/
