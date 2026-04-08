const API_KEY  = "373c7a1f";
const API_BASE = "https://www.omdbapi.com/";
const POPULAR_IMDB_IDS = ["tt0111161", "tt0068646", "tt0468569", "tt0133093", "tt0109830", "tt1375666", "tt0816692", "tt0120737","tt0120697","tt0102926"];
const OTHER_IMDB_IDS = ["tt0071562", "tt0050083", "tt0108052", "tt0167260", "tt0110912", "tt0120815", "tt0172495", "tt6751668", "tt0080684", "tt7286456"];

let watchlist     = [];
let lastResults   = [];
let sidebarOpen   = false;
let popularMovies = [];
let otherMovies   = [];
let popularLoading = false;
let otherLoading = false;

const searchInput   = document.getElementById("searchInput");
const clearBtn      = document.getElementById("clearBtn");
const loader        = document.getElementById("loader");
const errorBox      = document.getElementById("errorBox");
const errorText     = document.getElementById("errorText");
const moviesGrid    = document.getElementById("moviesGrid");
const popularGrid   = document.getElementById("popularGrid");
const popularSection= document.getElementById("popularSection");
const otherGrid     = document.getElementById("otherGrid");
const otherSection  = document.getElementById("otherSection");
const searchSection = document.getElementById("searchSection");
const noResults     = document.getElementById("noResults");
const resultsBar    = document.getElementById("resultsBar");
const resultsCount  = document.getElementById("resultsCount");
const sortSelect    = document.getElementById("sortSelect");
const themeToggle   = document.getElementById("themeToggle");
const themeIcon     = document.getElementById("themeIcon");
const themeLabel    = document.getElementById("themeLabel");

const wlSidebar     = document.getElementById("wlSidebar");
const wlNavBtn      = document.getElementById("wlNavBtn");
const navWlCount    = document.getElementById("navWlCount");
const wlCount       = document.getElementById("wlCount");
const wlEmptyState  = document.getElementById("wlEmptyState");
const wlList        = document.getElementById("wlList");
const wlActions     = document.getElementById("wlActions");
const clearAllBtn   = document.getElementById("clearAllBtn");
const randomBtn     = document.getElementById("randomBtn");
const mobBackdrop   = document.getElementById("mobBackdrop");

const detailOverlay = document.getElementById("detailOverlay");
const detailSkeleton= document.getElementById("detailSkeleton");
const detailBody    = document.getElementById("detailBody");
const dPoster       = document.getElementById("dPoster");
const dTitle        = document.getElementById("dTitle");
const dChips        = document.getElementById("dChips");
const dScoreRow     = document.getElementById("dScoreRow");
const dGenres       = document.getElementById("dGenres");
const dPlot         = document.getElementById("dPlot");
const dCrew         = document.getElementById("dCrew");
const detailWlBtn   = document.getElementById("detailWlBtn");
const detailCloseBtn= document.getElementById("detailCloseBtn");

const randomOverlay = document.getElementById("randomOverlay");
const rPoster       = document.getElementById("rPoster");
const rTitle        = document.getElementById("rTitle");
const rYear         = document.getElementById("rYear");
const randomCloseBtn= document.getElementById("randomCloseBtn");
const randomAgainBtn= document.getElementById("randomAgainBtn");


window.addEventListener("DOMContentLoaded", () => {
  applyInitialTheme();
  bindThemeToggle();
  loadWatchlist();
  renderWatchlist();
  clearBtn.classList.add("hidden");
  loadHomeSections();
});

function loadHomeSections() {
  showHomeSections();
  loadPopularMovies();
  loadOtherMovies();
}

function showHomeSections() {
  show(popularSection);
  show(otherSection);
}

function hideHomeSections() {
  hide(popularSection);
  hide(otherSection);
}

