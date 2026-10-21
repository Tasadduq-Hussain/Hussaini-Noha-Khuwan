/* =========================================================
   HUSSAINI NOHA KHUWAN
   PUBLIC APP
   ========================================================= */

const SUPABASE_URL = "https://xxigwjuzfrffgznuajui.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DCnF_aVt833TFuGDHwtU8Q_cm17-dZn";

let supabaseClient = null;
let nohay = [];

const demoNohay = [
  {
    id: "demo1",
    title: "اب مجھے کوئی سکینہ نہیں کہتا بابا",
    reciter: "Hussaini Noha Khuwan",
    category: "Muharram",
    keywords: "ab mujhe koi sakina nahi kehta baba sakina ali akbar",
    image: "",
    lyrics: ""
  },
  {
    id: "demo2",
    title: "علی اکبر علی اکبر",
    reciter: "Hussaini Noha Khuwan",
    category: "Muharram",
    keywords: "ali akbar aliakbar akber",
    image: "",
    lyrics: ""
  },
  {
    id: "demo3",
    title: "واہ میرے لال",
    reciter: "Hussaini Noha Khuwan",
    category: "Muharram",
    keywords: "wah mere lal",
    image: "",
    lyrics: ""
  }
];

const cats = [
  "All",
  "Muharram",
  "Ayyam-e-Ali",
  "Ayyam-e-Fatmiya",
  "Other"
];

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeApp();

});


async function initializeApp() {

  /* Load Supabase library */
  try {

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = async () => {

      try {

        supabaseClient =
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
          );

        await loadNohay();

      } catch (error) {

        console.warn("Supabase initialization failed:", error);

        loadLocalData();

      }

    };

    script.onerror = () => {

      console.warn("Supabase library could not load.");

      loadLocalData();

    };

    document.head.appendChild(script);

  } catch (error) {

    console.warn(error);

    loadLocalData();

  }


  setupSearch();

  setupTheme();

  setupModal();

  setupInstall();

  setupServiceWorker();

}


/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadNohay() {

  loadLocalData();

  if (!supabaseClient) return;

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("nohas")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) throw error;

    nohay = data || [];

    localStorage.setItem(
      "hnk_nohay",
      JSON.stringify(nohay)
    );

    renderAll();

  } catch (error) {

    console.warn(
      "Offline/cache mode:",
      error.message
    );

  }

}


function loadLocalData() {

  try {

    const cached =
      JSON.parse(
        localStorage.getItem("hnk_nohay") || "null"
      );

    if (
      Array.isArray(cached) &&
      cached.length
    ) {

      nohay = cached;

    } else {

      nohay = demoNohay;

    }

  } catch (error) {

    nohay = demoNohay;

  }

  renderAll();

}


/* =========================================================
   FILTERS
   ========================================================= */

function renderFilters() {

  const filters = $("#filters");

  if (!filters) return;

  filters.innerHTML = cats
    .map((category, index) => {

      return `
        <button
          class="filter ${index === 0 ? "active" : ""}"
          data-cat="${escapeHtml(category)}"
          type="button"
        >
          ${escapeHtml(category)}
        </button>
      `;

    })
    .join("");


  document
    .querySelectorAll(".filter")
    .forEach((button) => {

      button.addEventListener("click", () => {

        document
          .querySelectorAll(".filter")
          .forEach((item) => {

            item.classList.remove("active");

          });

        button.classList.add("active");

        const query =
          $("#searchInput")?.value.trim() || "";

        if (query) {

          renderSearchResults(
            button.dataset.cat,
            query
          );

        } else {

          renderFeatured(button.dataset.cat);

          renderRecent(button.dataset.cat);

        }

      });

    });

}


/* =========================================================
   FIND / FILTER NOHAY
   ========================================================= */

