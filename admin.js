/* =========================================================
   HUSSAINI NOHA KHUWAN — ADMIN PANEL
   PART 1 / 3
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   SUPABASE CONFIG
   --------------------------------------------------------- */

const SUPABASE_URL =
  "https://xxigwjuzfrffgznuajui.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_DCnF_aVt833TFuGDHwtU8Q_cm17-dZn";

const ADMIN_UID =
  "dfbf0317-3a66-497c-8cde-1180bba49db8";

/*
  IMPORTANT:
  We use a different variable name so it does not clash
  with the Supabase CDN's global `supabase` variable.
*/
const hnkSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* ---------------------------------------------------------
   CONSTANTS
   --------------------------------------------------------- */

const TABLE_NAME = "nohas";
const BUCKET_NAME = "noha-images";

const CATEGORIES = [
  "All",
  "Bibi Fatima (S.A)",
  "Imam Hussain (A.S)",
  "Imam Ali (A.S)",
  "Other"
];

let allNohay = [];
let filteredNohay = [];

let editingId = null;
let deletingId = null;


/* ---------------------------------------------------------
   DOM HELPERS
   --------------------------------------------------------- */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) =>
  Array.from(document.querySelectorAll(selector));


const els = {
  loginScreen: () => $("#loginScreen"),
  adminApp: () => $("#adminApp"),

  loginForm: () => $("#loginForm"),
  email: () => $("#email"),
  password: () => $("#password"),
  loginMessage: () => $("#loginMessage"),

  adminEmail: () => $("#adminEmail"),
  pageTitle: () => $("#pageTitle"),

  dashboardSection: () => $("#dashboardSection"),
  manageSection: () => $("#manageSection"),
  addSection: () => $("#addSection"),

  adminSearch: () => $("#adminSearch"),
  adminCategoryFilter: () => $("#adminCategoryFilter"),
  nohaTable: () => $("#nohaTable"),

  nohaForm: () => $("#nohaForm"),

  nohaId: () => $("#nohaId"),
  nohaTitle: () => $("#nohaTitle"),
  nohaReciter: () => $("#nohaReciter"),
  nohaCategory: () => $("#nohaCategory"),
  nohaKeywords: () => $("#nohaKeywords"),
  nohaLyrics: () => $("#nohaLyrics"),

  currentImage: () => $("#currentImage"),
  nohaImage: () => $("#nohaImage"),
  uploadPreview: () => $("#uploadPreview"),

  formTitle: () => $("#formTitle"),
  saveBtnText: () => $("#saveBtnText"),
  formMessage: () => $("#formMessage"),

  cancelEditBtn: () => $("#cancelEditBtn"),
  resetFormBtn: () => $("#resetFormBtn"),

  deleteModal: () => $("#deleteModal"),
  cancelDelete: () => $("#cancelDelete"),
  confirmDelete: () => $("#confirmDelete"),

  successToast: () => $("#successToast"),
  closeSuccessToast: () => $("#closeSuccessToast"),

  dashboardRecent: () => $("#dashboardRecent")
};


/* ---------------------------------------------------------
   GENERAL HELPERS
   --------------------------------------------------------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showMessage(message, type = "error") {
  const element = els.formMessage();

  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-message ${type}`;
}


function clearMessage() {
  const element = els.formMessage();

  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "form-message";
}


function showLoginMessage(message, type = "error") {
  const element = els.loginMessage();

  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `login-message ${type}`;
}


function clearLoginMessage() {
  const element = els.loginMessage();

  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "login-message";
}


function showSuccessToast(message) {
  const toast = els.successToast();

  if (!toast) {
    return;
  }

  const text =
    toast.querySelector(".toast-message") ||
    toast.querySelector("span") ||
    toast.querySelector("p");

  if (text) {
    text.textContent = message;
  }

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}


/* ---------------------------------------------------------
   CATEGORY NORMALIZATION
   --------------------------------------------------------- */

function normalizeCategory(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (text.includes("fatima")) {
    return "bibi fatima";
  }

  if (text.includes("hussain")) {
    return "imam hussain";
  }

  if (text.includes("ali")) {
    return "imam ali";
  }

  if (text === "all") {
    return "all";
  }

  if (!text) {
    return "other";
  }

  return text;
}


