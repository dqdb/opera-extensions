var Zoom = 
{
	timerId: null,
	osdElement: null,
	styleElement: null,
	
	init: function(level)
	{
		Zoom.styleElement = document.createElement("style");
		Zoom.styleElement.type = "text/css";
		Zoom.styleElement.appendChild(document.createTextNode(Zoom.format(level)));
		(document.head || document.documentElement).appendChild(Zoom.styleElement);
	},

	format: function(level)
	{
		return level == 100 ? "" : "html { zoom: " + level + "% !important; }";
	},

	set: function(action)
	{
		chrome.runtime.sendMessage({ action: action }, function(response)
		{
			var ratio = response.oldLevel > 0 ? response.level / response.oldLevel : 0;
			var offsetX = window.pageXOffset;
			var offsetY = window.pageYOffset;
			if (Zoom.styleElement == null)
				Zoom.init(response.level);
			else
				Zoom.styleElement.firstChild.nodeValue = Zoom.format(response.level);
			if (ratio > 0)
				window.scrollTo(offsetX * ratio, offsetY * ratio);

			if (response.level != response.oldLevel)
			{
				var text = response.level + "%";
				var width = (120 + 20 * text.length) + "pt";
				var marginLeft = (-70 - text.length * 10) + "pt";
				
				var osd = Zoom.osdElement;
				if (osd == null)
				{
					osd = document.createElement("div");
					osd.id = "classic-zoom-osd";
					osd.style.height = "80pt";
					osd.style.position = "fixed";
					osd.style.top = "75%";
					osd.style.left = "50%";
					osd.style.marginTop = "-40pt";
					osd.style.zIndex = 9999999;
					osd.style.background = "#404040";
					osd.style.color = "#ffffff";
					osd.style.fontFamily = "Tahoma";
					osd.style.fontSize = "48pt";
					osd.style.fontWeight = "bold";
					osd.style.textAlign = "center";
					osd.style.lineHeight = "80pt";
					osd.style.transition = "opacity 0.5s ease, visibility 0.5s, width 0.5s, margin-left 0.5s";
					osd.style.opacity = 1;
					osd.style.width = width;
					osd.style.marginLeft = marginLeft;
					osd.style.zoom = 100 / response.level;
					osd.appendChild(document.createTextNode(text))
					document.body.appendChild(osd);
					Zoom.osdElement = osd;
				}
				else
				{
					osd.style.width = width;
					osd.style.marginLeft = marginLeft;
					osd.style.opacity = 1;
					osd.style.visibility = "visible";
					osd.style.zoom = 100 / response.level;
					osd.firstChild.nodeValue = text;
				
					if (Zoom.timerId)
						window.clearTimeout(Zoom.timerId);
				}
				
				Zoom.timerId = window.setTimeout(function()
				{
					osd.style.visibility = "hidden";
					osd.style.opacity = 0;
				}, 1500);
				
			}
		});
	}
};

window.addEventListener("mousewheel", function(e)
{
	if (!e.ctrlKey)
		return true;
	
	var action = e.wheelDelta > 0 ? "zoomIn" : e.wheelDelta < 0 ? "zoomOut" : null;
	if (action != null)
		Zoom.set(action);
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

	Zoom.set(action);
	e.preventDefault();
	return false;
}, false);

chrome.runtime.sendMessage({ action: "zoomGet" }, function(response)
{
	Zoom.init(response.level);
});