function getFilteredNohay(
  category = "All",
  query = ""
) {

  const term =
    query.trim().toLowerCase();

  return nohay.filter((noha) => {

    const categoryMatch =
      category === "All" ||
      noha.category === category;

    if (!categoryMatch) return false;

    if (!term) return true;

    const searchableText = [

      noha.title || "",
      noha.reciter || "",
      noha.keywords || "",
      noha.category || ""

    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(term);

  });

}


/* =========================================================
   RECOMMENDATION / FEATURED CARD
   NO IMAGE HERE
   ========================================================= */

function recommendationCard(noha) {

  return `
    <article
      class="card recommendation-card"
      onclick="openNoha('${escapeHtml(noha.id)}')"
    >

      <div class="recommendation-icon">
        ♪
      </div>

      <div class="card-body">

        <div class="card-title">
          ${escapeHtml(noha.title)}
        </div>

        <div class="meta">
          ${escapeHtml(
            noha.reciter ||
            "Hussaini Noha Khuwan"
          )}
        </div>

        <span class="tag">
          ${escapeHtml(
            noha.category || "Other"
          )}
        </span>

      </div>

    </article>
  `;

}


/* =========================================================
   FEATURED NOHAY
   ========================================================= */

function renderFeatured(
  category = "All"
) {

  const grid =
    $("#featuredGrid");

  if (!grid) return;

  const list =
    getFilteredNohay(category, "");

  const featured =
    list.slice(0, 4);

  if (!featured.length) {

    grid.innerHTML = `
      <div class="empty-favorites">
        <h3>No Recommendations Yet</h3>
        <p>
          Nohay add hone ke baad yahan recommendations nazar aayengi.
        </p>
      </div>
    `;

    return;

  }

  grid.innerHTML =
    featured
      .map(recommendationCard)
      .join("");

}


/* =========================================================
   SEARCH RESULTS SECTION
   ========================================================= */

function ensureSearchResultsSection() {

  let section =
    $("#searchResultsSection");

  if (section) return section;

  const featured =
    $("#featured");

  if (!featured) return null;

  section =
    document.createElement("section");

  section.id =
    "searchResultsSection";

  section.className =
    "section search-results-section";

  section.innerHTML = `
    <div class="section-title">

      <h2 id="searchResultsTitle">
        Search Results
      </h2>

      <button
        id="clearSearchResults"
        class="secondary-action"
        type="button"
      >
        Clear
      </button>

    </div>

    <div
      id="searchResultsGrid"
      class="cards search-results-grid"
    ></div>
  `;

  featured.insertAdjacentElement(
    "afterend",
    section
  );


  $("#clearSearchResults")
    ?.addEventListener("click", () => {

      if ($("#searchInput")) {

        $("#searchInput").value = "";

      }

      section.classList.add("hidden");

      const activeCategory =
        document
          .querySelector(".filter.active")
          ?.dataset.cat || "All";

      renderFeatured(activeCategory);

      renderRecent(activeCategory);

    });


  return section;

}


/* =========================================================
   SEARCH RESULT CARD
   NO FULL IMAGE
   ========================================================= */

function searchResultCard(noha) {

  return `
    <article
      class="card search-result-card"
      onclick="openNoha('${escapeHtml(noha.id)}')"
    >

      <div class="search-result-content">

        <div class="search-result-icon">
          🔎
        </div>

        <div class="search-result-info">

          <div class="card-title">
            ${escapeHtml(noha.title)}
          </div>

          <div class="meta">
            ${escapeHtml(
              noha.reciter ||
              "Hussaini Noha Khuwan"
            )}
          </div>

          <span class="tag">
            ${escapeHtml(
              noha.category || "Other"
            )}
          </span>

        </div>

        <div class="search-result-arrow">
          →
        </div>

      </div>

    </article>
  `;

}


/* =========================================================
   RENDER SEARCH RESULTS
   ========================================================= */

function renderSearchResults(
  category = "All",
  query = ""
) {

  const section =
    ensureSearchResultsSection();

  if (!section) return;

  const grid =
    $("#searchResultsGrid");

  const title =
    $("#searchResultsTitle");

  if (!grid || !title) return;

  const list =
    getFilteredNohay(
      category,
      query
    );

  title.textContent =
    `Search Results (${list.length})`;

  section.classList.remove("hidden");


  if (!list.length) {

    grid.innerHTML = `
      <div class="empty-favorites">

        <div class="empty-heart">
          🔍
        </div>

        <h3>
          No Noha Found
        </h3>

        <p>
          "${escapeHtml(query)}" ke liye koi Noha nahi mila.
        </p>

      </div>
    `;

    return;

  }


  grid.innerHTML =
    list
      .map(searchResultCard)
      .join("");

}


/* =========================================================
   RECENT NOHAY
   TEXT ONLY
   ========================================================= */

function renderRecent(
  category = "All"
) {

  const recentList =
    $("#recentList");

  if (!recentList) return;

  const list =
    getFilteredNohay(
      category,
      ""
    ).slice(0, 8);


  if (!list.length) {

    recentList.innerHTML = `
      <p class="meta">
        Noha nahi mila.
      </p>
    `;

    return;

  }


  recentList.innerHTML =
    list
      .map((noha) => {

        return `
          <div
            class="recent-item text-only-recent"
            onclick="openNoha('${escapeHtml(noha.id)}')"
          >

            <div class="recent-text-icon">
              ♪
            </div>

            <div class="recent-info">

              <b>
                ${escapeHtml(noha.title)}
              </b>

              <div class="meta">
                ${escapeHtml(
                  noha.reciter ||
                  "Hussaini Noha Khuwan"
                )}
              </div>

              <span class="tag">
                ${escapeHtml(
                  noha.category || "Other"
                )}
              </span>

            </div>

            <span class="recent-arrow">
              →
            </span>

          </div>
        `;

      })
      .join("");

}


/* =========================================================
   CATEGORIES
   ========================================================= */

function renderCategories() {

  const categoryList =
    $("#categoryList");

  if (!categoryList) return;

  const counts = {};

  nohay.forEach((noha) => {

    const category =
      noha.category || "Other";

    counts[category] =
      (counts[category] || 0) + 1;

  });


  categoryList.innerHTML =
    cats
      .slice(1)
      .map((category) => {

        return `
          <div
            class="cat"
            onclick="selectCategory('${escapeHtml(category)}')"
          >

            <span>
              ${escapeHtml(category)}
            </span>

            <span class="count">
              ${counts[category] || 0}
            </span>

          </div>
        `;

      })
      .join("");

}


/* =========================================================
   CATEGORY CLICK
   ========================================================= */

window.selectCategory =
function(category) {

  const button =
    document.querySelector(
      `.filter[data-cat="${CSS.escape(category)}"]`
    );

  if (button) {

    button.click();

  }

  const categories =
    $("#categories");

  if (categories) {

    categories.scrollIntoView({
      behavior: "smooth"
    });

  }

};


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll() {

  renderFilters();

  renderFeatured();

  renderRecent();

  renderCategories();

}


/* =========================================================
   SEARCH
   ========================================================= */

function performSearch() {

  const query =
    $("#searchInput")?.value.trim() || "";

  const activeCategory =
    document
      .querySelector(".filter.active")
      ?.dataset.cat || "All";


  if (!query) {

    const section =
      $("#searchResultsSection");

    if (section) {

      section.classList.add("hidden");

    }

    renderFeatured(activeCategory);

    renderRecent(activeCategory);

    return;

  }


  renderSearchResults(
    activeCategory,
    query
  );


  const results =
    $("#searchResultsSection");

  if (results) {

    setTimeout(() => {

      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }, 80);

  }

}


function setupSearch() {

  const input =
    $("#searchInput");

  const button =
    $("#searchBtn");

  if (button) {

    button.addEventListener(
      "click",
      performSearch
    );

  }


  if (input) {

    input.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {

          event.preventDefault();

          performSearch();

        }

      }
    );

  }

}


