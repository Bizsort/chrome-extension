function insertContentScript(tabId, actionPage) {
    console.log("background.js: Injecting content script");
    chrome.tabs.insertCSS(tabId, { file: "content_script/contentSelector.css" });
    chrome.tabs.executeScript(tabId, { file: "import/jquery/jquery-3.2.1.js" });
    chrome.tabs.executeScript(tabId, { file: "content_script/common.js" });
    chrome.tabs.executeScript(tabId, { file: "content_script/contentSelector.js" });
    switch (actionPage) {
        case 'BusinessProfile':
            chrome.tabs.executeScript(tabId, { file: "content_script/businessSelector.js" });
            break;
        case 'BusinessProduct':
            chrome.tabs.executeScript(tabId, { file: "content_script/productSelector.js" });
            break;
        case 'MultiProduct':
            chrome.tabs.executeScript(tabId, { file: "content_script/multiProductSelector.js" });
            break;
    }
};