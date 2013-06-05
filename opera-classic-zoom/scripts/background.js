function getTabZoomLevel(tabId)
{
	return (localStorage.getItem("tab-" + tabId) || 100) * 1;
}

function setTabZoomLevel(tabId, oldLevel, newLevel, allFrames)
{
	var ratio = newLevel / oldLevel;
	var code = "var offsetX = window.pageXOffset; var offsetY = window.pageYOffset; document.body.parentElement.style.zoom = " + (newLevel == 100 ? "null" : "'" + newLevel + "%'") + ";window.scrollTo(offsetX * " + ratio + ", offsetY * " + ratio + ");";
	chrome.tabs.executeScript(tabId, { code: code, allFrames: allFrames, runAt: "document_end" } );
}

chrome.runtime.onStartup.addListener(function()
{
	localStorage.clear();
});

chrome.tabs.onCreated.addListener(function(tab)
{
	if (tab.openerTabId != null)
		localStorage.setItem("tab-" + tab.id, getTabZoomLevel(tab.openerTabId));
});

chrome.tabs.onRemoved.addListener(function(tabId, info)
{
	localStorage.removeItem("tab-" + tabId);
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab)
{
	var level = getTabZoomLevel(tabId);
	if (level != 100)
	{
		var isLoading = info.status == "loading";
		setTabZoomLevel(tabId, isLoading ? 100 : level, level, !isLoading);
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	var oldLevel = getTabZoomLevel(sender.tab.id);
	var newLevel;
	if (request.action == "zoomIn")
		newLevel = oldLevel + 10;
	else if (request.action == "zoomInMore")
		newLevel = oldLevel + 100;
	else if (request.action == "zoomOut")
		newLevel = oldLevel - 10;
	else if (request.action == "zoomOutMore")
		newLevel = oldLevel - 100;
	else if (request.action == "zoomReset")
		newLevel = 100;
	else
		return;

	if (newLevel < 10)
		newLevel = 10;
	else if (newLevel > 1000)
		newLevel = 1000;
	
	if (newLevel == oldLevel)
		return;

	localStorage.setItem("tab-" + sender.tab.id, newLevel);
	setTabZoomLevel(sender.tab.id, oldLevel, newLevel, true);
	sendResponse({ level: newLevel});
});
