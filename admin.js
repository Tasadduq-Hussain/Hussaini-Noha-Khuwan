const SUPABASE_URL = "https://xxigwjuzfrffgznuajui.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DCnF_aVt833TFuGDHwtU8Q_cm17-dZn";

const ADMIN_UID = "dfbf0317-3a66-497c-8cde-1180bba49db8";

let sb = null;
let current = [];
let selectedFile = null;

const $ = (s) => document.querySelector(s);


/* =========================
   HELPERS
========================= */

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


function loadScript() {
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


/* =========================
   INIT
========================= */

async function init() {

  try {

    await loadScript();

    sb = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );


    const {
      data: { session }
    } = await sb.auth.getSession();


    if (session) {

      if (session.user.id !== ADMIN_UID) {

        await sb.auth.signOut();

        $("#loginMsg").textContent =
          "Access denied. Admin account required.";

        return;
      }

      showDash();
    }


    sb.auth.onAuthStateChange(
      async (event, sessionData) => {

        if (
          sessionData &&
          sessionData.user.id === ADMIN_UID
        ) {

          showDash();

        } else if (sessionData) {

          await sb.auth.signOut();

          showLogin();

          $("#loginMsg").textContent =
            "Access denied. Admin account required.";
        }

      }
    );


  } catch (error) {

    console.error(error);

    $("#loginMsg").textContent =
      "Supabase connection failed. Please refresh the page.";
  }
}


/* =========================
   LOGIN / DASHBOARD
========================= */

function showDash() {

  $("#loginBox").classList.add("hidden");
  $("#dashboard").classList.remove("hidden");

  loadList();
}


function showLogin() {

  $("#loginBox").classList.remove("hidden");
  $("#dashboard").classList.add("hidden");
}


/* =========================
   LOGIN
========================= */

$("#loginBtn").onclick = async () => {

  const email =
    $("#email").value.trim();

  const password =
    $("#password").value;


  if (!email || !password) {

    $("#loginMsg").textContent =
      "Please enter your email and password.";

    return;
  }


  $("#loginBtn").disabled = true;

  $("#loginMsg").textContent =
    "Logging in...";


  try {

    const {
      data,
      error
    } =
      await sb.auth.signInWithPassword({
        email,
        password
      });


    if (error) {
      throw error;
    }


    if (!data.session) {
      throw new Error("Login session could not be created.");
    }


    /* ADMIN CHECK */

    if (
      data.session.user.id !== ADMIN_UID
    ) {

      await sb.auth.signOut();

      throw new Error(
        "Access denied. This account is not authorized."
      );
    }


    $("#loginMsg").textContent = "";

    showDash();


  } catch (error) {

    console.error(error);

    $("#loginMsg").textContent =
      error.message ||
      "Login failed.";


  } finally {

    $("#loginBtn").disabled = false;
  }
};


/* =========================
   LOGOUT
========================= */

$("#logoutBtn").onclick = async () => {

  $("#logoutBtn").disabled = true;

  await sb.auth.signOut();

  location.reload();
};


/* =========================
   LOAD NOHAY
========================= */

async function loadList() {

  $("#adminList").innerHTML =
    "<p>Loading Nohay...</p>";


  const {
    data,
    error
  } =
    await sb
      .from("nohas")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(error);

    $("#adminList").innerHTML =
      `<p>Error loading Nohay: ${esc(error.message)}</p>`;

    return;
  }


  current = data || [];

  $("#total").textContent =
    current.length;


  $("#adminList").innerHTML =
    current.map((n) => `

      <div class="noha-row">

        <img
          src="${esc(n.image_url || "logo.png")}"
          alt=""
        >

        <div class="grow">

          <b>${esc(n.title)}</b>

          <div>
            ${esc(n.category || "Other")}
          </div>

        </div>

        <button
          onclick="editNoha('${n.id}')"
        >
          Edit
        </button>

        <button
          class="delete"
          onclick="deleteNoha('${n.id}')"
        >
          Delete
        </button>

      </div>

    `).join("") || "<p>No Nohay yet.</p>";
}


