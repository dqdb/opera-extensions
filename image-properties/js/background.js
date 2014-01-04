// Image Properties browser extension
// copyright (c) 2014 dqdb

var imageInfo = null;
var menuHandle = null;
var menuRegex = /(?:http|https|ftp|file)\:\/\/.*\/(.*)/;

function updateMenuItem(url)
{
	var menuItem = 
	{
		title: strings.MenuItem, 
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

function getImage(image, callback)
{
	// Blink does not support XHR either for FTP or for data URIs
	// http://code.google.com/p/chromium/issues/detail?id=46806
   	// http://code.google.com/p/chromium/issues/detail?id=75248
   	
    if (image.url.substr(0, 4) == "ftp:")
    {
    	callback(image, null);
    }
	else if (image.url.substr(0, 5) == "data:")
	{
		var BASE64_MARKER = ";base64,";
		var raw;
		if (image.url.indexOf(BASE64_MARKER) == -1)
		{
			var parts = image.url.split(',');
			image.contentType = parts[0].split(':')[1];
			raw = decodeURIComponent(parts[1]);
		}
		else
		{
			var parts = image.url.split(BASE64_MARKER);
			image.contentType = parts[0].split(':')[1];
    		raw = window.atob(parts[1]);
		}
		
		image.size = raw.length;
		var data = new Uint8Array(image.size);

		for (var n = 0; n < image.size; n++)
			data[n] = raw.charCodeAt(n);
		
		callback(image, data);
    }
	else
	{
		var xhr = new XMLHttpRequest();
		xhr.open("GET", image.url, true);
		xhr.responseType = "arraybuffer";
		xhr.onreadystatechange = function()
		{
			if (xhr.readyState == 4)
			{
				// 0 for local files
				// 200 for HTTP
				if (xhr.status == 200 || xhr.status == 0)
				{
					image.contentType = xhr.getResponseHeader("Content-Type");
					var data = xhr.response ? new Uint8Array(xhr.response) : null;
					if (data)
					{
						if (data.length >= 4)
							image.size = data.length;
						else
							data = null;
					}
					callback(image, data);
				}
				else
				{
					callback(image, null);
				}
			}
		};
		
		return xhr.send();
	}
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
	
	try
	{
		getImage(image, decodeImage);
	}
	catch (ex)
	{
		decodeImage(image, null);
	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) 
{
	if (request.action == "setImageInfo")
	{
		imageInfo = request.imageInfo;
		updateMenuItem(imageInfo.url);
	}
});

updateMenuItem(null);
