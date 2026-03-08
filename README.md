# Tunlytics

A personal Spotify stats dashboard that shows what you've actually been listening to.

## What it does

- Connects to your Spotify account securely
- Shows your top tracks, top artists across three time ranges — last 4 weeks, last 6 months, and all time
- Generates a downloadable receipt of your listening history
- Calculates a discovery score based on how underground your taste is

## How it's built

- **Frontend** — React + Vite + Tailwind, deployed on Vercel
- **Backend** — Node.js + Express, deployed on Railway
- **Auth** — Spotify OAuth 2.0, tokens stored as JWT cookies
- **Styling** — Framer Motion for animations, Bebas Neue for the stat cards

## Running locally

1. Clone the repo
2. Create a Spotify app at developer.spotify.com and add `http://127.0.0.1:3001/auth/callback` as a redirect URI
3. Copy `.env.example` to `.env` and fill in your Spotify credentials
4. Run `npm run dev:full` to start both frontend and backend

## Notes

- Spotify doesn't expose play counts, so rankings are based on their own internal algorithm
- Genre breakdown is derived from your top artists' genre tags
- Discovery score is calculated from average artist popularity — lower popularity = higher score