function applyInitialTheme() {
  const savedTheme = localStorage.getItem("cinevault_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : (prefersDark ? "dark" : "light");

  setTheme(initialTheme);
}

function bindThemeToggle() {
  if (!themeToggle) return;
  themeToggle.addEventListener("click", () => {
    const current = document.body.dataset.theme === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("cinevault_theme", next);
  });
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  if (!themeIcon || !themeLabel || !themeToggle) return;

  if (theme === "light") {
    themeIcon.textContent = "🌙";
    themeLabel.textContent = "Dark";
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
  } else {
    themeIcon.textContent = "☀";
    themeLabel.textContent = "Light";
    themeToggle.setAttribute("aria-label", "Switch to light mode");
  }
}


searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();

  if (q.length > 0) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }

  if (q.length === 0) {
    resetToLanding();
    return;
  }

  searchMovies(q);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.classList.add("hidden");
  resetToLanding();
  searchInput.focus();
});


async function searchMovies(query) {
  hideHomeSections();
  show(searchSection);
  showLoader();
  hideError();
  moviesGrid.innerHTML = "";
  hide(noResults);
  hide(resultsBar);

  try {
    const res  = await fetch(`${API_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
    if (!res.ok) throw new Error(`Network error (${res.status})`);

    const data = await res.json();
    hideLoader();

    if (data.Response === "True" && data.Search && data.Search.length > 0) {
      lastResults = data.Search;
      show(resultsBar);
      updateResultsCount(data.Search.length, query);
      renderCards(data.Search);
    } else {
      lastResults = [];
      show(noResults);
    }

  } catch (err) {
    hideLoader();
    showError("Couldn't connect. Check your API key or internet connection.");
    console.error(err);
  }
}


async function loadPopularMovies() {
  if (popularMovies.length > 0) {
    renderPopularMovies();
    return;
  }
  if (popularLoading) return;

  popularLoading = true;

  try {
    const requests = POPULAR_IMDB_IDS.map(async (imdbID) => {
      const res = await fetch(`${API_BASE}?apikey=${API_KEY}&i=${imdbID}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.Response !== "True") return null;
      return {
        imdbID: data.imdbID,
        Title: data.Title,
        Year: data.Year,
        Poster: data.Poster
      };
    });

    popularMovies = (await Promise.all(requests)).filter(Boolean);

    if (popularMovies.length > 0) {
      renderPopularMovies();
    }
  } catch (err) {
    popularMovies = [];
    console.error(err);
  } finally {
    popularLoading = false;
  }
}