/* =========================================================
   NOHA DETAIL
   FULL IMAGE ONLY HERE
   ========================================================= */

window.openNoha =
function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) === String(id)
    );

  if (!noha) return;


  const modal =
    $("#modal");

  const content =
    $("#modalContent");

  if (!modal || !content) return;


  content.innerHTML = `

    <div class="detail">

      <div class="detail-top">

        <div>

          <span class="detail-category">
            ${escapeHtml(
              noha.category || "Other"
            )}
          </span>

          <h2>
            ${escapeHtml(noha.title)}
          </h2>

        </div>

      </div>


      ${
        noha.image
          ? `
            <div class="lyrics-viewer">

              <img
                src="${escapeHtml(noha.image)}"
                alt="Lyrics"
                onclick="openFullscreenImage('${escapeHtml(noha.id)}')"
              >

            </div>
          `
          : `
            <div class="empty-favorites">

              <div class="empty-heart">
                ♪
              </div>

              <h3>
                Lyrics image available nahi hai
              </h3>

            </div>
          `
      }


      <div class="detail-actions">

        ${
          noha.lyrics
            ? `
              <button
                class="secondary-action"
                onclick="copyLyrics('${escapeHtml(noha.id)}')"
              >
                📋 Copy Lyrics
              </button>
            `
            : ""
        }

        ${
          noha.image
            ? `
              <button
                class="secondary-action"
                onclick="downloadLyricsImage('${escapeHtml(noha.id)}')"
              >
                ⬇ Download Image
              </button>
            `
            : ""
        }

        <button
          class="secondary-action"
          onclick="shareNoha('${escapeHtml(noha.id)}')"
        >
          ↗ Share
        </button>

      </div>


      ${
        noha.lyrics
          ? `
            <div class="typed-lyrics">

              <div class="typed-lyrics-title">
                Urdu Lyrics
              </div>

              <div class="typed-lyrics-text">
                ${escapeHtml(noha.lyrics)}
              </div>

            </div>
          `
          : ""
      }

    </div>

  `;


  modal.classList.remove("hidden");

  document.body.classList.add(
    "modal-open"
  );

};


