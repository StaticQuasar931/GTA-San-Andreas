(function () {
  "use strict";

  const CDN_BASE = "https://cdn.jsdelivr.net/gh/StaticQuasar931/GTA-San-Andreas@main/SplitFiles/";
  const RAW_BASE = "https://raw.githubusercontent.com/StaticQuasar931/GTA-San-Andreas/main/SplitFiles/";
  const LOCAL_BASE = "./SplitFiles/";
  const CACHE_FOLDER = "gtasa-browser";
  const CACHE_FILE = "gtasan.ISO";
  const READY_KEY = "gtasa-opfs-ready-v1";

  const overlay = document.getElementById("loading-overlay");
  const panel = overlay.querySelector(".loading-panel");
  const stageLabel = document.getElementById("stage-label");
  const heading = document.getElementById("status-heading");
  const detail = document.getElementById("status-detail");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const sizeText = document.getElementById("size-text");
  const etaText = document.getElementById("eta-text");
  const primaryButton = document.getElementById("primary-button");
  const retryButton = document.getElementById("retry-button");
  const canvas = document.getElementById("outputCanvas");

  let preparedFile = null;
  let running = false;

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
    const remainder = rounded % 60;
    return minutes ? `${minutes}m ${remainder}s left` : `${remainder}s left`;
  }

  function setProgress(loaded, total, startedAt, label) {
    const fraction = total > 0 ? Math.min(1, loaded / total) : 0;
    const elapsed = Math.max(0.1, (performance.now() - startedAt) / 1000);
    const speed = loaded / elapsed;
    progressBar.style.width = `${(fraction * 100).toFixed(2)}%`;
    progressText.textContent = `${Math.floor(fraction * 100)}%`;
    sizeText.textContent = `${humanBytes(loaded)} / ${humanBytes(total)}`;
    etaText.textContent = fraction > 0 ? humanTime((total - loaded) / speed) : label;
  }

  async function sha256(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  }

  function sourceBases() {
    const localFirst = new URLSearchParams(location.search).get("source") === "local";
    return localFirst ? [LOCAL_BASE, CDN_BASE, RAW_BASE] : [CDN_BASE, RAW_BASE, LOCAL_BASE];
  }

  async function fetchVerifiedPart(part) {
    const failures = [];
    for (const base of sourceBases()) {
      const url = base + encodeURIComponent(part.name);
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== part.size) throw new Error(`expected ${part.size} bytes, received ${bytes.byteLength}`);
        const actualHash = await sha256(bytes);
        if (actualHash !== part.sha256) throw new Error("SHA-256 verification failed");
        return new Uint8Array(bytes);
      } catch (error) {
        failures.push(`${base}: ${error.message}`);
      }
    }
    throw new Error(`Could not download ${part.name}. ${failures.join(" | ")}`);
  }

  async function waitForRuntimeInput() {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const input = document.querySelector('#root input[type="file"]');
      if (input) return input;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("The emulator did not finish starting.");
  }

  async function openCache(manifest) {
    if (!navigator.storage || !navigator.storage.getDirectory) {
      throw new Error("This browser does not support the required private file storage. Use a recent Chrome, Edge, or Firefox browser.");
    }

    if (navigator.storage.persist) {
      await navigator.storage.persist().catch(() => false);
    }

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const available = (estimate.quota || 0) - (estimate.usage || 0);
      const readyValue = localStorage.getItem(READY_KEY);
      if (readyValue !== String(manifest.totalBytes) && available > 0 && available < manifest.totalBytes + 268435456) {
        throw new Error(`Not enough browser storage. ${humanBytes(manifest.totalBytes + 268435456)} is required, but about ${humanBytes(available)} is available.`);
      }
    }

    const root = await navigator.storage.getDirectory();
    const folder = await root.getDirectoryHandle(CACHE_FOLDER, { create: true });
    const handle = await folder.getFileHandle(CACHE_FILE, { create: true });
    return { folder, handle };
  }

  async function prepareIso() {
    if (running) return;
    running = true;
    panel.classList.remove("error");
    retryButton.hidden = true;
    primaryButton.disabled = true;
    primaryButton.textContent = "Preparing...";
    stageLabel.textContent = "Checking files";
    heading.textContent = "Preparing browser storage";
    detail.textContent = "Checking the split-file manifest and available device storage.";

    try {
      if (!window.crossOriginIsolated || typeof SharedArrayBuffer === "undefined") {
        throw new Error(window.__coiError ? `Browser isolation failed: ${window.__coiError.message}` : "Browser isolation is not ready. Reload the page once, then try again.");
      }

      const manifestResponse = await fetch("./iso-parts.json?v=1", { cache: "no-store" });
      if (!manifestResponse.ok) throw new Error("The ISO manifest could not be loaded.");
      const manifest = await manifestResponse.json();
      if (manifest.parts.length !== manifest.partCount || manifest.partCount !== 226) {
        throw new Error("The ISO manifest is incomplete.");
      }

      const cache = await openCache(manifest);
      let cachedFile = await cache.handle.getFile();
      if (cachedFile.size === manifest.totalBytes && localStorage.getItem(READY_KEY) === String(manifest.totalBytes)) {
        preparedFile = new File([cachedFile], manifest.fileName, { type: "application/octet-stream", lastModified: cachedFile.lastModified });
        progressBar.style.width = "100%";
        progressText.textContent = "100%";
        sizeText.textContent = `${humanBytes(manifest.totalBytes)} cached`;
        etaText.textContent = "Ready";
        showPlayButton(true);
        return;
      }

      localStorage.removeItem(READY_KEY);
      stageLabel.textContent = "Downloading and verifying";
      heading.textContent = "Building GTA: San Andreas";
      detail.textContent = "Each piece is verified, then written directly to private browser storage. Do not close this tab.";

      const writable = await cache.handle.createWritable({ keepExistingData: false });
      const startedAt = performance.now();
      let loaded = 0;
      try {
        for (let index = 0; index < manifest.parts.length; index += 1) {
          const part = manifest.parts[index];
          detail.textContent = `Downloading and verifying part ${index + 1} of ${manifest.partCount}: ${part.name}`;
          const bytes = await fetchVerifiedPart(part);
          await writable.write(bytes);
          loaded += bytes.byteLength;
          setProgress(loaded, manifest.totalBytes, startedAt, "Starting...");
        }
        await writable.close();
      } catch (error) {
        await writable.abort().catch(() => {});
        throw error;
      }

      cachedFile = await cache.handle.getFile();
      if (cachedFile.size !== manifest.totalBytes) {
        throw new Error(`The rebuilt ISO is the wrong size. Expected ${manifest.totalBytes}, received ${cachedFile.size}.`);
      }

      localStorage.setItem(READY_KEY, String(manifest.totalBytes));
      preparedFile = new File([cachedFile], manifest.fileName, { type: "application/octet-stream", lastModified: cachedFile.lastModified });
      showPlayButton(false);
    } catch (error) {
      panel.classList.add("error");
      stageLabel.textContent = "Stopped";
      heading.textContent = "The game could not be prepared";
      detail.textContent = error.message;
      primaryButton.hidden = true;
      retryButton.hidden = false;
      running = false;
    }
  }

  function showPlayButton(reused) {
    stageLabel.textContent = reused ? "Saved game found" : "Download complete";
    heading.textContent = "Ready to play";
    detail.textContent = reused ? "The completed ISO was reused from this device. No download was needed." : "All 226 pieces passed verification and the ISO is ready on this device.";
    progressBar.style.width = "100%";
    progressText.textContent = "100%";
    etaText.textContent = "Ready";
    primaryButton.hidden = false;
    primaryButton.disabled = false;
    primaryButton.textContent = "Play GTA: San Andreas";
    primaryButton.onclick = launchGame;
    running = false;
  }

  async function launchGame() {
    if (!preparedFile) return;
    primaryButton.disabled = true;
    primaryButton.textContent = "Launching...";
    stageLabel.textContent = "Starting emulator";
    detail.textContent = "Handing the verified ISO to Play!.js.";
    try {
      await waitForRuntimeInput();
      if (typeof window.__playBootFile !== "function") {
        throw new Error("The browser emulator launch bridge is unavailable.");
      }
      await window.__playBootFile(preparedFile);
      overlay.classList.add("hidden");
      canvas.focus();
    } catch (error) {
      panel.classList.add("error");
      stageLabel.textContent = "Launch stopped";
      heading.textContent = "The emulator could not start";
      detail.textContent = error.message;
      primaryButton.disabled = false;
      primaryButton.textContent = "Try launching again";
    }
  }

  primaryButton.addEventListener("click", prepareIso, { once: true });
  retryButton.addEventListener("click", function () {
    primaryButton.hidden = false;
    primaryButton.onclick = null;
    primaryButton.disabled = false;
    primaryButton.textContent = "Try download again";
    retryButton.hidden = true;
    running = false;
    prepareIso();
  });

  document.getElementById("fullscreen-button").addEventListener("click", async function () {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector(".player-card").requestFullscreen();
    } catch {}
  });
})();
