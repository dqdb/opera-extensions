if (localStorage.getItem("created-at") == null)
	localStorage.setItem("created-at", new Date());

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

function updateTabZoom(tabId, oldLevel, newLevel, allFrames)
{
	var ratio = newLevel / oldLevel;
	var code = "var offsetX = window.pageXOffset; var offsetY = window.pageYOffset; document.body.parentElement.style.zoom = " + (newLevel == 100 ? "null" : "'" + newLevel + "%'") + ";window.scrollTo(offsetX * " + ratio + ", offsetY * " + ratio + ");";
	chrome.tabs.executeScript(tabId, { code: code, allFrames: allFrames, runAt: "document_end" } );
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

chrome.tabs.onUpdated.addListener(function(tabId, info, tab)
{
	var level = getTabZoom(tabId, true);
	if (level == null)
	{
		// tab restored from previous session
		// try to use its url for lookup
		level = getUrlZoom(tab.url);
		if (level == null)
			level = 100;
		else
			removeUrlRef(tab.url); // setTabUrlZoom will increase the reference counter back

		setTabZoom(tabId, level);
	}
	
	level = level * 1;
	setTabUrlZoom(tabId, tab.url, level);
	
	if (level != 100)
	{
		var isLoading = info.status == "loading";
		updateTabZoom(tabId, isLoading ? 100 : level, level, !isLoading);
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	var oldLevel = getTabZoom(sender.tab.id);
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
	
	if (newLevel != oldLevel)
	{
		setTabZoom(sender.tab.id, newLevel);
		updateTabZoom(sender.tab.id, oldLevel, newLevel, true);
	}
	setTabUrlZoom(sender.tab.id, sender.tab.url, newLevel);
	
	sendResponse({ level: newLevel});
});
