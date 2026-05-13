# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack overview

Two independent apps in one repo:

- **`backend/`** — Rails 8.1 API-only (Ruby 3.4.1), Mongoid 9 against MongoDB. No ActiveRecord. JWT auth, Rack::Attack throttling, optional S3 image uploads. Deployed via Kamal/Docker.
- **`frontend/`** — React 19 + TypeScript + Vite 7, React Router 7. Plain CSS modules under `src/styles/`. No state library; component-level state + `sessionStorage`/`localStorage`.

The two are loosely coupled through the REST API at `VITE_API_URL` (default `http://localhost:3000`). CORS is whitelisted server-side via the `CORS_ORIGINS` env var (default `http://localhost:5173`).

## Commands

### Backend (`cd backend`)

| Task | Command |
|---|---|
| Install gems | `bundle install` |
| Start dev server (port 3000) | `bin/rails server` or `bin/dev` |
| Seed DB (also creates `admin` user) | `bin/rails db:seed` |
| Run all tests | `bin/rails test` |
| Run a single test file | `bin/rails test test/models/menu_item_test.rb` |
| Run a single test by line | `bin/rails test test/models/menu_item_test.rb:42` |
| Lint (Rubocop omakase) | `bin/rubocop` |
| Security (static analysis) | `bin/brakeman` |
| Security (gem CVEs) | `bin/bundler-audit` |
| Full CI pipeline locally | `bin/ci` |
| Rails console | `bin/rails console` |

`bin/setup` does `bundle install`, clears logs, then runs the server. Pass `--skip-server` to skip the boot.

### Frontend (`cd frontend`)

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Dev server (port 5173) | `npm run dev` |
| Production build (tsc + vite) | `npm run build` |
| Lint | `npm run lint` |
| Preview built bundle | `npm run preview` |

No test runner is configured on the frontend.

### Environment variables

Frontend (`frontend/.env`):
- `VITE_API_URL` — backend base URL, no trailing slash. Falls back to `http://localhost:3000`.

Backend (no checked-in `.env`; all read via `ENV.fetch`):
- `JWT_SECRET` — falls back to `Rails.application.secret_key_base`. Must be stable across restarts or all tokens invalidate.
- `ADMIN_PASSWORD` — used **only by `db:seed`** to create/update the `admin` user. Changing it later requires re-seeding or updating the document directly. Default in seeds: `homeseaside2025`.
- `CORS_ORIGINS` — comma-separated allowlist.
- `S3_UPLOADS_BUCKET`, `AWS_REGION` (default `eu-south-1`), `UPLOADS_CDN_URL` — if `S3_UPLOADS_BUCKET` is set, uploads go to S3; otherwise they are written to `public/uploads/` and served by Rails.

## Architecture

### Data model — one collection, many concerns

There is a single substantive Mongoid document: `MenuItem` ([backend/app/models/menu_item.rb](backend/app/models/menu_item.rb)). Everything the customer sees is one menu item. There is **no separate subcategory model** — subcategories are derived from the `category` field of existing items (see "Subcategories" below).

Key fields:
- `main_category` — one of a hardcoded list `coffee | spirits | cocktails | beer&wine | food`. Validated by inclusion. Both backend and frontend hardcode these IDs; **do not invent new ones without updating both sides**.
- `name`, `description`, `category` — Mongoid **localized fields** (`localize: true`) with locales `:en` and `:el` (Greek). They are stored as a hash under `*_translations` and accessed via `I18n.with_locale(...)` blocks. The serializer returns both locales as `{ en, el }` objects on every response.
- `pricing_type` — `single | single_double | glass_bottle`. When `single`, `price_secondary` is ignored. `single_double` is for coffees (single/double shot); `glass_bottle` is for wines/spirits. The frontend renders dual prices via a `DualPrice` component in [MenuSection.tsx](frontend/src/components/MenuSection.tsx). See [PLAN.md](PLAN.md) for the original feature spec.
- `allergens` is a free-form array of strings; the admin UI suggests a fixed list (`Dairy, Gluten, Eggs, Nuts, Seafood, Shellfish, Alcohol, Soy`) but accepts anything.

There is **no MongoDB migration system** — schema changes are just code changes plus possibly a `db:seed` re-run. `MenuItem.delete_all` runs at the top of seeds.rb, so re-seeding wipes the catalog.

