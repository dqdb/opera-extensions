// based on jsModal 1.0.0d but it is heavily modified
//
// original copyright: (c) 2013 Henry Tang Kai (http://jsmodal.com/)
// license: http://www.opensource.org/licenses/mit-license.php

var Modal = (function()
{
	"use strict";

	var settings = {};
	var overlay, container, header, content, close;

	var element = function(tag, id)
	{
    	var element = document.createElement(tag);
    	if (id)
			element.id = id;
		return element;
	};
		
	var row = function(label, text, link)
	{
		var tr = element("tr");
		var td = element("td");
		td.innerHTML = label;
		td.className = "ipex42-caption";
		tr.appendChild(td);
		td = element("td");
		td.className = "ipex42-text";
		if (link)
		{
			var a = element("a");
			a.href = link;
			a.innerHTML = text;
			a.target = "_blank";
			td.appendChild(a);
		}
		else
		{
			td.innerHTML = text;
		}
		tr.appendChild(td);
		return tr;
	};

	var modal =
	{
        open: function(image)
        {
        	var table = element("table");
        	if (image.url)
        		table.appendChild(row("Address", image.url, image.url));
        	if (image.type)
        		table.appendChild(row("Type", image.type));
        	if (image.width && image.height)
        		table.appendChild(row("Resolution", image.width + "x" + image.height + " pixels" + (image.frames ? ", " + image.frames + " frames": "")));
        	if (image.size)
        		table.appendChild(row("Size", image.size + " bytes"));
        	if (image.colorDepth)
        		table.appendChild(row("Colors", image.colorDepth + " bits"));
        	if (image.meta)
        	{
	        	for (var n = 0; n < image.meta.length; n++)
	        	{
	        		var info = image.meta[n];
	        		table.appendChild(row(info.caption, info.text, info.link));
	        	}
	        }
        	content.appendChild(table);

			container.style.width = "auto";
			container.style.height = "auto";
            modal.update();
			overlay.style.visibility = "visible";
            container.style.visibility = "visible";

            window.addEventListener("resize", modal.update, false);
            window.addEventListener("keyup", modal.escape, false);
        },

        close: function()
        {
            content.innerHTML = "";
            overlay.style.visibility = "hidden";
            container.style.visibility = "hidden";
			window.removeEventListener("resize", modal.update, false);
			window.removeEventListener("keyup", modal.escape, false);
        },
        	
        escape: function(e)
        {
	        if (e.keyCode === 27)
				modal.close();
        },

        update: function()
        {
			var browserWidth = window.innerWidth;
			var browserHeight = window.innerHeight;
            var modalWidth = Math.min(container.offsetWidth, browserWidth - 100);
			var modalHeight = Math.min(container.offsetHeight, browserHeight - 100);
            container.style.left = (browserWidth - modalWidth) / 2 + "px";
            container.style.top = (browserHeight - modalHeight) / 2 + "px";
            content.style.height = modalHeight - header.clientHeight + "px";
        }
	};

    var style = document.getElementById("ipex42-style");
    if (!style)
    {
    	overlay = element("div", "ipex42-overlay");
    	overlay.className = "yui3-cssreset";
    	container = element("div", "ipex42-container");
    	container.className = "yui3-cssreset";
		header = element("div", "ipex42-header");
		header.innerHTML = chrome.i18n.getMessage("GeneralTitle");
		content = element("div", "ipex42-content");
		close = element("div", "ipex42-close");
		close.innerHTML = "&times;";
		header.appendChild(close);
		container.appendChild(header);
		container.appendChild(content);
	}

	overlay.style.visibility = "hidden";
	container.style.visibility = "hidden";
    close.onclick = modal.close;
    overlay.onclick = modal.close;
	
	if (!style)
	{
		style = document.createElement("link");
		style.rel = "stylesheet";
		style.type = "text/css";
		style.href = chrome.extension.getURL("css/modal.css");
		document.head.appendChild(style);
		document.body.appendChild(overlay);
		document.body.appendChild(container);
	}

	return modal;
}());