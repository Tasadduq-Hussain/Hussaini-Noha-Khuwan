const SUPABASE_URL =
  "https://xxigwjuzfrffgznuajui.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_DCnF_aVt833TFuGDHwtU8Q_cm17-dZn";

let sb = null;
let nohas = [];
let activeCategory = "All";
let deferredInstallPrompt = null;

let favorites = JSON.parse(
  localStorage.getItem("hussainiFavorites") || "[]"
);

let viewerIndex = 0;
let viewerZoom = 1;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let panX = 0;
let panY = 0;
let lastTapTime = 0;
let touchStartX = 0;
let touchStartY = 0;

const $ = (selector) => document.querySelector(selector);


/* =========================================================
   BASIC HELPERS
========================================================= */

function esc(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m])
  );
}


/* =========================================================
   SUPABASE
========================================================= */

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}


async function loadNohaData() {
  try {
    await loadSupabase();

    sb = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    const { data, error } = await sb
      .from("nohas")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    nohas = data || [];

    localStorage.setItem(
      "hussainiNohaCache",
      JSON.stringify(nohas)
    );

    renderAll();

  } catch (error) {

    console.error("Supabase error:", error);

    const cached =
      localStorage.getItem("hussainiNohaCache");

    if (cached) {
      try {

        nohas = JSON.parse(cached);

        renderAll();

      } catch {

        showEmpty(
          "featuredGrid",
          "Noha data could not be loaded."
        );

      }

    } else {

      showEmpty(
        "featuredGrid",
        "Noha data could not be loaded."
      );

    }
  }
}


/* =========================================================
   CATEGORIES
========================================================= */

function getCategories() {
  return [
    "All",
    "Muharram",
    "Ayyam-e-Ali",
    "Ayyam-e-Fatmiya",
    "Other"
  ];
}


window.setCategory = function (category) {

  activeCategory = category;

  renderAll();

  document
    .getElementById("featured")
    ?.scrollIntoView({
      behavior: "smooth"
    });
};


function renderFilters() {

  const container = $("#filters");

  if (!container) return;

  container.innerHTML =
    getCategories()
      .map(
        (category) => `
        <button
          class="${activeCategory === category ? "active" : ""}"
          onclick="setCategory('${esc(category)}')">
          ${esc(category)}
        </button>
      `
      )
      .join("");
}


/* =========================================================
   FILTER / SEARCH
========================================================= */

function filteredNohay() {

  let result = [...nohas];

  if (activeCategory !== "All") {

    result = result.filter(
      (n) =>
        String(n.category || "Other")
          .toLowerCase() ===
        activeCategory.toLowerCase()
    );
  }

  const input = $("#searchInput");

  const query = input
    ? input.value.trim().toLowerCase()
    : "";

  if (query) {

    result = result.filter((n) => {

      const title =
        String(n.title || "").toLowerCase();

      const keywords =
        String(n.keywords || "").toLowerCase();

      const category =
        String(n.category || "").toLowerCase();

      return (
        title.includes(query) ||
        keywords.includes(query) ||
        category.includes(query)
      );
    });
  }

  return result;
}


function renderAll() {

  renderFilters();

  renderFeatured();

  renderRecent();

  renderCategories();

  renderFavorites();
}


/* =========================================================
   FEATURED
========================================================= */

function renderFeatured() {

  const container = $("#featuredGrid");

  if (!container) return;

  const items =
    filteredNohay().slice(0, 6);

  if (!items.length) {

    showEmpty(
      "featuredGrid",
      "No Nohay found."
    );

    return;
  }

  container.innerHTML =
    items.map(nohaCard).join("");
}


/* =========================================================
   NOHA CARD
========================================================= */

function nohaCard(noha) {

  const liked =
    isFavorite(noha.id);

  const image =
    noha.image_url || "logo.png";

  return `
    <article
      class="noha-card"
      onclick="openNohaById('${esc(noha.id)}')">

      <div class="card-image">

        <img
          src="${esc(image)}"
          alt="${esc(noha.title)}"
          loading="lazy">

        <button
          class="card-heart ${liked ? "liked" : ""}"
          onclick="
            event.stopPropagation();
            toggleFavorite('${esc(noha.id)}')
          "
          title="${
            liked
              ? "Remove from favorites"
              : "Add to favorites"
          }">

          ${liked ? "♥" : "♡"}

        </button>

      </div>

      <div class="card-body">

        <div class="card-category">
          ${esc(noha.category || "Other")}
        </div>

        <h3>
          ${esc(noha.title || "Untitled Noha")}
        </h3>

        <span class="read-more">
          Open Noha →
        </span>

      </div>

    </article>
  `;
}


