(function () {
  const BUILD_VERSION = window.__BUILD_VERSION || "dev";
  const SPLIT_PREFIX = "SplitFiles/gtasan.ISO.";
  const PART_COUNT = 226;
  const PART_SIZE = 19922944;
  const LAST_PART_SIZE = 17104896;
  const TOTAL_BYTES = PART_SIZE * (PART_COUNT - 1) + LAST_PART_SIZE;
  const CACHE_NAME = "gtasa-split-cache-v2";
  const SCORE_KEY = "gtasa-highway-hustle-best";
  const POPUP_COOLDOWN_MS = 10 * 60 * 1000;
  const NO_UPDATE_POPUP_SECONDS = 75;
  const TIP_ROTATE_MS = 30000;
  const REPORT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfFiegPH6GsWIWERzfbtptJW2GMk4exkrTQsdqlR2-2oj83zA/viewform";
  const DISCORD_URL = "https://discord.gg/DP2hM7RRhR";
  const IMAGE_POOL = [
    "Assets/1fae857e0461c12d3f6a7b8dd795a591.jpg",
    "Assets/1_PBLWZdNHuEnq3SNVW0wEPg.jpg",
    "Assets/28-3840x2160-desktop-4k-grand-theft-auto-san-andreas-wallpaper.jpg",
    "Assets/Artwork-Cesar&Kendl-GTASA.webp",
    "Assets/Artwork-GTASA-OrangeGroveFamilies-Unreleased.webp",
    "Assets/Artwork-LSPDHelicopter-GTASA.webp",
    "Assets/Artwork-OGLoc-GTASA.webp",
    "Assets/BigSmoke-Artwork.webp",
    "Assets/CarlJohnson-Artwork.webp",
    "Assets/d62lnnm-38c3b8d1-d801-4d6a-9156-114bef8da896.png",
    "Assets/EntryScreen-GTASA-CJ.webp",
    "Assets/FrankTenpenny-Artwork.webp",
    "Assets/grand-theft-auto-san-andreas-pc-mac-game-steam-cover.jpg",
    "Assets/grand-theft-auto-san-andreas-review-image-1024x587.jpg",
    "Assets/GroveStreet-GTASA-GangMemberArtwork.webp",
    "Assets/Grove_Street_Family_Artwork.webp",
    "Assets/GSFVSBALLAS.webp",
    "Assets/GSF_with_Ballas.webp",
    "Assets/gta_sa_loading_screen__1_by_gta_ivplayer_d62lnux-fullview.jpg",
    "Assets/HD-wallpaper-grand-theft-auto-san-andreas-katie-zhan-san-fierro-v01-loading-screen-girlfriend-san-andreas-china-chow-nursefor3yearsnow-girl-large-2560x1440-katie-blue-grand-theft-auto-games.jpg",
    "Assets/images.jpg",
    "Assets/maxresdefault.jpg",
    "Assets/maxresdefaultother.jpg",
    "Assets/Sweet.webp",
    "Assets/T-BoneMendez-Artwork.webp",
    "Assets/thumb-1920-85444.jpg",
    "Assets/Tram-GTASA-Artwork.webp",
    "Assets/unnamed.webp"
  ];
  const TIPS = [
    "Download reaches 100% first. Rebuild starts after that and can look slower because the browser is combining every split into one ISO.",
    "If the split files were cached earlier, the download stage can jump ahead while rebuild still takes a while in memory.",
    "The Last Update badge shows if work is still moving. Green is fresh, yellow is slowing down, red means it may be stuck.",
    "Starting Emulator is the final handoff. If that stage freezes, the issue is usually the host or browser environment, not the split files.",
    "Highway Hustle saves your best score in this browser while the loader runs."
  ];

  const loaderRoot = document.getElementById("loader-root");
  if (!loaderRoot) return;

  loaderRoot.innerHTML = [
    '<div class="loader-bg" data-layer="a"></div>',
    '<div class="loader-bg" data-layer="b"></div>',
    '<div class="loader-vignette"></div>',
    '<div class="loader-noise"></div>',
    '<div class="loader-shade"></div>',
    '<div class="loader-wrap">',
    '  <section class="loader-panel">',
    '    <div class="loader-kicker">StaticQuasar931 Games brings you:</div>',
    '    <h1 class="loader-title">GTA: San Andreas</h1>',
    '    <p class="loader-status" id="loader-status">Preparing loader...</p>',
    '    <div class="loader-progress-head"><span id="loader-stage">Preparing</span><span id="loader-percent">0%</span></div>',
    '    <div class="loader-track"><div class="loader-bar" id="loader-bar"></div></div>',
    '    <div class="loader-meta">',
    '      <span id="loader-size">0 B / 4.2 GB</span>',
    '      <span id="loader-elapsed">00:00</span>',
    '      <span id="loader-eta">ETA: --:--</span>',
    '      <span id="loader-heartbeat" class="is-fresh">Updated 0s ago</span>',
    '    </div>',
    '    <div class="loader-live" id="loader-live">Loader ready.</div>',
    '    <div class="loader-note" id="loader-note">Split files will download first, then rebuild into one ISO before launch.</div>',
    '  </section>',
    '  <aside class="game-panel" id="game-panel">',
    '    <div class="game-head"><span class="game-title">Loading Extras</span><div class="game-actions"><button type="button" id="game-pause">Pause</button><button type="button" id="game-collapse">Collapse</button></div></div>',
    '    <div class="game-stage is-active" id="stage-hustle">',
    '      <canvas class="game-canvas" id="game-canvas" width="300" height="172" aria-label="Loading mini-game"></canvas>',
    '      <div class="game-meta"><span id="game-score">Score: 0</span><span id="game-best">Best: 0</span></div>',
    '    </div>',
    '  </aside>',
    '</div>',
    '<div class="support-popup" id="support-popup" hidden>',
    '  <div class="support-card" role="dialog" aria-modal="true" aria-labelledby="support-title">',
    '    <div class="support-title" id="support-title">Need a hand?</div>',
    '    <div class="support-body">Have you encountered an error? Try reporting it on our Google Form or Discord while this page stays open.</div>',
    '    <div class="support-actions">',
    '      <a class="support-link" href="' + REPORT_FORM_URL + '" target="_blank" rel="noreferrer">Google Form</a>',
    '      <a class="support-link" href="' + DISCORD_URL + '" target="_blank" rel="noreferrer">Discord</a>',
    '      <button type="button" class="support-close" id="support-close">Close</button>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join("");

  const backgrounds = Array.from(loaderRoot.querySelectorAll(".loader-bg"));
  const statusNode = document.getElementById("loader-status");
  const stageNode = document.getElementById("loader-stage");
  const percentNode = document.getElementById("loader-percent");
  const barNode = document.getElementById("loader-bar");
  const sizeNode = document.getElementById("loader-size");
  const elapsedNode = document.getElementById("loader-elapsed");
  const etaNode = document.getElementById("loader-eta");
  const heartbeatNode = document.getElementById("loader-heartbeat");
  const liveNode = document.getElementById("loader-live");
  const noteNode = document.getElementById("loader-note");
  const supportPopup = document.getElementById("support-popup");
  const supportCloseButton = document.getElementById("support-close");
  const gamePanel = document.getElementById("game-panel");
  const gamePauseButton = document.getElementById("game-pause");
  const gameCollapseButton = document.getElementById("game-collapse");
  const hustleTab = document.getElementById("tab-hustle");
  const hustleStage = document.getElementById("stage-hustle");
  const gameCanvas = document.getElementById("game-canvas");
  const gameContext = gameCanvas.getContext("2d");
  const gameScoreNode = document.getElementById("game-score");
  const gameBestNode = document.getElementById("game-best");
  let currentLayer = 0;
  let currentImage = "";
  let recentImages = [];
  let startTime = Date.now();
  let lastProgressAt = Date.now();
  let heartbeatTimer = 0;
  let tipTimer = 0;
  let bgTimer = 0;
  let rafId = 0;
  let audioContext = null;
  let canPlayUiSound = false;
  let popupShown = false;
  let popupDismissedUntil = 0;
  let gamePaused = false;
  let gameCollapsed = false;
  let tipIndex = 0;
  let cacheHandlePromise = null;
  const preloadedImages = [];

  const progressState = {
    stage: "Preparing",
    downloadBytes: 0,
    assembleParts: 0,
    stageFraction: 0
  };

  const game = {
    laneCount: 3,
    roadLeft: 42,
    roadWidth: 216,
    targetLane: 1,
    playerX: 150,
    roadOffset: 0,
    score: 0,
    best: parseInt(localStorage.getItem(SCORE_KEY) || "0", 10) || 0,
    obstacles: [],
    pickups: [],
    nextObstacle: 2.6,
    nextPickup: 3.2,
    lastTime: 0
  };

  gameBestNode.textContent = "Best: " + game.best;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function humanSize(bytes) {
    if (!bytes || bytes < 1) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return value.toFixed(unitIndex > 1 ? 1 : 0) + " " + units[unitIndex];
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function preloadImages() {
    IMAGE_POOL.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src;
      preloadedImages.push(img);
    });
  }

  function nextImage() {
    const candidates = shuffle(IMAGE_POOL).filter((item) => item !== currentImage && !recentImages.includes(item));
    const choice = candidates[0] || shuffle(IMAGE_POOL.filter((item) => item !== currentImage))[0] || IMAGE_POOL[0];
    currentImage = choice;
    recentImages.push(choice);
    if (recentImages.length > 6) recentImages.shift();
    return choice;
  }

  function swapBackground(force) {
    const next = backgrounds[currentLayer % backgrounds.length];
    const prev = backgrounds[(currentLayer + 1) % backgrounds.length];
    next.style.backgroundImage = 'url("' + nextImage().replace(/"/g, "%22") + '")';
    next.style.setProperty("--pan-x", force ? "0px" : ((Math.random() * 10) - 5).toFixed(1) + "px");
    next.style.setProperty("--pan-y", force ? "0px" : ((Math.random() * 7) - 3.5).toFixed(1) + "px");
    next.classList.add("is-visible");
    prev.classList.remove("is-visible");
    currentLayer += 1;
  }

  function laneWidth() {
    return game.roadWidth / game.laneCount;
  }

  function laneCenter(lane) {
    return game.roadLeft + laneWidth() * lane + laneWidth() / 2;
  }

  function setHeartbeatState(seconds) {
    heartbeatNode.classList.remove("is-fresh", "is-warm", "is-stale");
    if (seconds <= 5) heartbeatNode.classList.add("is-fresh");
    else if (seconds < 60) heartbeatNode.classList.add("is-warm");
    else heartbeatNode.classList.add("is-stale");
  }

  function markProgress() {
    lastProgressAt = Date.now();
    if (popupShown) hideSupportPopup(false);
  }

  function updateHeartbeat() {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const sinceUpdate = Math.floor((Date.now() - lastProgressAt) / 1000);
    elapsedNode.textContent = formatTime(elapsedSeconds);
    heartbeatNode.textContent = "Updated " + sinceUpdate + "s ago";
    setHeartbeatState(sinceUpdate);
    if (sinceUpdate >= 15 && progressState.stage !== "Launching") {
      liveNode.textContent = "Still working in the background. Some stages stay quiet while the browser processes large data.";
    }
    if (sinceUpdate >= NO_UPDATE_POPUP_SECONDS && !popupShown && Date.now() >= popupDismissedUntil) {
      showSupportPopup();
    }
  }

  function updateEstimate() {
    const elapsedSeconds = Math.max(1, (Date.now() - startTime) / 1000);
    if (progressState.stage === "Downloading Split Files" && progressState.downloadBytes > 0 && progressState.downloadBytes < TOTAL_BYTES) {
      const speed = progressState.downloadBytes / elapsedSeconds;
      const remaining = Math.max(0, TOTAL_BYTES - progressState.downloadBytes);
      etaNode.textContent = "ETA: " + formatTime(remaining / Math.max(speed, 1));
      return;
    }
    if (progressState.stage === "Rebuilding ISO" && progressState.assembleParts < PART_COUNT) {
      const fraction = progressState.assembleParts / PART_COUNT;
      const estimatedTotal = 18 + PART_COUNT * 0.06;
      etaNode.textContent = "ETA: " + formatTime(Math.max(0, estimatedTotal * (1 - fraction)));
      return;
    }
    if (progressState.stage === "Starting Emulator") {
      etaNode.textContent = "ETA: almost ready";
      return;
    }
    etaNode.textContent = "ETA: --:--";
  }

  function setProgress(stageFraction, stageText, statusText, liveText, sizeText, shouldMark) {
    const safeFraction = Math.max(0, Math.min(stageFraction, 1));
    progressState.stage = stageText;
    progressState.stageFraction = safeFraction;
    stageNode.textContent = stageText;
    statusNode.textContent = statusText;
    liveNode.textContent = liveText;
    sizeNode.textContent = sizeText;
    barNode.style.width = (safeFraction * 100).toFixed(1) + "%";
    percentNode.textContent = Math.round(safeFraction * 100) + "%";
    if (shouldMark !== false) markProgress();
    updateEstimate();
  }

  function partName(index) {
    return SPLIT_PREFIX + String(index).padStart(3, "0");
  }

  async function openCacheHandle() {
    if (!("caches" in window)) return null;
    if (!cacheHandlePromise) cacheHandlePromise = caches.open(CACHE_NAME).catch(() => null);
    return cacheHandlePromise;
  }

  async function tryGetCachedPart(url) {
    const cache = await openCacheHandle();
    if (!cache) return null;
    try {
      return await cache.match(url);
    } catch {
      return null;
    }
  }

  async function tryStoreCachedPart(url, blob) {
    const cache = await openCacheHandle();
    if (!cache) return;
    try {
      await cache.put(url, new Response(blob, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(blob.size)
        }
      }));
    } catch {}
  }

  async function ensureIsolationReady() {
    if (window.crossOriginIsolated) return;
    if (!("serviceWorker" in navigator)) return;
    try {
      await navigator.serviceWorker.ready;
    } catch {}

    if (!navigator.serviceWorker.controller && !sessionStorage.getItem("coi-loader-reload")) {
      sessionStorage.setItem("coi-loader-reload", "1");
      location.reload();
      await new Promise(() => {});
    }

    if (!window.crossOriginIsolated && navigator.serviceWorker.controller && !sessionStorage.getItem("coi-loader-recheck")) {
      sessionStorage.setItem("coi-loader-recheck", "1");
      location.reload();
      await new Promise(() => {});
    }
  }

  function injectBundle() {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-play-bundle="1"]')) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "main.fb6e8aea.js?v=" + encodeURIComponent(BUILD_VERSION);
      script.defer = true;
      script.dataset.playBundle = "1";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load emulator bundle."));
      document.body.appendChild(script);
    });
  }

  async function fetchPart(index, onProgress) {
    const url = partName(index);
    const cached = await tryGetCachedPart(url);
    if (cached) {
      const blob = await cached.blob();
      onProgress(blob.size, true);
      return blob;
    }

    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error("Missing split file " + String(index).padStart(3, "0") + " (" + response.status + ")");
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      chunks.push(chunk.value);
      loaded += chunk.value.length;
      onProgress(loaded, false);
    }

    const blob = new Blob(chunks, { type: "application/octet-stream" });
    await tryStoreCachedPart(url, blob);
    onProgress(blob.size, false);
    return blob;
  }

  function animateAssembly(partBlobs) {
    return new Promise((resolve) => {
      const assembled = [];
      let index = 0;
      function step() {
        const chunkSize = 4;
        const nextIndex = Math.min(index + chunkSize, partBlobs.length);
        for (; index < nextIndex; index += 1) assembled.push(partBlobs[index]);
        progressState.assembleParts = assembled.length;
        setProgress(
          assembled.length / PART_COUNT,
          "Rebuilding ISO",
          "Combining split files into one disc image...",
          "Rebuild is in progress. This step can feel slower because the browser is stitching every part together.",
          assembled.length + " / " + PART_COUNT + " parts combined"
        );
        if (index < partBlobs.length) {
          requestAnimationFrame(step);
          return;
        }
        resolve(new File(assembled, "gtasan.ISO", { type: "application/octet-stream" }));
      }
      step();
    });
  }

  function waitForInput() {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      let settled = false;
      let sawPossibleWorkerFailure = false;
      const cleanup = () => {
        clearInterval(timer);
        window.removeEventListener("error", onError, true);
        window.removeEventListener("unhandledrejection", onRejection);
      };
      const fail = (message) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(message));
      };
      const finish = (input) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(input);
      };
      const looksLikePlayError = (message) => {
        if (!message) return false;
        return message.includes("ArrayBuffer") ||
          message.includes("worker sent an error") ||
          message.includes("wasm streaming compile failed") ||
          message.includes("Failed to load ''");
      };
      const onError = (event) => {
        const message = String(event.message || "");
        if (looksLikePlayError(message) || String(event.filename || "").includes("Play.js")) {
          sawPossibleWorkerFailure = true;
          fail("The emulator worker failed while starting. Play.js could not finish loading on this host.");
        }
      };
      const onRejection = (event) => {
        const reason = event.reason && (event.reason.message || String(event.reason));
        if (looksLikePlayError(String(reason || ""))) {
          sawPossibleWorkerFailure = true;
          fail("The emulator hit a startup error while loading Play.js or Play.wasm.");
        }
      };
      window.addEventListener("error", onError, true);
      window.addEventListener("unhandledrejection", onRejection);
      const timer = setInterval(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
          finish(input);
          return;
        }
        const seconds = Math.floor((Date.now() - started) / 1000);
        setProgress(
          progressState.stageFraction || 0.08,
          "Starting Emulator",
          "Waiting for emulator boot...",
          "Starting Play!.js and waiting for its disc picker to appear.",
          seconds + "s waiting for emulator",
          false
        );
        if (seconds >= 30 && sawPossibleWorkerFailure) {
          fail("The emulator worker crashed during startup. This host is still failing before the disc picker appears.");
          return;
        }
        if (seconds > 18 && !window.crossOriginIsolated) {
          fail("The emulator cannot boot on this host because cross-origin isolation headers are missing.");
          return;
        }
        if (seconds > 45) {
          fail("The emulator startup timed out before its file input appeared. Play.js likely crashed or stalled on this host.");
        }
      }, 500);
    });
  }

  function playPopupSound() {
    if (!canPlayUiSound) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(622, now);
      oscillator.frequency.exponentialRampToValueAtTime(740, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch {}
  }

  function showSupportPopup() {
    if (popupShown || Date.now() < popupDismissedUntil) return;
    popupShown = true;
    supportPopup.hidden = false;
    requestAnimationFrame(() => supportPopup.classList.add("is-visible"));
    playPopupSound();
  }

  function hideSupportPopup(withCooldown) {
    popupShown = false;
    if (withCooldown) popupDismissedUntil = Date.now() + POPUP_COOLDOWN_MS;
    supportPopup.classList.remove("is-visible");
    setTimeout(() => {
      if (!popupShown) supportPopup.hidden = true;
    }, 180);
  }

  async function autoload() {
    try {
      setProgress(0.03, "Preparing", "Checking browser environment...", "Loader started.", "0 B / " + humanSize(TOTAL_BYTES));
      await ensureIsolationReady();
      const bundlePromise = injectBundle();

      const partBlobs = [];
      let totalLoaded = 0;
      setProgress(0, "Downloading Split Files", "Opening split files...", "Downloading or reusing cached split files.", "0 B / " + humanSize(TOTAL_BYTES));

      for (let index = 1; index <= PART_COUNT; index += 1) {
        let partLoaded = 0;
        const blob = await fetchPart(index, (loaded, fromCache) => {
          totalLoaded += loaded - partLoaded;
          partLoaded = loaded;
          progressState.downloadBytes = totalLoaded;
          setProgress(
            totalLoaded / TOTAL_BYTES,
            "Downloading Split Files",
            (fromCache ? "Using cached part " : "Loading split file ") + index + " of " + PART_COUNT + "...",
            fromCache ? "Using split files already cached in this browser." : "Fetching split files and updating progress live.",
            humanSize(totalLoaded) + " / " + humanSize(TOTAL_BYTES)
          );
        });
        partBlobs.push(blob);
      }

      const file = await animateAssembly(partBlobs);
      await bundlePromise;
      setProgress(
        0.08,
        "Starting Emulator",
        "Booting emulator runtime...",
        "Play!.js is loading and preparing its disc picker.",
        "Waiting for emulator",
        true
      );
      const input = await waitForInput();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      hideSupportPopup(false);
      setProgress(1, "Launching", "Launching GTA: San Andreas...", "Disc image handed to the emulator. Finishing startup.", "ISO ready");
      etaNode.textContent = "ETA: done";
      setTimeout(() => {
        loaderRoot.style.transition = "opacity 0.45s ease";
        loaderRoot.style.opacity = "0";
        setTimeout(() => loaderRoot.remove(), 520);
      }, 450);
    } catch (error) {
      statusNode.textContent = error.message;
      liveNode.textContent = "The loader stopped.";
      noteNode.textContent = !window.crossOriginIsolated
        ? "This host still is not cross-origin isolated. The emulator itself is the blocker now."
        : "Check the split files, Play.js startup, and host setup.";
      etaNode.textContent = "ETA: blocked";
      showSupportPopup();
      console.error(error);
    }
  }

  function resetRun() {
    game.score = 0;
    game.targetLane = 1;
    game.obstacles.length = 0;
    game.pickups.length = 0;
    game.nextObstacle = 2.6;
    game.nextPickup = 3.2;
  }

  function drawVehicle(x, y, width, height, bodyColor, roofColor, windshield) {
    const wheelW = Math.max(6, width * 0.16);
    const wheelH = Math.max(4, height * 0.22);
    gameContext.fillStyle = "#111";
    gameContext.fillRect(x + 2, y + 4, wheelW, wheelH);
    gameContext.fillRect(x + width - wheelW - 2, y + 4, wheelW, wheelH);
    gameContext.fillRect(x + 2, y + height - wheelH - 4, wheelW, wheelH);
    gameContext.fillRect(x + width - wheelW - 2, y + height - wheelH - 4, wheelW, wheelH);

    gameContext.fillStyle = bodyColor;
    gameContext.beginPath();
    gameContext.moveTo(x + width * 0.22, y);
    gameContext.lineTo(x + width * 0.78, y);
    gameContext.quadraticCurveTo(x + width, y + height * 0.08, x + width, y + height * 0.3);
    gameContext.lineTo(x + width, y + height * 0.7);
    gameContext.quadraticCurveTo(x + width, y + height * 0.94, x + width * 0.76, y + height);
    gameContext.lineTo(x + width * 0.24, y + height);
    gameContext.quadraticCurveTo(x, y + height * 0.94, x, y + height * 0.7);
    gameContext.lineTo(x, y + height * 0.3);
    gameContext.quadraticCurveTo(x, y + height * 0.08, x + width * 0.22, y);
    gameContext.closePath();
    gameContext.fill();

    gameContext.fillStyle = roofColor;
    gameContext.fillRect(x + width * 0.22, y + height * 0.18, width * 0.56, height * 0.22);
    gameContext.fillStyle = windshield;
    gameContext.fillRect(x + width * 0.29, y + height * 0.24, width * 0.42, height * 0.16);
    gameContext.fillStyle = "rgba(255, 255, 255, 0.16)";
    gameContext.fillRect(x + width * 0.18, y + height * 0.72, width * 0.64, height * 0.08);
  }

  function spawnObstacle() {
    const palette = [
      ["#8a2d23", "#d65f50", "#f6cab8"],
      ["#304b78", "#5e8de6", "#d8ecff"],
      ["#4f5b2d", "#8fb651", "#eff6cc"],
      ["#5b3756", "#b067a8", "#f8d6f0"]
    ];
    const colors = palette[Math.floor(Math.random() * palette.length)];
    game.obstacles.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -34,
      speed: 48 + Math.random() * 16,
      width: 42,
      height: 30,
      body: colors[0],
      roof: colors[1],
      glass: colors[2]
    });
  }

  function spawnPickup() {
    game.pickups.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -18,
      speed: 42 + Math.random() * 12,
      size: 13
    });
  }

  function updateGame(delta) {
    if (gamePaused || gameCollapsed) return;
    game.roadOffset = (game.roadOffset + delta * 78) % 40;
    game.playerX += (laneCenter(game.targetLane) - game.playerX) * Math.min(delta * 5, 1);
    game.score += delta * 3;
    gameScoreNode.textContent = "Score: " + Math.floor(game.score);
    gameBestNode.textContent = "Best: " + game.best;

    game.nextObstacle -= delta;
    game.nextPickup -= delta;
    if (game.nextObstacle <= 0) {
      spawnObstacle();
      game.nextObstacle = 1.9 + Math.random() * 1.2;
    }
    if (game.nextPickup <= 0) {
      spawnPickup();
      game.nextPickup = 3 + Math.random() * 1.5;
    }

    game.obstacles.forEach((item) => { item.y += item.speed * delta; });
    game.pickups.forEach((item) => { item.y += item.speed * delta; });

    const playerBox = { x: game.playerX - 18, y: 122, width: 36, height: 28 };
    game.obstacles = game.obstacles.filter((item) => {
      if (item.y > gameCanvas.height + 18) return false;
      const box = { x: laneCenter(item.lane) - item.width / 2, y: item.y, width: item.width, height: item.height };
      const hit = playerBox.x < box.x + box.width &&
        playerBox.x + playerBox.width > box.x &&
        playerBox.y < box.y + box.height &&
        playerBox.y + playerBox.height > box.y;
      if (hit) {
        game.best = Math.max(game.best, Math.floor(game.score));
        localStorage.setItem(SCORE_KEY, String(game.best));
        resetRun();
        return false;
      }
      return true;
    });

    game.pickups = game.pickups.filter((item) => {
      if (item.y > gameCanvas.height + 18) return false;
      const box = { x: laneCenter(item.lane) - item.size / 2, y: item.y, width: item.size, height: item.size };
      const hit = playerBox.x < box.x + box.width &&
        playerBox.x + playerBox.width > box.x &&
        playerBox.y < box.y + box.height &&
        playerBox.y + playerBox.height > box.y;
      if (hit) {
        game.score += 10;
        return false;
      }
      return true;
    });
  }

  function drawGame() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    const sky = gameContext.createLinearGradient(0, 0, 0, gameCanvas.height);
    sky.addColorStop(0, "#f2ba78");
    sky.addColorStop(0.45, "#cd7048");
    sky.addColorStop(1, "#17181b");
    gameContext.fillStyle = sky;
    gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameContext.fillStyle = "#533721";
    gameContext.fillRect(0, 0, game.roadLeft, gameCanvas.height);
    gameContext.fillRect(game.roadLeft + game.roadWidth, 0, gameCanvas.width - game.roadLeft - game.roadWidth, gameCanvas.height);
    gameContext.fillStyle = "#2a2b2d";
    gameContext.fillRect(game.roadLeft, 0, game.roadWidth, gameCanvas.height);

    gameContext.strokeStyle = "#ffe0a3";
    gameContext.lineWidth = 3;
    for (let lane = 1; lane < game.laneCount; lane += 1) {
      const x = game.roadLeft + laneWidth() * lane;
      for (let y = -40 + game.roadOffset; y < gameCanvas.height + 40; y += 40) {
        gameContext.beginPath();
        gameContext.moveTo(x, y);
        gameContext.lineTo(x, y + 18);
        gameContext.stroke();
      }
    }

    game.pickups.forEach((item) => {
      const x = laneCenter(item.lane);
      gameContext.fillStyle = "#70f37d";
      gameContext.beginPath();
      gameContext.arc(x, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
      gameContext.fill();
      gameContext.fillStyle = "#123a17";
      gameContext.font = "bold 10px Trebuchet MS";
      gameContext.textAlign = "center";
      gameContext.fillText("$", x, item.y + 10);
    });

    game.obstacles.forEach((item) => {
      drawVehicle(laneCenter(item.lane) - item.width / 2, item.y, item.width, item.height, item.body, item.roof, item.glass);
    });

    drawVehicle(game.playerX - 18, 122, 36, 28, "#118f65", "#49e5ab", "#d8fff6");
  }

  function tickGame(timestamp) {
    if (!game.lastTime) game.lastTime = timestamp;
    const delta = Math.min((timestamp - game.lastTime) / 1000, 0.033);
    game.lastTime = timestamp;
    updateGame(delta);
    drawGame();
    rafId = requestAnimationFrame(tickGame);
  }

  function handleKey(event) {
    if (event.key === "Escape" && popupShown) {
      hideSupportPopup(true);
      return;
    }
    if (gameCollapsed) return;
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") game.targetLane = Math.max(0, game.targetLane - 1);
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") game.targetLane = Math.min(game.laneCount - 1, game.targetLane + 1);
  }

  gamePauseButton.addEventListener("click", () => {
    if (gameCollapsed) return;
    gamePaused = !gamePaused;
    gamePauseButton.textContent = gamePaused ? "Resume" : "Pause";
  });

  gameCollapseButton.addEventListener("click", () => {
    gameCollapsed = !gameCollapsed;
    gamePanel.classList.toggle("is-collapsed", gameCollapsed);
    gamePauseButton.disabled = gameCollapsed;
    if (gameCollapsed) {
      gamePaused = true;
      gamePauseButton.textContent = "Paused";
    } else {
      gamePaused = false;
      gamePauseButton.textContent = "Pause";
    }
    gameCollapseButton.textContent = gameCollapsed ? "Expand" : "Collapse";
  });

  supportCloseButton.addEventListener("click", () => hideSupportPopup(true));
  window.addEventListener("pointerdown", () => { canPlayUiSound = true; }, { once: true });
  window.addEventListener("keydown", () => { canPlayUiSound = true; }, { once: true });

  loaderRoot.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    backgrounds.forEach((bg, index) => {
      const factor = index === currentLayer % 2 ? 8 : 5;
      bg.style.setProperty("--pan-x", (x * factor).toFixed(1) + "px");
      bg.style.setProperty("--pan-y", (y * factor).toFixed(1) + "px");
    });
  });

  preloadImages();
  resetRun();
  hustleStage.classList.add("is-active");
  swapBackground(true);
  bgTimer = setInterval(() => swapBackground(false), 9000);
  tipTimer = setInterval(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    noteNode.textContent = TIPS[tipIndex];
  }, TIP_ROTATE_MS);
  noteNode.textContent = TIPS[0];
  heartbeatTimer = setInterval(updateHeartbeat, 1000);
  window.addEventListener("keydown", handleKey);
  rafId = requestAnimationFrame(tickGame);
  autoload().finally(() => {
    if (!loaderRoot.isConnected && rafId) cancelAnimationFrame(rafId);
    if (!loaderRoot.isConnected && heartbeatTimer) clearInterval(heartbeatTimer);
    if (!loaderRoot.isConnected && tipTimer) clearInterval(tipTimer);
    if (!loaderRoot.isConnected && bgTimer) clearInterval(bgTimer);
  });
})();
