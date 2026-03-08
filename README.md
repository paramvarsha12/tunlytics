# Spotify Stats Dashboard (PKCE)

Fully functional Spotify Stats Dashboard built with **React + Tailwind + Axios**, using Spotify’s **OAuth 2.0 Authorization Code w/ PKCE** flow.

## Features

- **Login with Spotify** (Spotify-hosted auth, no credentials collected)
- **PKCE token exchange** + **automatic refresh** (sessions don’t expire mid-use)
- **Logout** clears the session
- Stats across Spotify’s native time ranges:
  - **Last 4 Weeks** (`short_term`)
  - **Last 6 Months** (`medium_term`)
  - **All Time** (`long_term`)
- **Top Tracks** (artwork, title, artists)
- **Top Artists** (image, genre tags)
- **Top Genres** chart derived from Top Artists genres (no dedicated Spotify genre endpoint)

## Setup

### 1) Create a Spotify app

In the Spotify Developer Dashboard, create an app and add a Redirect URI that matches your local dev URL:

- `http://localhost:5173/callback`

### 2) Configure environment variables

Copy `.env.example` → `.env` and fill in:

- `VITE_SPOTIFY_CLIENT_ID`
- `VITE_SPOTIFY_REDIRECT_URI`

### 3) Install and run

```bash
npm install
npm run dev
```

Open the app and click **Login with Spotify**.

## Notes / Constraints (by design)

- No play counts: Spotify’s public API doesn’t expose them.
- Genre breakdown is derived by counting **artist genre tags** from `/me/top/artists`.
- Tokens are stored in **sessionStorage** (cleared when the tab closes).

