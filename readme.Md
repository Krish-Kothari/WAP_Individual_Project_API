# CineVault — Movie Watchlist App

CineVault is a movie discovery and watchlist app built with vanilla JavaScript and the OMDb API. It lets you browse popular movies, search the catalog, inspect movie details, and save titles to a personal watchlist that persists in the browser.

## What It Does

The app starts with curated movie sections on the landing page, then switches into search mode when you type in the search bar. You can open a detailed movie modal, save titles to your watchlist, and use the random picker when you want help choosing what to watch.

## Tech Stack

- HTML for structure
- CSS for layout and styling
- JavaScript for API calls, state management, and DOM updates

## API Used

OMDb API: https://www.omdbapi.com/

OMDb provides movie titles, posters, release years, ratings, plots, genres, cast, and other metadata. A free API key is required.

## Features

### Discovery
- Top 10 popular movies section on the landing page
- Additional movie feed on the landing page
- Search-as-you-type with debounce
- Infinite scroll for search results and home feed
- Sort search results by relevance, year, and title

### Movie Details
- Full movie details modal
- Poster, title, year, runtime, rating, country, genres, plot, director, writer, cast, and language
- Loading skeleton while details are fetched

### Watchlist
- Add or remove movies from the watchlist with one click
- Watchlist saved in localStorage
- Watchlist count in the navbar and sidebar
- Remove all watchlist items at once
- Random Pick button to choose a movie from your saved list

### UI Behavior
- Light and dark theme toggle with saved preference
- Sticky navbar and sticky watchlist sidebar
- Mobile watchlist drawer with backdrop
- Clear search button and reset-to-landing behavior
- Empty states for no results and empty watchlist

## Setup

1. Get a free OMDb API key from https://www.omdbapi.com/apikey.aspx.
2. Open [index.js](index.js) and replace the `API_KEY` value with your key.
3. Open [index.html](index.html) in a browser, or run the project through a local static server.

## Project Structure

```
.
├── index.html
├── index.css
├── index.js
├── favicon.svg
└── readme.Md
```

## Notes

- The app uses OMDb client-side, so the API key is visible in the browser bundle.
- Some posters or metadata may be missing depending on the OMDb response.
- The free OMDb tier may have request limits.

## Author

Created by Krish Kothari.