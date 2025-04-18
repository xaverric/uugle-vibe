import "./assets/img/icon-34.png";
import "./assets/img/icon-128.png";
import indexBook from "./indexBook";
import { initialize } from "./searchIndex";
import { search, searchAndSuggest, searchWithFilters, getAvailableBooks } from "./search";

// Constants
const MESSAGE_TYPES = {
  BOOK_DATA_RETRIEVED: "bookDataRetrieved",
  INDEX_MNGKIT_DOC: "indexMngkitDoc",
  SEARCH_REQUEST: "searchRequest",
  GET_BOOKS_REQUEST: "getBooksRequest",
  INDEX_BOOKKIT: "indexBookkit",
  SEARCH_INDEX_UPDATED: "searchIndexUpdated"
};

// Service worker self-registration
window.addEventListener('install', (event) => {
  window.skipWaiting();
});

window.addEventListener('activate', (event) => {
  // Claim any clients immediately
  window.clients.claim();
});

// Initialize extension
const initializeExtension = async () => {
  try {
    await initialize();
    setupOmnibox();
    setupMessageHandlers();
  } catch (err) {
    console.error("uugle-vibe: Error initializing extension:", err);
  }
};

/**
 * Sets up the omnibox integration
 */
function setupOmnibox() {
  if (!chrome.omnibox) return;

  chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    searchAndSuggest(text, suggest)
      .catch(err => console.error('uugle-vibe: Error providing suggestions:', err));
  });

  chrome.omnibox.onInputEntered.addListener((text) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      chrome.tabs.update(currentTab.id, { url: text });
    });
  });
}

/**
 * Sets up message handlers for extension communication
 */
function setupMessageHandlers() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const messageHandlers = {
      [MESSAGE_TYPES.BOOK_DATA_RETRIEVED]: handleBookDataRetrieved,
      [MESSAGE_TYPES.INDEX_MNGKIT_DOC]: handleIndexMngkitDoc,
      [MESSAGE_TYPES.SEARCH_REQUEST]: handleSearchRequest,
      [MESSAGE_TYPES.GET_BOOKS_REQUEST]: handleGetBooksRequest,
      [MESSAGE_TYPES.INDEX_BOOKKIT]: handleIndexBookkit,
      [MESSAGE_TYPES.SEARCH_INDEX_UPDATED]: handleSearchIndexUpdated
    };

    // Handle legacy message type
    if (request.type === "indexMngkitDoc") {
      return messageHandlers[MESSAGE_TYPES.INDEX_MNGKIT_DOC](request, sender, sendResponse);
    }

    const handler = messageHandlers[request.messageType];
    if (handler) {
      return handler(request, sender, sendResponse);
    }

    return false;
  });
}

/**
 * Handles the bookDataRetrieved message
 * @param {Object} request - The request message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - The response callback
 * @returns {boolean} - Whether sendResponse will be called asynchronously
 */
function handleBookDataRetrieved(request, sender, sendResponse) {
  indexBook(request.data)
    .then(() => {
      sendResponse({ success: true });
    })
    .catch(err => {
      sendResponse({ success: false, error: err.message });
    });
  
  return true; // Keep the message channel open for the async response
}

/**
 * Handles the indexMngkitDoc message
 * @param {Object} request - The request message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - The response callback
 * @returns {boolean} - Whether sendResponse will be called asynchronously
 */
function handleIndexMngkitDoc(request, sender, sendResponse) {
  let dataToProcess = request.data;
  
  // Validate the data structure we received
  if (!dataToProcess) {
    sendResponse({ success: false, error: "Missing data in request" });
    return true;
  }
  
  // Make sure we have a URL (required for AWID extraction)
  if (!dataToProcess.url) {
    if (sender && sender.url) {
      dataToProcess.url = sender.url;
    } else {
      sendResponse({ success: false, error: "Missing URL in data" });
      return true;
    }
  }
  
  // Process the data
  dataToProcess = prepareDocumentData(dataToProcess);
  
  // Index the document
  indexDocument(dataToProcess, sendResponse);
  
  return true; // Keep the message channel open for the async response
}

/**
 * Prepares document data for indexing
 * @param {Object} dataToProcess - The data to process
 * @returns {Object} - The processed data
 */
function prepareDocumentData(dataToProcess) {
  // Allow more flexible document structure
  if (!dataToProcess.document) {
    if (dataToProcess.data && dataToProcess.data.document) {
      // Create a new structure with the document at the top level
      return {
        document: dataToProcess.data.document,
        url: dataToProcess.url
      };
    } else {
      // Use the entire data object as the document
      return {
        document: dataToProcess,
        url: dataToProcess.url
      };
    }
  }
  
  return dataToProcess;
}

