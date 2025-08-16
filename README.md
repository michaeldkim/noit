# FILE: README.md

# noit — neural notework

a local-first productivity dashboard. drop files, take notes, and keep work separated by “pages” (environments). everything is stored in your browser using IndexedDB / OPFS.

---

## features

- **drag & drop files** (pdf, images, text, word…) with type detection
- **local storage**: metadata in IndexedDB; blobs in OPFS when available, otherwise IndexedDB
- **file list panel**: half-screen height, scrollable, search by name, filter by type, open/download/delete
- **notepad**: title + kind selector (`notes`, `to-do`, `accounts`, `files`); when `files` is selected, the uploader appears inline
- **pages (environments)**: switch contexts so files/notes don’t mix; default page is `main` (cannot be deleted)
- **hard delete (with confirm)**: delete a page and all its data with a confirmation modal (ESC/Enter, focus-trapped, shows counts)
- **global search**: `ctrl/cmd + k` searches files across **all** pages
- **lowercase ui**: labels and controls use lowercase by design

---

## stack

- react + typescript + vite
- tailwind css
- IndexedDB + OPFS (origin private file system)

---

## prerequisites

- **node.js 22 LTS** (recommended)  
  verify with:
  ```bash
  node -v
  npm -v

# install deps
npm install

# start dev server
npm run dev

# build for production
npm run build
npm run preview

