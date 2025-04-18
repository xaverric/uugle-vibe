console.log("uugle-vibe: inject script is running");

(function () {
  // XHR interception setup for capturing book data
  const origOpen = XMLHttpRequest.prototype.open;
  
  // Store data from multiple API calls to build a complete picture
  const bookData = {
    loadBook: null,
    getBookStructure: null,
  };
  
  // Data for managementkit documents
  const mngkitData = {
    document: null
  };

  console.log("uugle-vibe: XHR interception set up");

  // Intercept XMLHttpRequest to capture book and document data
  setupXHRInterception();
  
  // Intercept fetch requests for newer implementations
  setupFetchInterception();
  
  // Check for managementkit data after page load
  setupPageLoadHandler();
  
  /**
   * Set up XMLHttpRequest interception
   */
  function setupXHRInterception() {
    XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
      // Book data interception
      if (url.includes("loadBook")) {
        setupLoadBookListener(this);
      }
      
      if (url.includes("getBookStructure")) {
        setupGetBookStructureListener(this);
      }
      
      // Managementkit document interception
      if (isManagementKitDocumentRequest(url)) {
        setupManagementKitDocumentListener(this);
      }
      
      // Call original open method
      origOpen.apply(this, arguments);
    };
  }
  
  /**
   * Determines if a URL is for a managementkit document request
   * @param {string} url - The request URL
   * @returns {boolean} - Whether it is a managementkit document request
   */
  function isManagementKitDocumentRequest(url) {
    return url.includes("document/loadByOid") || 
           url.includes("document/load") || 
           url.includes("getDocument") || 
           url.includes("getData") || 
           (url.includes("managementkit") && url.includes("load"));
  }
  
  /**
   * Sets up a listener for loadBook responses
   * @param {XMLHttpRequest} xhr - The XMLHttpRequest instance
   */
  function setupLoadBookListener(xhr) {
    xhr.addEventListener("load", function () {
      try {
        bookData.loadBook = JSON.parse(this.responseText);
        checkAndDispatchEvent();
      } catch (error) {
        console.error("uugle-vibe: Error parsing loadBook response", error);
      }
    });
  }
  
  /**
   * Sets up a listener for getBookStructure responses
   * @param {XMLHttpRequest} xhr - The XMLHttpRequest instance
   */
  function setupGetBookStructureListener(xhr) {
    xhr.addEventListener("load", function () {
      try {
        bookData.getBookStructure = JSON.parse(this.responseText);
        checkAndDispatchEvent();
      } catch (error) {
        console.error("uugle-vibe: Error parsing getBookStructure response", error);
      }
    });
  }
  
  /**
   * Sets up a listener for managementkit document responses
   * @param {XMLHttpRequest} xhr - The XMLHttpRequest instance
   */
  function setupManagementKitDocumentListener(xhr) {
    xhr.addEventListener("load", function () {
      try {
        const responseData = JSON.parse(this.responseText);
        
        // Process and extract document data
        mngkitData.document = extractDocumentData(responseData);
        checkAndDispatchMngkitEvent();
      } catch (error) {
        console.error("uugle-vibe: Error parsing managementkit document response", error);
        console.error("uugle-vibe: Error details:", error.stack);
        console.error("uugle-vibe: Raw response:", this.responseText.substring(0, 200) + "...");
      }
    });
  }
  
  /**
   * Set up fetch interception for newer implementations
   */
  function setupFetchInterception() {
    const originalFetch = window.fetch;
    
    window.fetch = (...args) =>
      (async args => {
        try {
          const response = await originalFetch(...args);
          
          // Get the request URL
          const url = response.url || (args[0] && (typeof args[0] === 'string' ? args[0] : args[0].url));
          
          // Skip if not a supported content type
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            return response;
          }
          
          // Process fetch responses based on URL patterns
          await processFetchResponse(response.clone(), url);
          
          return response;
        } catch (fetchError) {
          console.error("uugle-vibe: Fetch error:", fetchError);
          throw fetchError; // Rethrow to maintain normal behavior
        }
      })(args);
  }
  
  /**
   * Process a fetch response based on URL patterns
   * @param {Response} response - The cloned fetch response
   * @param {string} url - The request URL
   */
  async function processFetchResponse(response, url) {
    try {
      if (url.includes("loadBook")) {
        bookData.loadBook = await response.json();
        checkAndDispatchEvent();
      } else if (url.includes("sys/uuAppWorkspace/load")) {
        const responseJson = await response.json();
        bookData.loadBook = responseJson.data;
        checkAndDispatchEvent();
      } else if (url.includes("getBookStructure")) {
        bookData.getBookStructure = await response.json();
        checkAndDispatchEvent();
      } else if (isManagementKitDocumentRequest(url)) {
        const responseJson = await response.json();
        mngkitData.document = extractDocumentData(responseJson);
        checkAndDispatchMngkitEvent();
      }
    } catch (error) {
      console.error("uugle-vibe: Error handling fetch response:", error);
      console.error("uugle-vibe: Error details:", error.stack);
    }
  }
  
  /**
   * Extract document data from various response formats
   * @param {Object} responseData - The response data
   * @returns {Object} - The extracted document data
   */
  function extractDocumentData(responseData) {
    if (responseData.data && responseData.data.document) {
      return responseData.data.document;
    } else if (responseData.document) {
      return responseData.document;
    } else if (responseData.data && responseData.data.item) {
      // Some managementkit APIs return data.item
      return responseData.data.item;
    } else if (responseData.item) {
      return responseData.item;
    } else if (responseData.data) {
      // If there's just a data object with no document/item, use that
      return responseData.data;
    } 
    return responseData;
  }
  
  /**
   * Set up handler for checking managementkit data after page load
   */
  function setupPageLoadHandler() {
    window.addEventListener('load', function() {
      setTimeout(() => {
        // Check if we're on a managementkit page
        if (window.location.href.includes('managementkit')) {
          // Try to find document data in the window object
          if (window.uuManagementKit && window.uuManagementKit.document) {
            mngkitData.document = window.uuManagementKit.document;
            checkAndDispatchMngkitEvent();
          }
        }
      }, 1000); // Give the page a second to load
    });
  }
  
  /**
   * Check if book data is complete and dispatch event
   */
  function checkAndDispatchEvent() {
    if (bookData.loadBook && bookData.getBookStructure) {
      // Once we have both response data we invoke event, which is consumed by uugle-vibe plugin to index the book
      document.dispatchEvent(
        new CustomEvent("uugle-vibe:bookRetrieved", {
          detail: JSON.stringify(bookData),
        })
      );
    }
  }
  
  /**
   * Check if managementkit document data is available and dispatch event
   */
  function checkAndDispatchMngkitEvent() {
    if (mngkitData.document) {
      document.dispatchEvent(
        new CustomEvent("uugle-vibe:mngkitDocRetrieved", {
          detail: JSON.stringify(mngkitData),
        })
      );
    }
  }
})();