/* ---------------------------------------------------------
   DATE HELPERS
   --------------------------------------------------------- */

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


/* ---------------------------------------------------------
   AUTH
   --------------------------------------------------------- */

async function checkAuth() {
  try {
    const {
      data: { session },
      error
    } = await hnkSupabase.auth.getSession();

    if (error) {
      console.error("Auth session error:", error);
      showLoginScreen();
      return;
    }

    if (!session) {
      showLoginScreen();
      return;
    }

    if (session.user.id !== ADMIN_UID) {
      await hnkSupabase.auth.signOut();

      showLoginMessage(
        "This account is not authorized as admin."
      );

      showLoginScreen();
      return;
    }

    showAdminApp(session.user);
    await loadDashboard();
    await loadNohay();

  } catch (error) {
    console.error("checkAuth error:", error);
    showLoginScreen();
  }
}


function showLoginScreen() {
  const loginScreen = els.loginScreen();
  const adminApp = els.adminApp();

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }

  if (adminApp) {
    adminApp.classList.add("hidden");
  }
}


function showAdminApp(user) {
  const loginScreen = els.loginScreen();
  const adminApp = els.adminApp();

  if (loginScreen) {
    loginScreen.classList.add("hidden");
  }

  if (adminApp) {
    adminApp.classList.remove("hidden");
  }

  const adminEmail = els.adminEmail();

  if (adminEmail) {
    adminEmail.textContent = user?.email || "";
  }
}


/* ---------------------------------------------------------
   LOGIN
   --------------------------------------------------------- */

async function handleLogin(event) {
  event.preventDefault();

  clearLoginMessage();

  const email = els.email()?.value.trim();
  const password = els.password()?.value;

  if (!email || !password) {
    showLoginMessage(
      "Email aur password dono enter karein."
    );
    return;
  }

  const submitButton =
    els.loginForm()?.querySelector(
      'button[type="submit"]'
    );

  const originalText = submitButton
    ? submitButton.textContent
    : "";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";
  }

  try {
    const {
      data,
      error
    } = await hnkSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Login error:", error);
      showLoginMessage(
        error.message || "Login failed."
      );
      return;
    }

    if (!data?.user) {
      showLoginMessage("Login failed.");
      return;
    }

    if (data.user.id !== ADMIN_UID) {
      await hnkSupabase.auth.signOut();

      showLoginMessage(
        "This account is not authorized as admin."
      );

      return;
    }

    showAdminApp(data.user);

    await loadDashboard();
    await loadNohay();

  } catch (error) {
    console.error("handleLogin error:", error);

    showLoginMessage(
      "Something went wrong. Please try again."
    );

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
}


/* ---------------------------------------------------------
   LOGOUT
   --------------------------------------------------------- */

async function handleLogout() {
  try {
    await hnkSupabase.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  }

  allNohay = [];
  filteredNohay = [];

  showLoginScreen();
}


/* ---------------------------------------------------------
   SECTION NAVIGATION
   --------------------------------------------------------- */

function showSection(sectionName) {
  const sections = {
    dashboard: els.dashboardSection(),
    manage: els.manageSection(),
    add: els.addSection()
  };

  Object.entries(sections).forEach(
    ([name, section]) => {
      if (!section) {
        return;
      }

      if (name === sectionName) {
        section.classList.remove("hidden");
      } else {
        section.classList.add("hidden");
      }
    }
  );

  const pageTitle = els.pageTitle();

  const titles = {
    dashboard: "Dashboard",
    manage: "Manage Nohay",
    add: editingId ? "Edit Noha" : "Add New Noha"
  };

  if (pageTitle) {
    pageTitle.textContent =
      titles[sectionName] || "Dashboard";
  }

  $$(".nav-item").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.section === sectionName
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ---------------------------------------------------------
   NAVIGATION BINDING
   --------------------------------------------------------- */

function bindNavigation() {
  $$(".nav-item").forEach(item => {
    item.addEventListener("click", event => {
      event.preventDefault();

      const section =
        item.dataset.section;

      if (!section) {
        return;
      }

      if (section === "add") {
        startAddNoha();
        return;
      }

      showSection(section);
    });
  });
}


/* ---------------------------------------------------------
   QUICK ACTIONS
   --------------------------------------------------------- */

function bindQuickActions() {
  $$("[data-go]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();

      const target =
        button.dataset.go;

      if (target === "add") {
        startAddNoha();
        return;
      }

      if (target === "manage") {
        showSection("manage");
        return;
      }

      if (target === "dashboard") {
        showSection("dashboard");
      }
    });
  });
}


