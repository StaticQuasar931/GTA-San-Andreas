(function () {
  const SPLIT_PREFIX = "SplitFiles/gtasan.ISO.";
  const PART_COUNT = 226;
  const PART_SIZE = 19922944;
  const LAST_PART_SIZE = 17104896;
  const TOTAL_BYTES = PART_SIZE * (PART_COUNT - 1) + LAST_PART_SIZE;
  const CACHE_NAME = "gtasa-split-cache-v2";
  const SCORE_KEY = "gtasa-highway-hustle-best";
  const REPORT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfFiegPH6GsWIWERzfbtptJW2GMk4exkrTQsdqlR2-2oj83zA/viewform";
  const DISCORD_URL = "https://discord.gg/DP2hM7RRhR";
  const NO_UPDATE_POPUP_SECONDS = 45;
  const IMAGE_POOL = [
    "Assets/1_PBLWZdNHuEnq3SNVW0wEPg.jpg",
    "Assets/28-3840x2160-desktop-4k-grand-theft-auto-san-andreas-wallpaper.jpg",
    "Assets/d62lnnm-38c3b8d1-d801-4d6a-9156-114bef8da896.png",
    "Assets/grand-theft-auto-san-andreas-pc-mac-game-steam-cover.jpg",
    "Assets/grand-theft-auto-san-andreas-review-image-1024x587.jpg",
    "Assets/HD-wallpaper-grand-theft-auto-san-andreas-katie-zhan-san-fierro-v01-loading-screen-girlfriend-san-andreas-china-chow-nursefor3yearsnow-girl-large-2560x1440-katie-blue-grand-theft-auto-games.jpg",
    "Assets/maxresdefault.jpg",
    "Assets/thumb-1920-85444.jpg",
    "Assets/unnamed.webp"
  ];
  const TIPS = [
    "Split files download first, then the browser rebuilds them into one ISO before boot.",
    "If rebuild slows down, the browser is still combining all 226 parts in memory.",
    "Cached split files can make later reloads much faster, but browsers can still evict large caches.",
    "If the emulator fails on GitHub Pages, the host is likely still missing the isolation headers this build needs.",
    "The mini-game saves your best score locally and pauses automatically when collapsed."
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
    "    </div>",
    '    <div class="loader-live" id="loader-live">Loader ready.</div>',
    '    <div class="loader-note" id="loader-note">Split files will be downloaded, rebuilt, and then handed to the emulator.</div>',
    "  </section>",
    '  <aside class="game-panel" id="game-panel">',
    '    <div class="game-head"><span>Highway Hustle</span><div class="game-actions"><button type="button" id="game-pause">Pause</button><button type="button" id="game-collapse">Collapse</button></div></div>',
    '    <canvas class="game-canvas" id="game-canvas" width="300" height="160" aria-label="Loading mini-game"></canvas>',
    '    <div class="game-meta"><span id="game-score">Score: 0</span><span id="game-best">Best: 0</span></div>',
    "  </aside>",
    "</div>",
    '<div class="support-popup" id="support-popup" hidden>',
    '  <div class="support-card">',
    '    <div class="support-title">Still stuck?</div>',
    '    <div class="support-body">Have you encountered an error? Try reporting it on our Google Form or Discord.</div>',
    '    <div class="support-actions">',
    '      <a class="support-link" href="' + REPORT_FORM_URL + '" target="_blank" rel="noreferrer">Google Form</a>',
    '      <a class="support-link" href="' + DISCORD_URL + '" target="_blank" rel="noreferrer">Discord</a>',
    '      <button type="button" class="support-close" id="support-close">Close</button>',
    "    </div>",
    "  </div>",
    "</div>"
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
  const gamePanel = document.getElementById("game-panel");
  const gamePauseButton = document.getElementById("game-pause");
  const gameCollapseButton = document.getElementById("game-collapse");
  const gameCanvas = document.getElementById("game-canvas");
  const gameScoreNode = document.getElementById("game-score");
  const gameBestNode = document.getElementById("game-best");
  const gameContext = gameCanvas.getContext("2d");
  const supportPopup = document.getElementById("support-popup");
  const supportCloseButton = document.getElementById("support-close");

  let currentLayer = 0;
  let currentImage = "";
  let recentImages = [];
  let tipIndex = 0;
  let stageProgress = 0;
  let startTime = Date.now();
  let lastProgressAt = Date.now();
  let heartbeatTimer = 0;
  let tipTimer = 0;
  let rafId = 0;
  let gamePaused = false;
  let gameCollapsed = false;
  let cacheHandlePromise = null;
  let popupShown = false;
  let audioContext = null;

  const progressState = {
    stage: "Preparing",
    downloadBytes: 0,
    assembleParts: 0
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
    nextObstacle: 2.1,
    nextPickup: 2.8,
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

  function nextImage() {
    const candidates = shuffle(IMAGE_POOL).filter((item) => item !== currentImage && !recentImages.includes(item));
    const choice = candidates[0] || shuffle(IMAGE_POOL.filter((item) => item !== currentImage))[0] || IMAGE_POOL[0];
    currentImage = choice;
    recentImages.push(choice);
    if (recentImages.length > 4) recentImages.shift();
    return choice;
  }

  function swapBackground(force) {
    const next = backgrounds[currentLayer % backgrounds.length];
    const prev = backgrounds[(currentLayer + 1) % backgrounds.length];
    next.style.backgroundImage = 'url("' + nextImage().replace(/"/g, "%22") + '")';
    next.style.setProperty("--pan-x", force ? "0px" : ((Math.random() * 12) - 6).toFixed(1) + "px");
    next.style.setProperty("--pan-y", force ? "0px" : ((Math.random() * 8) - 4).toFixed(1) + "px");
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
    if (popupShown) hideSupportPopup();
  }

  function updateHeartbeat() {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const sinceUpdate = Math.floor((Date.now() - lastProgressAt) / 1000);
    elapsedNode.textContent = formatTime(elapsedSeconds);
    heartbeatNode.textContent = "Updated " + sinceUpdate + "s ago";
    setHeartbeatState(sinceUpdate);
    if (sinceUpdate > 20) {
      liveNode.textContent = "Still working. No fresh progress for " + sinceUpdate + " seconds.";
    }
    if (sinceUpdate >= NO_UPDATE_POPUP_SECONDS && !popupShown) {
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
      const estimatedTotal = 24 + PART_COUNT * 0.07;
      etaNode.textContent = "ETA: " + formatTime(Math.max(0, estimatedTotal * (1 - fraction)));
      return;
    }
    etaNode.textContent = "ETA: --:--";
  }

  function setProgress(stageFraction, stageText, statusText, liveText, sizeText) {
    progressState.stage = stageText;
    stageProgress = Math.max(0, Math.min(stageFraction, 1));
    stageNode.textContent = stageText;
    statusNode.textContent = statusText;
    liveNode.textContent = liveText;
    sizeNode.textContent = sizeText;
    barNode.style.width = (stageProgress * 100).toFixed(1) + "%";
    percentNode.textContent = Math.round(stageProgress * 100) + "%";
    markProgress();
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
    try { return await cache.match(url); } catch { return null; }
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

  function injectBundle() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "main.fb6e8aea.js";
      script.defer = true;
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
      onProgress(blob.size, blob.size, true);
      return blob;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Missing split file " + String(index).padStart(3, "0") + " (" + response.status + ")");
    }

    const expectedLength = index === PART_COUNT ? LAST_PART_SIZE : PART_SIZE;
    const total = parseInt(response.headers.get("content-length") || "0", 10) || expectedLength;
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, total, false);
    }

    const blob = new Blob(chunks, { type: "application/octet-stream" });
    await tryStoreCachedPart(url, blob);
    onProgress(blob.size, blob.size, false);
    return blob;
  }

  function animateAssembly(partBlobs) {
    return new Promise((resolve) => {
      const assembled = [];
      let index = 0;
      function step() {
        const chunkSize = 3;
        const nextIndex = Math.min(index + chunkSize, partBlobs.length);
        for (; index < nextIndex; index += 1) assembled.push(partBlobs[index]);
        progressState.assembleParts = assembled.length;
        setProgress(
          assembled.length / PART_COUNT,
          "Rebuilding ISO",
          "Combining split files into one disc image...",
          "Still working. This stage is usually the slowest-looking one.",
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
      const timer = setInterval(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
          clearInterval(timer);
          resolve(input);
          return;
        }
        const seconds = Math.floor((Date.now() - started) / 1000);
        setProgress(
          Math.min(0.98, 0.45 + seconds * 0.015),
          "Starting Emulator",
          "Waiting for emulator boot...",
          "Still working. Waiting for Play!.js to expose its file input.",
          seconds + "s waiting for emulator"
        );
        if (seconds > 12 && !window.crossOriginIsolated) {
          clearInterval(timer);
          reject(new Error("The emulator cannot boot on this host because cross-origin isolation headers are missing."));
        }
      }, 250);
    });
  }

  function playPopupSound() {
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(554, now);
      oscillator.frequency.exponentialRampToValueAtTime(698, now + 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.35);
    } catch {}
  }

  function showSupportPopup() {
    popupShown = true;
    supportPopup.hidden = false;
    supportPopup.classList.add("is-visible");
    playPopupSound();
  }

  function hideSupportPopup() {
    popupShown = false;
    supportPopup.classList.remove("is-visible");
    supportPopup.hidden = true;
  }

  async function autoload() {
    try {
      const bundlePromise = injectBundle();
      if (!window.crossOriginIsolated) {
        noteNode.textContent = "Warning: this host may still fail at emulator startup because COOP and COEP headers are missing.";
      }

      const partBlobs = [];
      let totalLoaded = 0;
      setProgress(0.02, "Preparing", "Opening split files...", "Loader started.", "0 B / " + humanSize(TOTAL_BYTES));

      for (let index = 1; index <= PART_COUNT; index += 1) {
        let partLoaded = 0;
        const blob = await fetchPart(index, (loaded, total, fromCache) => {
          totalLoaded += loaded - partLoaded;
          partLoaded = loaded;
          progressState.downloadBytes = totalLoaded;
          setProgress(
            totalLoaded / TOTAL_BYTES,
            "Downloading Split Files",
            (fromCache ? "Using cached part " : "Loading split file ") + index + " of " + PART_COUNT + "...",
            fromCache ? "Using split files already cached in the browser." : "Fetching split files and updating progress live.",
            humanSize(totalLoaded) + " / " + humanSize(TOTAL_BYTES)
          );
        });
        partBlobs.push(blob);
      }

      const file = await animateAssembly(partBlobs);
      await bundlePromise;
      const input = await waitForInput();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      hideSupportPopup();
      setProgress(1, "Launching", "Launching GTA: San Andreas...", "Disc image injected. Starting game.", "ISO ready");
      etaNode.textContent = "ETA: done";
      setTimeout(() => {
        loaderRoot.style.transition = "opacity 0.5s ease";
        loaderRoot.style.opacity = "0";
        setTimeout(() => loaderRoot.remove(), 550);
      }, 500);
    } catch (error) {
      statusNode.textContent = error.message;
      liveNode.textContent = "The loader stopped.";
      noteNode.textContent = !window.crossOriginIsolated
        ? "GitHub Pages cannot provide the isolation headers this emulator build needs. That host limitation is the blocker."
        : "Check the split files and host setup.";
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
    game.nextObstacle = 2.1;
    game.nextPickup = 2.8;
  }

  function drawVehicle(x, y, width, height, bodyColor, roofColor) {
    const wheelW = Math.max(6, width * 0.18);
    const wheelH = Math.max(4, height * 0.22);
    gameContext.fillStyle = "#0f0f0f";
    gameContext.fillRect(x + 2, y + 4, wheelW, wheelH);
    gameContext.fillRect(x + width - wheelW - 2, y + 4, wheelW, wheelH);
    gameContext.fillRect(x + 2, y + height - wheelH - 4, wheelW, wheelH);
    gameContext.fillRect(x + width - wheelW - 2, y + height - wheelH - 4, wheelW, wheelH);

    gameContext.fillStyle = bodyColor;
    gameContext.beginPath();
    gameContext.moveTo(x + width * 0.25, y);
    gameContext.lineTo(x + width * 0.75, y);
    gameContext.quadraticCurveTo(x + width, y + height * 0.08, x + width, y + height * 0.28);
    gameContext.lineTo(x + width, y + height * 0.72);
    gameContext.quadraticCurveTo(x + width, y + height * 0.92, x + width * 0.75, y + height);
    gameContext.lineTo(x + width * 0.25, y + height);
    gameContext.quadraticCurveTo(x, y + height * 0.92, x, y + height * 0.72);
    gameContext.lineTo(x, y + height * 0.28);
    gameContext.quadraticCurveTo(x, y + height * 0.08, x + width * 0.25, y);
    gameContext.closePath();
    gameContext.fill();

    gameContext.fillStyle = roofColor;
    gameContext.beginPath();
    gameContext.moveTo(x + width * 0.3, y + height * 0.16);
    gameContext.lineTo(x + width * 0.7, y + height * 0.16);
    gameContext.lineTo(x + width * 0.6, y + height * 0.5);
    gameContext.lineTo(x + width * 0.4, y + height * 0.5);
    gameContext.closePath();
    gameContext.fill();
  }

  function spawnObstacle() {
    const palette = [
      ["#4c75ff", "#dfe8ff"],
      ["#f1634a", "#ffe3da"],
      ["#2bb0ff", "#d8f2ff"],
      ["#7a58ff", "#e7dcff"]
    ];
    const colors = palette[Math.floor(Math.random() * palette.length)];
    game.obstacles.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -34,
      speed: 70 + Math.random() * 24,
      width: 40,
      height: 28,
      body: colors[0],
      roof: colors[1]
    });
  }

  function spawnPickup() {
    game.pickups.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -18,
      speed: 58 + Math.random() * 16,
      size: 13
    });
  }

  function updateGame(delta) {
    if (gamePaused || gameCollapsed) return;
    game.roadOffset = (game.roadOffset + delta * 95) % 40;
    game.playerX += (laneCenter(game.targetLane) - game.playerX) * Math.min(delta * 6, 1);
    game.score += delta * 4;
    gameScoreNode.textContent = "Score: " + Math.floor(game.score);
    gameBestNode.textContent = "Best: " + game.best;

    game.nextObstacle -= delta;
    game.nextPickup -= delta;
    if (game.nextObstacle <= 0) {
      spawnObstacle();
      game.nextObstacle = 1.35 + Math.random() * 0.9;
    }
    if (game.nextPickup <= 0) {
      spawnPickup();
      game.nextPickup = 2.5 + Math.random() * 1.2;
    }

    game.obstacles.forEach((item) => { item.y += item.speed * delta; });
    game.pickups.forEach((item) => { item.y += item.speed * delta; });

    const playerBox = { x: game.playerX - 18, y: 118, width: 36, height: 28 };
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
        game.score += 8;
        return false;
      }
      return true;
    });
  }

  function drawGame() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    const sky = gameContext.createLinearGradient(0, 0, 0, gameCanvas.height);
    sky.addColorStop(0, "#f1b980");
    sky.addColorStop(0.52, "#c36443");
    sky.addColorStop(1, "#171717");
    gameContext.fillStyle = sky;
    gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameContext.fillStyle = "#342517";
    gameContext.fillRect(0, 0, game.roadLeft, gameCanvas.height);
    gameContext.fillRect(game.roadLeft + game.roadWidth, 0, gameCanvas.width - game.roadLeft - game.roadWidth, gameCanvas.height);
    gameContext.fillStyle = "rgba(22, 22, 22, 0.94)";
    gameContext.fillRect(game.roadLeft, 0, game.roadWidth, gameCanvas.height);

    gameContext.strokeStyle = "rgba(255, 230, 170, 0.72)";
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
      gameContext.fillStyle = "#79ef73";
      gameContext.beginPath();
      gameContext.arc(x, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
      gameContext.fill();
      gameContext.fillStyle = "#1f4719";
      gameContext.font = "bold 10px Trebuchet MS";
      gameContext.textAlign = "center";
      gameContext.fillText("$", x, item.y + 10);
    });

    game.obstacles.forEach((item) => {
      drawVehicle(laneCenter(item.lane) - item.width / 2, item.y, item.width, item.height, item.body, item.roof);
    });

    drawVehicle(game.playerX - 18, 118, 36, 28, "#18c786", "#d7fff0");
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

  supportCloseButton.addEventListener("click", hideSupportPopup);

  loaderRoot.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    backgrounds.forEach((bg, index) => {
      const factor = index === currentLayer % 2 ? 9 : 6;
      bg.style.setProperty("--pan-x", (x * factor).toFixed(1) + "px");
      bg.style.setProperty("--pan-y", (y * factor).toFixed(1) + "px");
    });
  });

  window.addEventListener("keydown", handleKey);
  resetRun();
  swapBackground(true);
  setInterval(() => swapBackground(false), 9000);
  tipTimer = setInterval(() => {
    tipIndex = (tipIndex + 1) % TIPS.length;
    noteNode.textContent = TIPS[tipIndex];
  }, 9000);
  noteNode.textContent = TIPS[0];
  heartbeatTimer = setInterval(updateHeartbeat, 1000);
  rafId = requestAnimationFrame(tickGame);
  autoload().finally(() => {
    if (!loaderRoot.isConnected && rafId) cancelAnimationFrame(rafId);
    if (!loaderRoot.isConnected && heartbeatTimer) clearInterval(heartbeatTimer);
    if (!loaderRoot.isConnected && tipTimer) clearInterval(tipTimer);
  });
})();
