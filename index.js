const API_KEY = "373c7a1f";
const WEB_URL="https://www.omdbapi.com/";
let watchlist = [];
let debounceTimer = null;

const searchInput     = document.getElementById("searchInput");
const clearBtn        = document.getElementById("clearBtn");
const loader          = document.getElementById("loader");
const errorMsg        = document.getElementById("errorMsg");
const resultsGrid     = document.getElementById("resultsGrid");
const emptySearch     = document.getElementById("emptySearch");
const noResults       = document.getElementById("noResults");
const watchlistItems  = document.getElementById("watchlistItems");
const watchlistEmpty  = document.getElementById("watchlistEmpty");
const watchlistCount  = document.getElementById("watchlistCount");
const randomSection   = document.getElementById("randomSection");
const randomBtn       = document.getElementById("randomBtn");
const clearAllBtn     = document.getElementById("clearAllBtn");
const randomModal     = document.getElementById("randomModal");
const closeModal      = document.getElementById("closeModal");
const modalPoster     = document.getElementById("modalPoster");
const modalTitle      = document.getElementById("modalTitle");
const modalYear       = document.getElementById("modalYear");
const modalRating     = document.getElementById("modalRating");
const modalPlot       = document.getElementById("modalPlot");

window.addEventListener("DOMContentLoaded", () => {
  loadWatchlistFromStorage();
  renderWatchlist();
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();

  clearBtn.style.display = query.length > 0 ? "block" : "none";

  if (query.length < 2) {
    clearResults();
    show(emptySearch);
    return;
  }
    clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchMovies(query);
  }, 450);
});