/* ---------------------------------------------------------
   FORM CATEGORY OPTIONS
   --------------------------------------------------------- */

function populateFormCategories() {
  const select = els.nohaCategory();

  if (!select) {
    return;
  }

  const currentValue = select.value;

  select.innerHTML = "";

  CATEGORIES
    .filter(category => category !== "All")
    .forEach(category => {
      const option = document.createElement("option");

      option.value = category;
      option.textContent = category;

      select.appendChild(option);
    });

  const matchingCategory = CATEGORIES.find(
    category =>
      category !== "All" &&
      normalizeCategory(category) ===
        normalizeCategory(currentValue)
  );

  if (matchingCategory) {
    select.value = matchingCategory;
  } else {
    select.value = "Other";
  }

  setupCustomCategoryInput();
}
function setupCustomCategoryInput() {
  const select = els.nohaCategory();

  if (!select) {
    return;
  }

  let input =
    document.querySelector("#customCategory");

  if (!input) {
    input = document.createElement("input");

    input.type = "text";
    input.id = "customCategory";
    input.name = "customCategory";
    input.placeholder = "Enter custom category...";
    input.className = "admin-input custom-category-input";

    select.parentElement.appendChild(input);
  }

  updateCustomCategoryVisibility();
}


function updateCustomCategoryVisibility() {
  const select = els.nohaCategory();
  const input =
    document.querySelector("#customCategory");

  if (!select || !input) {
    return;
  }

  const isOther =
    select.value === "Other";

  if (isOther) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}


/* ---------------------------------------------------------
   ADMIN CATEGORY FILTER
   --------------------------------------------------------- */

function populateCategoryFilters() {
  const select =
    els.adminCategoryFilter();

  if (!select) {
    return;
  }

  select.innerHTML = "";

  CATEGORIES.forEach(category => {
    const option =
      document.createElement("option");

    option.value = category;
    option.textContent = category;

    select.appendChild(option);
  });

  select.value = "All";
}


/* ---------------------------------------------------------
   END OF PART 1
   ========================================================= */
   /* =========================================================
   HUSSAINI NOHA KHUWAN — ADMIN PANEL
   PART 2 / 3
   ========================================================= */


/* ---------------------------------------------------------
   LOAD NOHAY
   --------------------------------------------------------- */

async function loadNohay() {
  const table = els.nohaTable();

  if (table) {
    table.innerHTML = `
      <div class="loading-state">
        Loading Nohay...
      </div>
    `;
  }

  try {
    const {
      data,
      error
    } = await hnkSupabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error("Load Nohay error:", error);

      if (table) {
        table.innerHTML = `
          <div class="empty-state">
            <strong>Unable to load Nohay</strong>
            <p>${escapeHtml(error.message)}</p>
          </div>
        `;
      }

      return;
    }

    allNohay = Array.isArray(data)
      ? data
      : [];

    filteredNohay = [...allNohay];

    populateCategoryFilters();
    applyFilters();

    renderDashboardRecent();

  } catch (error) {
    console.error("loadNohay error:", error);

    if (table) {
      table.innerHTML = `
        <div class="empty-state">
          <strong>Something went wrong</strong>
          <p>Please refresh the page.</p>
        </div>
      `;
    }
  }
}


/* ---------------------------------------------------------
   FILTERING
   --------------------------------------------------------- */

function applyFilters() {
  const searchInput =
    els.adminSearch();

  const categoryFilter =
    els.adminCategoryFilter();

  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const selectedCategory =
    categoryFilter
      ? categoryFilter.value
      : "All";

  const normalizedSelected =
    normalizeCategory(selectedCategory);

  filteredNohay =
    allNohay.filter(noha => {

      const nohaCategory =
        normalizeCategory(noha.category);

      const matchesCategory =
        normalizedSelected === "all" ||
        nohaCategory === normalizedSelected;

      if (!matchesCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableText = [
        noha.title,
        noha.reciter,
        noha.category,
        noha.keywords,
        noha.lyrics
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(search);
    });

  renderNohaTable();
}


/* ---------------------------------------------------------
   SEARCH EVENTS
   --------------------------------------------------------- */

function bindSearchEvents() {
  const searchInput =
    els.adminSearch();

  const categoryFilter =
    els.adminCategoryFilter();

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      applyFilters
    );
  }

  if (categoryFilter) {
    categoryFilter.addEventListener(
      "change",
      applyFilters
    );
  }
}


