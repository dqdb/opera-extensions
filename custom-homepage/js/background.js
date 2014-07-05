var speedDialUrl = "opera://startpage/#speeddial";

function redirect(id, url)
{
	if (url == speedDialUrl)
	{
		var blank = chrome.extension.getURL("html/empty.html");
		chrome.storage.sync.get(
		{
			url: blank
		}, function (items)
		{
			if (items.url != speedDialUrl)
			{
				chrome.tabs.update(id, 
				{
					url: items.url ? items.url : blank
				});
		}
		});
	}
}

chrome.tabs.onCreated.addListener(function (tab)
{
	redirect(tab.id, tab.url);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
{
	if (changeInfo.url)
		redirect(tabId, changeInfo.url);
});