async function loadOtherMovies() {
  if (otherMovies.length > 0) {
    renderOtherMovies();
    return;
  }
  if (otherLoading) return;

  otherLoading = true;

  try {
    const requests = OTHER_IMDB_IDS.map(async (imdbID) => {
      const res = await fetch(`${API_BASE}?apikey=${API_KEY}&i=${imdbID}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.Response !== "True") return null;
      return {
        imdbID: data.imdbID,
        Title: data.Title,
        Year: data.Year,
        Poster: data.Poster
      };
    });

    otherMovies = (await Promise.all(requests)).filter(Boolean);

    if (otherMovies.length > 0) {
      renderOtherMovies();
    }
  } catch (err) {
    otherMovies = [];
    console.error(err);
  } finally {
    otherLoading = false;
  }
}


function renderPopularMovies() {
  if (!popularGrid || !popularSection) return;
  if (popularMovies.length === 0) {
    hide(popularSection);
    return;
  }
  show(popularSection);
  renderCards(popularMovies, popularGrid);
}

function renderOtherMovies() {
  if (!otherGrid || !otherSection) return;
  if (otherMovies.length === 0) {
    hide(otherSection);
    return;
  }
  show(otherSection);
  renderCards(otherMovies, otherGrid);
}


async function fetchDetail(imdbID) {
  openDetailModal();

  try {
    const res  = await fetch(`${API_BASE}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
    const data = await res.json();

    if (data.Response === "True") {
      populateDetail(data);
    } else {
      closeDetailModal();
      showError("Couldn't load movie details — please try again.");
    }

  } catch (err) {
    closeDetailModal();
    showError("Something went wrong loading the details.");
    console.error(err);
  }
}


sortSelect.addEventListener("change", () => {
  if (lastResults.length === 0) return;

  const val  = sortSelect.value;
  let sorted = [...lastResults];

  if (val === "year-desc") {
    sorted = sorted.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
  } else if (val === "year-asc") {
    sorted = sorted.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
  } else if (val === "az") {
    sorted = sorted.sort((a, b) => a.Title.localeCompare(b.Title));
  } else if (val === "za") {
    sorted = sorted.sort((a, b) => b.Title.localeCompare(a.Title));
  }

  renderCards(val === "default" ? lastResults : sorted);
});


function renderCards(movies, targetGrid = moviesGrid) {
  if (!targetGrid) return;
  targetGrid.innerHTML = "";

  movies.forEach((movie, i) => {
    const saved = isSaved(movie.imdbID);

    const card = document.createElement("div");
    card.className = "movie-card" + (saved ? " saved" : "");
    card.dataset.id = movie.imdbID;
    card.style.animationDelay = `${i * 0.035}s`;

    const posterHTML = movie.Poster && movie.Poster !== "N/A"
      ? `<img class="card-poster" src="${movie.Poster}" alt="${safe(movie.Title)}" loading="lazy" />`
      : `<div class="no-poster-box"><span>🎞️</span><p>No Image</p></div>`;

    const saveLabel = saved ? "✓ Saved" : "+ Watchlist";

    card.innerHTML = `
      <div class="card-poster-wrap">
        ${posterHTML}
        <button class="card-bookmark-btn" data-id="${movie.imdbID}" title="${saved ? "Remove from watchlist" : "Add to watchlist"}">
          <svg viewBox="0 0 24 24" fill="${saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
      <div class="card-body">
        <p class="card-title">${safe(movie.Title)}</p>
        <p class="card-year">${movie.Year}</p>
        <div class="card-actions">
          <button class="btn-card-details" data-id="${movie.imdbID}">Details</button>
          <button class="btn-card-save" data-id="${movie.imdbID}">${saveLabel}</button>
        </div>
      </div>
    `;

    card.querySelector(".card-bookmark-btn").addEventListener("click", () => {
      toggleSave(movie, card);
    });

    card.querySelector(".btn-card-details").addEventListener("click", () => {
      fetchDetail(movie.imdbID);
    });

    card.querySelector(".btn-card-save").addEventListener("click", () => {
      toggleSave(movie, card);
    });

    targetGrid.appendChild(card);
  });
}


function toggleSave(movie, cardEl) {
  if (isSaved(movie.imdbID)) {
    removeMovie(movie.imdbID);
  } else {
    addMovie(movie);

    wlCount.style.transform = "scale(1.5)";
    navWlCount.style.transform = "scale(1.5)";
    setTimeout(() => {
      wlCount.style.transform = "";
      navWlCount.style.transform = "";
    }, 220);
  }

  syncMovieCards(movie.imdbID);
  renderWatchlist();
  saveWatchlist();

  if (detailWlBtn.dataset.id === movie.imdbID) {
    syncDetailBtn(movie.imdbID);
  }
}

function addMovie(movie) {
  if (!isSaved(movie.imdbID)) watchlist.push(movie);
}

function removeMovie(imdbID) {
  watchlist = watchlist.filter(m => m.imdbID !== imdbID);
}

function isSaved(imdbID) {
  return watchlist.some(m => m.imdbID === imdbID);
}

function syncMovieCards(imdbID) {
  const saved = isSaved(imdbID);
  document.querySelectorAll(`.movie-card[data-id="${imdbID}"]`).forEach((card) => {
    card.classList.toggle("saved", saved);
    const btn = card.querySelector(".btn-card-save");
    const svg = card.querySelector(".card-bookmark-btn svg");
    if (btn) btn.textContent = saved ? "✓ Saved" : "+ Watchlist";
    if (svg) svg.setAttribute("fill", saved ? "currentColor" : "none");
  });
}

function renderWatchlist() {
  wlList.innerHTML = "";
  wlCount.textContent    = watchlist.length;
  navWlCount.textContent = watchlist.length;

  if (watchlist.length === 0) {
    show(wlEmptyState);
    hide(wlActions);
    return;
  }

  hide(wlEmptyState);
  show(wlActions);

  watchlist.forEach(movie => {
    const li = document.createElement("li");
    li.className  = "wl-item";
    li.dataset.id = movie.imdbID;

    const thumbHTML = movie.Poster && movie.Poster !== "N/A"
      ? `<img class="wl-thumb" src="${movie.Poster}" alt="${safe(movie.Title)}" loading="lazy" />`
      : `<div class="wl-thumb-ph">🎞️</div>`;

    li.innerHTML = `
      ${thumbHTML}
      <div class="wl-item-info">
        <p class="wl-item-title" title="${safe(movie.Title)}">${safe(movie.Title)}</p>
        <p class="wl-item-year">${movie.Year}</p>
      </div>
      <button class="wl-item-del" data-id="${movie.imdbID}" title="Remove">✕</button>
    `;

    li.querySelector(".wl-item-del").addEventListener("click", () => {
      removeMovie(movie.imdbID);
      renderWatchlist();
      saveWatchlist();
      syncMovieCards(movie.imdbID);
    });

    wlList.appendChild(li);
  });
}

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Remove everything from your watchlist?")) return;

  watchlist = [];
  renderWatchlist();
  saveWatchlist();

  document.querySelectorAll(".movie-card.saved").forEach(card => {
    card.classList.remove("saved");
    const btn = card.querySelector(".btn-card-save");
    const svg = card.querySelector(".card-bookmark-btn svg");
    if (btn) btn.textContent = "+ Watchlist";
    if (svg) svg.setAttribute("fill", "none");
  });
});


function openDetailModal() {
  show(detailSkeleton);
  hide(detailBody);
  show(detailOverlay);
  document.body.style.overflow = "hidden";
}

function closeDetailModal() {
  hide(detailOverlay);
  document.body.style.overflow = "";
}

function populateDetail(data) {
  dPoster.src = data.Poster && data.Poster !== "N/A" ? data.Poster : "";
  dPoster.alt = data.Title;
  if (!dPoster.src) dPoster.style.display = "none";
  else dPoster.style.display = "block";

  dTitle.textContent = data.Title;

  dChips.innerHTML = "";
  [data.Year, data.Runtime, data.Rated, data.Country ? data.Country.split(",")[0] : null]
    .filter(v => v && v !== "N/A")
    .forEach(val => {
      const s = document.createElement("span");
      s.className   = "chip";
      s.textContent = val;
      dChips.appendChild(s);
    });

  dScoreRow.innerHTML = "";
  if (data.Ratings && data.Ratings.length > 0) {
    data.Ratings.forEach(r => {
      const box = document.createElement("div");
      box.className = "score-box";
      box.innerHTML = `
        <span class="score-source">${r.Source.replace("Internet Movie Database", "IMDb")}</span>
        <span class="score-val">${r.Value}</span>
      `;
      dScoreRow.appendChild(box);
    });
  }

  dGenres.innerHTML = "";
  if (data.Genre && data.Genre !== "N/A") {
    data.Genre.split(", ").forEach(g => {
      const tag = document.createElement("span");
      tag.className   = "genre-tag";
      tag.textContent = g;
      dGenres.appendChild(tag);
    });
  }

  dPlot.textContent = data.Plot && data.Plot !== "N/A" ? data.Plot : "No plot available.";

  dCrew.innerHTML = "";
  const crewFields = [
    { role: "Director",  val: data.Director },
    { role: "Writer",    val: data.Writer },
    { role: "Cast",      val: data.Actors },
    { role: "Language",  val: data.Language }
  ];
  crewFields
    .filter(c => c.val && c.val !== "N/A")
    .forEach(c => {
      const div = document.createElement("div");
      div.className = "crew-item";
      div.innerHTML = `
        <p class="crew-role">${c.role}</p>
        <p class="crew-name">${c.val}</p>
      `;
      dCrew.appendChild(div);
    });

  detailWlBtn.dataset.id = data.imdbID;
  syncDetailBtn(data.imdbID);

  detailWlBtn.onclick = () => {
    const movieObj = {
      imdbID: data.imdbID,
      Title:  data.Title,
      Year:   data.Year,
      Poster: data.Poster
    };
    toggleSave(movieObj);
  };

  hide(detailSkeleton);
  show(detailBody);
}

function syncDetailBtn(imdbID) {
  if (isSaved(imdbID)) {
    detailWlBtn.textContent = "✓ In Watchlist";
    detailWlBtn.classList.add("is-saved");
  } else {
    detailWlBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      Add to Watchlist
    `;
    detailWlBtn.classList.remove("is-saved");
  }
}

detailCloseBtn.addEventListener("click", closeDetailModal);
detailOverlay.addEventListener("click", (e) => {
  if (e.target === detailOverlay) closeDetailModal();
});


randomBtn.addEventListener("click", pickRandom);
randomAgainBtn.addEventListener("click", pickRandom);

function pickRandom() {
  if (watchlist.length === 0) return;
  const pick = watchlist[Math.floor(Math.random() * watchlist.length)];

  rPoster.src = pick.Poster && pick.Poster !== "N/A"
    ? pick.Poster
    : "https://placehold.co/150x222/1f1f1f/666?text=No+Image";
  rTitle.textContent = pick.Title;
  rYear.textContent  = pick.Year;

  show(randomOverlay);
  document.body.style.overflow = "hidden";
}

function closeRandomModal() {
  hide(randomOverlay);
  document.body.style.overflow = "";
}

randomCloseBtn.addEventListener("click", closeRandomModal);
randomOverlay.addEventListener("click", (e) => {
  if (e.target === randomOverlay) closeRandomModal();
});


wlNavBtn.addEventListener("click", () => {
  sidebarOpen = !sidebarOpen;
  wlSidebar.classList.toggle("open", sidebarOpen);
  mobBackdrop.classList.toggle("hidden", !sidebarOpen);
  document.body.style.overflow = sidebarOpen ? "hidden" : "";
});

mobBackdrop.addEventListener("click", () => {
  sidebarOpen = false;
  wlSidebar.classList.remove("open");
  mobBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
});


document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!detailOverlay.classList.contains("hidden")) closeDetailModal();
  if (!randomOverlay.classList.contains("hidden"))  closeRandomModal();
  if (sidebarOpen) {
    sidebarOpen = false;
    wlSidebar.classList.remove("open");
    mobBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
  }
});


function saveWatchlist() {
  localStorage.setItem("cinevault_wl", JSON.stringify(watchlist));
}

function loadWatchlist() {
  const raw = localStorage.getItem("cinevault_wl");
  if (!raw) return;
  try { watchlist = JSON.parse(raw); }
  catch { watchlist = []; }
}


function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function showLoader() { show(loader); }
function hideLoader() { hide(loader); }

function showError(msg) {
  errorText.textContent = msg;
  show(searchSection);
  show(errorBox);
}

function hideError() { hide(errorBox); }

function resetToLanding() {
  moviesGrid.innerHTML = "";
  lastResults = [];
  hide(searchSection);
  hide(resultsBar);
  hide(noResults);
  hide(errorBox);
  hide(loader);
  loadHomeSections();
  sortSelect.value = "default";
}

function updateResultsCount(n, query) {
  resultsCount.innerHTML = `<strong>${n}</strong> result${n !== 1 ? "s" : ""} for "<em>${safe(query)}</em>"`;
}

function safe(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}