/* ---------------------------------------------------------
   RENDER NOHA TABLE
   --------------------------------------------------------- */

function renderNohaTable() {
  const container =
    els.nohaTable();

  if (!container) {
    return;
  }

  if (!filteredNohay.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No Nohay found</strong>
        <p>
          Search ya category filter change karke
          dobara try karein.
        </p>
      </div>
    `;

    return;
  }

  const rows = filteredNohay.map(noha => {

    const imageHtml = noha.image
      ? `
        <img
          src="${escapeHtml(noha.image)}"
          alt=""
          class="table-thumb"
          loading="lazy"
        >
      `
      : `
        <div class="table-thumb placeholder-thumb">
          No Image
        </div>
      `;

    return `
      <tr>
        <td>
          ${imageHtml}
        </td>

        <td>
          <div class="table-title">
            ${escapeHtml(noha.title || "Untitled")}
          </div>
        </td>

        <td>
          ${escapeHtml(noha.reciter || "—")}
        </td>

        <td>
          <span class="category-badge">
            ${escapeHtml(noha.category || "Other")}
          </span>
        </td>

        <td>
          ${formatDate(noha.created_at)}
        </td>

        <td>
          <div class="table-actions">

            <button
              type="button"
              class="table-action edit"
              data-edit-id="${escapeHtml(noha.id)}"
            >
              Edit
            </button>

            <button
              type="button"
              class="table-action delete"
              data-delete-id="${escapeHtml(noha.id)}"
            >
              Delete
            </button>

          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Reciter</th>
            <th>Category</th>
            <th>Added</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  bindTableActions();
}


/* ---------------------------------------------------------
   TABLE ACTIONS
   --------------------------------------------------------- */

function bindTableActions() {

  $$("[data-edit-id]").forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        const id =
          button.dataset.editId;

        if (id) {
          startEditNoha(id);
        }
      }
    );
  });


  $$("[data-delete-id]").forEach(button => {

    button.addEventListener(
      "click",
      event => {

        event.preventDefault();

        const id =
          button.dataset.deleteId;

        if (id) {
          openDeleteModal(id);
        }
      }
    );
  });
}


/* ---------------------------------------------------------
   START ADD NOHA
   --------------------------------------------------------- */

function startAddNoha() {

  editingId = null;

  resetNohaForm();

  populateFormCategories();

  const title =
    els.formTitle();

  if (title) {
    title.textContent = "Add New Noha";
  }

  const saveText =
    els.saveBtnText();

  if (saveText) {
    saveText.textContent = "Save Noha";
  }

  showSection("add");

  clearMessage();
}


/* ---------------------------------------------------------
   START EDIT NOHA
   --------------------------------------------------------- */

function startEditNoha(id) {

  const noha =
    allNohay.find(
      item => String(item.id) === String(id)
    );

  if (!noha) {
    showSuccessToast(
      "Noha not found."
    );

    return;
  }

  editingId = noha.id;

  populateFormCategories();

  const idInput =
    els.nohaId();

  const titleInput =
    els.nohaTitle();

  const reciterInput =
    els.nohaReciter();

  const categoryInput =
    els.nohaCategory();

  const keywordsInput =
    els.nohaKeywords();

  const lyricsInput =
    els.nohaLyrics();

  if (idInput) {
    idInput.value = noha.id || "";
  }

  if (titleInput) {
    titleInput.value = noha.title || "";
  }

  if (reciterInput) {
    reciterInput.value =
      noha.reciter || "";
  }

  if (categoryInput) {

    const matchingCategory =
      CATEGORIES.find(
        category =>
          category !== "All" &&
          normalizeCategory(category) ===
            normalizeCategory(noha.category)
      );

    categoryInput.value =
      matchingCategory || "Other";
  }

  if (keywordsInput) {
    keywordsInput.value =
      noha.keywords || "";
  }

  if (lyricsInput) {
    lyricsInput.value =
      noha.lyrics || "";
  }

  renderCurrentImage(noha.image);

  const title =
    els.formTitle();

  if (title) {
    title.textContent = "Edit Noha";
  }

  const saveText =
    els.saveBtnText();

  if (saveText) {
    saveText.textContent = "Update Noha";
  }

  clearMessage();

  showSection("add");
}


