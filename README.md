# GTA: San Andreas Browser Edition

This repository hosts a standalone GitHub Pages browser build powered by the open-source Play! PlayStation 2 emulator.

## Runtime flow

1. The page initializes the included Play!.js WebAssembly runtime.
2. It downloads `SplitFiles/gtasan.ISO.001` through `gtasan.ISO.226` from the same GitHub Pages project. No third-party CDN is used.
3. Every piece is checked against its expected byte length and SHA-256 hash in `iso-parts.json`.
4. A dedicated storage worker writes and flushes verified pieces into one ISO in Origin Private File System storage.
5. Interrupted downloads resume at the last fully verified piece.
6. The completed ISO is identified by its total byte length and manifest fingerprint, then reused on later visits.
7. The loader keeps the artwork visible until Play!.js reports real game frames.

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