/* =========================================================
   RECENT
========================================================= */

function renderRecent() {

  const container = $("#recentList");

  if (!container) return;

  const items =
    filteredNohay().slice(0, 10);

  if (!items.length) {

    showEmpty(
      "recentList",
      "No recent Nohay found."
    );

    return;
  }

  container.innerHTML =
    items
      .map(
        (noha) => `
        <div
          class="recent-item"
          onclick="openNohaById('${esc(noha.id)}')">

          <img
            src="${esc(
              noha.image_url || "logo.png"
            )}"
            alt=""
            loading="lazy">

          <div>

            <b>
              ${esc(noha.title)}
            </b>

            <small>
              ${esc(noha.category || "Other")}
            </small>

          </div>

          <span>→</span>

        </div>
      `
      )
      .join("");
}


/* =========================================================
   CATEGORY LIST
========================================================= */

function renderCategories() {

  const container =
    $("#categoryList");

  if (!container) return;

  container.innerHTML =
    getCategories()
      .filter((c) => c !== "All")
      .map((category) => {

        const count =
          nohas.filter(
            (n) =>
              String(n.category || "Other")
                .toLowerCase() ===
              category.toLowerCase()
          ).length;

        return `
          <button
            class="category-row"
            onclick="
              setCategory('${esc(category)}')
            ">

            <span>
              ${esc(category)}
            </span>

            <b>
              ${count}
            </b>

          </button>
        `;

      })
      .join("");
}


/* =========================================================
   FAVORITES
========================================================= */

function saveFavorites() {

  localStorage.setItem(
    "hussainiFavorites",
    JSON.stringify(favorites)
  );
}


function isFavorite(id) {

  return favorites.includes(
    String(id)
  );
}


window.toggleFavorite = function (id) {

  id = String(id);

  if (isFavorite(id)) {

    favorites =
      favorites.filter(
        (item) => item !== id
      );

  } else {

    favorites.push(id);
  }

  saveFavorites();

  renderAll();

  const modal = $("#modal");

  if (
    modal &&
    !modal.classList.contains("hidden")
  ) {

    openNohaById(id, false);
  }
};