/* ---------------------------------------------------------
   CURRENT IMAGE
   --------------------------------------------------------- */

function renderCurrentImage(imageUrl) {

  const container =
    els.currentImage();

  if (!container) {
    return;
  }

  if (!imageUrl) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  container.innerHTML = `
    <div class="current-image-inner">
      <span class="current-image-label">
        Current Image
      </span>

      <img
        src="${escapeHtml(imageUrl)}"
        alt="Current Noha image"
      >
    </div>
  `;

  container.classList.remove("hidden");
}


/* ---------------------------------------------------------
   RESET FORM
   --------------------------------------------------------- */

function resetNohaForm() {

  const form =
    els.nohaForm();

  if (form) {
    form.reset();
  }

  editingId = null;

  const idInput =
    els.nohaId();

  if (idInput) {
    idInput.value = "";
  }

  const preview =
    els.uploadPreview();

  if (preview) {
    preview.innerHTML = "";
    preview.classList.add("hidden");
  }

  const currentImage =
    els.currentImage();

  if (currentImage) {
    currentImage.innerHTML = "";
    currentImage.classList.add("hidden");
  }

  populateFormCategories();

  clearMessage();
}


/* ---------------------------------------------------------
   CANCEL EDIT
   --------------------------------------------------------- */

function cancelEdit() {
  resetNohaForm();
  showSection("manage");
}


/* ---------------------------------------------------------
   IMAGE PREVIEW
   --------------------------------------------------------- */

