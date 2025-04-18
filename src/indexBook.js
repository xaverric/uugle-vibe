import patchUtil from "./patch";
import {
  booksScheme,
  indexScheme,
  openDb,
  pagesScheme,
  requestToPromise,
  indexObjectId,
} from "./common";
import { searchIndex } from "./searchIndex";

// Constants
const BOOK_INDEX_EXPIRATION = 60 * 60 * 1000; // 1 hour
const BOOK_TYPES = {
  BOOKKIT: 'bookkit',
  MNGKIT: 'mngkit'
};

/**
 * Indexes new book or re-indexes existing book
 * @param bookData - The book data to index
 * @param {string} type - 'bookkit' or 'mngkit' to specify the document type
 */
export default async function indexBook(bookData, type = BOOK_TYPES.BOOKKIT) {
  const db = await openDb();
  const transaction = db.transaction(
    [booksScheme, pagesScheme, indexScheme],
    "readwrite"
  );

  transaction.onerror = () => {
    console.error("uugle-vibe: book indexing error");
  };

  const booksStore = transaction.objectStore(booksScheme);
  const pagesStore = transaction.objectStore(pagesScheme);

  // Extract AWID based on book type
  const awid = type === BOOK_TYPES.MNGKIT 
    ? getMngkitAwid(bookData.url) 
    : getBookAwid(bookData.url);
  
  const currentTime = new Date();

  // If the book has been already indexed and index is up to date, then there is no more to be done
  let book = await getBookByAwid(booksStore, awid);
  if (book && book.lastUpdate > currentTime - BOOK_INDEX_EXPIRATION) {
    return;
  }

  // Create new book or update existing book
  let existingPages;
  if (!book) {
    book = type === BOOK_TYPES.MNGKIT 
      ? createNewMngkitObject(bookData.document, awid, currentTime) 
      : createNewBookObject(bookData.loadBook, awid, currentTime);
    existingPages = [];
  } else {
    book.lastUpdate = currentTime;
    existingPages = await getBookPages(awid, pagesStore);
  }
  
  let bookId = await requestToPromise(booksStore.put(book));

  // Create list of pages from retrieved book data
  const bookDataPages = type === BOOK_TYPES.MNGKIT 
    ? getMngkitPageList(bookData, bookId, awid) 
    : getPageList(bookData, bookId, awid);

  // Apply changes to the database
  const changePatch = patchUtil.getPatch(existingPages, bookDataPages, comparePages);
  await applyChangePatch(changePatch, pagesStore);

  // Store updated index serialized in JSON
  await updateSearchIndex(transaction);
}

/**
 * Updates the search index in the database
 * @param {IDBTransaction} transaction - The current transaction
 */
async function updateSearchIndex(transaction) {
  const indexStore = transaction.objectStore(indexScheme);
  const indexObject = {
    id: indexObjectId,
    indexDump: JSON.stringify(searchIndex),
  };
  await requestToPromise(indexStore.put(indexObject));
}

/**
 * Extracts bookkit base URL and awid from any page URL.
 * @param {string} pageUrl
 * @returns {string}
 */
function getBookAwid(pageUrl) {
  const bookBaseUrlRexExp = /https:\/\/[a-zA-Z0-9]+\.plus4u.net\/(uu-dockitg01-main|uu-bookkit-maing01|uu-bookkitg01-main)\/([a-z0-9]+-)?([a-z0-9]+)/;
  const matches = pageUrl.match(bookBaseUrlRexExp);
  if (!matches || matches.length === 0) {
    throw new Error("uugle-vibe: invalid bookkit page url: " + pageUrl);
  }

  return matches[3];
}

/**
 * Extracts managementkit base URL and awid from any page URL.
 * @param {string} pageUrl
 * @returns {string}
 */