/**
 * Indexes a document
 * @param {Object} dataToProcess - The document data to index
 * @param {Function} sendResponse - The response callback
 */
function indexDocument(dataToProcess, sendResponse) {
  indexBook(dataToProcess, 'mngkit')
    .then(() => {
      sendResponse({ success: true });
    })
    .catch(err => {
      // Try with a fallback data structure
      const fallbackData = createFallbackDocument(dataToProcess);
      
      indexBook(fallbackData, 'mngkit')
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(fallbackErr => {
          sendResponse({ success: false, error: err.message });
        });
    });
}

/**
 * Creates a fallback document structure
 * @param {Object} dataToProcess - The original data
 * @returns {Object} - The fallback document
 */
function createFallbackDocument(dataToProcess) {
  return {
    document: {
      name: "Document from " + new URL(dataToProcess.url).hostname,
      id: new URL(dataToProcess.url).pathname.split('/').pop()
    },
    url: dataToProcess.url
  };
}

/**
 * Handles the searchRequest message
 * @param {Object} request - The request message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - The response callback
 * @returns {boolean} - Whether sendResponse will be called asynchronously
 */
function handleSearchRequest(request, sender, sendResponse) {
  const {
    data: { query, bookId, page = 0, pageSize = 50 },
  } = request;

  // In MV3, we need to keep the message channel open for async responses
  const searchFunction = bookId ? searchWithFilters : search;
  searchFunction(query, bookId, pageSize, page)
    .then(formatSearchResults)
    .then(sendResponse)
    .catch(err => {
      sendResponse({ 
        results: [], 
        error: err.message, 
        hasMore: false, 
        totalPages: 1 
      });
    });

  return true; // Keep the message channel open for the async response
}

/**
 * Formats search results to a consistent format
 * @param {Array|Object} results - The search results
 * @returns {Object} - The formatted results
 */
function formatSearchResults(results) {
  if (Array.isArray(results)) {
    // Old format - no pagination info
    return {
      results, 
      hasMore: false, 
      totalPages: 1 
    };
  } else if (results && results.pages) {
    // New format with pagination info
    return {
      results: results.pages, 
      hasMore: results.hasMore, 
      totalPages: results.totalPages
    };
  } else {
    // Fallback - something unexpected
    return { 
      results: [], 
      hasMore: false, 
      totalPages: 1 
    };
  }
}

/**
 * Handles the getBooksRequest message
 * @param {Object} request - The request message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - The response callback
 * @returns {boolean} - Whether sendResponse will be called asynchronously
 */
function handleGetBooksRequest(request, sender, sendResponse) {
  getAvailableBooks()
    .then(books => {
      sendResponse({ books });
    })
    .catch(err => {
      sendResponse({ books: [], error: err.message });
    });
    
  return true; // Keep the message channel open for the async response
}

/**
 * Handles the indexBookkit message
 * @param {Object} request - The request message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - The response callback
 * @returns {boolean} - Whether sendResponse will be called asynchronously
 */
function handleIndexBookkit(request, sender, sendResponse) {
  indexBook(request.data)
    .then(() => {
      sendResponse({ success: true });
    })
    .catch(err => {
      sendResponse({ success: false, error: err.message });
    });
  return true; // Keep the message channel open for the async response
}

/**
 * Handles the searchIndexUpdated message
 * @param {Object} request - The request message
 * @param {Object} sender - The sender of the message
 * @param {Function} sendResponse - The response callback
 * @returns {boolean} - Whether sendResponse will be called asynchronously
 */
function handleSearchIndexUpdated(request, sender, sendResponse) {
  // This is sent from the Plugin Management page after importing data
  // Reinitialize the search functionality to reload the index from IndexedDB
  initialize()
    .then(() => {
      sendResponse({ success: true });
    })
    .catch(err => {
      sendResponse({ success: false, error: err.message });
    });
  
  return true; // Keep the message channel open for the async response
}

// Initialize the extension when the service worker starts
initializeExtension()
  .catch(err => console.error('uugle-vibe: Extension initialization failed:', err));

// Set up context menu and keyboard shortcuts when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

/**
 * Sets up context menu items
 */
function setupContextMenu() {
  // Create context menu for plugin management
  chrome.contextMenus.create({
    id: "managePlugins",
    title: "Plugin Management",
    contexts: ["action"], // Show context menu on the extension icon
  });

  // Add listener for context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "managePlugins") {
      // Open the plugin management page in a new tab
      chrome.tabs.create({ url: "pluginManagement.html" });
    }
  });
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-search") {
    // Open the popup programmatically
    chrome.action.openPopup();
  }
});
