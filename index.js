const API_KEY  = "373c7a1f";
const API_BASE = "https://www.omdbapi.com/";
const POPULAR_IMDB_IDS = ["tt0111161", "tt0068646", "tt0468569", "tt0133093", "tt0109830", "tt1375666", "tt0816692", "tt0120737","tt0120697","tt0102926"];
const HOME_FEED_QUERY = "movie";
const SCROLL_THRESHOLD_PX = 520;
const SEARCH_DEBOUNCE_MS = 350;

let watchlist     = [];
let lastResults   = [];
let sidebarOpen   = false;
let popularMovies = [];
let otherMovies   = [];
let popularLoading = false;
let otherLoading = false;
let homeFeedPage = 0;
let homeFeedTotalResults = 0;
let canLoadMoreHome = true;
let isFetchingHome = false;
const seenHomeIds = new Set();
let currentSearchQuery = "";
let totalSearchResults = 0;
let searchPage = 0;
let canLoadMoreSearch = false;
let isFetchingSearch = false;
let activeSearchToken = 0;
let infiniteObserver = null;
let searchDebounceTimer = null;

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
const infiniteLoader= document.getElementById("infiniteLoader");
const homeInfiniteLoader = document.getElementById("homeInfiniteLoader");
const infiniteSentinel = document.getElementById("infiniteSentinel");
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
  bindInfiniteScroll();
  loadWatchlist();
  renderWatchlist();
  clearBtn.classList.add("hidden");
  loadHomeSections();
});

function loadHomeSections() {
  showHomeSections();
  loadPopularMovies();
  loadOtherMovies();
  scheduleInfiniteCheck();
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
    : "dark";

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

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = null;
  }
  if (q.length > 0) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }

  if (q.length === 0) {
    resetToLanding();
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    searchMovies(q);
  }, SEARCH_DEBOUNCE_MS);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.classList.add("hidden");
  resetToLanding();
  searchInput.focus();
});


async function searchMovies(query) {
  const searchToken = ++activeSearchToken;
  resetSearchPaginationState();
  currentSearchQuery = query;

  hideHomeSections();
  show(searchSection);
  showLoader();
  hide(infiniteLoader);
  hide(homeInfiniteLoader);
  hideError();
  moviesGrid.innerHTML = "";
  hide(noResults);
  hide(resultsBar);

  try {
    const data = await fetchSearchPage(query, 1);
    if (searchToken !== activeSearchToken) return;
    hideLoader();

    if (data.movies.length > 0) {
      lastResults = data.movies;
      searchPage = 1;
      totalSearchResults = data.totalResults;
      canLoadMoreSearch = lastResults.length < totalSearchResults;
      show(resultsBar);
      updateResultsCount(lastResults.length, totalSearchResults, query);
      renderCards(lastResults);
    } else {
      lastResults = [];
      canLoadMoreSearch = false;
      show(noResults);
    }

  } catch (err) {
    if (searchToken !== activeSearchToken) return;
    hideLoader();
    hide(infiniteLoader);
    showError("Couldn't connect. Check your API key or internet connection.");
    console.error(err);
  }
}

async function fetchSearchPage(query, page) {
  const res = await fetch(`${API_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie&page=${page}`);
  if (!res.ok) throw new Error(`Network error (${res.status})`);

  const data = await res.json();
  if (data.Response !== "True") {
    return { movies: [], totalResults: 0 };
  }

  return {
    movies: data.Search || [],
    totalResults: Number.parseInt(data.totalResults || "0", 10) || 0
  };
}

function bindInfiniteScroll() {
  window.addEventListener("scroll", handleInfiniteScroll, { passive: true });
  window.addEventListener("resize", handleInfiniteScroll, { passive: true });
  bindInfiniteObserver();
}

function bindInfiniteObserver() {
  if (!infiniteSentinel || typeof IntersectionObserver === "undefined") return;

  infiniteObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      if (!searchSection.classList.contains("hidden")) {
        loadNextSearchPage();
      } else {
        loadNextHomePage();
      }
    }
  }, {
    root: null,
    rootMargin: "0px 0px 560px 0px",
    threshold: 0
  });

  infiniteObserver.observe(infiniteSentinel);
}

function scheduleInfiniteCheck() {
  requestAnimationFrame(() => {
    handleInfiniteScroll();
  });
}

function handleInfiniteScroll() {
  const viewportBottom = window.scrollY + window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;
  if (fullHeight - viewportBottom > SCROLL_THRESHOLD_PX) return;

  if (!searchSection.classList.contains("hidden")) {
    if (!canLoadMoreSearch || isFetchingSearch) return;
    loadNextSearchPage();
    return;
  }

  if (otherSection.classList.contains("hidden")) return;
  if (!canLoadMoreHome || isFetchingHome) return;
  loadNextHomePage();
}