/* =========================
   CATEGORY
========================= */

$("#category").addEventListener(
  "change",
  () => {

    if (
      $("#category").value === "Other"
    ) {

      $("#customCategory")
        .classList
        .remove("hidden");

      $("#customCategory").focus();

    } else {

      $("#customCategory")
        .classList
        .add("hidden");

      $("#customCategory").value = "";
    }

  }
);


/* =========================
   IMAGE PREVIEW
========================= */

$("#image").onchange = () => {

  selectedFile =
    $("#image").files[0] || null;


  if (!selectedFile) {

    $("#preview").innerHTML = "";

    return;
  }


  const url =
    URL.createObjectURL(selectedFile);


  $("#preview").innerHTML = `
    <img
      src="${url}"
      alt="Preview"
    >
  `;
};


/* =========================
   GET STORAGE PATH
========================= */

function getStoragePath(imageUrl) {

  if (!imageUrl) {
    return null;
  }


  try {

    const marker =
      "/storage/v1/object/public/noha-images/";

    const index =
      imageUrl.indexOf(marker);


    if (index === -1) {
      return null;
    }


    return imageUrl.substring(
      index + marker.length
    );

  } catch {

    return null;
  }
}


/* =========================
   UPLOAD IMAGE
========================= */

async function uploadImage(file) {

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const safeExtension =
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif"
    ].includes(extension)
      ? extension
      : "jpg";


  const path =
    `${crypto.randomUUID()}.${safeExtension}`;


  const {
    error
  } =
    await sb.storage
      .from("noha-images")
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType:
            file.type || "image/jpeg"
        }
      );


  if (error) {
    throw error;
  }


  const {
    data
  } =
    sb.storage
      .from("noha-images")
      .getPublicUrl(path);


  return {
    url: data.publicUrl,
    path
  };
}


/* =========================
   SAVE / UPDATE NOHA
========================= */

$("#nohaForm").onsubmit =
  async (e) => {

    e.preventDefault();


    const id =
      $("#editId").value;


    $("#saveBtn").disabled = true;

    $("#saveBtn").textContent =
      "Saving...";


    try {

      const existing =
        current.find(
          (n) =>
            String(n.id) ===
            String(id)
        );


      let imageUrl =
        existing?.image_url || "";


      let oldImagePath = null;

      let newImagePath = null;


      /* NEW IMAGE */

      if (selectedFile) {

        const uploaded =
          await uploadImage(
            selectedFile
          );


        imageUrl =
          uploaded.url;

        newImagePath =
          uploaded.path;


        if (existing?.image_url) {

          oldImagePath =
            getStoragePath(
              existing.image_url
            );
        }
      }


      if (!imageUrl) {

        throw new Error(
          "Please select a lyrics image."
        );
      }


      /* CATEGORY */

      let finalCategory =
        $("#category").value;


      if (
        finalCategory === "Other"
      ) {

        finalCategory =
          $("#customCategory")
            .value
            .trim();


        if (!finalCategory) {

          throw new Error(
            "Please enter a category."
          );
        }
      }


      /* DATA */

      const row = {

        title:
          $("#title")
            .value
            .trim(),

        category:
          finalCategory,

        lyrics:
          $("#lyrics")
            .value
            .trim(),

        keywords:
          $("#keywords")
            .value
            .trim()
            .toLowerCase(),

        image_url:
          imageUrl
      };


      if (!row.title) {

        throw new Error(
          "Noha title is required."
        );
      }


      let result;


      /* UPDATE */

      if (id) {

        result =
          await sb
            .from("nohas")
            .update(row)
            .eq("id", id);

      }


      /* INSERT */

      else {

        result =
          await sb
            .from("nohas")
            .insert(row);
      }


      if (result.error) {

        /* If database failed after uploading,
           remove newly uploaded image */

        if (newImagePath) {

          await sb.storage
            .from("noha-images")
            .remove([
              newImagePath
            ]);
        }


        throw result.error;
      }


      /* DELETE OLD IMAGE */

      if (
        oldImagePath &&
        newImagePath &&
        oldImagePath !== newImagePath
      ) {

        const {
          error: deleteImageError
        } =
          await sb.storage
            .from("noha-images")
            .remove([
              oldImagePath
            ]);


        if (deleteImageError) {

          console.warn(
            "Old image could not be deleted:",
            deleteImageError
          );
        }
      }


      resetForm();

      await loadList();


      alert(
        id
          ? "Noha updated successfully!"
          : "Noha uploaded successfully!"
      );


    } catch (error) {

      console.error(error);

      alert(
        "Error:\n" +
        (
          error.message ||
          "Noha could not be saved."
        )
      );


    } finally {

      $("#saveBtn").disabled = false;

      $("#saveBtn").textContent =
        "💾 Save Noha";
    }
  };


