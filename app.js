  /* =========================================================
   HUSSAINI NOHA KHUWAN — PUBLIC APP
   Dynamic categories + robust search
   ========================================================= */

const SUPABASE_URL = "https://xxigwjuzfrffgznuajui.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DCnF_aVt833TFuGDHwtU8Q_cm17-dZn";

let supabaseClient = null;
let nohay = [];

const DEFAULT_CATEGORIES = [
  "Bibi Fatima (S.A)",
  "Imam Hussain (A.S)",
  "Imam Ali (A.S)"
];

const DEMO_NOHAY = [
  {
    id: "demo1",
    title: "اب مجھے کوئی سکینہ نہیں کہتا بابا",
    reciter: "Hussaini Noha Khuwan",
    category: "Imam Hussain (A.S)",
    keywords: "ab mujhe koi sakina nahi kehta baba sakina ali akbar",
    image: "",
    lyrics: ""
  }
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
   SEARCH NORMALIZATION
   ========================================================= */

function cleanText(value = "") {
  return String(value)
    .toLocaleLowerCase("en-US")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[.,/#!$%^&*;:{}=_`~()\[\]"'!?|\\<>+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   CATEGORIES
   ========================================================= */

function getCategories() {
  const custom = nohay
    .map((item) => String(item.category || "").trim())
    .filter(Boolean);

  const all = [
    ...DEFAULT_CATEGORIES,
    ...custom
  ];

  const unique = [];

  all.forEach((value) => {
    if (!value) return;

    const exists = unique.some(
      (item) => cleanText(item) === cleanText(value)
    );

    if (!exists) {
      unique.push(value);
    }
  });

  return ["All", ...unique];
}

/* =========================================================
   SEARCH
   ========================================================= */

function searchableText(noha) {
  return cleanText([
    noha.title,
    noha.reciter,
    noha.keywords,
    noha.category,
    noha.lyrics
  ]
    .filter(Boolean)
    .join(" "));
}

function matchesQuery(noha, query) {
  const q = cleanText(query);

  if (!q) {
    return true;
  }

  const haystack = searchableText(noha);

  /* Exact phrase */
  if (haystack.includes(q)) {
    return true;
  }

  /* Every word separately */
  const words = q
    .split(" ")
    .filter(Boolean);

  if (
    words.length > 1 &&
    words.every((word) =>
      haystack.includes(word)
    )
  ) {
    return true;
  }

  return false;
}

function getFilteredNohay(
  category = "All",
  query = ""
) {
  return nohay.filter((noha) => {
    const itemCategory =
      String(
        noha.category || "Other"
      ).trim();

    const categoryMatch =
      category === "All" ||
      cleanText(itemCategory) ===
        cleanText(category);

    return (
      categoryMatch &&
      matchesQuery(noha, query)
    );
  });
}

/* =========================================================
   SUPABASE
   ========================================================= */

async function loadSupabaseScript() {
  if (window.supabase) {
    return;
  }

  await new Promise(
    (resolve, reject) => {
      const script =
        document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    }
  );
}

async function initializeSupabase() {
  try {
    await loadSupabaseScript();

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

async function loadNohay() {
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
      "Using cached Nohay:",
      error
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

    nohay =
      Array.isArray(cached)
        ? cached
        : DEMO_NOHAY;
  } catch {
    nohay = DEMO_NOHAY;
  }

  renderAll();
}

/* =========================================================
   FILTERS
   ========================================================= */

function renderFilters() {
  const filters =
    $("#filters");

  if (!filters) {
    return;
  }

  const active =
    filters.querySelector(
      ".filter.active"
    )?.dataset.cat ||
    "All";

  const categories =
    getCategories();

  filters.innerHTML =
    categories
      .map((category) => `
        <button
          class="filter ${
            cleanText(active) ===
            cleanText(category)
              ? "active"
              : ""
          }"
          data-cat="${escapeHtml(category)}"
          type="button"
        >
          ${escapeHtml(category)}
        </button>
      `)
      .join("");

  if (
    !filters.querySelector(
      ".filter.active"
    )
  ) {
    filters
      .querySelector(".filter")
      ?.classList.add("active");
  }

  filters
    .querySelectorAll(".filter")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          filters
            .querySelectorAll(".filter")
            .forEach((item) =>
              item.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

          const query =
            $("#searchInput")
              ?.value
              .trim() || "";

          if (query) {
            renderSearchResults(
              button.dataset.cat,
              query
            );

            renderDirectSearchResults(
              query
            );
          } else {
            hideDirectSearchResults();

            renderFeatured(
              button.dataset.cat
            );

            renderRecent(
              button.dataset.cat
            );
          }
        }
      );
    });
}

/* =========================================================
   FEATURED
   ========================================================= */

function recommendationCard(
  noha
) {
  return `
    <article
      class="card recommendation-card"
      data-noha-id="${escapeHtml(noha.id)}"
    >
      <div class="recommendation-icon">
        ♪
      </div>

      <div class="card-body">
        <div class="card-title">
          ${escapeHtml(
            noha.title ||
            "Untitled Noha"
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

  if (!grid) {
    return;
  }

  const list =
    getFilteredNohay(category)
      .slice(0, 4);

  grid.innerHTML =
    list.length
      ? list
          .map(recommendationCard)
          .join("")
      : `
        <div class="empty-favorites">
          <h3>
            No Recommendations Yet
          </h3>

          <p>
            Nohay add hone ke baad
            yahan nazar aayengi.
          </p>
        </div>
      `;

  attachNohaClicks(grid);
}

/* =========================================================
   RECENT
   ========================================================= */

function renderRecent(
  category = "All"
) {
  const listEl =
    $("#recentList");

  if (!listEl) {
    return;
  }

  const list =
    getFilteredNohay(category)
      .slice(0, 8);

  listEl.innerHTML =
    list.length
      ? list
          .map(
            (noha) => `
              <div
                class="recent-item text-only-recent"
                data-noha-id="${escapeHtml(noha.id)}"
              >
                <div class="recent-text-icon">
                  ♪
                </div>

                <div class="recent-info">
                  <b>
                    ${escapeHtml(
                      noha.title ||
                      "Untitled Noha"
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
            `
          )
          .join("")
      : `
        <p class="meta">
          Noha nahi mila.
        </p>
      `;

  attachNohaClicks(listEl);
}

/* =========================================================
   DYNAMIC CATEGORIES
   ========================================================= */

function renderCategories() {
  const listEl =
    $("#categoryList");

  if (!listEl) {
    return;
  }

  const counts = {};

  nohay.forEach(
    (noha) => {
      const category =
        String(
          noha.category ||
          "Other"
        ).trim() ||
        "Other";

      const key =
        cleanText(category);

      counts[key] =
        (counts[key] || 0) + 1;
    }
  );

  const categories =
    getCategories()
      .filter(
        (category) =>
          category !== "All"
      );

  listEl.innerHTML =
    categories
      .map(
        (category) => `
          <div
            class="cat"
            data-category="${escapeHtml(category)}"
          >
            <span>
              ${escapeHtml(category)}
            </span>

            <span class="count">
              ${
                counts[
                  cleanText(category)
                ] || 0
              }
            </span>
          </div>
        `
      )
      .join("");

  listEl
    .querySelectorAll(
      "[data-category]"
    )
    .forEach((item) => {
      item.addEventListener(
        "click",
        () =>
          selectCategory(
            item.dataset.category
          )
      );
    });
}

/* =========================================================
   SEARCH RESULTS SECTION
   ========================================================= */

function ensureSearchResultsSection() {
  let section =
    $("#searchResultsSection");

  if (section) {
    return section;
  }

  const featured =
    $("#featured");

  if (!featured) {
    return null;
  }

  section =
    document.createElement(
      "section"
    );

  section.id =
    "searchResultsSection";

  section.className =
    "section search-results-section hidden";

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
    ?.addEventListener(
      "click",
      () => {
        if (
          $("#searchInput")
        ) {
          $("#searchInput").value =
            "";
        }

        hideDirectSearchResults();

        section.classList.add(
          "hidden"
        );

        const active =
          $(".filter.active")
            ?.dataset.cat ||
          "All";

        renderFeatured(active);
        renderRecent(active);
      }
    );

  return section;
}

function searchResultCard(
  noha
) {
  return `
    <article
      class="card search-result-card"
      data-noha-id="${escapeHtml(noha.id)}"
    >
      <div class="search-result-content">
        <div class="search-result-icon">
          ⌕
        </div>

        <div class="search-result-info">
          <div class="card-title">
            ${escapeHtml(
              noha.title ||
              "Untitled Noha"
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

        <div class="search-result-arrow">
          →
        </div>
      </div>
    </article>
  `;
}

function renderSearchResults(
  category = "All",
  query = ""
) {
  const section =
    ensureSearchResultsSection();

  if (!section) {
    return;
  }

  const grid =
    $("#searchResultsGrid");

  const title =
    $("#searchResultsTitle");

  if (!grid || !title) {
    return;
  }

  const results =
    getFilteredNohay(
      category,
      query
    );

  title.textContent =
    `Search Results (${results.length})`;

  section.classList.remove(
    "hidden"
  );

  grid.innerHTML =
    results.length
      ? results
          .map(searchResultCard)
          .join("")
      : `
        <div class="empty-favorites">
          <div class="empty-heart">
            ⌕
          </div>

          <h3>
            No Noha Found
          </h3>

          <p>
            "${escapeHtml(query)}"
            ke liye koi Noha nahi mila.
          </p>
        </div>
      `;

  attachNohaClicks(grid);
}

/* =========================================================
   SEARCH DROPDOWN DIRECTLY BELOW SEARCH BAR
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

function renderDirectSearchResults(
  query
) {
  const box =
    createDirectSearchResultsBox();

  if (!box) {
    return;
  }

  const activeCategory =
    $(".filter.active")
      ?.dataset.cat ||
    "All";

  const results =
    getFilteredNohay(
      activeCategory,
      query
    ).slice(0, 8);

  box.classList.remove(
    "hidden"
  );

  if (!results.length) {
    box.innerHTML = `
      <div class="search-results-empty">
        Noha nahi mila for
        <strong>
          "${escapeHtml(query)}"
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
      .map(
        (noha) => `
          <div
            class="search-result-item"
            data-noha-id="${escapeHtml(noha.id)}"
          >
            <div class="search-result-icon">
              ♪
            </div>

            <div class="search-result-info">
              <div class="search-result-title">
                ${escapeHtml(
                  noha.title ||
                  "Untitled Noha"
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
        `
      )
      .join("")}
  `;

  attachNohaClicks(box);
}

function hideDirectSearchResults() {
  const box =
    $("#directSearchResults");

  if (!box) {
    return;
  }

  box.classList.add(
    "hidden"
  );

  box.innerHTML = "";
}

/* =========================================================
   SEARCH EVENTS
   ========================================================= */

function performSearch() {
  const input =
    $("#searchInput");

  if (!input) {
    return;
  }

  const query =
    input.value.trim();

  const activeCategory =
    $(".filter.active")
      ?.dataset.cat ||
    "All";

  if (!query) {
    hideDirectSearchResults();

    $("#searchResultsSection")
      ?.classList.add(
        "hidden"
      );

    renderFeatured(
      activeCategory
    );

    renderRecent(
      activeCategory
    );

    return;
  }

  renderDirectSearchResults(
    query
  );

  renderSearchResults(
    activeCategory,
    query
  );
}

function setupSearch() {
  const input =
    $("#searchInput");

  const button =
    $("#searchBtn");

  if (!input) {
    return;
  }

  button?.addEventListener(
    "click",
    performSearch
  );

  input.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
        "Enter"
      ) {
        event.preventDefault();
        performSearch();
      }
    }
  );

  input.addEventListener(
    "input",
    () => {
      const query =
        input.value.trim();

      if (!query) {
        hideDirectSearchResults();

        $("#searchResultsSection")
          ?.classList.add(
            "hidden"
          );

        return;
      }

      renderDirectSearchResults(
        query
      );
    }
  );
}

/* =========================================================
   NOHA CLICK
   ========================================================= */

function attachNohaClicks(
  container
) {
  container
    .querySelectorAll(
      "[data-noha-id]"
    )
    .forEach((element) => {
      element.addEventListener(
        "click",
        () =>
          openNoha(
            element.dataset.nohaId
          )
      );
    });
}

window.selectCategory =
  function (category) {
    const button =
      document.querySelector(
        `.filter[data-cat="${CSS.escape(category)}"]`
      );

    if (button) {
      button.click();

      $("#featured")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }
  };

/* =========================================================
   NOHA DETAIL
   ========================================================= */

window.openNoha =
  function (id) {
    const noha =
      nohay.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!noha) {
      return;
    }

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
                noha.title ||
                "Untitled Noha"
              )}
            </h2>

            <div class="meta">
              ${escapeHtml(
                noha.reciter ||
                "Hussaini Noha Khuwan"
              )}
            </div>
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
                  Lyrics image
                  available nahi hai
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
  function (id) {
    const noha =
      nohay.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!noha?.image) {
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
          class="image-viewer-close"
          id="simpleImageClose"
          type="button"
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
          () =>
            viewer.classList.add(
              "hidden"
            )
        );

      viewer.addEventListener(
        "click",
        (event) => {
          if (
            event.target ===
              viewer ||
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

    $("#simpleFullImage").src =
      noha.image;

    viewer.classList.remove(
      "hidden"
    );
  };

/* =========================================================
   DOWNLOAD IMAGE
   ========================================================= */

window.downloadLyricsImage =
  async function (id) {
    const noha =
      nohay.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!noha?.image) {
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

      link.href = url;

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
    } catch {
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
  async function (id) {
    const noha =
      nohay.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!noha) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        noha.lyrics ||
        noha.title ||
        ""
      );

      alert(
        "Lyrics copied!"
      );
    } catch {
      alert(
        "Copy nahi ho saka."
      );
    }
  };

/* =========================================================
   SHARE
   ========================================================= */

window.shareNoha =
  async function (id) {
    const noha =
      nohay.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!noha) {
      return;
    }

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
    } catch {}
  };

/* =========================================================
   MODAL
   ========================================================= */

function setupModal() {
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
  $("#modal")
    ?.classList.add(
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

  button?.addEventListener(
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

  $("#installBtn")
    ?.addEventListener(
      "click",
      async () => {
        if (
          !deferredPrompt
        ) {
          return;
        }

        deferredPrompt.prompt();

        deferredPrompt =
          null;

        $("#installBtn").hidden =
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
        .register("sw.js")
        .catch(
          (error) =>
            console.warn(
              "Service worker:",
              error
            )
        );
    }
  );
}

/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {
  renderFilters();

  const active =
    $(".filter.active")
      ?.dataset.cat ||
    "All";

  renderFeatured(
    active
  );

  renderRecent(
    active
  );

  renderCategories();
}

/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    setupTheme();
    setupModal();
    setupInstall();
    setupServiceWorker();
    setupSearch();

    /*
      Local/cache first so page
      immediately has something.
    */
    loadLocalData();

    /*
      Then Supabase fresh data.
    */
    await initializeSupabase();
  }
);