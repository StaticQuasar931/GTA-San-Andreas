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
    "Split files are loaded in order, then stitched into one ISO for the emulator.",
    "Use Left and Right to dodge traffic while San Andreas finishes loading.",
    "Click Shuffle Art if you want a different loading-screen vibe.",
    "The loader tracks download, assembly, and emulator handoff separately.",
    "If the game takes a minute, at least the road is still moving."
  ];

  const loaderRoot = document.getElementById("loader-root");
  if (!loaderRoot) return;

  loaderRoot.innerHTML = [
    '<div class="loader-bg" data-layer="a"></div>',
    '<div class="loader-bg" data-layer="b"></div>',
    '<div class="loader-vignette"></div>',
    '<div class="loader-noise"></div>',
    '<div class="loader-shade"></div>',
    '<div class="loader-ui">',
    '  <div class="loader-card">',
    '    <div class="loader-kicker">Play!.js Local Build</div>',
    '    <div class="loader-header">',
    '      <div>',
    '        <div class="loader-title">San Andreas</div>',
    '        <div class="loader-status" id="loader-status">Scanning split files...</div>',
    "      </div>",
    '      <button class="loader-shuffle" id="loader-shuffle" type="button">Shuffle Art</button>',
    "    </div>",
    '    <div class="loader-progress">',
    '      <div class="loader-track"><div class="loader-bar" id="loader-bar"></div></div>',
    '    </div>',
    '    <div class="loader-meta"><span id="loader-percent">0%</span><span id="loader-size">Waiting</span></div>',
    '    <div class="loader-stage" id="loader-stage">Stage: Preparing loader</div>',
    '    <div class="loader-tip" id="loader-tip"></div>',
    '    <div class="loader-game">',
    '      <div class="loader-game-head"><span>Highway Hustle</span><span id="game-score">Score: 0</span></div>',
    '      <canvas class="loader-game-canvas" id="game-canvas" width="360" height="180" aria-label="Loading mini-game"></canvas>',
    '      <div class="loader-game-help">Left/Right or A/D to dodge traffic. Collect cash. Crash resets your run.</div>',
    "    </div>",
    "  </div>",
    "</div>"
  ].join("");

  const backgrounds = Array.from(loaderRoot.querySelectorAll(".loader-bg"));
  const statusNode = document.getElementById("loader-status");
  const barNode = document.getElementById("loader-bar");
  const percentNode = document.getElementById("loader-percent");
  const sizeNode = document.getElementById("loader-size");
  const stageNode = document.getElementById("loader-stage");
  const tipNode = document.getElementById("loader-tip");
  const shuffleButton = document.getElementById("loader-shuffle");
  const gameCanvas = document.getElementById("game-canvas");
  const gameScoreNode = document.getElementById("game-score");
  const gameContext = gameCanvas.getContext("2d");

  let currentLayer = 0;
  let currentImage = "";
  let recentImages = [];
  let tipIndex = Math.floor(Math.random() * TIPS.length);
  let displayedProgress = 0;
  let rafId = 0;

  const game = {
    laneCount: 3,
    laneWidth: gameCanvas.width / 3,
    playerLane: 1,
    playerTargetLane: 1,
    playerX: gameCanvas.width / 2,
    roadOffset: 0,
    score: 0,
    highScore: 0,
    pickups: [],
    obstacles: [],
    nextSpawn: 0,
    nextPickup: 0,
    lastTime: 0
  };

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
    next.style.setProperty("--pan-x", force ? "0px" : ((Math.random() * 24) - 12).toFixed(1) + "px");
    next.style.setProperty("--pan-y", force ? "0px" : ((Math.random() * 18) - 9).toFixed(1) + "px");
    next.classList.add("is-visible");
    prev.classList.remove("is-visible");
    currentLayer += 1;
  }

  function cycleTip() {
    tipIndex = (tipIndex + 1) % TIPS.length;
    tipNode.textContent = TIPS[tipIndex];
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

  function setProgress(actualFraction, statusText, sizeText, stageText) {
    displayedProgress = Math.max(displayedProgress, Math.min(actualFraction, 1));
    barNode.style.width = (displayedProgress * 100).toFixed(1) + "%";
    percentNode.textContent = Math.round(displayedProgress * 100) + "%";
    statusNode.textContent = statusText;
    sizeNode.textContent = sizeText;
    stageNode.textContent = stageText;
  }

  function partName(index) {
    return SPLIT_PREFIX + String(index).padStart(3, "0");
  }

  async function fetchPart(index, onProgress) {
    const response = await fetch(partName(index));
    if (!response.ok) {
      throw new Error("Missing split file " + String(index).padStart(3, "0") + " (" + response.status + ")");
    }

    const expectedLength = index === PART_COUNT ? LAST_PART_SIZE : PART_SIZE;
    const contentLength = parseInt(response.headers.get("content-length") || "0", 10) || expectedLength;
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress(loaded, contentLength);
    }

    onProgress(contentLength, contentLength);
    return new Blob(chunks, { type: "application/octet-stream" });
  }

  function animateAssembly(partBlobs) {
    return new Promise((resolve) => {
      const assembled = [];
      let index = 0;

      function step() {
        const chunkSize = 4;
        const nextIndex = Math.min(index + chunkSize, partBlobs.length);
        for (; index < nextIndex; index += 1) {
          assembled.push(partBlobs[index]);
        }
        const fraction = assembled.length / partBlobs.length;
        setProgress(
          0.92 + fraction * 0.06,
          "Assembling split files into one disc image...",
          assembled.length + " / " + partBlobs.length + " parts combined",
          "Stage: Rebuilding ISO"
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
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) {
          clearInterval(check);
          resolve(input);
        }
      }, 100);
    });
  }

  async function autoload() {
    try {
      const partBlobs = [];
      let totalLoaded = 0;

      setProgress(0.01, "Opening local split files...", "0 / " + humanSize(TOTAL_BYTES), "Stage: Downloading split files");

      for (let index = 1; index <= PART_COUNT; index += 1) {
        let partLoaded = 0;
        const blob = await fetchPart(index, (loaded) => {
          const currentTotal = totalLoaded - partLoaded + loaded;
          partLoaded = loaded;
          const fraction = currentTotal / TOTAL_BYTES;
          setProgress(
            fraction * 0.92,
            "Loading split file " + index + " of " + PART_COUNT + "...",
            humanSize(currentTotal) + " / " + humanSize(TOTAL_BYTES),
            "Stage: Downloading split files"
          );
        });
        totalLoaded += partLoaded;
        partBlobs.push(blob);
      }

      const file = await animateAssembly(partBlobs);

      setProgress(0.985, "Waiting for emulator boot...", "ISO rebuilt locally", "Stage: Handing disc image to emulator");
      const input = await waitForInput();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));

      setProgress(1, "Launching San Andreas...", "Disc image injected", "Stage: Starting game");
      setTimeout(() => {
        loaderRoot.style.transition = "opacity 0.5s ease";
        loaderRoot.style.opacity = "0";
        setTimeout(() => loaderRoot.remove(), 550);
      }, 500);
    } catch (error) {
      statusNode.textContent = error.message;
      sizeNode.textContent = "Loader stopped";
      stageNode.textContent = "Stage: Error";
      console.error(error);
    }
  }

  function resetRun() {
    game.score = 0;
    game.playerLane = 1;
    game.playerTargetLane = 1;
    game.obstacles.length = 0;
    game.pickups.length = 0;
    game.nextSpawn = 0.6;
    game.nextPickup = 1.2;
  }

  function spawnObstacle() {
    const openLane = Math.floor(Math.random() * game.laneCount);
    for (let lane = 0; lane < game.laneCount; lane += 1) {
      if (lane === openLane) continue;
      game.obstacles.push({ lane, y: -40, speed: 150 + Math.random() * 90, width: 52, height: 34 });
    }
  }

  function spawnPickup() {
    game.pickups.push({
      lane: Math.floor(Math.random() * game.laneCount),
      y: -22,
      speed: 120 + Math.random() * 50,
      size: 18
    });
  }

  function laneCenter(lane) {
    return lane * game.laneWidth + game.laneWidth / 2;
  }

  function updateGame(delta) {
    game.roadOffset = (game.roadOffset + delta * 220) % 40;
    game.playerX += (laneCenter(game.playerTargetLane) - game.playerX) * Math.min(delta * 12, 1);
    game.score += delta * 12;
    gameScoreNode.textContent = "Score: " + Math.floor(game.score);

    game.nextSpawn -= delta;
    game.nextPickup -= delta;
    if (game.nextSpawn <= 0) {
      spawnObstacle();
      game.nextSpawn = Math.max(0.45, 1.1 - game.score / 120);
    }
    if (game.nextPickup <= 0) {
      spawnPickup();
      game.nextPickup = 1.6 + Math.random() * 1.1;
    }

    game.obstacles.forEach((item) => {
      item.y += item.speed * delta;
    });
    game.pickups.forEach((item) => {
      item.y += item.speed * delta;
    });

    const playerBox = { x: game.playerX - 18, y: 130, width: 36, height: 38 };
    game.obstacles = game.obstacles.filter((item) => {
      if (item.y > gameCanvas.height + 50) return false;
      const box = { x: laneCenter(item.lane) - item.width / 2, y: item.y, width: item.width, height: item.height };
      const hit = playerBox.x < box.x + box.width &&
        playerBox.x + playerBox.width > box.x &&
        playerBox.y < box.y + box.height &&
        playerBox.y + playerBox.height > box.y;
      if (hit) {
        game.highScore = Math.max(game.highScore, Math.floor(game.score));
        resetRun();
        return false;
      }
      return true;
    });

    game.pickups = game.pickups.filter((item) => {
      if (item.y > gameCanvas.height + 30) return false;
      const size = item.size;
      const box = { x: laneCenter(item.lane) - size / 2, y: item.y, width: size, height: size };
      const hit = playerBox.x < box.x + box.width &&
        playerBox.x + playerBox.width > box.x &&
        playerBox.y < box.y + box.height &&
        playerBox.y + playerBox.height > box.y;
      if (hit) {
        game.score += 18;
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

    const gradient = gameContext.createLinearGradient(0, 0, 0, gameCanvas.height);
    gradient.addColorStop(0, "#ffb66d");
    gradient.addColorStop(0.44, "#a94d32");
    gradient.addColorStop(1, "#161616");
    gameContext.fillStyle = gradient;
    gameContext.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameContext.fillStyle = "rgba(20, 20, 20, 0.86)";
    gameContext.fillRect(60, 0, gameCanvas.width - 120, gameCanvas.height);

    gameContext.strokeStyle = "rgba(255, 228, 167, 0.68)";
    gameContext.lineWidth = 3;
    for (let lane = 1; lane < game.laneCount; lane += 1) {
      const x = lane * game.laneWidth;
      for (let y = -40 + game.roadOffset; y < gameCanvas.height + 40; y += 40) {
        gameContext.beginPath();
        gameContext.moveTo(x, y);
        gameContext.lineTo(x, y + 20);
        gameContext.stroke();
      }
    }

    game.obstacles.forEach((item) => {
      const x = laneCenter(item.lane) - item.width / 2;
      drawRoundedRect(x, item.y, item.width, item.height, 6, "#385dff");
      drawRoundedRect(x + 6, item.y + 6, item.width - 12, item.height - 12, 4, "#dce7ff");
    });

    game.pickups.forEach((item) => {
      const x = laneCenter(item.lane);
      gameContext.fillStyle = "#7ae657";
      gameContext.beginPath();
      gameContext.arc(x, item.y + item.size / 2, item.size / 2, 0, Math.PI * 2);
      gameContext.fill();
      gameContext.fillStyle = "#183f11";
      gameContext.font = "bold 12px Trebuchet MS";
      gameContext.textAlign = "center";
      gameContext.fillText("$", x, item.y + 13);
    });

    const playerX = game.playerX - 19;
    drawRoundedRect(playerX, 130, 38, 38, 7, "#16d18d");
    drawRoundedRect(playerX + 7, 136, 24, 14, 4, "#0e3b2e");
    drawRoundedRect(playerX + 7, 152, 24, 10, 4, "#ffde8b");

    gameContext.fillStyle = "rgba(255, 244, 204, 0.82)";
    gameContext.font = "12px Trebuchet MS";
    gameContext.textAlign = "left";
    gameContext.fillText("High: " + game.highScore, 8, 16);
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
      game.playerTargetLane = Math.max(0, game.playerTargetLane - 1);
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      game.playerTargetLane = Math.min(game.laneCount - 1, game.playerTargetLane + 1);
    }
  }

  loaderRoot.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    backgrounds.forEach((bg, index) => {
      const factor = index === currentLayer % 2 ? 18 : 12;
      bg.style.setProperty("--pan-x", (x * factor).toFixed(1) + "px");
      bg.style.setProperty("--pan-y", (y * factor).toFixed(1) + "px");
    });
  });

  shuffleButton.addEventListener("click", () => {
    cycleTip();
    swapBackground(true);
  });

  window.addEventListener("keydown", handleKey);
  resetRun();
  swapBackground(true);
  cycleTip();
  setInterval(() => swapBackground(false), 7000);
  setInterval(cycleTip, 6500);
  rafId = requestAnimationFrame(tickGame);
  autoload().finally(() => {
    if (!loaderRoot.isConnected && rafId) cancelAnimationFrame(rafId);
  });
})();
