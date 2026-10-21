/* =========================================================
   HUSSAINI NOHA KHUWAN
   PUBLIC APP
   ========================================================= */

const SUPABASE_URL =
  "https://xxigwjuzfrffgznuajui.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_DCnF_aVt833TFuGDHwtU8Q_cm17-dZn";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let supabaseClient = null;
let nohay = [];

const demoNohay = [
  {
    id: "demo1",
    title: "اب مجھے کوئی سکینہ نہیں کہتا بابا",
    reciter: "Hussaini Noha Khuwan",
    category: "Muharram",
    keywords:
      "ab mujhe koi sakina nahi kehta baba sakina",
    image: "",
    lyrics: ""
  },
  {
    id: "demo2",
    title: "علی اکبر علی اکبر",
    reciter: "Hussaini Noha Khuwan",
    category: "Muharram",
    keywords:
      "ali akbar aliakbar akber",
    image: "",
    lyrics: ""
  },
  {
    id: "demo3",
    title: "واہ میرے لال",
    reciter: "Hussaini Noha Khuwan",
    category: "Muharram",
    keywords:
      "wah mere lal",
    image: "",
    lyrics: ""
  }
];


const categories = [
  "All",
  "Muharram",
  "Ayyam-e-Ali",
  "Ayyam-e-Fatmiya",
  "Other"
];


const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(value = "") {

  return String(value).replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);


async function initializeApp() {

  setupTheme();

  setupModal();

  setupInstall();

  setupServiceWorker();

  setupSearch();

  renderLocalImmediately();

  await initializeSupabase();

}


/* =========================================================
   SUPABASE
   ========================================================= */

async function initializeSupabase() {

  try {

    if (!window.supabase) {

      await loadSupabaseScript();

    }

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    await loadNohay();

  } catch (error) {

    console.warn(
      "Supabase unavailable:",
      error
    );

    loadLocalData();

  }

}


function loadSupabaseScript() {

  return new Promise(
    (resolve, reject) => {

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.onload = resolve;

      script.onerror = reject;

      document.head.appendChild(
        script
      );

    }
  );

}


/* =========================================================
   DATA LOADING
   ========================================================= */

async function loadNohay() {

  if (!supabaseClient) {

    loadLocalData();

    return;

  }


  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("nohas")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      throw error;

    }


    nohay =
      Array.isArray(data)
        ? data
        : [];


    localStorage.setItem(
      "hnk_nohay",
      JSON.stringify(nohay)
    );


    renderAll();

  } catch (error) {

    console.warn(
      "Using offline cache:",
      error.message
    );

    loadLocalData();

  }

}


