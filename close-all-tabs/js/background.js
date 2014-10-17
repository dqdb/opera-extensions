chrome.browserAction.onClicked.addListener(function(tab)
{
	chrome.tabs.query({ windowId: tab.windowId }, function(tabs)
	{
		chrome.tabs.remove(tabs.map(function(e) { return e.id; }));
	});
});
	