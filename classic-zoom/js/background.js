function getUrlRef(url)
{
	return (localStorage.getItem("url-ref-" + url) || 0) * 1;
}

function addUrlRef(url)
{
	var ref = getUrlRef(url);
	localStorage.setItem("url-ref-" + url, ref + 1);
}

function removeUrlRef(url)
{
	var ref = getUrlRef(url);
	if (ref <= 1)
	{
		localStorage.removeItem("url-ref-" + url);
		localStorage.removeItem("url-zoom-" + url);
	}
	else
	{
		localStorage.setItem("url-ref-" + url, ref - 1);
	}
}

function getUrlZoom(url)
{
	return localStorage.getItem("url-zoom-" + url);
}

function setUrlZoom(url, zoom)
{
	localStorage.setItem("url-zoom-" + url, zoom);
}

function setTabUrl(tabId, newUrl)
{
	var oldUrl = sessionStorage.getItem("tab-url-" + tabId);
	if (oldUrl == newUrl)
		return;

	if (oldUrl != null)
		removeUrlRef(oldUrl);
	
	if (newUrl != null)
	{
		addUrlRef(newUrl);
		sessionStorage.setItem("tab-url-" + tabId, newUrl);
	}
	else
	{
		sessionStorage.removeItem("tab-url-" + tabId);
	}
}

function setTabUrlZoom(tabId, newUrl, newLevel)
{
	setTabUrl(tabId, newUrl);
	setUrlZoom(newUrl, newLevel);
}

function getTabZoom(tabId, returnNull)
{
	var result = sessionStorage.getItem("tab-zoom-" + tabId);
	if (result != null)
		return 1 * result;
	else
		return returnNull ? null : 100;
}

function setTabZoom(tabId, level)
{
	if (level == null)
		sessionStorage.removeItem("tab-zoom-" + tabId);
	else
		sessionStorage.setItem("tab-zoom-" + tabId, level);
}

chrome.tabs.onCreated.addListener(function(tab)
{
	setTabZoom(tab.id, tab.openerTabId != null ? getTabZoom(tab.openerTabId) : 100);
});

chrome.tabs.onRemoved.addListener(function(tabId, info)
{
	setTabZoom(tabId, null);
	if (!info.isWindowClosing)
		setTabUrl(tabId, null);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	console.log("tab: " + sender.tab.url);
	var oldLevel = getTabZoom(sender.tab.id, true);
		console.log("tab level: " + oldLevel);
	if (oldLevel == null)
	{
		// tab restored from previous session
		// try to use its url for lookup
		oldLevel = getUrlZoom(sender.tab.url);
		console.log("url level: " + oldLevel);
		if (oldLevel == null)
			oldLevel = 100;
		else
			removeUrlRef(sender.tab.url); // setTabUrlZoom will increase the reference counter back
			
		setTabZoom(sender.tab.id, oldLevel);
	}
	
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
	else if (request.action == "zoomGet")
		newLevel = oldLevel;
	else
		return;

	if (newLevel < 10)
		newLevel = 10;
	else if (newLevel > 1000)
		newLevel = 1000;
	
	if (newLevel != oldLevel)
		setTabZoom(sender.tab.id, newLevel);
	
	setTabUrlZoom(sender.tab.id, sender.tab.url, newLevel);
	sendResponse({ level: newLevel, oldLevel: oldLevel });
});
