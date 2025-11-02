# Squad Score Project Overview

Concise guide for agents to understand the project scope, architecture, and current status.

## High-Level Goals
- Deliver a modern, game-themed leaderboard experience across multiple static pages.
- Support Auth0-based authentication for login, signup, and profile personalization.
- Provide lightweight squad chat interactions and editable player profile UI.

## Tech Stack & Tooling
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (no framework).
- **Auth**: Auth0 SPA SDK via CDN, configured through `auth-config.js`.
- **Dev Tooling**: `live-server` or `serve` for static hosting (`npm run dev`, `npm start`).
- **Styling**: Centralized in `css/styles.css`; additional page-specific placeholders (`css/all-lb.css`, `css/all-squads.css`).

## Page Map & Responsibilities
- `index.html` – Landing page, global navigation hub, CTA to leaderboards.
- `all-leaderboards.html` / `all-squads.html` – Containers for aggregate views (currently content placeholders).
- `leaderboard.html` – Sample squad leaderboard layout with navigation back-links.
- `chat.html` – Squad chat mock (DOM-driven message list and composer).
- `profile.html` – Player profile card with inline edit experience.
- `login.html` / `signup.html` – Auth0 login/signup entry points, defer actual auth to `AuthService`.

## JavaScript Modules
- `auth.js` – Instantiates `AuthService`, wraps Auth0 SPA SDK, persists user info to `localStorage`, and updates UI elements on auth state changes.
- `js/script.js` – Handles navigation click routing, UI polish (animations, keyboard support), and profile edit mode.
- `chat.html` inline script – Handles squad tab selection and in-browser message append (no backend).

> Note: Legacy `script.js` at repo root is unused; current pages import `js/script.js`.

## State & Data Flow
- **Auth state**: Stored in-memory within `AuthService` and mirrored to `localStorage` (`user`, `isAuthenticated`) for cross-page awareness.
- **UI state**: Managed per-page through DOM classes (e.g., active nav link, profile edit toggles, chat card selection).
- **Data sources**: Static mock data hard-coded in HTML; no API fetch or persistence beyond browser storage.

## Directory Structure (trimmed)
```
.
├── index.html
├── auth-config.js
├── auth.js
├── js/
│   └── script.js
├── css/
│   ├── styles.css
│   ├── all-lb.css
│   └── all-squads.css
├── chat.html
├── leaderboard.html
├── profile.html
├── login.html
├── signup.html
├── all-leaderboards.html
├── all-squads.html
├── README.md
├── AUTH0_SETUP.md
└── package.json
```

## Key User Journeys
1. **Browse leaderboards**: Landing page CTA → `leaderboard.html` sample squad board.
2. **Authenticate**: Login/Signup buttons call Auth0 redirect flow; on return, navbar and CTA text update via `AuthService`.
3. **Manage profile**: Profile page toggles between view/edit; saves remain client-side only.
4. **Chat mock**: User selects squad tabs, submits messages appended client-side without persistence.

## Development Workflow
1. Install dependencies (optional, for static server helpers): `npm install`.
2. Run locally: `npm run dev` (opens `index.html` on port 3000).
3. Configure Auth0: follow `AUTH0_SETUP.md` for domain/client ID and allowlisted origins.
4. Static hosting compatible—no build step required.

## Known Gaps & Follow-Ups
- Populate `all-leaderboards.html` / `all-squads.html` with actual content or data hooks.
- Externalize chat logic from inline script if feature grows.
- Persist profile edits and chat history once a backend is introduced.
- Audit for redundant files (e.g., root `script.js`).

Use this document as a quick entry point; refer to the original `README.md` for theming details and `AUTH0_SETUP.md` for authentication setup.
