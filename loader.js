(function () {
  const ISO_URL = "https://pixeldrain.com/api/file/yvkLKSJJ";
  const IMAGE_POOL = [
    "Assets/1_PBLWZdNHuEnq3SNVW0wEPg.jpg",
    "Assets/28-3840x2160-desktop-4k-grand-theft-auto-san-andreas-wallpaper.jpg",
    "Assets/d62lnnm-38c3b8d1-d801-4d6a-9156-114bef8da896.png",
    "Assets/grand-theft-auto-san-andreas-pc-mac-game-steam-cover.jpg",
    "Assets/grand-theft-auto-san-andreas-review-image-1024x587.jpg",
    "Assets/GTASABOX.jpg",
    "Assets/HD-wallpaper-grand-theft-auto-san-andreas-katie-zhan-san-fierro-v01-loading-screen-girlfriend-san-andreas-china-chow-nursefor3yearsnow-girl-large-2560x1440-katie-blue-grand-theft-auto-games.jpg",
    "Assets/maxresdefault.jpg",
    "Assets/thumb-1920-85444.jpg",
    "Assets/unnamed.webp"
  ];
  const TIPS = [
    "Click the loading card to shuffle the art and loading message.",
    "This build streams the disc image from Pixeldrain, so the first load can take a bit.",
    "Move your mouse around. The background drifts a little like a GTA loading screen.",
    "The ISO gets injected automatically once the emulator exposes its file input.",
    "Big game, big disc image, better loading screen."
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
    '    <div class="loader-title">San Andreas</div>',
    '    <div class="loader-status" id="loader-status">Connecting to remote ISO...</div>',
    '    <div class="loader-progress"><div class="loader-track"><div class="loader-bar" id="loader-bar"></div></div></div>',
    '    <div class="loader-meta"><span id="loader-percent">0%</span><span id="loader-size">Waiting for stream</span></div>',
    '    <div class="loader-tip" id="loader-tip"></div>',
    '    <div class="loader-interact">Click card to shuffle artwork</div>',
    "  </div>",
    "</div>"
  ].join("");

  const backgrounds = Array.from(loaderRoot.querySelectorAll(".loader-bg"));
  const card = loaderRoot.querySelector(".loader-card");
  const statusNode = document.getElementById("loader-status");
  const barNode = document.getElementById("loader-bar");
  const percentNode = document.getElementById("loader-percent");
  const sizeNode = document.getElementById("loader-size");
  const tipNode = document.getElementById("loader-tip");

  let currentLayer = 0;
  let currentImage = "";
  let recentImages = [];
  let tipIndex = Math.floor(Math.random() * TIPS.length);

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

  function pulseCard() {
    card.classList.remove("is-pulse");
    void card.offsetWidth;
    card.classList.add("is-pulse");
  }

  function humanSize(bytes) {
    if (!bytes || bytes < 1) return "Streaming";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return value.toFixed(unitIndex > 1 ? 1 : 0) + " " + units[unitIndex];
  }

  function setProgress(loaded, total, text) {
    const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((loaded / total) * 100))) : 0;
    barNode.style.width = pct + "%";
    percentNode.textContent = pct + "%";
    sizeNode.textContent = total > 0 ? humanSize(loaded) + " / " + humanSize(total) : humanSize(loaded);
    statusNode.textContent = text;
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
      setProgress(0, 0, "Downloading GTA San Andreas from Pixeldrain...");
      const response = await fetch(ISO_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch remote ISO (" + response.status + ")");
      }

      const total = parseInt(response.headers.get("content-length") || "0", 10);
      const chunks = [];
      let loaded = 0;
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        setProgress(loaded, total, "Downloading GTA San Andreas from Pixeldrain...");
      }

      setProgress(total || loaded, total || loaded, "Preparing disc image...");
      const blob = new Blob(chunks, { type: "application/octet-stream" });
      const file = new File([blob], "gtasan.ISO", { type: "application/octet-stream" });

      statusNode.textContent = "Waiting for emulator boot...";
      sizeNode.textContent = "ISO ready";
      barNode.style.width = "100%";
      percentNode.textContent = "100%";

      const input = await waitForInput();
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));

      statusNode.textContent = "Launching San Andreas...";
      setTimeout(() => {
        loaderRoot.style.transition = "opacity 0.5s ease";
        loaderRoot.style.opacity = "0";
        setTimeout(() => loaderRoot.remove(), 550);
      }, 450);
    } catch (error) {
      statusNode.textContent = error.message;
      sizeNode.textContent = "Remote ISO unavailable";
      console.error(error);
    }
  }

  loaderRoot.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth) - 0.5;
    const y = (event.clientY / window.innerHeight) - 0.5;
    backgrounds.forEach((bg, index) => {
      const factor = index === currentLayer % 2 ? 18 : 12;
      bg.style.setProperty("--pan-x", (x * factor).toFixed(1) + "px");
      bg.style.setProperty("--pan-y", (y * factor).toFixed(1) + "px");
    });
  });

  card.addEventListener("click", () => {
    pulseCard();
    cycleTip();
    swapBackground(true);
  });

  swapBackground(true);
  cycleTip();
  setInterval(() => swapBackground(false), 7000);
  setInterval(cycleTip, 6500);
  autoload();
})();
