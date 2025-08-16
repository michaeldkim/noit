<div align="center">

# **noit — neural notework**

_a local-first productivity dashboard. drop files, take notes, and keep work separated by “pages” (environments). everything is stored in your browser using indexeddb / opfs._

</div>

---

## features

- **drag & drop files** (pdf, images, text, word…) with type detection  
- **local storage**: metadata in **indexeddb**; blobs in **opfs** (fallback to indexeddb)  
- **file list panel**: half-screen height, scrollable, search by name, filter by type, open/download/delete  
- **notepad**: title  kind selector (`notes`, `to-do`, `accounts`, `files`); when `files` is selected, the uploader appears inline  
- **pages (environments)**: switch contexts so files/notes don’t mix; default page is `main` (cannot be deleted)  
- **hard delete (with confirm)**: delete a page and all its data with a confirmation modal (esc/enter, focus-trapped, shows counts)  
- **global search**: `ctrl/cmd  k` searches files across **all** pages  
- **lowercase ui**: labels and controls use lowercase by design  

---

## stack

- react  typescript  vite  
- tailwind css  
- indexeddb  opfs (origin private file system)  

---

## prerequisites

- **node.js 22 lts** (recommended)

verify:

```bash
node -v
npm -v
```

---

## quick start

```bash
# install deps
npm install

# start dev server
npm run dev

# build for production
npm run build
npm run preview
```

open the printed localhost url in a modern browser. opfs works best in chromium-based browsers (chrome/edge).

---

## keyboard shortcuts

- **ctrl/cmd  k** → open global search  
- **esc** → close modals / menus  
- **enter** → confirm in the delete modal  

---

## pages (environments)

- switch pages from the left slide panel’s header menu.  
- **add a page**: last menu item. names are lowercased.  
- **delete page**: shows a confirm modal (files  notes counts). `main` cannot be deleted.  
- the current page is stored in `localStorage`; each record also stores its `env` so lists filter fast.  
- idb schema uses **`env` indexes** (db v4) for quick queries.  

---

## storage model

**files**
- metadata: store `files` (keyPath `id`, indexes: `createdAt`, `name`, `env`)  
- blobs: store `fileBlobs` (keyPath `id`)  
- blobs prefer **opfs**; fallback to indexeddb if opfs is unavailable  

**notes**
- store `notes` (keyPath `id`, indexes: `kind`, `updatedAt`, `env`)  

**global search (v1)**
- filename substring across all pages (env-agnostic)  

> clearing site data in your browser will remove all local content.

---

## ui overview

- **header** (fixed overlay): `noit: neural notework` (left) and faq `?` (right)  
- **notepad** (left): title  kind; textarea or file dropzone (when kind = `files`)  
- **files** (right): half-screen panel with:
  - top bar: `files`  count, type filter menu, search box  
  - rows: name, size, type, date, storage, actions (open/download/delete)  
- **left slide panel**: opens via chevron; shows files for the selected group or all files; footer with brand (left) and faq (right)  
- **upload overlay**: floating `` button opens the dashed dropzone  

---

## troubleshooting

- nothing happens on drop → ensure supported file types; check devtools console  
- opfs unavailable → app falls back to indexeddb blobs  
- stuck modals → press **esc**  

---

## scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

---


## privacy

all data is stored **locally** in your browser (indexeddb/opfs). there is no server. exporting/backups are planned.

---