/* =========================
   EDIT NOHA
========================= */

window.editNoha =
  (id) => {

    const n =
      current.find(
        (x) =>
          String(x.id) ===
          String(id)
      );


    if (!n) {
      return;
    }


    $("#editId").value =
      n.id;


    $("#title").value =
      n.title || "";


    $("#lyrics").value =
      n.lyrics || "";


    $("#keywords").value =
      n.keywords || "";


    const standardCategories = [
      "Muharram",
      "Ayyam-e-Ali",
      "Ayyam-e-Fatmiya"
    ];


    if (
      standardCategories.includes(
        n.category
      )
    ) {

      $("#category").value =
        n.category;


      $("#customCategory")
        .classList
        .add("hidden");


      $("#customCategory").value =
        "";

    } else {

      $("#category").value =
        "Other";


      $("#customCategory")
        .classList
        .remove("hidden");


      $("#customCategory").value =
        n.category || "";
    }


    $("#preview").innerHTML =
      n.image_url
        ? `
          <img
            src="${esc(n.image_url)}"
            alt="Current image"
          >
        `
        : "";


    $("#cancelEdit")
      .classList
      .remove("hidden");


    $("#saveBtn").textContent =
      "✏️ Update Noha";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };


/* =========================
   DELETE NOHA
========================= */

window.deleteNoha =
  async (id) => {

    const n =
      current.find(
        (x) =>
          String(x.id) ===
          String(id)
      );


    if (!n) {
      return;
    }


    const confirmed =
      confirm(
        `Are you sure you want to delete "${n.title}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      /* DELETE DATABASE ROW */

      const {
        error
      } =
        await sb
          .from("nohas")
          .delete()
          .eq("id", id);


      if (error) {
        throw error;
      }


      /* DELETE IMAGE */

      const imagePath =
        getStoragePath(
          n.image_url
        );


      if (imagePath) {

        const {
          error:
            imageDeleteError
        } =
          await sb.storage
            .from("noha-images")
            .remove([
              imagePath
            ]);


        if (imageDeleteError) {

          console.warn(
            "Image could not be deleted:",
            imageDeleteError
          );
        }
      }


      await loadList();


      alert(
        "Noha deleted successfully!"
      );


    } catch (error) {

      console.error(error);

      alert(
        "Delete failed:\n" +
        (
          error.message ||
          "Noha could not be deleted."
        )
      );
    }
  };


/* =========================
   RESET FORM
========================= */

function resetForm() {

  $("#nohaForm").reset();


  $("#editId").value =
    "";


  $("#preview").innerHTML =
    "";


  $("#customCategory")
    .classList
    .add("hidden");


  $("#customCategory").value =
    "";


  selectedFile = null;


  $("#cancelEdit")
    .classList
    .add("hidden");


  $("#saveBtn").textContent =
    "💾 Save Noha";
}


$("#cancelEdit").onclick =
  resetForm;


/* =========================
   START
========================= */

init();