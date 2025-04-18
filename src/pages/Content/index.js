import { printLine } from "./modules/print";

//TODO rename to content.js

printLine("Using the print module");

/**
 * We listen for event from inject.js script, who sends us loaded book data.
 * We add current page URL to this data and send message to background script.
 */
document.addEventListener("uugle-vibe:bookRetrieved", function (e) {
  const data = { ...JSON.parse(e.detail), url: window.location.href };
  
  // Send the data to background service worker
  try {
    chrome.runtime.sendMessage({ 
      messageType: "bookDataRetrieved", 
      data: data 
    }, 
    response => {
      if (chrome.runtime.lastError) {
        console.error("uugle-vibe: Error sending message to background:", chrome.runtime.lastError);
      }
    });

    // Legacy support
    chrome.runtime.sendMessage({
      type: "indexBook",
      data: data,
    });
  } catch (error) {
    console.error("uugle-vibe: Failed to send message to background script:", error);
  }
});

// Listen for managementkit document events
document.addEventListener("uugle-vibe:mngkitDocRetrieved", (event) => {
  try {
    const parsedData = JSON.parse(event.detail);
    
    // Preserve the original URL for managementkit documents
    parsedData.url = window.location.href;
    
    chrome.runtime.sendMessage({
      type: "indexMngkitDoc",
      data: parsedData,
    }, response => {
      if (chrome.runtime.lastError) {
        console.error("uugle-vibe: Error sending managementkit data to background:", chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error("uugle-vibe: Failed to process managementkit document event:", error);
  }
});

// Listen for any errors in the page context
window.addEventListener('error', function(event) {
  console.error('uugle-vibe: Error in page context:', event.error);
});

//content script run in isolated context, so we need to inject script into the page
//see https://stackoverflow.com/questions/9515704/insert-code-into-the-page-context-using-a-content-script/9517879#9517879
const scriptElement = document.createElement("script");
scriptElement.src = chrome.runtime.getURL("inject.bundle.js");
scriptElement.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(scriptElement);
