import { indexObjectId, indexScheme, openDb, requestToPromise } from "./common";

// Import elasticlunr for full-text search capabilities
export const elasticlunr = require("elasticlunr");

// Configure elasticlunr tokenizer to handle special characters in search queries
// Extend default elasticlunr separators by "." to allow search e.g. "accordion" in "UU5.Bricks.Accordion"
elasticlunr.tokenizer.setSeperator(/[\s\-./]+/);

// Constants
const SAVE_DOCUMENT_IN_INDEX = false; // Set to true only for debugging - increases index size

/**
 * In-memory fulltext search index.
 * It must be initialized first by calling the initialize() function.
 */
export let searchIndex = null;

/**
 * Initializes the full-text search index from database
 * @returns {Promise<void>} A promise that resolves when initialization is complete
 */
export async function initialize() {
  const db = await openDb();
  const transaction = db.transaction([indexScheme]);
  transaction.onerror = () => {
    console.error("uugle-vibe: index load error", transaction.error);
  };

  searchIndex = await loadIndexFromDb(transaction);
}

/**
 * Loads index from serialized dump in database.
 * If no index is found, creates a new empty one.
 * 
 * @param {IDBTransaction} transaction - IndexedDB transaction
 * @returns {Object} Elasticlunr search index
 */
async function loadIndexFromDb(transaction) {
  const indexStore = transaction.objectStore(indexScheme);
  const indexObject = await requestToPromise(indexStore.get(indexObjectId));

  if (!indexObject) {
    return createNewIndex();
  }

  // Load existing index from serialized JSON
  const { indexDump } = indexObject;
  return elasticlunr.Index.load(JSON.parse(indexDump));
}

/**
 * Creates a new empty search index with the desired configuration
 * 
 * @returns {Object} New elasticlunr search index
 */
function createNewIndex() {
  return elasticlunr(function () {
    this.setRef("id"); // Document reference field
    this.addField("name"); // Index the name field
    this.addField("bookName"); // Index the book name field
    this.saveDocument(SAVE_DOCUMENT_IN_INDEX); // Only save documents when debugging
  });
}
