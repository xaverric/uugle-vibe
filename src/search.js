import { searchIndex } from './searchIndex';
import { openDb, pagesScheme, booksScheme, requestToPromise } from './common';

// Constants
const MAX_SUGGESTIONS = 30;
const PAGE_URL_BASE = 'https://uuapp.plus4u.net/uu-bookkit-maing01';
const DEFAULT_PAGE_SIZE = 100;

/**
 * Creates omnibox suggestion from page info
 * @param {{name: string, awid: string, code: string, bookName: string, url: string}} page
 * @returns {{description: string, content: *}}
 */
export function getSuggestion(page) {
  const pageTitle = page.bookName
    ? `${page.bookName} - ${page.name}`
    : page.name;
  return {
    content: page.url,
    description: `${escapeHtml(pageTitle)} - <url>${page.url}</url>`,
  };
}

/**
 * Returns page URL
 * @param {Object} page - Page object
 * @returns {string} - Page URL
 */
export function getPageUrl(page) {
  if (page.type === 'mngkit' && page.url) {
    return page.url;
  }

  return `${PAGE_URL_BASE}/${page.awid}/book/page?code=${page.code}`;
}

/**
 * Returns book home URL
 * @param {Object} page - Page object
 * @returns {string} - Book URL
 */
export function getBookUrl(page) {
  if (page.type === 'mngkit' && page.url) {
    const urlObj = new URL(page.url);
    return `${urlObj.origin}${urlObj.pathname}`;
  }
  return `${PAGE_URL_BASE}/${page.awid}`;
}

/**
 * Fulltext search in index
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Search results
 */
export async function search(query) {
  validateSearchIndex();
  
  if (!isValidQuery(query)) {
    return [];
  }

  // First, we query index for page ids
  let indexResults = searchIndex.search(query, { expand: true });
  if (indexResults.length === 0) {
    return [];
  }

  if (indexResults.length > MAX_SUGGESTIONS) {
    indexResults = indexResults.slice(0, MAX_SUGGESTIONS);
  }

  // For each page id found, we load page from db and return list of suggestions
  const { pagesStore, transaction } = await getPagesStore();
  const results = await loadPagesFromSearchResults(indexResults, pagesStore);

  return results;
}

/**
 * Validates that the search index is initialized
 * @throws {Error} If search index is not initialized
 */
function validateSearchIndex() {
  if (searchIndex === null) {
    throw new Error(
      'Index must be initialized first. Call initialize() function.',
    );
  }
}

/**
 * Checks if a query is valid for search
 * @param {string} query - Search query
 * @returns {boolean} - Whether the query is valid
 */
function isValidQuery(query) {
  if (!query) {
    return false;
  }

  query = query.trim();
  return query !== '';
}

/**
 * Gets the pages store for database operations
 * @returns {Promise<{pagesStore: IDBObjectStore, transaction: IDBTransaction}>} - Pages store and transaction
 */
async function getPagesStore() {
  const db = await openDb();
  const transaction = db.transaction([pagesScheme]);
  transaction.onerror = () => {
    console.error('uugle-vibe: load page list error', transaction.error);
  };

  const pagesStore = transaction.objectStore(pagesScheme);
  return { pagesStore, transaction };
}

/**
 * Loads pages from search results
 * @param {Array} indexResults - Search index results
 * @param {IDBObjectStore} pagesStore - Pages store
 * @returns {Promise<Array>} - Loaded pages
 */
async function loadPagesFromSearchResults(indexResults, pagesStore) {
  const results = await Promise.all(
    indexResults.map(indexDoc => {
      return requestToPromise(pagesStore.get(parseInt(indexDoc.ref)))
        .then(page => {
          return { ...page, url: getPageUrl(page), bookUrl: getBookUrl(page) };
        })
        .catch(error => {
          console.error('uugle-vibe: error loading page:', indexDoc.ref, error);
        });
    }),
  );

  return results;
}

/**
 * Fulltext search in index
 * @param {string} query - Search query
 * @param {Function} suggest - Callback function for suggestions
 * @returns {Promise<void>}
 */
export async function searchAndSuggest(query, suggest) {
  const searchResults = await search(query);
  const suggestions = searchResults.map(getSuggestion);
  suggest(suggestions);
}

/**
 * Escapes HTML special chars
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Escaped string
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get all available indexed books
 * @returns {Promise<Array>} - Array of book objects
 */
export async function getAvailableBooks() {
  try {
    const db = await openDb();
    const transaction = db.transaction([booksScheme]);
    const booksStore = transaction.objectStore(booksScheme);
    return await requestToPromise(booksStore.getAll());
  } catch (error) {
    console.error('uugle-vibe: Error loading books:', error);
    return [];
  }
}

/**
 * Get all pages for a specific book with pagination
 * @param {string} bookId - The AWID of the book
 * @param {number} pageSize - Number of records to fetch per page
 * @param {number} pageNum - Page number (0-based)
 * @returns {Promise<{pages: Array, totalPages: number, hasMore: boolean}>} - Paginated results
 */
