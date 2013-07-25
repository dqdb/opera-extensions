function formatZoomStyle(level)
{
	return level == 100 ? "" : "html { zoom: " + level + "% !important; }";
}

function injectZoom(doc, levelText)
{
	var style = doc.createElement("style");
	style.type = "text/css";
	style.id = "classic-zoom-css";
	style.appendChild(doc.createTextNode(levelText));
	(doc.head || doc.documentElement).appendChild(style);
}

function updateZoom(doc, levelText, ratio)
{
	var offsetX = window.pageXOffset;
	var offsetY = window.pageYOffset;
	var style = doc.getElementById("classic-zoom-css");
	if (style == null)
		injectZoom(doc, levelText);
	else
		style.firstChild.nodeValue = levelText;
	if (ratio > 0)
		window.scrollTo(offsetX * ratio, offsetY * ratio);
}

function modifyZoom(action)
{
	chrome.runtime.sendMessage({ action: action }, function(response)
	{
		var levelText = formatZoomStyle(response.level);
		var ratio = response.oldLevel > 0 ? response.level / response.oldLevel : 0;
		updateZoom(document, levelText, ratio);
		window.dispatchEvent(new CustomEvent("classicZoomChanged", { detail: { levelText: levelText, ratio: ratio } } ));
	});
}

window.addEventListener("mousewheel", function(e)
{
	if (!e.ctrlKey)
		return true;
	
	var action = e.wheelDelta > 0 ? "zoomIn" : e.wheelDelta < 0 ? "zoomOut" : null;
	if (action != null)
		modifyZoom(action);
	e.preventDefault();
	return false;
});

window.addEventListener("keydown", function(e)
{
	var action;
	
	if (e.keyCode == 107)
		action = e.ctrlKey ? "zoomInMore" : "zoomIn";
	else if (e.keyCode == 109)
		action = e.ctrlKey ? "zoomOutMore" : "zoomOut";
	else if (e.keyCode == 106)
		action = "zoomReset";
	else
		return true;

	modifyZoom(action);
	e.preventDefault();
	return false;
}, false);

chrome.runtime.sendMessage({ action: "zoomGet" }, function(response)
{
	injectZoom(document, formatZoomStyle(response.level));
});

