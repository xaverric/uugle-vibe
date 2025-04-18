// Add a global self reference for elasticlunr to work in service worker context
if (typeof window === 'undefined') {
  self.window = self; // This is necessary for elasticlunr to assign lunr
}
import elasticlunr from "elasticlunr";

const databaseVersion = 5;
const booksDatabase = "booksDb";

export const booksScheme = "books";
export const pagesScheme = "pages";
export const indexScheme = "index";

/**
 * Opens db connection.
 * If database does not exists yet, it is initialized first.
 * @returns {Promise<IDBDatabase>}
 */
export async function openDb() {
  // Make sure we're in an environment with indexedDB available
  if (!self.indexedDB) {
    throw new Error("IndexedDB is not available in this environment");
  }

  const request = self.indexedDB.open(booksDatabase, databaseVersion);

  request.onupgradeneeded = async event => {
    const db = event.target.result;

    //when upgrading from v4 to v5, we need to rebuild index
    if (event.oldVersion === 4) {
      await migrate4to5(event);
    } else {
      if (db.objectStoreNames.length > 0) {
        db.deleteObjectStore(booksScheme);
        db.deleteObjectStore(pagesScheme);
        db.deleteObjectStore(indexScheme);
      }

      db.createObjectStore(booksScheme, {
        keyPath: "awid",
      });

      const pageStore = db.createObjectStore(pagesScheme, {
        keyPath: "id",
        autoIncrement: true,
      });
      pageStore.createIndex("awid", "awid", { unique: false });
      pageStore.createIndex("awid-code", ["awid", "code"], {
        multiEntry: false,
        unique: true,
      });

      db.createObjectStore(indexScheme, {
        keyPath: "id",
      });
    }
  };

  return new Promise((resolve, reject) => {
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

/**
 * Creates Promise from IDBRequest
 * @param request {IDBRequest}
 * @returns {Promise<any>}
 */
export async function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

export const indexObjectId = 1;

async function migrate4to5(event) {

  //read all pages
  const transaction = event.target.transaction;

  transaction.onerror = () => {
    console.error("uugle-vibe: book indexing error");
  };

  const indexStore = transaction.objectStore(indexScheme);
  const pagesStore = transaction.objectStore(pagesScheme);

  const allPages = await requestToPromise(pagesStore.getAll());

  //rebuild index
  let index = elasticlunr(function () {
    this.setRef("id");
    this.addField("name");
    this.addField("bookName");
    this.saveDocument(false);
  });

  allPages.forEach(page => {
    const indexDoc = {
      id: page.id,
      name: page.name,
      bookName: page.bookName,
    };
    index.addDoc(indexDoc);
  });

  //store rebuilt index
  //Store updated index serialized in JSON
  const indexObject = {
    id: indexObjectId,
    indexDump: JSON.stringify(index),
  };
  await requestToPromise(indexStore.put(indexObject));
}