function renderFavorites() {

  const container =
    $("#favoritesGrid");

  const count =
    $("#favoriteCount");

  if (!container) return;

  const items =
    nohas.filter(
      (n) => isFavorite(n.id)
    );

  if (count) {

    count.textContent =
      `${items.length} saved`;
  }

  if (!items.length) {

    container.innerHTML = `
      <div class="empty-favorites">

        <div class="empty-heart">
          ♡
        </div>

        <h3>
          No Favorites Yet
        </h3>

        <p>
          Tap the heart on any Noha
          to save it here.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML =
    items.map(nohaCard).join("");
}


/* =========================================================
   OPEN NOHA
========================================================= */

window.openNohaById =
function (id, scrollTop = true) {

  const noha =
    nohas.find(
      (n) =>
        String(n.id) === String(id)
    );

  if (!noha) return;

  openNoha(
    noha,
    scrollTop
  );
};


function openNoha(
  noha,
  scrollTop = true
) {

  const modal = $("#modal");

  const content =
    $("#modalContent");

  if (!modal || !content) return;

  const liked =
    isFavorite(noha.id);

  const image =
    noha.image_url || "logo.png";

  content.innerHTML = `

    <div class="detail">

      <div class="detail-top">

        <div>

          <span class="detail-category">
            ${esc(
              noha.category || "Other"
            )}
          </span>

          <h2>
            ${esc(
              noha.title ||
              "Untitled Noha"
            )}
          </h2>

        </div>

        <button
          class="detail-favorite ${
            liked ? "liked" : ""
          }"
          onclick="
            toggleFavorite('${esc(noha.id)}')
          ">

          ${liked ? "♥" : "♡"}

          <span>
            ${liked ? "Saved" : "Save"}
          </span>

        </button>

      </div>


      <div
        class="lyrics-viewer"
        onclick="
          openImageViewer('${esc(noha.id)}')
        ">

        <img
          src="${esc(image)}"
          alt="${esc(noha.title)}">

      </div>


      <div class="detail-actions">

        <button
          class="primary"
          onclick="
            downloadImage(
              '${esc(image)}',
              '${esc(noha.title)}'
            )
          ">

          ↓ Download Image

        </button>


        <button
          class="secondary-action"
          onclick="
            shareNoha('${esc(noha.id)}')
          ">

          ↗ Share

        </button>


        ${
          noha.lyrics
            ? `
              <button
                class="secondary-action"
                onclick="
                  copyLyrics('${esc(noha.id)}')
                ">

                ⧉ Copy Lyrics

              </button>
            `
            : ""
        }

      </div>


      ${
        noha.lyrics
          ? `
            <div class="typed-lyrics">

              <div class="typed-lyrics-title">
                Urdu Lyrics
              </div>

              <div
                class="typed-lyrics-text">

                ${esc(
                  noha.lyrics
                ).replace(
                  /\n/g,
                  "<br>"
                )}

              </div>

            </div>
          `
          : ""
      }

    </div>
  `;

  modal.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );

  if (scrollTop) {

    const box =
      modal.querySelector(
        ".modal-box"
      );

    if (box) {
      box.scrollTop = 0;
    }
  }
}


/* =========================================================
   FULLSCREEN IMAGE VIEWER
========================================================= */

window.openImageViewer =
function (id) {

  const index =
    nohas.findIndex(
      (n) =>
        String(n.id) ===
        String(id)
    );

  if (index === -1) return;

  viewerIndex = index;

  viewerZoom = 1;

  panX = 0;

  panY = 0;

  updateImageViewer();

  const viewer =
    $("#imageViewer");

  if (!viewer) return;

  viewer.classList.remove(
    "hidden"
  );

  document.body.classList.add(
    "modal-open"
  );
};


function updateImageViewer() {

  const noha =
    nohas[viewerIndex];

  if (!noha) return;

  const image =
    $("#fullLyricsImage");

  if (!image) return;

  image.src =
    noha.image_url ||
    "logo.png";

  image.alt =
    noha.title ||
    "Lyrics";

  viewerZoom = 1;

  panX = 0;

  panY = 0;

  updateZoom();
}


function updateZoom() {

  const image =
    $("#fullLyricsImage");

  const level =
    $("#zoomLevel");

  if (!image) return;

  image.style.transform =
    `translate(${panX}px, ${panY}px) scale(${viewerZoom})`;

  if (level) {

    level.textContent =
      `${Math.round(
        viewerZoom * 100
      )}%`;
  }
}


/* =========================================================
   ZOOM BUTTONS
========================================================= */

$("#zoomIn")?.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    viewerZoom =
      Math.min(
        viewerZoom + 0.25,
        3
      );

    updateZoom();
  }
);


$("#zoomOut")?.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    viewerZoom =
      Math.max(
        viewerZoom - 0.25,
        0.5
      );

    if (viewerZoom === 1) {

      panX = 0;
      panY = 0;
    }

    updateZoom();
  }
);


/* =========================================================
   PREVIOUS / NEXT
========================================================= */

$("#prevNoha")?.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    if (!nohas.length) return;

    viewerIndex--;

    if (viewerIndex < 0) {

      viewerIndex =
        nohas.length - 1;
    }

    updateImageViewer();
  }
);


$("#nextNoha")?.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    if (!nohas.length) return;

    viewerIndex++;

    if (
      viewerIndex >=
      nohas.length
    ) {

      viewerIndex = 0;
    }

    updateImageViewer();
  }
);


/* =========================================================
   CLOSE IMAGE VIEWER
========================================================= */

$("#closeImageViewer")
  ?.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      closeImageViewer();
    }
  );


function closeImageViewer() {

  const viewer =
    $("#imageViewer");

  if (!viewer) return;

  viewer.classList.add(
    "hidden"
  );

  viewerZoom = 1;

  panX = 0;

  panY = 0;
}


$("#imageViewer")
  ?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("#imageViewer")
      ) {

        closeImageViewer();
      }
    }
  );


/* =========================================================
   MOUSE DRAG / PAN
========================================================= */

const fullImage =
  $("#fullLyricsImage");


fullImage?.addEventListener(
  "mousedown",
  (event) => {

    if (viewerZoom <= 1) return;

    event.preventDefault();

    isDragging = true;

    dragStartX =
      event.clientX - panX;

    dragStartY =
      event.clientY - panY;
  }
);


document.addEventListener(
  "mousemove",
  (event) => {

    if (!isDragging) return;

    panX =
      event.clientX -
      dragStartX;

    panY =
      event.clientY -
      dragStartY;

    updateZoom();
  }
);


document.addEventListener(
  "mouseup",
  () => {

    isDragging = false;
  }
);


/* =========================================================
   DOUBLE CLICK ZOOM
========================================================= */

fullImage?.addEventListener(
  "dblclick",
  (event) => {

    event.preventDefault();

    if (viewerZoom === 1) {

      viewerZoom = 2;

    } else {

      viewerZoom = 1;

      panX = 0;

      panY = 0;
    }

    updateZoom();
  }
);


/* =========================================================
   MOBILE TOUCH
========================================================= */

fullImage?.addEventListener(
  "touchstart",
  (event) => {

    if (!event.touches.length)
      return;

    const touch =
      event.touches[0];

    touchStartX =
      touch.clientX;

    touchStartY =
      touch.clientY;

    const now =
      Date.now();

    if (
      now - lastTapTime <
      300
    ) {

      if (viewerZoom === 1) {

        viewerZoom = 2;

      } else {

        viewerZoom = 1;

        panX = 0;

        panY = 0;
      }

      updateZoom();
    }

    lastTapTime = now;

    if (viewerZoom > 1) {

      isDragging = true;

      dragStartX =
        touch.clientX - panX;

      dragStartY =
        touch.clientY - panY;
    }
  },
  {
    passive: true
  }
);


fullImage?.addEventListener(
  "touchmove",
  (event) => {

    if (
      !isDragging ||
      viewerZoom <= 1
    ) return;

    const touch =
      event.touches[0];

    panX =
      touch.clientX -
      dragStartX;

    panY =
      touch.clientY -
      dragStartY;

    updateZoom();

    event.preventDefault();

  },
  {
    passive: false
  }
);


fullImage?.addEventListener(
  "touchend",
  (event) => {

    if (!event.changedTouches.length)
      return;

    const touch =
      event.changedTouches[0];

    const deltaX =
      touch.clientX -
      touchStartX;

    const deltaY =
      touch.clientY -
      touchStartY;

    isDragging = false;


    /*
      Swipe only when image
      is not zoomed.
    */

    if (
      viewerZoom === 1 &&
      Math.abs(deltaX) > 70 &&
      Math.abs(deltaX) >
        Math.abs(deltaY)
    ) {

      if (deltaX < 0) {

        $("#nextNoha")?.click();

      } else {

        $("#prevNoha")?.click();
      }
    }

  },
  {
    passive: true
  }
);


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    const viewer =
      $("#imageViewer");

    if (
      viewer &&
      !viewer.classList.contains(
        "hidden"
      )
    ) {

      if (
        event.key ===
        "Escape"
      ) {

        closeImageViewer();
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {

        $("#prevNoha")?.click();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {

        $("#nextNoha")?.click();
      }

      if (
        event.key === "+" ||
        event.key === "="
      ) {

        $("#zoomIn")?.click();
      }

      if (
        event.key === "-"
      ) {

        $("#zoomOut")?.click();
      }

      return;
    }

    if (
      event.key ===
      "Escape"
    ) {

      closeModal();
    }
  }
);


/* =========================================================
   DOWNLOAD IMAGE
========================================================= */

window.downloadImage =
async function (
  imageUrl,
  title
) {

  if (!imageUrl) return;

  try {

    const response =
      await fetch(imageUrl);

    if (!response.ok)
      throw new Error(
        "Download failed"
      );

    const blob =
      await response.blob();

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;

    a.download =
      `${title || "Noha"}-Lyrics.jpg`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

  } catch {

    window.open(
      imageUrl,
      "_blank"
    );
  }
};


/* =========================================================
   SHARE
========================================================= */

window.shareNoha =
async function (id) {

  const noha =
    nohas.find(
      (n) =>
        String(n.id) ===
        String(id)
    );

  if (!noha) return;

  const data = {

    title: noha.title,

    text:
      `Hussaini Noha Khuwan - ${noha.title}`,

    url:
      window.location.href
  };


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        data
      );

    } else {

      await navigator.clipboard
        .writeText(
          window.location.href
        );

      alert(
        "Noha link copied!"
      );
    }

  } catch {

    console.log(
      "Share cancelled"
    );
  }
};


/* =========================================================
   COPY LYRICS
========================================================= */

window.copyLyrics =
async function (id) {

  const noha =
    nohas.find(
      (n) =>
        String(n.id) ===
        String(id)
    );

  if (
    !noha ||
    !noha.lyrics
  ) return;


  try {

    await navigator.clipboard
      .writeText(
        noha.lyrics
      );

    alert(
      "Lyrics copied!"
    );

  } catch {

    alert(
      "Lyrics could not be copied."
    );
  }
};


/* =========================================================
   MAIN MODAL
========================================================= */

$("#closeModal")
  ?.addEventListener(
    "click",
    closeModal
  );


$("#modal")
  ?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("#modal")
      ) {

        closeModal();
      }
    }
  );


function closeModal() {

  $("#modal")
    ?.classList.add(
      "hidden"
    );

  document.body.classList.remove(
    "modal-open"
  );
}


/* =========================================================
   SEARCH
========================================================= */

function search() {

  renderAll();
}


$("#searchBtn")
  ?.addEventListener(
    "click",
    () => {

      search();

      $("#featured")
        ?.scrollIntoView({
          behavior: "smooth"
        });
    }
  );


$("#searchInput")
  ?.addEventListener(
    "input",
    () => {

      search();

      showSuggestions();
    }
  );


/* =========================================================
   LIVE SEARCH SUGGESTIONS
========================================================= */

function showSuggestions() {

  const input =
    $("#searchInput");

  if (!input) return;

  const searchBox =
    input.closest(
      ".searchbox"
    );

  if (!searchBox) return;

  let box =
    searchBox.querySelector(
      ".search-suggestions"
    );


  if (!box) {

    box =
      document.createElement(
        "div"
      );

    box.className =
      "search-suggestions";

    searchBox.appendChild(
      box
    );
  }


  const query =
    input.value
      .trim()
      .toLowerCase();


  if (!query) {

    hideSuggestions();

    return;
  }


  const suggestions =
    nohas
      .filter((noha) => {

        const title =
          String(
            noha.title || ""
          ).toLowerCase();

        const keywords =
          String(
            noha.keywords || ""
          ).toLowerCase();

        const words =
          `${title} ${keywords}`
            .split(
              /[\s,]+/
            )
            .filter(Boolean);

        return words.some(
          (word) =>
            word.startsWith(
              query
            )
        );

      })
      .slice(0, 7);


  if (!suggestions.length) {

    box.innerHTML = `
      <div class="suggestion-empty">
        No matching Nohay found
      </div>
    `;

    box.classList.add(
      "show"
    );

    return;
  }


  box.innerHTML =
    suggestions
      .map(
        (noha) => `

        <div
          class="suggestion-item"
          data-id="${esc(noha.id)}">

          <div class="suggestion-icon">

            <img
              src="${esc(
                noha.image_url ||
                "logo.png"
              )}"
              alt="">

          </div>

          <div class="suggestion-text">

            <div class="suggestion-title">
              ${esc(noha.title)}
            </div>

            <div class="suggestion-category">
              ${esc(
                noha.category ||
                "Other"
              )}
            </div>

          </div>

        </div>

      `
      )
      .join("");


  box
    .querySelectorAll(
      ".suggestion-item"
    )
    .forEach(
      (item) => {

        item.onclick = () => {

          const id =
            item.dataset.id;

          const selected =
            nohas.find(
              (n) =>
                String(n.id) ===
                String(id)
            );

          input.value =
            selected?.title ||
            "";

          hideSuggestions();

          openNohaById(id);
        };
      }
    );


  box.classList.add(
    "show"
  );
}


function hideSuggestions() {

  document
    .querySelectorAll(
      ".search-suggestions"
    )
    .forEach(
      (box) =>
        box.classList.remove(
          "show"
        )
    );
}


document.addEventListener(
  "click",
  (event) => {

    if (
      !event.target.closest(
        ".searchbox"
      )
    ) {

      hideSuggestions();
    }
  }
);


/* =========================================================
   THEME
========================================================= */

const savedTheme =
  localStorage.getItem(
    "hussainiTheme"
  );


if (
  savedTheme ===
  "light"
) {

  document.body.classList.add(
    "light"
  );
}


$("#themeBtn")
  ?.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light"
      );

      localStorage.setItem(
        "hussainiTheme",

        document.body.classList.contains(
          "light"
        )
          ? "light"
          : "dark"
      );
    }
  );


/* =========================================================
   PWA INSTALL
========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  (event) => {

    event.preventDefault();

    deferredInstallPrompt =
      event;

    const button =
      $("#installBtn");

    if (button) {

      button.hidden = false;
    }
  }
);


$("#installBtn")
  ?.addEventListener(
    "click",
    async () => {

      if (
        !deferredInstallPrompt
      ) return;

      deferredInstallPrompt
        .prompt();

      await deferredInstallPrompt
        .userChoice;

      deferredInstallPrompt =
        null;

      $("#installBtn").hidden =
        true;
    }
  );


/* =========================================================
   SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in
  navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(
          (error) =>
            console.log(
              "Service worker:",
              error
            )
        );
    }
  );
}


/* =========================================================
   EMPTY STATE HELPER
========================================================= */

function showEmpty(
  id,
  message
) {

  const container =
    document.getElementById(id);

  if (!container) return;

  container.innerHTML = `
    <div class="empty-favorites">

      <div class="empty-heart">
        ♡
      </div>

      <h3>
        ${esc(message)}
      </h3>

    </div>
  `;
}


/* =========================================================
   START APP
========================================================= */

loadNohaData();