### Auth flow

JWT-based, stateless. There is **one** admin user (`username: "admin"`) created by `db:seed`.

1. Client POSTs `/admin/login` with `{ username, password }` → server returns `{ token }` (HS256, 24h expiry).
2. Client stores token in `sessionStorage` under key `homeseaside_admin_token` (cleared on tab close — by design). Accessor: `getAdminToken()` in [App.tsx](frontend/src/App.tsx).
3. Every write request includes `Authorization: Bearer <token>`. `ApplicationController#authenticate_admin!` decodes it and loads `@current_admin`.
4. `GET /admin/verify` is used by the frontend on page load to validate an existing token before showing the admin UI; it 401s on expired/invalid.
5. `DELETE /admin/logout` is a no-op server-side (stateless tokens) — the client just clears its storage.

Reads on `/menu_items` are public. `index` returns only `available: true` items unless `?all=true` is passed (admin uses `?all=true` to see hidden items).

### Image uploads

`POST /uploads` (authenticated). [UploadsController](backend/app/controllers/uploads_controller.rb) accepts a multipart `file`, checks:
1. `Content-Type` is in `[image/jpeg, image/png, image/webp, image/gif]`.
2. File size ≤ 5 MB.
3. **Magic bytes** match the declared type (defends against MIME spoofing).

If `S3_UPLOADS_BUCKET` is set → uploads to S3 with `cache-control: immutable` and returns `UPLOADS_CDN_URL/uploads/<uuid>.<ext>`. Otherwise writes to `backend/public/uploads/<uuid>.<ext>` and returns a `/uploads/...` path. The frontend resolves relative paths against `VITE_API_URL` via `getImageFullUrl()`.

### Rate limiting

Rack::Attack ([config/initializers/rack_attack.rb](backend/config/initializers/rack_attack.rb)) enforces:
- 300 req / 5 min per IP (global).
- 5 logins / min per IP on `POST /admin/login`.
- 10 uploads / min per IP on `POST /uploads`.
- 30 write ops / min per IP (POST/PATCH/PUT/DELETE).

Throttled requests return JSON `429`. The frontend login handler ([App.tsx](frontend/src/App.tsx)) shows a localized "Too many attempts" message specifically for `429`.

### Frontend routing & component layout

Three top-level routes in [App.tsx](frontend/src/App.tsx):
- `/` → `HomePageWrapper` (landing).
- `/menu` → `CustomerMenu` (TopBar + CategoryNav + MenuSection).
- `/admin` → `AdminPage` (gated by `AdminGate` until JWT verifies).

Bilingual UI throughout (`EN` / `EL`). Language state lives **per-page** at the top-level route component and is passed down via props — there is no global i18n provider. The `TopBar` raises an `onLanguageChange` callback.

[CategoryNav.tsx](frontend/src/components/CategoryNav.tsx) reorders the 5 main categories by time of day (morning → coffee first; afternoon → food; evening → cocktails; night → spirits). This is intentional UX, not a bug.

### Subcategories — derived, not stored

There is no subcategory document type. [AdminPanel.tsx](frontend/src/components/AdminPanel.tsx) (`buildSubcategoriesFromItems`) constructs the subcategory list by **iterating all menu items and collecting unique `category` values** grouped by `main_category`. An admin can also stash overrides in `localStorage` under `homeseaside_subcategories_v3`. When adding new categorization features, work with this dynamic derivation — do not add a separate Mongoid collection.

### Localized field assignment quirk

`MenuItemsController#assign_localized_fields` writes each locale inside its own `I18n.with_locale(:en) { ... }` block. If you add new localized fields to `MenuItem`, you must mirror this pattern in the controller — direct assignment without the locale block will write to whatever the current `I18n.locale` is (default `:en`, set in [config/initializers/locale.rb](backend/config/initializers/locale.rb)).

## Deployment

Production deploy is via **Kamal** ([backend/config/deploy.yml](backend/config/deploy.yml)). The Dockerfile is production-only (no dev container). The CI workflow ([.github/workflows/ci.yml](backend/.github/workflows/ci.yml)) runs Brakeman, bundler-audit, Rubocop, and `bin/rails test` on PRs and pushes to `main`. The default `deploy.yml` still has placeholder values (`192.168.0.1`, `localhost:5555` registry) — real deploy config is not yet committed.