function handleImagePreview(event) {

  const file =
    event.target.files?.[0];

  const preview =
    els.uploadPreview();

  if (!preview) {
    return;
  }

  if (!file) {
    preview.innerHTML = "";
    preview.classList.add("hidden");
    return;
  }

  if (!file.type.startsWith("image/")) {
    preview.innerHTML = `
      <div class="preview-error">
        Please select an image file.
      </div>
    `;

    preview.classList.remove("hidden");
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {

    preview.innerHTML = `
      <div class="upload-preview-inner">
        <span>New Image Preview</span>

        <img
          src="${reader.result}"
          alt="Preview"
        >
      </div>
    `;

    preview.classList.remove("hidden");
  };

  reader.readAsDataURL(file);
}


/* ---------------------------------------------------------
   IMAGE FILE NAME
   --------------------------------------------------------- */

function createSafeFileName(fileName) {

  return String(fileName || "image")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}


/* ---------------------------------------------------------
   UPLOAD IMAGE
   --------------------------------------------------------- */

async function uploadImage(file) {

  if (!file) {
    return null;
  }

  const extension =
    file.name.includes(".")
      ? file.name
          .split(".")
          .pop()
          .toLowerCase()
      : "jpg";

  const baseName =
    createSafeFileName(
      file.name.replace(
        /\.[^/.]+$/,
        ""
      )
    );

  const uniqueName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${baseName}.${extension}`;

  const filePath =
    `nohay/${uniqueName}`;

  const {
    error: uploadError
  } = await hnkSupabase
    .storage
    .from(BUCKET_NAME)
    .upload(
      filePath,
      file,
      {
        cacheControl: "3600",
        upsert: false
      }
    );

  if (uploadError) {
    console.error(
      "Image upload error:",
      uploadError
    );

    throw new Error(
      uploadError.message ||
      "Image upload failed."
    );
  }

  const {
    data
  } = hnkSupabase
    .storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}


/* ---------------------------------------------------------
   SAVE NOHA
   --------------------------------------------------------- */

async function handleNohaSubmit(event) {

  event.preventDefault();

  clearMessage();

  const title =
    els.nohaTitle()?.value.trim();

  const reciter =
    els.nohaReciter()?.value.trim();

  const selectedCategory =
  els.nohaCategory()?.value;

const customCategory =
  document
    .querySelector("#customCategory")
    ?.value.trim();

const category =
  selectedCategory === "Other" &&
  customCategory
    ? customCategory
    : selectedCategory;

if (
  selectedCategory === "Other" &&
  !customCategory
) {
  showMessage(
    "Custom category enter karein."
  );
  return;
}

  const keywords =
    els.nohaKeywords()?.value.trim();

  const lyrics =
    els.nohaLyrics()?.value.trim();

  const imageFile =
    els.nohaImage()?.files?.[0];

  if (!title) {
    showMessage(
      "Noha title required hai."
    );
    return;
  }

  if (!category) {
    showMessage(
      "Category select karein."
    );
    return;
  }

  if (!lyrics) {
    showMessage(
      "Lyrics required hain."
    );
    return;
  }

  const saveButton =
    els.nohaForm()?.querySelector(
      'button[type="submit"]'
    );

  const originalButtonText =
    els.saveBtnText()?.textContent ||
    "Save Noha";

  if (saveButton) {
    saveButton.disabled = true;
  }

  if (els.saveBtnText()) {
    els.saveBtnText().textContent =
      imageFile
        ? "Uploading..."
        : "Saving...";
  }

  try {

    let imageUrl = null;

    const existing =
      editingId
        ? allNohay.find(
            item =>
              String(item.id) ===
              String(editingId)
          )
        : null;

    if (existing?.image) {
      imageUrl = existing.image;
    }

    if (imageFile) {
      imageUrl =
        await uploadImage(imageFile);
    }

    const payload = {
      title,
      reciter: reciter || null,
      category,
      keywords: keywords || null,
      lyrics,
      image: imageUrl
    };

    let result;

    if (editingId) {

      result =
        await hnkSupabase
          .from(TABLE_NAME)
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();

    } else {

      result =
        await hnkSupabase
          .from(TABLE_NAME)
          .insert(payload)
          .select()
          .single();
    }

    if (result.error) {
      console.error(
        "Save Noha error:",
        result.error
      );

      throw new Error(
        result.error.message ||
        "Could not save Noha."
      );
    }

    const savedNoha =
      result.data;

    if (editingId) {

      const index =
        allNohay.findIndex(
          item =>
            String(item.id) ===
            String(editingId)
        );

      if (index !== -1) {
        allNohay[index] =
          savedNoha;
      }

      showSuccessToast(
        "Noha updated successfully."
      );

    } else {

      allNohay.unshift(
        savedNoha
      );

      showSuccessToast(
        "Noha added successfully."
      );
    }

    filteredNohay =
      [...allNohay];

    populateCategoryFilters();
    applyFilters();
    renderDashboardRecent();

    resetNohaForm();
    showSection("manage");

  } catch (error) {

    console.error(
      "handleNohaSubmit error:",
      error
    );

    showMessage(
      error.message ||
      "Noha save nahi ho saka."
    );

  } finally {

    if (saveButton) {
      saveButton.disabled = false;
    }

    if (els.saveBtnText()) {
      els.saveBtnText().textContent =
        originalButtonText;
    }
  }
}


/* ---------------------------------------------------------
   DELETE MODAL
   --------------------------------------------------------- */

function openDeleteModal(id) {

  const noha =
    allNohay.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!noha) {
    return;
  }

  deletingId = noha.id;

  const modal =
    els.deleteModal();

  if (!modal) {
    return;
  }

  const title =
    modal.querySelector(
      ".delete-noha-title"
    ) ||
    modal.querySelector(
      "[data-delete-title]"
    );

  if (title) {
    title.textContent =
      noha.title || "this Noha";
  }

  modal.classList.remove("hidden");
}


function closeDeleteModal() {

  deletingId = null;

  const modal =
    els.deleteModal();

  if (modal) {
    modal.classList.add("hidden");
  }
}


/* ---------------------------------------------------------
   CONFIRM DELETE
   --------------------------------------------------------- */

async function confirmDeleteNoha() {

  if (!deletingId) {
    return;
  }

  const id =
    deletingId;

  const button =
    els.confirmDelete();

  if (button) {
    button.disabled = true;
    button.textContent = "Deleting...";
  }

  try {

    const noha =
      allNohay.find(
        item =>
          String(item.id) ===
          String(id)
      );

    const {
      error
    } = await hnkSupabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Delete Noha error:",
        error
      );

      throw new Error(
        error.message ||
        "Could not delete Noha."
      );
    }

    /*
      Delete database record first.
      Image is optional, so image deletion
      failure should not block successful
      record deletion.
    */

    if (noha?.image) {
      await tryDeleteStorageImage(
        noha.image
      );
    }

    allNohay =
      allNohay.filter(
        item =>
          String(item.id) !==
          String(id)
      );

    filteredNohay =
      filteredNohay.filter(
        item =>
          String(item.id) !==
          String(id)
      );

    closeDeleteModal();

    renderNohaTable();
    renderDashboardRecent();

    showSuccessToast(
      "Noha deleted successfully."
    );

  } catch (error) {

    console.error(
      "confirmDeleteNoha error:",
      error
    );

    showMessage(
      error.message ||
      "Delete failed."
    );

    closeDeleteModal();

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Delete";
    }
  }
}


/* ---------------------------------------------------------
   DELETE STORAGE IMAGE
   --------------------------------------------------------- */

async function tryDeleteStorageImage(
  publicUrl
) {

  try {

    if (!publicUrl) {
      return;
    }

    const marker =
      `/storage/v1/object/public/${BUCKET_NAME}/`;

    const index =
      publicUrl.indexOf(marker);

    if (index === -1) {
      return;
    }

    const path =
      publicUrl.slice(
        index + marker.length
      );

    if (!path) {
      return;
    }

    const {
      error
    } = await hnkSupabase
      .storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.warn(
        "Storage image delete warning:",
        error
      );
    }

  } catch (error) {

    console.warn(
      "tryDeleteStorageImage warning:",
      error
    );
  }
}


/* ---------------------------------------------------------
   END OF PART 2
   ========================================================= */
   /* =========================================================
   HUSSAINI NOHA KHUWAN — ADMIN PANEL
   PART 3 / 3 — FINAL
   ========================================================= */


/* ---------------------------------------------------------
   DASHBOARD
   --------------------------------------------------------- */

async function loadDashboard() {
  try {
    const {
      count,
      error
    } = await hnkSupabase
      .from(TABLE_NAME)
      .select("*", {
        count: "exact",
        head: true
      });

    if (error) {
      console.error(
        "Dashboard count error:",
        error
      );
    }

    updateStat(
      [
        "#totalNohay",
        "#totalNoha",
        "#totalCount",
        "[data-stat='total']"
      ],
      count ?? allNohay.length
    );

  } catch (error) {
    console.error(
      "loadDashboard error:",
      error
    );

    updateStat(
      [
        "#totalNohay",
        "#totalNoha",
        "#totalCount",
        "[data-stat='total']"
      ],
      allNohay.length
    );
  }

  renderDashboardRecent();
}


function updateStat(selectors, value) {
  for (const selector of selectors) {
    const element = $(selector);

    if (element) {
      element.textContent =
        String(value);

      return;
    }
  }
}


function renderDashboardRecent() {

  const container =
    els.dashboardRecent();

  if (!container) {
    return;
  }

  const recent =
    [...allNohay]
      .sort((a, b) => {
        const dateA =
          new Date(
            a.created_at || 0
          ).getTime();

        const dateB =
          new Date(
            b.created_at || 0
          ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);

  if (!recent.length) {

    container.innerHTML = `
      <div class="empty-state">
        <strong>No Nohay yet</strong>
        <p>
          Add your first Noha to get started.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    recent.map(noha => `
      <div class="recent-item">

        <div class="recent-item-info">

          <strong>
            ${escapeHtml(
              noha.title || "Untitled"
            )}
          </strong>

          <span>
            ${escapeHtml(
              noha.reciter || "—"
            )}
          </span>

        </div>

        <div class="recent-item-meta">

          <span class="category-badge">
            ${escapeHtml(
              noha.category || "Other"
            )}
          </span>

          <small>
            ${formatDate(
              noha.created_at
            )}
          </small>

        </div>

      </div>
    `)
    .join("");
}


/* ---------------------------------------------------------
   FORM EVENTS
   --------------------------------------------------------- */

function bindFormEvents() {

const categoryInput =
  els.nohaCategory();

if (categoryInput) {
  categoryInput.addEventListener(
    "change",
    updateCustomCategoryVisibility
  );
}

  const form =
    els.nohaForm();

  if (form) {
    form.addEventListener(
      "submit",
      handleNohaSubmit
    );
  }


  const imageInput =
    els.nohaImage();

  if (imageInput) {
    imageInput.addEventListener(
      "change",
      handleImagePreview
    );
  }


  const cancelButton =
    els.cancelEditBtn();

  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      event => {
        event.preventDefault();
        cancelEdit();
      }
    );
  }


  const resetButton =
    els.resetFormBtn();

  if (resetButton) {
    resetButton.addEventListener(
      "click",
      event => {
        event.preventDefault();
        resetNohaForm();
      }
    );
  }
}


