var sidebar = document.getElementById("sidebar");
var relatedbar = document.getElementById("relatedbar");
if (sidebar && !relatedbar)
{
	var related =
	[
		[
			{ text: "History", href: "opera://history/" },
			{ text: "Downloads", href: "opera://downloads/" }
		],
		[
			{ text: "Settings", href: "opera://settings/" },
			{ text: "Themes", href: "opera://themes/" },
			{ text: "Plug-ins", href: "opera://plugins/" },
			{ text: "Extensions", href: "opera://extensions/" },
			{ text: "Experiments", href: "opera://flags/" },
			{ text: "About", href: "opera://about/" }
		]
	];
	
	var found = false;
	for (var n1 = 0; n1 < related.length; n1++)
	{
		var group = related[n1];
		
		for (var n2 = 0; n2 < group.length; n2++)
		{
			var item = group[n2];
			if (item.href == document.location.href.substr(0, item.href.length))
			{
				found = true;
				break;
			}
		}
		
		if (!found)
			continue;

		sidebox = document.createElement("div");
		sidebox.id = "sidebox";
		
		relatedbar = document.createElement("div");
		relatedbar.id = "relatedbar";
		var title = document.createElement("h1");
		relatedbar.appendChild(title);
		title.innerText = "Related pages";
		
		for (var n2 = 0; n2 < group.length; n2++)
		{
			var item = group[n2];
			if (item.href == document.location.href.substr(0, item.href.length))
				continue;

			var div = document.createElement("div");
			div.className = "relatedbar-related";
			var a = document.createElement("a");
			a.href = item.href;
			a.innerText = item.text;
			div.appendChild(a);
			relatedbar.appendChild(div);
		
		}

		sidebar.style.position = "static";
		sidebar.parentNode.insertBefore(sidebox, sidebar);
		sidebox.appendChild(sidebar);
		sidebox.appendChild(relatedbar);
		break;
	}
	
}