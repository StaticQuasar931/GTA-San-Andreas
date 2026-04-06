(function () {
  const SPLIT_PREFIX = "SplitFiles/gtasan.ISO.";
  const PART_COUNT = 226;
  const PART_SIZE = 19922944;
  const LAST_PART_SIZE = 17104896;
  const TOTAL_BYTES = PART_SIZE * (PART_COUNT - 1) + LAST_PART_SIZE;
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
    "Download, rebuild, then boot. This loader tracks all three separately.",
    "If progress pauses for a moment, the heartbeat still tells you it is alive.",
    "The mini-game is optional now. Collapse it or pause it whenever you want.",
    "Split files are loaded one by one, then rebuilt into a single ISO in memory.",
    "This emulator build needs cross-origin isolation headers. GitHub Pages does not provide them."
  ];

  const loaderRoot = document.getElementById("loader-root");
  if (!loaderRoot) return;

  loaderRoot.innerHTML = [
    '<div class="loader-bg" data-layer="a"></div>',
    '<div class="loader-bg" data-layer="b"></div>',
    '<div class="loader-vignette"></div>',
    '<div class="loader-noise"></div>',
    '<div class="loader-shade"></div>',
    '<div class="loader-shell">',
    '  <section class="loader-main">',
    '    <div class="loader-kicker">Play!.js Local Build</div>',
    '    <h1 class="loader-title">San Andreas</h1>',
    '    <p class="loader-status" id="loader-status">Preparing loader...</p>',
    '    <div class="loader-time-row">',
    '      <div class="loader-time-box"><span class="loader-time-label">Elapsed</span><strong id="loader-elapsed">00:00</strong></div>',
    '      <div class="loader-time-box"><span class="loader-time-label">Estimate</span><strong id="loader-eta">Calculating</strong></div>',
    '      <div class="loader-time-box"><span class="loader-time-label">Last Update</span><strong id="loader-heartbeat">just now</strong></div>',
    "    </div>",
    '    <div class="loader-overall">',
    '      <div class="loader-overall-head"><span>Overall Progress</span><span id="loader-percent">0%</span></div>',
    '      <div class="loader-track"><div class="loader-bar" id="loader-bar"></div></div>',
    '      <div class="loader-size" id="loader-size">0 B / 4.2 GB</div>',
    "    </div>",
    '    <div class="loader-stages">',
    '      <div class="loader-stage-card is-active" id="stage-download"><div class="loader-stage-head"><span>1. Download Split Files</span><span id="stage-download-text">Starting</span></div><div class="loader-stage-track"><div class="loader-stage-bar" id="stage-download-bar"></div></div></div>',
    '      <div class="loader-stage-card" id="stage-assemble"><div class="loader-stage-head"><span>2. Rebuild ISO</span><span id="stage-assemble-text">Waiting</span></div><div class="loader-stage-track"><div class="loader-stage-bar" id="stage-assemble-bar"></div></div></div>',
    '      <div class="loader-stage-card" id="stage-emulator"><div class="loader-stage-head"><span>3. Start Emulator</span><span id="stage-emulator-text">Waiting</span></div><div class="loader-stage-track"><div class="loader-stage-bar" id="stage-emulator-bar"></div></div></div>',
    "    </div>",
    '    <div class="loader-live" id="loader-live">Loader idle</div>',
    '    <div class="loader-tip" id="loader-tip"></div>',
    '    <div class="loader-note" id="loader-note">Expected rebuild time depends heavily on browser memory pressure and device speed.</div>',
    "  </section>",
    '  <aside class="loader-side" id="loader-side">',
    '    <div class="loader-side-head"><span>Highway Hustle</span><div class="loader-side-actions"><button type="button" id="game-pause">Pause</button><button type="button" id="game-collapse">Collapse</button></div></div>',
    '    <canvas class="loader-game-canvas" id="game-canvas" width="340" height="190" aria-label="Loading mini-game"></canvas>',
    '    <div class="loader-game-meta"><span id="game-score">Score: 0</span><span id="game-best">Best: 0</span></div>',
    '    <div class="loader-game-help">Left/Right or A/D. Slower traffic, wider gaps, optional play.</div>',
    "  </aside>",
    "</div>"
  ].join("");

  const backgrounds = Array.from(loaderRoot.querySelectorAll(".loader-bg"));
  const statusNode = document.getElementById("loader-status");
  const percentNode = document.getElementById("loader-percent");
  const barNode = document.getElementById("loader-bar");
  const sizeNode = document.getElementById("loader-size");
  const elapsedNode = document.getElementById("loader-elapsed");
  const etaNode = document.getElementById("loader-eta");
  const heartbeatNode = document.getElementById("loader-heartbeat");
  const liveNode = document.getElementById("loader-live");
  const noteNode = document.getElementById("loader-note");
  const tipNode = document.getElementById("loader-tip");
  const stageDownload = document.getElementById("stage-download");
  const stageAssemble = document.getElementById("stage-assemble");
  const stageEmulator = document.getElementById("stage-emulator");
  const stageDownloadBar = document.getElementById("stage-download-bar");
  const stageAssembleBar = document.getElementById("stage-assemble-bar");
  const stageEmulatorBar = document.getElementById("stage-emulator-bar");
  const stageDownloadText = document.getElementById("stage-download-text");
  const stageAssembleText = document.getElementById("stage-assemble-text");
  const stageEmulatorText = document.getElementById("stage-emulator-text");
  const gameCanvas = document.getElementById("game-canvas");
  const gamePauseButton = document.getElementById("game-pause");
  const gameCollapseButton = document.getElementById("game-collapse");
  const gameSide = document.getElementById("loader-side");
  const gameScoreNode = document.getElementById("game-score");
  const gameBestNode = document.getElementById("game-best");
  const gameContext = gameCanvas.getContext("2d");

  let currentLayer = 0;
  let currentImage = "";
  let recentImages = [];
  let tipIndex = Math.floor(Math.random() * TIPS.length);
  let overallProgress = 0;
  let startTime = Date.now();
  let lastProgressAt = Date.now();
  let heartbeatTimer = 0;
  let rafId = 0;
  let gamePaused = false;
  let gameCollapsed = false;

  const progressState = {
    downloadBytes: 0,
    assembleParts: 0,
    inputReady: false
  };

  const game = {
    laneCount: 3,
    laneWidth: gameCanvas.width / 3,
    targetLane: 1,
    playerX: gameCanvas.width / 2,
    roadOffset: 0,
    score: 0,
    best: 0,
    obstacles: [],
    pickups: [],
    nextObstacle: 1.9,
    nextPickup: 2.6,
    lastTime: 0
  };

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
    next.style.setProperty("--pan-x", force ? "0px" : ((Math.random() * 18) - 9).toFixed(1) + "px");
    next.style.setProperty("--pan-y", force ? "0px" : ((Math.random() * 14) - 7).toFixed(1) + "px");
    next.classList.add("is-visible");
    prev.classList.remove("is-visible");
    currentLayer += 1;
  }

  function cycleTip() {
    tipIndex = (tipIndex + 1) % TIPS.length;
    tipNode.textContent = TIPS[tipIndex];
  }

  function markProgress() {
    lastProgressAt = Date.now();
  }

  function setStageState(stageCard, status) {
    stageCard.classList.remove("is-active", "is-done", "is-error");
    stageCard.classList.add(status);
  }

  function updateHeartbeat() {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const sinceUpdate = Math.floor((Date.now() - lastProgressAt) / 1000);
    elapsedNode.textContent = formatTime(elapsedSeconds);
    heartbeatNode.textContent = sinceUpdate < 2 ? "just now" : sinceUpdate + "s ago";
    if (sinceUpdate > 20) {
      liveNode.textContent = "Still working. No fresh progress for " + sinceUpdate + " seconds.";
    }
  }

  function updateEstimate() {
    const elapsedSeconds = Math.max(1, (Date.now() - startTime) / 1000);
    if (progressState.downloadBytes > 0 && progressState.downloadBytes < TOTAL_BYTES) {
      const speed = progressState.downloadBytes / elapsedSeconds;
      const remaining = Math.max(0, TOTAL_BYTES - progressState.downloadBytes);
      const estimate = remaining / Math.max(speed, 1);
      etaNode.textContent = "~" + formatTime(estimate);
      noteNode.textContent = "Current split-file speed: " + humanSize(speed) + "/s";
      return;
    }
    if (progressState.downloadBytes >= TOTAL_BYTES && progressState.assembleParts < PART_COUNT) {
      const fraction = progressState.assembleParts / Math.max(PART_COUNT, 1);
      const estimatedTotal = 25 + PART_COUNT * 0.08;
      const estimate = Math.max(0, estimatedTotal * (1 - fraction));
      etaNode.textContent = "~" + formatTime(estimate);
      noteNode.textContent = "ISO rebuild can look stuck even when it is still working because the browser is stitching 226 parts in memory.";
      return;
    }
    if (progressState.assembleParts >= PART_COUNT && !progressState.inputReady) {
      etaNode.textContent = "Waiting";
      noteNode.textContent = "The loader is waiting for the emulator to expose its file input.";
      return;
    }
    etaNode.textContent = "Almost done";
  }

  function setOverallProgress(fraction, statusText, liveText) {
    overallProgress = Math.max(overallProgress, Math.min(fraction, 1));
    barNode.style.width = (overallProgress * 100).toFixed(1) + "%";
    percentNode.textContent = Math.round(overallProgress * 100) + "%";
    statusNode.textContent = statusText;
    liveNode.textContent = liveText;
    markProgress();
    updateEstimate();
  }

  function setDownloadProgress(bytesLoaded, currentPart) {
    progressState.downloadBytes = bytesLoaded;
    setStageState(stageDownload, "is-active");
    stageDownloadBar.style.width = ((bytesLoaded / TOTAL_BYTES) * 100).toFixed(2) + "%";
    stageDownloadText.textContent = currentPart + " / " + PART_COUNT;
    sizeNode.textContent = humanSize(bytesLoaded) + " / " + humanSize(TOTAL_BYTES);
    setOverallProgress(
      (bytesLoaded / TOTAL_BYTES) * 0.78,
      "Downloading split file " + currentPart + " of " + PART_COUNT + "...",
      "Fetching local split files and tracking byte progress."
    );
  }

  function setAssemblyProgress(partsDone) {
    progressState.assembleParts = partsDone;
    setStageState(stageDownload, "is-done");
    setStageState(stageAssemble, "is-active");
    stageDownloadBar.style.width = "100%";
    stageDownloadText.textContent = "Completed";
    stageAssembleBar.style.width = ((partsDone / PART_COUNT) * 100).toFixed(2) + "%";
    stageAssembleText.textContent = partsDone + " / " + PART_COUNT;
    sizeNode.textContent = partsDone + " / " + PART_COUNT + " parts combined";
    setOverallProgress(
      0.78 + (partsDone / PART_COUNT) * 0.17,
      "Rebuilding the ISO from 226 split files...",
      "Still working. Browser memory assembly is the slowest-looking part."
    );
  }

  function setEmulatorProgress(statusText, fraction, detailText) {
    setStageState(stageDownload, "is-done");
    setStageState(stageAssemble, "is-done");
    setStageState(stageEmulator, "is-active");
    stageAssembleBar.style.width = "100%";
    stageAssembleText.textContent = "Completed";
    stageEmulatorBar.style.width = (fraction * 100).toFixed(0) + "%";
    stageEmulatorText.textContent = detailText;
    sizeNode.textContent = detailText;
    setOverallProgress(0.95 + fraction * 0.05, statusText, "Loader is waiting on the emulator, not frozen.");
  }

  function setErrorState(message, note) {
    setStageState(stageEmulator, "is-error");
    statusNode.textContent = message;
    liveNode.textContent = note || "The loader stopped.";
    noteNode.textContent = note || "";
    etaNode.textContent = "Blocked";
  }

  function partName(index) {
    return SPLIT_PREFIX + String(index).padStart(3, "0");
  }

  function injectBundle() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "main.fb6e8aea.js";
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load emulator bundle."));
      document.body.appendChild(script);
    });
  }

  async function fetchPart(index, onProgress) {
    const response = await fetch(partName(index));
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
      onProgress(loaded, total);
    }
    onProgress(total, total);
    return new Blob(chunks, { type: "application/octet-stream" });
  }

  function animateAssembly(partBlobs) {
    return new Promise((resolve) => {
      const assembled = [];
      let index = 0;
      function step() {
        const chunkSize = 2;
        const nextIndex = Math.min(index + chunkSize, partBlobs.length);
        for (; index < nextIndex; index += 1) {
          assembled.push(partBlobs[index]);
        }
        setAssemblyProgress(assembled.length);
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
      const check = setInterval(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
          clearInterval(check);
          progressState.inputReady = true;
          resolve(input);
          return;
        }
        const seconds = Math.floor((Date.now() - started) / 1000);
        setEmulatorProgress("Waiting for emulator boot...", 0.5, seconds + "s waiting for file input");
        if (seconds > 12 && !window.crossOriginIsolated) {
          clearInterval(check);
          reject(new Error("This host cannot start the emulator because it is missing cross-origin isolation headers."));
        }
      }, 250);
    });
  }

  function environmentBlocker() {
    if (window.crossOriginIsolated) return null;
    return [
      "This host cannot run this Play! build.",
      "Reason: the emulator uses shared WebAssembly memory and requires Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers.",
      "GitHub Pages does not provide those headers, so it will fail even if the loader finishes rebuilding the ISO.",
      "Use the included local server or host somewhere that lets you set COOP and COEP headers."
    ].join(" ");
  }

  async function autoload() {
    try {
      const blocker = environmentBlocker();
      if (blocker) {
        setErrorState("Host blocked", blocker);
        return;
      }

      const bundlePromise = injectBundle();
      const partBlobs = [];
      let totalLoaded = 0;
      setDownloadProgress(0, 0);

      for (let index = 1; index <= PART_COUNT; index += 1) {
        let currentPartLoaded = 0;
        const blob = await fetchPart(index, (loaded) => {
          totalLoaded += loaded - currentPartLoaded;
          currentPartLoaded = loaded;
          setDownloadProgress(totalLoaded, index);
        });
        partBlobs.push(blob);
      }

      const file = await animateAssembly(partBlobs);
      await bundlePromise;
      setEmulatorProgress("Emulator bundle loaded. Waiting for file input...", 0.72, "Bundle ready");
      const input = await waitForInput();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      setStageState(stageEmulator, "is-done");
      stageEmulatorBar.style.width = "100%";
      stageEmulatorText.textContent = "Disc image injected";
      setOverallProgress(1, "Launching San Andreas...", "All stages complete. Starting game.");
      etaNode.textContent = "Done";
      setTimeout(() => {
        loaderRoot.style.transition = "opacity 0.5s ease";
        loaderRoot.style.opacity = "0";
        setTimeout(() => loaderRoot.remove(), 550);
      }, 600);
    } catch (error) {
      setErrorState(error.message, "If this is on GitHub Pages, the emulator itself is blocked by missing headers.");
      console.error(error);
    }
  }

  function resetRun() {
    game.score = 0;
    game.targetLane = 1;
    game.obstacles.length = 0;
    game.pickups.length = 0;
    game.nextObstacle = 1.9;
    game.nextPickup = 2.6;
  }

  function laneCenter(lane) {
    return lane * game.laneWidth + game.laneWidth / 2;
  }

  function spawnObstacle() {
    game.obstacles.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -36,
      speed: 85 + Math.random() * 35,
      width: 48,
      height: 30
    });
  }

  function spawnPickup() {
    game.pickups.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -20,
      speed: 70 + Math.random() * 20,
      size: 16
    });
  }

  function updateGame(delta) {
    if (gamePaused || gameCollapsed) return;
    game.roadOffset = (game.roadOffset + delta * 120) % 44;
    game.playerX += (laneCenter(game.targetLane) - game.playerX) * Math.min(delta * 8, 1);
    game.score += delta * 6;
    gameScoreNode.textContent = "Score: " + Math.floor(game.score);
    gameBestNode.textContent = "Best: " + game.best;

    game.nextObstacle -= delta;
    game.nextPickup -= delta;
    if (game.nextObstacle <= 0) {
      spawnObstacle();
      game.nextObstacle = 1.1 + Math.random() * 0.8;
    }
    if (game.nextPickup <= 0) {
      spawnPickup();
      game.nextPickup = 2.1 + Math.random() * 1.4;
    }

    game.obstacles.forEach((item) => {
      item.y += item.speed * delta;
    });
    game.pickups.forEach((item) => {
      item.y += item.speed * delta;
    });

    const playerBox = { x: game.playerX - 20, y: 138, width: 40, height: 34 };
    game.obstacles = game.obstacles.filter((item) => {
      if (item.y > gameCanvas.height + 40) return false;
      const box = { x: laneCenter(item.lane) - item.width / 2, y: item.y, width: item.width, height: item.height };
      const hit = playerBox.x < box.x + box.width &&
        playerBox.x + playerBox.width > box.x &&
        playerBox.y < box.y + box.height &&
        playerBox.y + playerBox.height > box.y;
      if (hit) {
        game.best = Math.max(game.best, Math.floor(game.score));
        gameBestNode.textContent = "Best: " + game.best;
        resetRun();
        return false;
      }
      return true;
    });

    game.pickups = game.pickups.filter((item) => {
      if (item.y > gameCanvas.height + 30) return false;
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

  function drawRoundedRect(x, y, width, height, radius, fillStyle) {
    gameContext.fillStyle = fillStyle;
    gameContext.beginPath();
    gameContext.moveTo(x + radius, y);
    gameContext.arcTo(x + width, y, x + width, y + height, radius);
    gameContext.arcTo(x + width, y + height, x, y + height, radius);
    gameContext.arcTo(x, y + height, x, y, radius);
    gameContext.arcTo(x, y, x + width, y, radius);
    gameContext.closePath();
    gameContext.fill();
  }

  function drawGame() {
    gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    const sky = gameContext.createLinearGradient(0, 0, 0, gameCanvas.height);
    sky.addColorStop(0, "#f7be7e");
    sky.addColorStop(0.5, "#cb6b3f");
    sky.addColorStop(1, "#181818");
    gameContext.fillStyle = sky;
    gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameContext.fillStyle = "rgba(22, 22, 22, 0.9)";
    gameContext.fillRect(54, 0, gameCanvas.width - 108, gameCanvas.height);

    gameContext.strokeStyle = "rgba(255, 230, 170, 0.72)";
    gameContext.lineWidth = 3;
    for (let lane = 1; lane < game.laneCount; lane += 1) {
      const x = lane * game.laneWidth;
      for (let y = -44 + game.roadOffset; y < gameCanvas.height + 44; y += 44) {
        gameContext.beginPath();
        gameContext.moveTo(x, y);
        gameContext.lineTo(x, y + 22);
        gameContext.stroke();
      }
    }

    game.obstacles.forEach((item) => {
      const x = laneCenter(item.lane) - item.width / 2;
      drawRoundedRect(x, item.y, item.width, item.height, 7, "#4370ff");
      drawRoundedRect(x + 5, item.y + 5, item.width - 10, item.height - 10, 5, "#d9e4ff");
    });

    game.pickups.forEach((item) => {
      const x = laneCenter(item.lane);
      gameContext.fillStyle = "#71f06b";
      gameContext.beginPath();
      gameContext.arc(x, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
      gameContext.fill();
      gameContext.fillStyle = "#163a11";
      gameContext.font = "bold 11px Trebuchet MS";
      gameContext.textAlign = "center";
      gameContext.fillText("$", x, item.y + 12);
    });

    const playerX = game.playerX - 20;
    drawRoundedRect(playerX, 138, 40, 34, 8, "#16c783");
    drawRoundedRect(playerX + 8, 143, 24, 10, 4, "#0d372b");
    drawRoundedRect(playerX + 7, 156, 26, 9, 4, "#ffdd8e");
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
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      game.targetLane = Math.max(0, game.targetLane - 1);
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      game.targetLane = Math.min(game.laneCount - 1, game.targetLane + 1);
    }
  }

  gamePauseButton.addEventListener("click", () => {
    gamePaused = !gamePaused;
    gamePauseButton.textContent = gamePaused ? "Resume" : "Pause";
  });

  gameCollapseButton.addEventListener("click", () => {
    gameCollapsed = !gameCollapsed;
    gameSide.classList.toggle("is-collapsed", gameCollapsed);
    gameCollapseButton.textContent = gameCollapsed ? "Expand" : "Collapse";
  });

  loaderRoot.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    backgrounds.forEach((bg, index) => {
      const factor = index === currentLayer % 2 ? 12 : 8;
      bg.style.setProperty("--pan-x", (x * factor).toFixed(1) + "px");
      bg.style.setProperty("--pan-y", (y * factor).toFixed(1) + "px");
    });
  });

  window.addEventListener("keydown", handleKey);
  resetRun();
  setDownloadProgress(0, 0);
  swapBackground(true);
  cycleTip();
  setInterval(() => swapBackground(false), 8500);
  setInterval(cycleTip, 8000);
  heartbeatTimer = setInterval(updateHeartbeat, 1000);
  rafId = requestAnimationFrame(tickGame);
  autoload().finally(() => {
    if (!loaderRoot.isConnected && rafId) cancelAnimationFrame(rafId);
    if (!loaderRoot.isConnected && heartbeatTimer) clearInterval(heartbeatTimer);
  });
})();