async function getAllPagesForBook(bookId, pageSize = DEFAULT_PAGE_SIZE, pageNum = 0) {
  try {
    const db = await openDb();
    const transaction = db.transaction([pagesScheme]);
    const pagesStore = transaction.objectStore(pagesScheme);

    // Use the "awid" index to get all pages for this book
    const index = pagesStore.index('awid');

    // Count total pages (for pagination info)
    const totalCount = await requestToPromise(index.count(bookId));
    const totalPages = Math.ceil(totalCount / pageSize);

    // Use cursor to implement pagination
    const skipCount = pageNum * pageSize;
    return await getPagesWithCursor(index, bookId, pageSize, pageNum, skipCount, totalPages);
  } catch (error) {
    console.error(`uugle-vibe: Error fetching pages for book ${bookId}:`, error);
    return { pages: [], totalPages: 0, hasMore: false };
  }
}

/**
 * Gets pages using a cursor with pagination
 * @param {IDBIndex} index - Index to use
 * @param {string} bookId - Book ID
 * @param {number} pageSize - Page size
 * @param {number} pageNum - Page number
 * @param {number} skipCount - Records to skip
 * @param {number} totalPages - Total pages
 * @returns {Promise<{pages: Array, totalPages: number, hasMore: boolean}>} - Paginated results
 */
async function getPagesWithCursor(index, bookId, pageSize, pageNum, skipCount, totalPages) {
  const cursorRequest = index.openCursor(IDBKeyRange.only(bookId));

  return new Promise((resolve, reject) => {
    let pages = [];
    let cursorPosition = 0;

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;

      if (!cursor) {
        // End of records reached
        const pagesWithUrls = addUrlsToPages(pages);
        resolve({
          pages: pagesWithUrls,
          totalPages,
          hasMore: pageNum < totalPages - 1,
        });
        return;
      }

      // Skip records until we reach our desired page
      if (cursorPosition < skipCount) {
        // Use advance with a larger step for efficiency when skipping many records
        const advanceBy = Math.min(skipCount - cursorPosition, 100);
        cursorPosition += advanceBy;
        cursor.advance(advanceBy);
        return;
      }

      // We're on the right page, collect records
      if (pages.length < pageSize) {
        pages.push(cursor.value);
        cursor.continue();
      } else {
        // We've collected enough records
        const pagesWithUrls = addUrlsToPages(pages);
        resolve({
          pages: pagesWithUrls,
          totalPages,
          hasMore: pageNum < totalPages - 1,
        });
      }
    };

    cursorRequest.onerror = (event) => {
      console.error(`uugle-vibe: Error fetching pages for book ${bookId}:`, event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Adds URLs to pages
 * @param {Array} pages - Pages
 * @returns {Array} - Pages with URLs
 */
function addUrlsToPages(pages) {
  return pages.map(page => ({
    ...page,
    url: getPageUrl(page),
    bookUrl: getBookUrl(page),
  }));
}

/**
 * Search with filters, including pagination
 * @param {string} query - Search query
 * @param {string|null} bookId - Book ID filter
 * @param {number} pageSize - Page size
 * @param {number} pageNum - Page number
 * @returns {Promise<Array|{pages: Array, totalPages: number, hasMore: boolean}>} - Search results
 */
export async function searchWithFilters(query, bookId = null, pageSize = DEFAULT_PAGE_SIZE, pageNum = 0) {
  validateSearchIndex();

  // Special case: If we have a bookId and an empty query,
  // we should return ALL pages from that book without text filtering
  const isEmptyQuery = !query || query.trim() === '';

  if (isEmptyQuery && bookId) {
    return await getAllPagesForBook(bookId, pageSize, pageNum);
  }

  // Regular search behavior for non-empty queries
  if (isEmptyQuery) {
    return [];
  }

  query = query.trim();

  // First, we query index for page ids
  const indexResults = searchIndex.search(query, { expand: true });

  if (indexResults.length === 0) {
    return [];
  }

  // Get total results and calculate page bounds
  const totalResults = indexResults.length;
  const startIndex = pageNum * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalResults);
  
  // Slice the results for the current page
  const pagedIndexResults = indexResults.slice(startIndex, endIndex);

  // Load the pages from database
  const db = await openDb();
  const transaction = db.transaction([pagesScheme]);
  const pagesStore = transaction.objectStore(pagesScheme);

  // Get pages in batches for better performance
  const results = await loadPagesInBatches(pagedIndexResults, pagesStore);

  // Filter by bookId if provided
  const filteredResults = bookId
    ? results.filter(page => page && page.awid === bookId)
    : results;

  return filteredResults;
}

/**
 * Loads pages in batches for better performance
 * @param {Array} indexResults - Search index results
 * @param {IDBObjectStore} pagesStore - Pages store
 * @returns {Promise<Array>} - Loaded pages
 */
async function loadPagesInBatches(indexResults, pagesStore) {
  const batchSize = 10; // Process in smaller batches for smoother UI
  const results = [];

  for (let i = 0; i < indexResults.length; i += batchSize) {
    const batch = indexResults.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(indexDoc => {
        return requestToPromise(pagesStore.get(parseInt(indexDoc.ref)))
          .then(page => {
            if (!page) return null;
            return { ...page, url: getPageUrl(page), bookUrl: getBookUrl(page) };
          })
          .catch(error => {
            console.error('uugle-vibe: error loading page:', indexDoc.ref, error);
            return null;
          });
      }),
    );
    results.push(...batchResults.filter(Boolean));
  }

  return results;
}
