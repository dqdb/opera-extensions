(function()
{
	var hideElements = function(tab)
	{
		if (tab.url == "opera://startpage/")
			chrome.tabs.insertCSS(tab.id, { code: "form, nav { display: none !important; } #view-container { top: 0px !important; }", runAt: "document_start" });
	};
		
	chrome.tabs.onCreated.addListener(function(tab) { hideElements(tab); } );
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) { hideElements(tab); } );
})();
