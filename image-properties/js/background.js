// Image Properties browser extension
// copyright (c) 2014 dqdb

var imageInfo = null;
var menuHandle = null;
var menuRegex = /(?:http|https|ftp|file)\:\/\/.*\/(.*)/;

function updateMenuItem(url)
{
	var menuItem = 
	{
		title: Strings.MenuItem, 
		contexts: ["image"]
	};

	if (url)
	{
		var m = url.match(menuRegex);
		if (m && m.length > 1 && m[1].length > 0)
			menuItem.title += " (" + decodeURIComponent(m[1]) + ")";
	}
	
	if (menuHandle)
		chrome.contextMenus.update(menuHandle, menuItem);
	else
		menuHandle = chrome.contextMenus.create(menuItem);
}

function loadImage(url, callback)
{
	// Blink does not support XHR either for FTP or for data URIs
	// http://code.google.com/p/chromium/issues/detail?id=46806
   	// http://code.google.com/p/chromium/issues/detail?id=75248
    if (url.substr(0, 4) == "ftp:")
    	ImageParser.loadData(null, callback);
	else if (url.substr(0, 5) == "data:")
		ImageParser.loadDataUrl(url, callback);
	else
		ImageParser.loadUrl(url, callback);
}

function showImage(tabId)
{
	chrome.tabs.executeScript(tabId, { code: "Modal.open(ImgPropExtInfo);" });
}

chrome.contextMenus.onClicked.addListener(function(info, tab) 
{
	var image = {};
	if (imageInfo == null)
	{
		image.url = info.srcUrl;
	}
	else
	{
		for (prop in imageInfo)
			image[prop] = imageInfo[prop];
	}

	// delete filename from menu item name asap
	updateMenuItem(null);
	imageInfo = null;
	
	loadImage(image.url, function(data, contentType)
	{
		ImageParser.parse(image, data, contentType);
		console.log(JSON.stringify(image));
		chrome.tabs.executeScript(tab.id,
		{
	        code: "var ImgPropExtInfo = " + JSON.stringify(image) + "; chrome.extension.sendMessage( { action: \"showImageInfo\", isLoaded: typeof ImgPropExtIsAlreadyInjected !== \"undefined\" });"
	    });	
	});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	if (request.action == "setImageInfo")
	{
		imageInfo = request.imageInfo;
		updateMenuItem(imageInfo.url);
	}
	else if (request.action == "showImageInfo")
	{
		var tabId = sender.tab.id;
		
		// solution found at http://stackoverflow.com/a/8860891
		if (request.isLoaded)
		{
			showImage(tabId);
		}
		else
		{
			chrome.tabs.insertCSS(tabId, { file: "css/modal.css" }, function() 
			{
				chrome.tabs.executeScript(tabId, { file: "js/modal.js" }, function() 
				{
					chrome.tabs.executeScript(tabId, { code: "var ImgPropExtIsAlreadyInjected = true;" }, function()
					{
						showImage(tabId);
					});
				});
			});
		}
	}
});

updateMenuItem(null);
