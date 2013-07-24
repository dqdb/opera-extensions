chrome.tabs.onCreated.addListener(function(tab) { modifyPage(tab); } );
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) { modifyPage(tab); } );

function modifyPage(tab)
{
	if (tab.url.substring(0, 8) == "opera://")
		chrome.tabs.executeScript(tab.id, { file: "js/related.js", runAt: "document_idle" });
}
