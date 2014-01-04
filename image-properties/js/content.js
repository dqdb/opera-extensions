// Image Properties browser extension
// copyright (c) 2014 dqdb

var currentImage = null;

function setImageInfo(e)
{
	if (e.button != 2)
		return;
	
	var element = e.srcElement;
	if (element === currentImage)
		return;
	
	if (element instanceof HTMLImageElement)
	{
		currentImage = element;
		
		try
		{
			chrome.runtime.sendMessage(
			{
				action: "setImageInfo", 
				imageInfo: 
				{ 
					url: element.src, 
					alt: element.alt || element.title,
					width: element.naturalWidth,
					height: element.naturalHeight
				}
			});
		}
		catch(ex)
		{
			// exception means very likely updated or removed plugin
			// remove broken event handlers because all further chrome.runtime.sendMessage() calls will fail also
			document.removeEventListener("contextmenu", setImageInfo);
			document.removeEventListener("mousedown", setImageInfo);
			document.removeEventListener("mouseup", clearImageInfo);
		}
	}
}

function clearImageInfo(e)
{
	currentImage = null;
}

// context menu update in Blink is an async process and it is sometimes slow
// hence I start title update in oncontextmenu and onmousedown (whichever fires earlier) 
// and I *hope* that it will end before the menu is shown
// http://code.google.com/p/chromium/issues/detail?id=60758
document.addEventListener("contextmenu", setImageInfo, true);
document.addEventListener("mousedown", setImageInfo, true);
document.addEventListener("mouseup", clearImageInfo, true);