function loadLocalData() {

  try {

    const cached =
      JSON.parse(
        localStorage.getItem(
          "hnk_nohay"
        ) || "null"
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


function renderLocalImmediately() {

  loadLocalData();

}


/* =========================================================
   CATEGORY FILTERS
   ========================================================= */

function renderFilters() {

  const filters =
    $("#filters");

  if (!filters) return;


  filters.innerHTML =
    categories
      .map(
        (category, index) => {

          return `
            <button
              class="filter ${
                index === 0
                  ? "active"
                  : ""
              }"
              data-cat="${escapeHtml(
                category
              )}"
              type="button"
            >
              ${escapeHtml(
                category
              )}
            </button>
          `;

        }
      )
      .join("");


  filters
    .querySelectorAll(
      ".filter"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            filters
              .querySelectorAll(
                ".filter"
              )
              .forEach(
                (item) =>
                  item.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            const category =
              button.dataset.cat;


            const query =
              $("#searchInput")
                ?.value
                .trim() || "";


            if (query) {

              showSearchResults(
                query,
                category
              );

            } else {

              renderFeatured(
                category
              );

              renderRecent(
                category
              );

              hideDirectSearchResults();

            }

          }
        );

      }
    );

}


/* =========================================================
   FILTER DATA
   ========================================================= */

function getFilteredNohay(
  category = "All",
  query = ""
) {

  const term =
    String(query)
      .trim()
      .toLowerCase();


  return nohay.filter(
    (noha) => {

      const categoryMatch =
        category === "All" ||
        noha.category === category;


      if (!categoryMatch) {

        return false;

      }


      if (!term) {

        return true;

      }


      const searchable = [

        noha.title || "",

        noha.reciter || "",

        noha.keywords || "",

        noha.category || ""

      ]
        .join(" ")
        .toLowerCase();


      return searchable.includes(
        term
      );

    }
  );

}


/* =========================================================
   FEATURED / RECOMMENDATIONS
   TEXT ONLY
   ========================================================= */

function createRecommendationCard(
  noha
) {

  return `
    <article
      class="card recommendation-card"
      data-noha-id="${escapeHtml(
        noha.id
      )}"
    >

      <div class="recommendation-icon">
        ♪
      </div>

      <div class="card-body">

        <div class="card-title">
          ${escapeHtml(
            noha.title
          )}
        </div>

        <div class="meta">
          ${escapeHtml(
            noha.reciter ||
            "Hussaini Noha Khuwan"
          )}
        </div>

        <span class="tag">
          ${escapeHtml(
            noha.category ||
            "Other"
          )}
        </span>

      </div>

    </article>
  `;

}


function renderFeatured(
  category = "All"
) {

  const grid =
    $("#featuredGrid");

  if (!grid) return;


  const list =
    getFilteredNohay(
      category,
      ""
    );


  const featured =
    list.slice(0, 4);


  if (!featured.length) {

    grid.innerHTML = `
      <div class="empty-favorites">

        <h3>
          No Recommendations Yet
        </h3>

        <p>
          Nohay add hone ke baad
          yahan recommendations nazar
          aayengi.
        </p>

      </div>
    `;

    return;

  }


  grid.innerHTML =
    featured
      .map(
        createRecommendationCard
      )
      .join("");


  attachNohaClicks(
    grid
  );

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
      .map(
        (noha) => {

          return `
            <div
              class="recent-item text-only-recent"
              data-noha-id="${escapeHtml(
                noha.id
              )}"
            >

              <div class="recent-text-icon">
                ♪
              </div>

              <div class="recent-info">

                <b>
                  ${escapeHtml(
                    noha.title
                  )}
                </b>

                <div class="meta">
                  ${escapeHtml(
                    noha.reciter ||
                    "Hussaini Noha Khuwan"
                  )}
                </div>

                <span class="tag">
                  ${escapeHtml(
                    noha.category ||
                    "Other"
                  )}
                </span>

              </div>

              <span class="recent-arrow">
                →
              </span>

            </div>
          `;

        }
      )
      .join("");


  attachNohaClicks(
    recentList
  );

}


/* =========================================================
   NOHA CLICK HANDLERS
   ========================================================= */

function attachNohaClicks(
  container
) {

  container
    .querySelectorAll(
      "[data-noha-id]"
    )
    .forEach(
      (element) => {

        element.addEventListener(
          "click",
          () => {

            openNoha(
              element.dataset.nohaId
            );

          }
        );

      }
    );

}


/* =========================================================
   SEARCH RESULTS
   DIRECTLY BELOW SEARCH BAR
   ========================================================= */

function createDirectSearchResultsBox() {

  let box =
    $("#directSearchResults");


  if (box) {

    return box;

  }


  const searchBox =
    document.querySelector(
      ".searchbox"
    );


  if (!searchBox) {

    return null;

  }


  box =
    document.createElement(
      "div"
    );


  box.id =
    "directSearchResults";


  box.className =
    "search-results-box hidden";


  searchBox.insertAdjacentElement(
    "afterend",
    box
  );


  return box;

}


function createSearchResultCard(
  noha
) {

  return `
    <div
      class="search-result-item"
      data-noha-id="${escapeHtml(
        noha.id
      )}"
    >

      <div class="search-result-icon">
        ♪
      </div>

      <div class="search-result-info">

        <div class="search-result-title">
          ${escapeHtml(
            noha.title
          )}
        </div>

        <div class="search-result-meta">
          ${escapeHtml(
            noha.reciter ||
            "Hussaini Noha Khuwan"
          )}
        </div>

        <span class="search-result-category">
          ${escapeHtml(
            noha.category ||
            "Other"
          )}
        </span>

      </div>

      <div class="search-result-arrow">
        →
      </div>

    </div>
  `;

}


function showSearchResults(
  query,
  category = "All"
) {

  const box =
    createDirectSearchResultsBox();


  if (!box) return;


  const cleanQuery =
    String(query)
      .trim()
      .toLowerCase();


  if (!cleanQuery) {

    hideDirectSearchResults();

    return;

  }


  const results =
    getFilteredNohay(
      category,
      cleanQuery
    );


  box.classList.remove(
    "hidden"
  );


  if (!results.length) {

    box.innerHTML = `
      <div class="search-results-empty">

        Noha nahi mila for

        <strong>
          "${escapeHtml(
            query
          )}"
        </strong>

      </div>
    `;

    return;

  }


  box.innerHTML = `

    <div class="search-results-heading">
      Search Results
      <span>
        ${results.length}
      </span>
    </div>

    ${results
      .slice(0, 8)
      .map(
        createSearchResultCard
      )
      .join("")}

  `;


  attachNohaClicks(
    box
  );

}


function hideDirectSearchResults() {

  const box =
    $("#directSearchResults");


  if (!box) return;


  box.classList.add(
    "hidden"
  );


  box.innerHTML = "";

}


/* =========================================================
   SEARCH BUTTON
   ========================================================= */

function performSearch() {

  const input =
    $("#searchInput");

  if (!input) return;


  const query =
    input.value.trim();


  const activeCategory =
    document
      .querySelector(
        ".filter.active"
      )
      ?.dataset.cat ||
    "All";


  if (!query) {

    hideDirectSearchResults();

    renderFeatured(
      activeCategory
    );

    renderRecent(
      activeCategory
    );

    return;

  }


  showSearchResults(
    query,
    activeCategory
  );

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

        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          performSearch();

        }

      }
    );


    input.addEventListener(
      "input",
      () => {

        if (
          !input.value.trim()
        ) {

          hideDirectSearchResults();

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
        String(item.id) ===
        String(id)
    );


  if (!noha) return;


  const modal =
    $("#modal");

  const content =
    $("#modalContent");


  if (!modal || !content) {

    return;

  }


  content.innerHTML = `

    <div class="detail">

      <div class="detail-top">

        <div>

          <span class="detail-category">
            ${escapeHtml(
              noha.category ||
              "Other"
            )}
          </span>

          <h2>
            ${escapeHtml(
              noha.title
            )}
          </h2>

        </div>

      </div>


      ${
        noha.image
          ? `
            <div class="lyrics-viewer">

              <img
                src="${escapeHtml(
                  noha.image
                )}"
                alt="Lyrics"
                onclick="openFullscreenImage('${escapeHtml(
                  noha.id
                )}')"
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
                type="button"
                onclick="copyLyrics('${escapeHtml(
                  noha.id
                )}')"
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
                type="button"
                onclick="downloadLyricsImage('${escapeHtml(
                  noha.id
                )}')"
              >
                ⬇ Download Image
              </button>
            `
            : ""
        }


        <button
          class="secondary-action"
          type="button"
          onclick="shareNoha('${escapeHtml(
            noha.id
          )}')"
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
                ${escapeHtml(
                  noha.lyrics
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

};


/* =========================================================
   FULLSCREEN IMAGE
   ========================================================= */

window.openFullscreenImage =
function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (
    !noha ||
    !noha.image
  ) {

    return;

  }


  let viewer =
    $("#simpleImageViewer");


  if (!viewer) {

    viewer =
      document.createElement(
        "div"
      );


    viewer.id =
      "simpleImageViewer";


    viewer.className =
      "image-viewer hidden";


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


    document.body.appendChild(
      viewer
    );


    $("#simpleImageClose")
      ?.addEventListener(
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


  if (image) {

    image.src =
      noha.image;

  }


  viewer.classList.remove(
    "hidden"
  );

};


/* =========================================================
   DOWNLOAD
   ========================================================= */

window.downloadLyricsImage =
async function(id) {

  const noha =
    nohay.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (
    !noha ||
    !noha.image
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        noha.image
      );


    const blob =
      await response.blob();


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      `${(
        noha.title ||
        "noha"
      ).replace(
        /[\\/:*?"<>|]/g,
        "_"
      )}.jpg`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );

  } catch (error) {

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
        String(item.id) ===
        String(id)
    );


  if (!noha) return;


  const text =
    noha.lyrics ||
    noha.title ||
    "";


  try {

    await navigator
      .clipboard
      .writeText(
        text
      );


    alert(
      "Lyrics copied!"
    );

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
        String(item.id) ===
        String(id)
    );


  if (!noha) return;


  const shareData = {

    title:
      noha.title,

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

      await navigator
        .clipboard
        .writeText(
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
          event.target ===
          modal
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
        event.key ===
        "Escape"
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
   CATEGORIES
   ========================================================= */

function renderCategories() {

  const categoryList =
    $("#categoryList");


  if (!categoryList) return;


  const counts = {};


  nohay.forEach(
    (noha) => {

      const category =
        noha.category ||
        "Other";


      counts[category] =
        (counts[category] || 0) +
        1;

    }
  );


  categoryList.innerHTML =
    categories
      .slice(1)
      .map(
        (category) => {

          return `
            <div
              class="cat"
              data-category="${escapeHtml(
                category
              )}"
            >

              <span>
                ${escapeHtml(
                  category
                )}
              </span>

              <span class="count">
                ${counts[
                  category
                ] || 0}
              </span>

            </div>
          `;

        }
      )
      .join("");


  categoryList
    .querySelectorAll(
      "[data-category]"
    )
    .forEach(
      (item) => {

        item.addEventListener(
          "click",
          () => {

            selectCategory(
              item.dataset.category
            );

          }
        );

      }
    );

}


window.selectCategory =
function(category) {

  const button =
    document.querySelector(
      `.filter[data-cat="${CSS.escape(
        category
      )}"]`
    );


  if (button) {

    button.click();

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

  let deferredPrompt =
    null;


  window.addEventListener(
    "beforeinstallprompt",
    (event) => {

      event.preventDefault();

      deferredPrompt =
        event;


      const button =
        $("#installBtn");


      if (button) {

        button.hidden =
          false;

      }

    }
  );


  const button =
    $("#installBtn");


  if (!button) return;


  button.addEventListener(
    "click",
    async () => {

      if (!deferredPrompt) {

        return;

      }


      deferredPrompt.prompt();


      deferredPrompt =
        null;


      button.hidden =
        true;

    }
  );

}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

function setupServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {

    return;

  }


  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register(
          "sw.js"
        )
        .catch(
          (error) => {

            console.warn(
              "Service worker:",
              error
            );

          }
        );

    }
  );

}