/* ---------------------------------------------------------
   DELETE EVENTS
   --------------------------------------------------------- */

function bindDeleteEvents() {

  const cancelButton =
    els.cancelDelete();

  if (cancelButton) {
    cancelButton.addEventListener(
      "click",
      event => {
        event.preventDefault();
        closeDeleteModal();
      }
    );
  }


  const confirmButton =
    els.confirmDelete();

  if (confirmButton) {
    confirmButton.addEventListener(
      "click",
      event => {
        event.preventDefault();
        confirmDeleteNoha();
      }
    );
  }


  const modal =
    els.deleteModal();

  if (modal) {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {
          closeDeleteModal();
        }

      }
    );
  }
}


/* ---------------------------------------------------------
   LOGIN EVENTS
   --------------------------------------------------------- */

function bindLoginEvents() {

  const form =
    els.loginForm();

  if (form) {
    form.addEventListener(
      "submit",
      handleLogin
    );
  }
}


/* ---------------------------------------------------------
   LOGOUT EVENT
   --------------------------------------------------------- */

function bindLogoutEvent() {

  const logoutButton =
    $("#logoutBtn");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener(
    "click",
    event => {

      event.preventDefault();

      handleLogout();
    }
  );
}


/* ---------------------------------------------------------
   SUCCESS TOAST EVENT
   --------------------------------------------------------- */