async function loadNextSearchPage() {
  if (!canLoadMoreSearch || isFetchingSearch) return;

  const nextPage = searchPage + 1;
  if (!currentSearchQuery || nextPage < 2) return;

  const searchToken = activeSearchToken;
  isFetchingSearch = true;
  show(infiniteLoader);

  try {
    const data = await fetchSearchPage(currentSearchQuery, nextPage);
    if (searchToken !== activeSearchToken) return;

    if (data.movies.length === 0) {
      canLoadMoreSearch = false;
      return;
    }

    searchPage = nextPage;
    const newMovies = data.movies.filter((movie) => !lastResults.some((m) => m.imdbID === movie.imdbID));
    lastResults = [...lastResults, ...newMovies];
    totalSearchResults = data.totalResults || totalSearchResults;
    canLoadMoreSearch = lastResults.length < totalSearchResults;
    updateResultsCount(lastResults.length, totalSearchResults, currentSearchQuery);

    if (sortSelect.value === "default") {
      renderCards(newMovies, moviesGrid, { append: true, startIndex: lastResults.length - newMovies.length });
    } else {
      const sorted = sortMovies(lastResults, sortSelect.value);
      renderCards(sorted);
    }

    if (canLoadMoreSearch) scheduleInfiniteCheck();
  } catch (err) {
    if (searchToken === activeSearchToken) {
      showError("Could not load more movies. Please scroll again to retry.");
      console.error(err);
    }
  } finally {
    if (searchToken === activeSearchToken) {
      isFetchingSearch = false;
      hide(infiniteLoader);
    }
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

  await loadNextHomePage();
}

async function fetchHomeFeedPage(page) {
  const res = await fetch(`${API_BASE}?apikey=${API_KEY}&s=${encodeURIComponent(HOME_FEED_QUERY)}&type=movie&page=${page}`);
  if (!res.ok) throw new Error(`Network error (${res.status})`);

  const data = await res.json();
  if (data.Response !== "True") {
    return { movies: [], totalResults: 0 };
  }

  return {
    movies: data.Search || [],
    totalResults: Number.parseInt(data.totalResults || "0", 10) || 0
  };
}

async function loadNextHomePage() {
  if (isFetchingHome || !canLoadMoreHome) return;
  if (!searchSection.classList.contains("hidden")) return;

  isFetchingHome = true;
  otherLoading = true;
  show(homeInfiniteLoader);

  try {
    const nextPage = homeFeedPage + 1;
    const data = await fetchHomeFeedPage(nextPage);

    if (data.movies.length === 0) {
      canLoadMoreHome = false;
      return;
    }

    homeFeedPage = nextPage;
    homeFeedTotalResults = data.totalResults;

    const newMovies = data.movies.filter((movie) => {
      if (seenHomeIds.has(movie.imdbID)) return false;
      seenHomeIds.add(movie.imdbID);
      return true;
    });

    if (newMovies.length > 0) {
      const startIndex = otherMovies.length;
      otherMovies = [...otherMovies, ...newMovies];

      if (otherGrid && otherGrid.children.length > 0) {
        renderCards(newMovies, otherGrid, { append: true, startIndex });
      } else {
        renderOtherMovies();
      }
    }

    const maxPages = Math.ceil(homeFeedTotalResults / 10);
    canLoadMoreHome = homeFeedPage < maxPages;
    if (canLoadMoreHome) scheduleInfiniteCheck();
  } catch (err) {
    console.error(err);
  } finally {
    isFetchingHome = false;
    otherLoading = false;
    hide(homeInfiniteLoader);
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
  const sorted = sortMovies(lastResults, val);
  renderCards(val === "default" ? lastResults : sorted);
});

function sortMovies(movies, sortValue) {
  let sorted = [...movies];

  if (sortValue === "year-desc") {
    sorted = sorted.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
  } else if (sortValue === "year-asc") {
    sorted = sorted.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
  } else if (sortValue === "az") {
    sorted = sorted.sort((a, b) => a.Title.localeCompare(b.Title));
  } else if (sortValue === "za") {
    sorted = sorted.sort((a, b) => b.Title.localeCompare(a.Title));
  }

  return sorted;
}


function renderCards(movies, targetGrid = moviesGrid, options = {}) {
  const { append = false, startIndex = 0 } = options;
  if (!targetGrid) return;
  if (!append) targetGrid.innerHTML = "";

  movies.forEach((movie, i) => {
    const saved = isSaved(movie.imdbID);

    const card = document.createElement("div");
    card.className = "movie-card" + (saved ? " saved" : "");
    card.dataset.id = movie.imdbID;
    card.style.animationDelay = `${(startIndex + i) * 0.02}s`;

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
  ++activeSearchToken;
  resetSearchPaginationState();
  moviesGrid.innerHTML = "";
  lastResults = [];
  hide(searchSection);
  hide(resultsBar);
  hide(noResults);
  hide(errorBox);
  hide(loader);
  hide(infiniteLoader);
  hide(homeInfiniteLoader);
  loadHomeSections();
  sortSelect.value = "default";
}

function resetSearchPaginationState() {
  totalSearchResults = 0;
  searchPage = 0;
  canLoadMoreSearch = false;
  isFetchingSearch = false;
}

function updateResultsCount(loaded, total, query) {
  const resultsWord = total !== 1 ? "results" : "result";
  resultsCount.innerHTML = `<strong>${loaded}</strong> of <strong>${total}</strong> ${resultsWord} for "<em>${safe(query)}</em>"`;
}

function safe(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}