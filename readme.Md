# 🎬 CineVault — Movie Watchlist App

A web app where you can search for movies and build your personal watchlist. Built as part of a college JavaScript project using the OMDb public API.

---

## What It Does

Pretty straightforward — you type a movie name, it fetches results from the OMDb API, and you can save the ones you want to watch later. Your list stays saved even after you close the browser tab.

There's also a "Random Movie Night" button that picks a random movie from your saved list when you can't decide what to watch (honestly the most useful feature).

---

## Tech Stack

- **HTML** — structure
- **CSS** — styling
- **JavaScript** — all logic, API calls, DOM manipulation

---

## API Used

**OMDb API** — [https://www.omdbapi.com/](https://www.omdbapi.com/)

Free movie database API. Returns movie titles, posters, release years, IMDb ratings, and plot summaries. Requires a free API key (see setup below).

---

## Features

### Core
- **Live Search** — searches the OMDb API as you type (debounced so it doesn't fire on every keystroke)
- **Movie Cards** — shows poster, title, and year for each result
- **Watchlist Toggle** — add or remove any movie from your list with one click
- **Sticky Sidebar** — your saved movies stay visible on the right while you keep searching
- **Empty States** — proper messages for when nothing is found or the watchlist is empty

### Milestone 3 Features
- **Search** — implemented using `.filter()` on fetched results
- **Sorting** — sort watchlist alphabetically or by year using `.sort()`
- **Watchlist management** — uses `.find()` and `.filter()` to add/remove movies without loops

---

## Project Structure

```
cinevault/
├── index.html    # main page structure
├── style.css     # all styling
└── script.js     # API calls, watchlist logic, event handlers
```

---