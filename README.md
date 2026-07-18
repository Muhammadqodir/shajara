# Shajara — Family Tree Visualizer

_Shajara_ (شجرة, “tree”) is a collaborative app for building and exploring a family tree
with a smooth, interactive graph. Add members, connect parents, children and spouses by
dragging between cards, and keep a shared photo gallery of the family.

Built with **Laravel 12 · Inertia 2 · React 19 · TypeScript · Tailwind 4 · shadcn/ui**, with
the interactive graph powered by **React Flow** and an automatic **dagre** layout. The
interface is a minimal, black‑and‑white shadcn theme with light/dark mode.

## Features

- **Interactive tree** — pan/zoom canvas, auto‑laid‑out generations, couples placed
  side‑by‑side, mini‑map and zoom controls.
- **Manage relationships visually** — drag from one card to another to create a parent
  (top ↔ bottom) or spouse (left ↔ right) link; click a connecting line to remove it.
  Loops and duplicate spouse links are rejected server‑side.
- **Member profiles** — name, surname, gender, birth/death dates & places, profession,
  photo and a description. Click any card for a detail panel with add/edit/delete and
  quick “add parent / spouse / child”.
- **Gallery** — shared photos by URL, each tagged with the members who appear in it.

## Data model

| Table            | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `members`        | A person in the tree (all profile fields).                              |
| `relationships`  | An edge between two members. `type=parent` → `from` is parent of `to`; `type=spouse` stored once. |
| `galleries`      | A photo (`image_url`, `description`).                                    |
| `gallery_member` | Pivot: which members appear in which photo.                             |

## Getting started

Requires PHP 8.4+, Composer, Node 20+, and a MySQL server.

```bash
# 1. Install dependencies
composer install
npm install

# 2. Configure the database in .env (defaults shown)
#    DB_CONNECTION=mysql  DB_DATABASE=shajara  DB_USERNAME=root  DB_PASSWORD=
mysql -u root -e "CREATE DATABASE IF NOT EXISTS shajara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Migrate and seed a sample three‑generation family
php artisan migrate:fresh --seed

# 4. Run (two terminals, or use the combined dev script)
php artisan serve      # http://127.0.0.1:8000
npm run dev            # Vite dev server (HMR)
```

For a production build of the assets: `npm run build`.

## Tests

```bash
php artisan test --filter=FamilyTest
```

Covers member CRUD & validation, relationship creation, loop prevention, duplicate‑spouse
rejection, cascade deletes, and gallery tagging.

## Project layout

- `app/Models` — `Member`, `Relationship`, `Gallery`.
- `app/Http/Controllers` — `TreeController`, `MemberController`, `RelationshipController`, `GalleryController`.
- `resources/js/pages` — `tree.tsx`, `gallery.tsx`.
- `resources/js/components/family` — member node, form dialog, detail sheet, gallery dialog.
- `resources/js/lib/family-graph.ts` — union‑find “households” + dagre layout and display helpers.