/* =========================================================
   FULLSCREEN IMAGE
   ========================================================= */

window.openFullscreenImage =
function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) === String(id)
    );

  if (!noha || !noha.image) return;


  let viewer =
    document.getElementById(
      "simpleImageViewer"
    );


  if (!viewer) {

    viewer =
      document.createElement("div");

    viewer.id =
      "simpleImageViewer";

    viewer.innerHTML = `

      <button
        type="button"
        class="image-viewer-close"
        id="simpleImageClose"
      >
        ×
      </button>

      <div class="image-viewer-content">

        <img
          id="simpleFullImage"
          alt="Lyrics"
        >

      </div>

    `;

    viewer.className =
      "image-viewer";

    document.body.appendChild(viewer);


    $("#simpleImageClose")
      .addEventListener(
        "click",
        () => {

          viewer.classList.add(
            "hidden"
          );

        }
      );


    viewer.addEventListener(
      "click",
      (event) => {

        if (
          event.target === viewer ||
          event.target.classList.contains(
            "image-viewer-content"
          )
        ) {

          viewer.classList.add(
            "hidden"
          );

        }

      }
    );

  }


  const image =
    $("#simpleFullImage");

  image.src =
    noha.image;

  viewer.classList.remove(
    "hidden"
  );

};


/* =========================================================
   DOWNLOAD IMAGE
   ========================================================= */

window.downloadLyricsImage =
async function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) === String(id)
    );

  if (!noha || !noha.image) return;


  try {

    const response =
      await fetch(noha.image);

    const blob =
      await response.blob();

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${(noha.title || "noha")
        .replace(/[\\/:*?"<>|]/g, "_")
      }.jpg`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

  } catch (error) {

    /* Fallback */
    window.open(
      noha.image,
      "_blank"
    );

  }

};


/* =========================================================
   COPY LYRICS
   ========================================================= */

window.copyLyrics =
async function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) === String(id)
    );

  if (!noha) return;


  const text =
    noha.lyrics ||
    noha.title ||
    "";


  try {

    await navigator.clipboard.writeText(
      text
    );

    alert("Lyrics copied!");

  } catch (error) {

    alert(
      "Copy nahi ho saka."
    );

  }

};


/* =========================================================
   SHARE
   ========================================================= */

window.shareNoha =
async function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) === String(id)
    );

  if (!noha) return;


  const shareData = {

    title: noha.title,

    text:
      noha.lyrics ||
      noha.title,

    url:
      window.location.href

  };


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        shareData
      );

    } else {

      await navigator.clipboard.writeText(
        window.location.href
      );

      alert(
        "Link copied!"
      );

    }

  } catch (error) {

    console.warn(
      "Share cancelled:",
      error
    );

  }

};


/* =========================================================
   MODAL
   ========================================================= */

function setupModal() {

  const closeButton =
    $("#closeModal");

  const modal =
    $("#modal");


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeModal
    );

  }


  if (modal) {

    modal.addEventListener(
      "click",
      (event) => {

        if (
          event.target === modal
        ) {

          closeModal();

        }

      }
    );

  }


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape"
      ) {

        closeModal();

      }

    }
  );

}


function closeModal() {

  const modal =
    $("#modal");

  if (!modal) return;

  modal.classList.add(
    "hidden"
  );

  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {

  const button =
    $("#themeBtn");

  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light"
      );


      localStorage.setItem(
        "hnk_theme",
        document.body.classList.contains(
          "light"
        )
          ? "light"
          : "dark"
      );

    }
  );


  if (
    localStorage.getItem(
      "hnk_theme"
    ) === "light"
  ) {

    document.body.classList.add(
      "light"
    );

  }

}


/* =========================================================
   PWA INSTALL
   ========================================================= */

function setupInstall() {

  let deferredPrompt = null;

  window.addEventListener(
    "beforeinstallprompt",
    (event) => {

      event.preventDefault();

      deferredPrompt =
        event;

      const installButton =
        $("#installBtn");

      if (installButton) {

        installButton.hidden =
          false;

      }

    }
  );


  const installButton =
    $("#installBtn");


  if (installButton) {

    installButton.addEventListener(
      "click",
      async () => {

        if (!deferredPrompt)
          return;

        deferredPrompt.prompt();

        deferredPrompt =
          null;

        installButton.hidden =
          true;

      }
    );

  }

}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

function setupServiceWorker() {

  if (
    "serviceWorker" in navigator
  ) {

    window.addEventListener(
      "load",
      () => {

        navigator.serviceWorker
          .register("sw.js")
          .catch((error) => {

            console.warn(
              "Service worker:",
              error
            );

          });

      }
    );

  }

}
