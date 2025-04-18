# uugle-vibe — Unicorn Book Search Extension

**uugle-vibe** is a fresh fork and successor of the legacy [uuGle](https://github.com/Pocuston/uugle) Chrome extension.  
It brings a faster, cleaner, and more powerful way to search through Unicorn 🦄 **BookKit** books.

## ✨ What's New in uugle-vibe release 1.0.0

- ⚙️ **Upgraded to Manifest V3**
- 📦 **Modernized stack** — updated React, Webpack, and other dependencies
- 📚 **Indexing now includes Management Kit pages**
- 🧩 **Plugin Management Panel**
  - View and filter **pages** and **books** stored in the database
  - Delete individual pages or whole books (along with all related pages)
  - ⭐ Mark books as favorites for easier access
  - 📤 **Export**: Save entire database to a JSON file
  - 📥 **Import**: Load previously exported JSON — only new records are added
  - 🗑️ **Delete all**: Wipe the complete plugin database
- 🔍 **Popup UI improvements**
  - Shortcut button to open the Plugin Management panel (cmd/ctrl+shift+K)
  - Book filtering:
    - `:book` keyword to filter search within a selected book
    - Selected books can be added to favorites
  - Slight UI refresh
- 🌙 **Dark mode**

---

## 🚀 How to Use

1. Install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/uugle/makckafajckddaiinilmeogejgdmacmi)
2. Open any page of a Unicorn BookKit book — the whole book will be indexed automatically.
3. Use the extension icon or the shortcut:
   - Windows: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd>
   - Linux: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd>
   - macOS: <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd>
4. Start typing — search is instant and fuzzy (e.g. “trans list” will find "transaction/list")

🔹 Link color reflects book type  
🔹 Breadcrumb navigation for clarity  
🔹 `_w_` icon = work in progress page  
🔹 Use <kbd>↑</kbd>/<kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to open

---

## ⚙️ How It Works

- Uses [Elasticlunr.js](http://elasticlunr.com/) for fast fuzzy search.
- Data is saved in the browser using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).
- Supports only **English** for search.

---

Enjoy fast Unicorn search! 🦄💡  
For issues or ideas, feel free to contribute or open a discussion.