function getMngkitAwid(pageUrl) {
  try {
    const url = new URL(pageUrl);
    const oid = url.searchParams.get('oid');

    if (oid && /^[a-f0-9]+$/.test(oid)) { // Check if oid looks like a valid hex OID
      return oid; // Use the document OID as the primary key
    }

    // Fallback 1: Try extracting application workspace ID from path
    const pathPatterns = [
      /https:\/\/[a-zA-Z0-9.-]+\.plus4u.net\/uu-managementkit-maing[0-9]+\/([a-z0-9]+-)?([a-z0-9]+)/,
      /https:\/\/[a-zA-Z0-9.-]+\/uu-managementkit-maing[0-9]+\/([a-z0-9]+-)?([a-z0-9]+)/,
      /uu-managementkit-maing[0-9]+\/([a-z0-9]+-)?([a-z0-9]+)/
    ];
    
    for (const pattern of pathPatterns) {
      const matches = pageUrl.match(pattern);
      if (matches) {
        const awid = matches[matches.length - 1];
        // For now, let's assume AWID is sufficient if OID is missing.
        return awid;
      }
    }

    // Fallback 2: Hash relevant parts of the URL (excluding pageOid)
    return createUrlBasedFallbackAwid(url);

  } catch (e) {
    console.error("uugle-vibe: Error parsing managementkit URL:", pageUrl, e);
    // Fallback 3: Absolute last resort hash if URL parsing fails
    const fallbackAwid = 'mngkit-err-' + btoa(pageUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
    return fallbackAwid;
  }
}

/**
 * Creates a fallback AWID based on URL parameters
 * @param {URL} url - URL object
 * @returns {string} - Fallback AWID
 */
function createUrlBasedFallbackAwid(url) {
  url.searchParams.delete('pageOid'); // Remove pageOid before hashing
  const stringToHash = url.pathname + url.search; // Hash path + remaining query params
  return 'mngkit-' + btoa(stringToHash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
}

/**
 * Loads single book by AWID
 * @param {IDBObjectStore} bookStore - The books object store
 * @param {string} awid - The AWID to search for
 * @returns {Promise<Book>}
 */
function getBookByAwid(bookStore, awid) {
  return requestToPromise(bookStore.get(awid));
}

/**
 * Gets all pages for a specific book
 * @param {string} awid - The book's AWID
 * @param {IDBObjectStore} pagesStore - The pages object store
 * @returns {Promise<Array>}
 */
async function getBookPages(awid, pagesStore) {
  const index = pagesStore.index("awid");
  return requestToPromise(index.getAll(awid));
}

/**
 * Compares two pages for equality
 * @param {Object} pageA - First page
 * @param {Object} pageB - Second page
 * @returns {boolean} - Whether pages are equal
 */
function comparePages(pageA, pageB) {
  return (
    pageA.code === pageB.code &&
    pageA.name === pageB.name &&
    pageA.bookName === pageB.bookName &&
    pageA.state === pageB.state
  );
}

/**
 * Applies changes to the pages database
 * @param {Array} patch - Patch of changes
 * @param {IDBObjectStore} pagesStore - The pages object store
 */
async function applyChangePatch(patch, pagesStore) {
  // Handle page removals
  const pagesToRemove = extractPagesToRemove(patch);
  await removePagesFromStore(pagesToRemove, pagesStore);

  // Handle page additions
  const pagesToAdd = extractPagesToAdd(patch);
  await addPagesToStore(pagesToAdd, pagesStore);
}

/**
 * Extracts pages to remove from the patch
 * @param {Array} patch - Patch of changes
 * @returns {Array} - Pages to remove
 */
function extractPagesToRemove(patch) {
  let pagesToRemove = [];
  patch
    .filter(action => action.type === "remove")
    .forEach(action => {
      pagesToRemove = [...pagesToRemove, ...action.items];
    });
  return pagesToRemove;
}

/**
 * Extracts pages to add from the patch
 * @param {Array} patch - Patch of changes
 * @returns {Array} - Pages to add
 */
function extractPagesToAdd(patch) {
  let pagesToAdd = [];
  patch
    .filter(action => action.type === "add")
    .forEach(action => (pagesToAdd = [...pagesToAdd, ...action.items]));
  return pagesToAdd;
}

/**
 * Removes pages from the store
 * @param {Array} pagesToRemove - Pages to remove
 * @param {IDBObjectStore} pagesStore - The pages object store
 */
async function removePagesFromStore(pagesToRemove, pagesStore) {
  await Promise.all(
    pagesToRemove.map(page => {
      return requestToPromise(pagesStore.delete(page.id))
        .then(() => {
          searchIndex.removeDoc(page);
        })
        .catch(e => console.error("uugle-vibe: error removing page ", e));
    })
  );
}

/**
 * Adds pages to the store
 * @param {Array} pagesToAdd - Pages to add
 * @param {IDBObjectStore} pagesStore - The pages object store
 */
async function addPagesToStore(pagesToAdd, pagesStore) {
  await Promise.all(
    pagesToAdd.map(page => {
      // Store the full page object (including content, url etc.) in IndexedDB
      return requestToPromise(pagesStore.add(page)).then(pageId => {
        // Add relevant fields to the search index
        const indexDoc = {
          id: pageId, // Use the DB key as the doc ID
          name: page.name,
          bookName: page.bookName,
          // Add the extracted content to the search index
          content: page.content || '', // Ensure content is a string
        };
        searchIndex.addDoc(indexDoc);
      });
    })
  );
}

/**
 * Creates a new book object from book data
 * @param {Object} bookData - Book data
 * @param {string} awid - AWID
 * @param {Date} lastUpdate - Last update timestamp
 * @returns {Object} - New book object
 */
function createNewBookObject(bookData, awid, lastUpdate) {
  const { primaryLanguage, name } = bookData;
  return {
    awid,
    name: name[primaryLanguage],
    lastUpdate,
  };
}

/**
 * Creates a new managementkit object from document data
 * @param {Object} docData - Document data
 * @param {string} awid - AWID
 * @param {Date} lastUpdate - Last update timestamp
 * @returns {Object} - New managementkit object
 */
function createNewMngkitObject(docData, awid, lastUpdate) {
  return {
    awid,
    name: docData.name,
    lastUpdate,
  };
}

// Text extraction functions
/**
 * Extracts text from UU5 JSON string
 * @param {string} uu5JsonString - UU5 JSON string
 * @returns {string} - Extracted text
 */
function extractTextFromUu5Json(uu5JsonString) {
  if (!uu5JsonString || typeof uu5JsonString !== 'string' || !uu5JsonString.startsWith('<uu5json/>')) {
    return '';
  }
  try {
    const jsonPart = uu5JsonString.substring('<uu5json/>'.length);
    const data = JSON.parse(jsonPart);
    return extractStringsFromObject(data).trim();
  } catch (error) {
    console.error('uugle-vibe: Error parsing uu5json string:', error, uu5JsonString);
    return '';
  }
}

/**
 * Extracts strings from an object recursively
 * @param {any} obj - Object to extract strings from
 * @returns {string} - Extracted strings
 */
function extractStringsFromObject(obj) {
  let text = '';
  if (typeof obj === 'string') {
    text += obj + ' ';
  } else if (Array.isArray(obj)) {
    obj.forEach(item => text += extractStringsFromObject(item));
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(value => text += extractStringsFromObject(value));
  }
  return text;
}

/**
 * Extracts text from a content node
 * @param {Object} node - Content node
 * @returns {string} - Extracted text
 */
function extractTextFromContentNode(node) {
  let text = '';
  if (!node) return text;

  // Extract text from known text properties
  text += extractTextFromBasicProperties(node);
  
  // Handle object headers
  if (typeof node.header === 'object' && node.header !== null) {
     text += extractTextFromContentNode(node.header) + ' ';
  }

  // Handle uu5Tag content
  text += extractTextFromUu5Tag(node);
  
  // Recursively process common container properties
  text += extractTextFromContainerProperties(node);

  return text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
}

/**
 * Extracts text from basic properties of a node
 * @param {Object} node - Content node
 * @returns {string} - Extracted text
 */
function extractTextFromBasicProperties(node) {
  let text = '';
  if (typeof node.name === 'string') text += node.name + ' ';
  if (typeof node.title === 'string') text += node.title + ' ';
  if (typeof node.label === 'string') text += node.label + ' ';
  if (typeof node.header === 'string') text += node.header + ' ';
  if (typeof node.text === 'string') text += node.text + ' ';
  return text;
}

/**
 * Extracts text from UU5 tag
 * @param {Object} node - Content node
 * @returns {string} - Extracted text
 */
function extractTextFromUu5Tag(node) {
  let text = '';
  if (node.uu5Tag && node.props) {
     if (node.uu5Tag === 'Uu5TilesBricks.Table' && node.props.data) {
         text += extractTextFromUu5Json(node.props.data) + ' ';
     }
     if (node.uu5Tag === 'Uu5TilesBricks.Table' && node.props.columns) {
         text += extractTextFromUu5Json(node.props.columns) + ' ';
     }
  }
  return text;
}

/**
 * Extracts text from container properties of a node
 * @param {Object} node - Content node
 * @returns {string} - Extracted text
 */
function extractTextFromContainerProperties(node) {
  let text = '';
  if (Array.isArray(node.content)) {
    node.content.forEach(child => text += extractTextFromContentNode(child) + ' ');
  }
  if (Array.isArray(node.sectionList)) {
    node.sectionList.forEach(child => text += extractTextFromContentNode(child) + ' ');
  }
  if (node.mainPanel) {
    text += extractTextFromContentNode(node.mainPanel) + ' ';
  }
  if (node.sidePanel) {
    text += extractTextFromContentNode(node.sidePanel) + ' ';
  }
  if (node.topSection) {
    text += extractTextFromContentNode(node.topSection) + ' ';
  }
  if (node.bottomSection) {
    text += extractTextFromContentNode(node.bottomSection) + ' ';
  }
  return text;
}

// Page list generation functions
/**
 * Gets a list of pages from book data
 * @param {Object} bookData - Book data
 * @param {number} bookId - Book ID
 * @param {string} awid - AWID
 * @returns {Array} - List of pages
 */
function getPageList(bookData, bookId, awid) {
  const { name, primaryLanguage, menu, theme } = bookData.loadBook;
  const itemMap = { ...bookData.getBookStructure.itemMap };
  const bookName = name[primaryLanguage];
  const color = theme?.main;

  const pages = [];

  // First, we iterate pages in menu, because from there we can assemble breadcrumbs
  menu.forEach((menuItem, menuItemIndex) => {
    const pageFromItemMap = itemMap[menuItem.page];

    const pageFromMenu = {
      bookId,
      bookName,
      awid,
      code: menuItem.page,
      name: menuItem.label[primaryLanguage],
      breadcrumbs: getBreadcrumbs(pages, menu, menuItem, menuItemIndex),
      color,
      state: pageFromItemMap?.state,
    };

    // Once page from menu is processed, we delete it from itemMap so we do not index it in duplicite
    if (pageFromItemMap) {
      delete itemMap[menuItem.page];
    }

    pages.push(pageFromMenu);
  });

  // Not every page is in menu, so we need to go through itemMap as well for remaining set of pages
  Object.entries(itemMap).forEach(([code, item]) => {
    const pageFromItemMap = {
      bookId,
      bookName,
      awid,
      code,
      name: item.label[primaryLanguage],
      breadcrumbs: [],
      color,
      state: item.state,
    };
    pages.push(pageFromItemMap);
  });

  return pages;
}

/**
 * Gets a list of pages from managementkit data
 * @param {Object} bookData - Book data
 * @param {number} bookId - Book ID
 * @param {string} awid - AWID
 * @returns {Array} - List of pages
 */
function getMngkitPageList(bookData, bookId, awid) {
  const documentData = bookData.document;
  const documentName = documentData.name || 'Unnamed Document';
  
  // Extract content from the document
  const currentPageContent = extractContentFromDocument(documentData);
  
  // Get the current page oid from the URL if present
  const url = new URL(bookData.url);
  const currentPageOidFromUrl = url.searchParams.get('pageOid') || 'main';
  
  const pages = [];
  
  // Try to find page list in standard locations
  if (documentData.pageList && documentData.pageList.length > 0) {
    // The document has a standard page list
    documentData.pageList.forEach((page, index) => {
      addMngkitPage(pages, page, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, bookData.url, documentData);
    });
  } else {
    // Look for collections of items that might represent pages
    const collections = findPossibleCollections(documentData);
    const foundCollection = processCollections(collections, pages, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, bookData.url, documentData);
    
    // If no collections found, just create a single page for the main document
    if (!foundCollection) {
      createSinglePageForDocument(pages, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, bookData.url);
    }
  }
  
  return pages;
}

/**
 * Extracts content from a document
 * @param {Object} documentData - Document data
 * @returns {string} - Extracted content
 */
function extractContentFromDocument(documentData) {
  if (documentData.requestedPage && documentData.requestedPage.content) {
    // Get content from the requested page if available
    return extractTextFromContentNode(documentData.requestedPage.content);
  } else {
    // Fallback: Try to extract content from the document body
    return extractTextFromContentNode(documentData);
  }
}

/**
 * Finds possible collections in document data
 * @param {Object} documentData - Document data
 * @returns {Array} - List of possible collections
 */
function findPossibleCollections(documentData) {
  return [
    documentData.items,
    documentData.documents,
    documentData.children,
    documentData.list,
    documentData.data?.items,
    documentData.data?.documents,
    documentData.data?.list
  ];
}

/**
 * Processes collections to find pages
 * @param {Array} collections - List of possible collections
 * @param {Array} pages - List of pages to add to
 * @param {string} documentName - Document name
 * @param {number} bookId - Book ID
 * @param {string} awid - AWID
 * @param {string} currentPageOidFromUrl - Current page OID
 * @param {string} currentPageContent - Current page content
 * @param {string} url - URL
 * @param {Object} documentData - Document data
 * @returns {boolean} - Whether a collection was found
 */
function processCollections(collections, pages, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, url, documentData) {
  for (const collection of collections) {
    if (Array.isArray(collection) && collection.length > 0) {
      collection.forEach((item, index) => {
        addMngkitPage(pages, item, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, url, documentData);
      });
      return true;
    }
  }
  return false;
}

/**
 * Creates a single page for the document
 * @param {Array} pages - List of pages to add to
 * @param {string} documentName - Document name
 * @param {number} bookId - Book ID
 * @param {string} awid - AWID
 * @param {string} currentPageOidFromUrl - Current page OID
 * @param {string} currentPageContent - Current page content
 * @param {string} url - URL
 */
function createSinglePageForDocument(pages, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, url) {
  const mainPage = {
    id: undefined, // Will be assigned by IndexedDB
    bookId,
    awid,
    code: currentPageOidFromUrl,
    name: documentName,
    bookName: documentName,
    state: "active",
    url: url,
    content: currentPageContent,
    breadcrumbs: []
  };
  pages.push(mainPage);
}

/**
 * Adds a managementkit page to the pages list
 * @param {Array} pages - List of pages to add to
 * @param {Object} item - Item to add as a page
 * @param {string} documentName - Document name
 * @param {number} bookId - Book ID
 * @param {string} awid - AWID
 * @param {string} currentPageOidFromUrl - Current page OID
 * @param {string} currentPageContent - Current page content
 * @param {string} originalUrl - Original URL
 * @param {Object} documentData - Document data
 */
function addMngkitPage(pages, item, documentName, bookId, awid, currentPageOidFromUrl, currentPageContent, originalUrl, documentData) {
  const itemOid = item.pageOid || item.oid || item.id;
  const itemName = item.name || item.title || item.label || 'Unnamed Item';
  
  // Construct URL with the proper pageOid
  let itemUrl = originalUrl;
  if (itemOid) {
    try {
      const url = new URL(originalUrl);
      url.searchParams.set('pageOid', itemOid);
      if (!url.searchParams.has('oid') && documentData.oid) {
        url.searchParams.set('oid', documentData.oid);
      }
      itemUrl = url.toString();
    } catch (e) {
      // Fallback to original URL if there's an error
    }
  }
  
  // Add content only to the page matching the current pageOid
  const isCurrentPage = itemOid && (itemOid === currentPageOidFromUrl);
  
  pages.push({
    id: undefined, // Will be assigned by IndexedDB
    bookId,
    awid,
    code: itemOid || `mngkit-${awid}-item-${pages.length}`,
    name: itemName,
    bookName: documentName,
    state: item.state || "active",
    url: itemUrl,
    content: isCurrentPage ? currentPageContent : '',
    breadcrumbs: []
  });
}

/**
 * Creates list of breadcrumb pages from menu items
 * @param {Array} pages - List of already created pages
 * @param {Array} menu - Menu structure from loadBook response data
 * @param {Object} menuItem - Current menu item
 * @param {number} menuItemIndex - Current menu item index
 * @returns {Array} - List of breadcrumb pages
 */
function getBreadcrumbs(pages, menu, menuItem, menuItemIndex) {
  if (menuItem.indent === 0) {
    return [];
  }

  for (let i = menuItemIndex - 1; i >= 0; i--) {
    const prevMenuItem = menu[i];
    if (prevMenuItem.indent < menuItem.indent) {
      const parent = pages[i];
      return [...parent.breadcrumbs, createBreadcrumbFromPage(parent)];
    }
  }

  console.error("Could not get breadcrumbs for menu item", menuItem);
  return [];
}

/**
 * Creates breadcrumb from page
 * @param {Object} page - Page
 * @returns {{code: string, name: string}} - Breadcrumb
 */
export function createBreadcrumbFromPage(page) {
  return {
    code: page.code,
    name: page.name,
  };
}
