# GTA: San Andreas Browser Edition

This repository hosts a GitHub Pages browser build powered by the open-source Play! PlayStation 2 emulator.

## Runtime flow

1. The page loads the current Play!.js WebAssembly runtime.
2. It downloads `SplitFiles/gtasan.ISO.001` through `gtasan.ISO.226` from jsDelivr.
3. Every piece is checked against its expected byte length and SHA-256 hash in `iso-parts.json`.
4. Verified pieces are streamed into one ISO in Origin Private File System storage.
5. The completed ISO is passed to Play!.js and reused on later visits.

If jsDelivr fails for a piece, the loader automatically tries GitHub Raw and then the same-origin GitHub Pages file.

## Requirements

- A recent 64-bit Chrome, Edge, or Firefox browser
- At least 5 GB of available browser storage
- Enough system memory and graphics performance for experimental PS2 emulation

The first load transfers approximately 4.19 GB. Later loads reuse the on-device ISO unless site storage is cleared.

For a local-source test, serve the repository through the included local server and open `?source=local`.

Play! source: https://github.com/jpd002/Play-

Play!.js: https://playjs.purei.org/