function bindToastEvents() {

  const closeButton =
    els.closeSuccessToast();

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        const toast =
          els.successToast();

        if (toast) {
          toast.classList.add(
            "hidden"
          );
        }

      }
    );
  }
}


/* ---------------------------------------------------------
   MOBILE MENU
   --------------------------------------------------------- */

function bindMobileMenu() {

  const button =
    $("#mobileMenuBtn");

  const sidebar =
    $(".sidebar");

  if (!button || !sidebar) {
    return;
  }

  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      sidebar.classList.toggle(
        "mobile-open"
      );
    }
  );


  $$(".nav-item").forEach(item => {

    item.addEventListener(
      "click",
      () => {
        sidebar.classList.remove(
          "mobile-open"
        );
      }
    );

  });
}


/* ---------------------------------------------------------
   AUTH STATE LISTENER
   --------------------------------------------------------- */

function bindAuthListener() {

  hnkSupabase.auth.onAuthStateChange(
    async (event, session) => {

      if (
        event === "SIGNED_OUT"
      ) {
        showLoginScreen();
        return;
      }

      if (
        event === "SIGNED_IN" &&
        session?.user
      ) {

        if (
          session.user.id !==
          ADMIN_UID
        ) {

          await hnkSupabase
            .auth
            .signOut();

          showLoginScreen();

          showLoginMessage(
            "This account is not authorized as admin."
          );

          return;
        }

        showAdminApp(
          session.user
        );

        await loadDashboard();
        await loadNohay();
      }
    }
  );
}


/* ---------------------------------------------------------
   KEYBOARD SHORTCUTS
   --------------------------------------------------------- */

function bindKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeDeleteModal();

      }

    }
  );
}


/* ---------------------------------------------------------
   INITIALIZE
   --------------------------------------------------------- */

async function init() {

  console.log(
    "Hussaini Noha Khuwan Admin initialized."
  );

  bindLoginEvents();
  bindLogoutEvent();

  bindNavigation();
  bindQuickActions();

  bindSearchEvents();

  bindFormEvents();
  bindDeleteEvents();

  bindToastEvents();
  bindMobileMenu();

  bindKeyboardShortcuts();

  bindAuthListener();

  populateFormCategories();
  populateCategoryFilters();

  await checkAuth();
}


/* ---------------------------------------------------------
   DOM READY
   --------------------------------------------------------- */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();

}


/* =========================================================
   END OF ADMIN.JS
   ========================================================= */