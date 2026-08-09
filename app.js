(function () {
  "use strict";

  const PARTS_BASE = "./SplitFiles/";
  const CACHE_FOLDER = "gtasa-browser";
  const CACHE_FILE = "gtasan.ISO";
  const BUILD_KEY = "gtasa-opfs-build-v3";
  const RESUME_KEY = "gtasa-opfs-resume-v3";
  const SAVE_DB = "gtasa-play-saves-v1";
  const SAVE_KEY = "latest";
  const ARTWORK = [
    "EntryScreen-GTASA-CJ.webp", "CarlJohnson-Artwork.webp", "BigSmoke-Artwork.webp",
    "Sweet.webp", "FrankTenpenny-Artwork.webp", "Artwork-Cesar&Kendl-GTASA.webp",
    "Artwork-LSPDHelicopter-GTASA.webp", "Artwork-OGLoc-GTASA.webp",
    "GroveStreet-GTASA-GangMemberArtwork.webp", "Grove_Street_Family_Artwork.webp",
    "GSFVSBALLAS.webp", "GSF_with_Ballas.webp", "T-BoneMendez-Artwork.webp",
    "Tram-GTASA-Artwork.webp", "Artwork-GTASA-OrangeGroveFamilies-Unreleased.webp",
    "28-3840x2160-desktop-4k-grand-theft-auto-san-andreas-wallpaper.jpg",
    "thumb-1920-85444.jpg", "maxresdefault.jpg", "maxresdefaultother.jpg",
    "gta_sa_loading_screen__1_by_gta_ivplayer_d62lnux-fullview.jpg",
    "grand-theft-auto-san-andreas-review-image-1024x587.jpg",
    "d62lnnm-38c3b8d1-d801-4d6a-9156-114bef8da896.png",
    "1fae857e0461c12d3f6a7b8dd795a591.jpg", "1_PBLWZdNHuEnq3SNVW0wEPg.jpg",
    "grand-theft-auto-san-andreas-pc-mac-game-steam-cover.jpg", "images.jpg", "unnamed.webp"
  ];

  const $ = id => document.getElementById(id);
  const overlay = $("loading-overlay");
  const panel = overlay.querySelector(".loading-panel");
  const artwork = $("loading-artwork");
  const stageLabel = $("stage-label");
  const heading = $("status-heading");
  const detail = $("status-detail");
  const progressBar = $("progress-bar");
  const progressText = $("progress-text");
  const sizeText = $("size-text");
  const etaText = $("eta-text");
  const primaryButton = $("primary-button");
  const retryButton = $("retry-button");
  const canvas = $("outputCanvas");
  const scoreText = $("loader-score");
  const target = $("loader-target");
  let preparedFile = null;
  let running = false;
  let artIndex = Math.floor(Math.random() * ARTWORK.length);
  let score = Number(localStorage.getItem("gtasa-loader-score") || 0);
  let lastUiUpdate = 0;
  let saveTimer = 0;

  function humanBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index >= 3 ? 2 : 1)} ${units[index]}`;
  }

  function humanTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "Estimating...";
    const rounded = Math.ceil(seconds);
    const minutes = Math.floor(rounded / 60);
    return minutes ? `${minutes}m ${rounded % 60}s left` : `${rounded}s left`;
  }

  function setStage(stage, title, message) {
    stageLabel.textContent = stage;
    heading.textContent = title;
    detail.textContent = message;
  }

  function setProgress(loaded, total, startedAt, force) {
    const now = performance.now();
    if (!force && now - lastUiUpdate < 250) return;
    lastUiUpdate = now;
    const fraction = total > 0 ? Math.min(1, loaded / total) : 0;
    const elapsed = Math.max(0.1, (now - startedAt) / 1000);
    const speed = loaded / elapsed;
    const percent = Math.floor(fraction * 100);
    progressBar.style.width = `${(fraction * 100).toFixed(2)}%`;
    progressText.textContent = `${percent}%`;
    sizeText.textContent = `${humanBytes(loaded)} / ${humanBytes(total)}`;
    etaText.textContent = fraction > 0 ? humanTime((total - loaded) / speed) : "Starting...";
    document.title = `${percent}% | GTA: San Andreas`;
  }

  async function digestHex(value) {
    const bytes = value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), item => item.toString(16).padStart(2, "0")).join("");
  }

  async function manifestFingerprint(manifest) {
    return digestHex(new TextEncoder().encode(JSON.stringify(manifest.parts)));
  }

  async function fetchVerifiedPart(part) {
    const response = await fetch(PARTS_BASE + encodeURIComponent(part.name), { cache: "no-store" });
    if (!response.ok) throw new Error(`Part ${part.name} returned HTTP ${response.status}.`);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== part.size) throw new Error(`${part.name} is incomplete.`);
    if (await digestHex(bytes) !== part.sha256) throw new Error(`${part.name} failed its SHA-256 check.`);
    return new Uint8Array(bytes);
  }

  async function openCache(manifest) {
    if (!navigator.storage?.getDirectory) throw new Error("Use a recent Chrome or Edge browser with private file storage support.");
    const persistent = await navigator.storage.persist?.().catch(() => false);
    $("storage-status").textContent = persistent ? "Persistent storage granted" : "Browser-managed storage";
    const estimate = await navigator.storage.estimate?.();
    const available = (estimate?.quota || 0) - (estimate?.usage || 0);
    if (!localStorage.getItem(BUILD_KEY) && available > 0 && available < manifest.totalBytes + 268435456) {
      throw new Error(`About ${humanBytes(manifest.totalBytes + 268435456)} of browser storage is required. Only ${humanBytes(available)} appears available.`);
    }
    const root = await navigator.storage.getDirectory();
    const folder = await root.getDirectoryHandle(CACHE_FOLDER, { create: true });
    const handle = await folder.getFileHandle(CACHE_FILE, { create: true });
    return { handle };
  }

  function prefixBytes(parts, count) {
    let total = 0;
    for (let index = 0; index < count; index += 1) total += parts[index].size;
    return total;
  }

  async function createIsoWriter() {
    const worker = new Worker("./iso-worker.js?v=30");
    let sequence = 0;
    const pending = new Map();
    worker.onmessage = event => {
      const job = pending.get(event.data.id);
      if (!job) return;
      pending.delete(event.data.id);
      if (event.data.error) job.reject(new Error(event.data.error));
      else job.resolve(event.data.value);
    };
    worker.onerror = event => {
      for (const job of pending.values()) job.reject(new Error(event.message || "The storage worker stopped."));
      pending.clear();
    };
    function send(type, value, transfer = []) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        worker.postMessage({ id, type, ...value }, transfer);
      });
    }
    await send("open", { folder: CACHE_FOLDER, file: CACHE_FILE });
    return {
      truncate: size => send("truncate", { size }),
      write: (offset, bytes) => send("write", { offset, bytes }, [bytes.buffer]),
      async close() {
        await send("close", {});
        worker.terminate();
      }
    };
  }

  async function prepareIso() {
    if (running) return;
    running = true;
    panel.classList.remove("error");
    retryButton.hidden = true;
    primaryButton.disabled = true;
    primaryButton.textContent = "Preparing...";
    setStage("Checking", "Checking your local game", "Reading the manifest and confirming browser storage.");
    try {
      if (!window.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") {
        throw new Error(window.__coiError ? `Browser isolation failed: ${window.__coiError.message}` : "Browser isolation is not ready. Reload this page once and try again.");
      }
      const response = await fetch("./iso-parts.json?v=3", { cache: "no-store" });
      if (!response.ok) throw new Error("The ISO manifest could not be loaded.");
      const manifest = await response.json();
      if (manifest.parts.length !== manifest.partCount || manifest.partCount !== 226) throw new Error("The ISO manifest is incomplete.");
      const fingerprint = await manifestFingerprint(manifest);
      const cache = await openCache(manifest);
      let cachedFile = await cache.handle.getFile();
      let build = null;
      try { build = JSON.parse(localStorage.getItem(BUILD_KEY)); } catch {}
      if (cachedFile.size === manifest.totalBytes && build?.fingerprint === fingerprint && build?.totalBytes === manifest.totalBytes) {
        preparedFile = cachedFile;
        setProgress(manifest.totalBytes, manifest.totalBytes, performance.now() - 1000, true);
        showPlayButton(true);
        return;
      }

      localStorage.removeItem(BUILD_KEY);
      let resume = null;
      try { resume = JSON.parse(localStorage.getItem(RESUME_KEY)); } catch {}
      let nextIndex = resume?.fingerprint === fingerprint ? Number(resume.nextIndex) : 0;
      if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex > manifest.partCount) nextIndex = 0;
      let loaded = prefixBytes(manifest.parts, nextIndex);
      const writer = await createIsoWriter();
      if (cachedFile.size !== loaded) {
        nextIndex = 0;
        loaded = 0;
        await writer.truncate(0);
      }

      setStage(nextIndex ? "Resuming download" : "Downloading", "Building GTA: San Andreas", "Every piece is checked, then saved directly on this device. You may switch tabs, but do not close this page.");
      const startedAt = performance.now() - (loaded ? 1000 : 0);
      setProgress(loaded, manifest.totalBytes, startedAt, true);
      try {
        for (let index = nextIndex; index < manifest.parts.length; index += 1) {
          const part = manifest.parts[index];
          detail.textContent = `Downloading and checking part ${index + 1} of ${manifest.partCount}: ${part.name}`;
          const bytes = await fetchVerifiedPart(part);
          const byteLength = bytes.byteLength;
          await writer.write(loaded, bytes);
          loaded += byteLength;
          localStorage.setItem(RESUME_KEY, JSON.stringify({ fingerprint, nextIndex: index + 1 }));
          setProgress(loaded, manifest.totalBytes, startedAt, true);
        }
      } finally {
        await writer.close().catch(() => {});
      }

      cachedFile = await cache.handle.getFile();
      if (cachedFile.size !== manifest.totalBytes) throw new Error(`The rebuilt ISO has the wrong size. Expected ${manifest.totalBytes}, received ${cachedFile.size}.`);
      localStorage.setItem(BUILD_KEY, JSON.stringify({ fingerprint, totalBytes: manifest.totalBytes, verifiedAt: Date.now() }));
      localStorage.removeItem(RESUME_KEY);
      preparedFile = cachedFile;
      showPlayButton(false);
    } catch (error) {
      panel.classList.add("error");
      setStage("Stopped", "The game could not be prepared", error.message);
      primaryButton.hidden = true;
      retryButton.hidden = false;
      running = false;
      document.title = "Download stopped | GTA: San Andreas";
    }
  }

  function showPlayButton(reused) {
    setStage(reused ? "Downloaded" : "Download complete", "Ready to start", reused ? "The verified game is already saved on this device. No download is needed." : "All 226 pieces passed SHA-256 verification and the complete game is saved on this device.");
    progressBar.style.width = "100%";
    progressText.textContent = "100%";
    etaText.textContent = "Ready";
    primaryButton.hidden = false;
    primaryButton.disabled = false;
    primaryButton.textContent = "Start GTA: San Andreas";
    primaryButton.onclick = launchGame;
    running = false;
    document.title = "Ready | GTA: San Andreas";
  }

  function waitForModule() {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + 60000;
      const check = () => {
        if (window.__playModule?.FS) resolve(window.__playModule);
        else if (Date.now() > deadline) reject(new Error("The emulator runtime did not initialize."));
        else setTimeout(check, 100);
      };
      check();
    });
  }

  function openSaveDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SAVE_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("snapshots");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function dbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function collectSaveFiles(FS) {
    const files = [];
    const excluded = new Set(["/dev", "/proc", "/tmp"]);
    function walk(path) {
      if (excluded.has(path)) return;
      let names;
      try { names = FS.readdir(path); } catch { return; }
      for (const name of names) {
        if (name === "." || name === "..") continue;
        const child = path === "/" ? `/${name}` : `${path}/${name}`;
        let stat;
        try { stat = FS.stat(child); } catch { continue; }
        if (FS.isDir(stat.mode)) walk(child);
        else if (FS.isFile(stat.mode) && stat.size <= 32 * 1024 * 1024) {
          try { files.push({ path: child, data: FS.readFile(child) }); } catch {}
        }
      }
    }
    walk("/");
    return files;
  }

  async function saveEmulatorFiles() {
    const FS = window.__playModule?.FS;
    if (!FS) return;
    const files = collectSaveFiles(FS);
    const total = files.reduce((sum, file) => sum + file.data.byteLength, 0);
    if (!files.length) {
      $("save-status").textContent = "Local autosave watching for memory-card changes";
      return;
    }
    if (total > 128 * 1024 * 1024) return;
    const db = await openSaveDb();
    const tx = db.transaction("snapshots", "readwrite");
    tx.objectStore("snapshots").put({ files, savedAt: Date.now() }, SAVE_KEY);
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    db.close();
    localStorage.setItem("gtasa-last-save", String(Date.now()));
    $("save-status").textContent = `Local saves active, last checked ${new Date().toLocaleTimeString()}`;
  }

  async function restoreEmulatorFiles(module) {
    const db = await openSaveDb();
    const tx = db.transaction("snapshots", "readonly");
    const snapshot = await dbRequest(tx.objectStore("snapshots").get(SAVE_KEY));
    db.close();
    if (!snapshot?.files) return;
    for (const file of snapshot.files) {
      const pieces = file.path.split("/").filter(Boolean);
      pieces.pop();
      let directory = "";
      for (const piece of pieces) {
        directory += `/${piece}`;
        try { module.FS.mkdir(directory); } catch {}
      }
      try { module.FS.writeFile(file.path, file.data); } catch {}
    }
    $("save-status").textContent = `Local saves restored from ${new Date(snapshot.savedAt).toLocaleString()}`;
  }

  async function waitForFrames() {
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      const stats = document.querySelector("#root .stats")?.textContent || "";
      const match = stats.match(/(\d+)\s*f\/s/i);
      if (match && Number(match[1]) > 0) return;
      const elapsed = 180 - Math.ceil((deadline - Date.now()) / 1000);
      detail.textContent = `The emulator is reading the 4.2 GB disc image. This can take about a minute on a Chromebook. ${elapsed}s elapsed.`;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error("The emulator did not produce a game frame within three minutes.");
  }

  async function launchGame() {
    if (!preparedFile || running) return;
    running = true;
    primaryButton.disabled = true;
    primaryButton.textContent = "Starting...";
    setStage("Loading saves", "Starting the emulator", "Restoring local game data before the disc starts.");
    try {
      const module = await waitForModule();
      await restoreEmulatorFiles(module).catch(() => {});
      if (typeof window.__playBootFile !== "function") throw new Error("The emulator launch bridge is unavailable.");
      setStage("Starting game", "Reading the game disc", "The emulator is opening the 4.2 GB ISO. The artwork stays here until the first game frame is ready.");
      await window.__playBootFile(preparedFile);
      await waitForFrames();
      overlay.classList.add("hidden");
      canvas.focus();
      document.title = "GTA: San Andreas";
      saveTimer = window.setInterval(() => saveEmulatorFiles().catch(() => {}), 60000);
      saveEmulatorFiles().catch(() => {});
      running = false;
    } catch (error) {
      panel.classList.add("error");
      setStage("Launch stopped", "The emulator could not start", error.message);
      primaryButton.disabled = false;
      primaryButton.textContent = "Try starting again";
      running = false;
    }
  }

  function cycleArtwork() {
    artIndex = (artIndex + 1) % ARTWORK.length;
    const next = new Image();
    next.onload = () => { artwork.src = next.src; };
    next.src = `./Assets/${encodeURIComponent(ARTWORK[artIndex])}`;
  }

  function moveTarget() {
    const x = 8 + Math.random() * 78;
    const y = 8 + Math.random() * 65;
    target.style.left = `${x}%`;
    target.style.top = `${y}%`;
  }

  scoreText.textContent = String(score);
  artwork.src = `./Assets/${encodeURIComponent(ARTWORK[artIndex])}`;
  window.setInterval(() => { if (!document.hidden && !overlay.classList.contains("hidden")) cycleArtwork(); }, 8000);
  target.addEventListener("click", () => {
    score += 1;
    scoreText.textContent = String(score);
    localStorage.setItem("gtasa-loader-score", String(score));
    moveTarget();
  });
  moveTarget();

  primaryButton.addEventListener("click", prepareIso, { once: true });
  retryButton.addEventListener("click", () => {
    primaryButton.hidden = false;
    primaryButton.disabled = false;
    primaryButton.textContent = "Resume download";
    retryButton.hidden = true;
    running = false;
    prepareIso();
  });

  $("fullscreen-button").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector(".player-card").requestFullscreen({ navigationUI: "hide" });
    } catch (error) {
      detail.textContent = `Fullscreen was blocked: ${error.message}`;
    }
  });
  document.addEventListener("fullscreenchange", () => {
    $("fullscreen-button").textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && saveTimer) saveEmulatorFiles().catch(() => {});
  });
  window.addEventListener("pagehide", () => { if (saveTimer) saveEmulatorFiles().catch(() => {}); });
})();
