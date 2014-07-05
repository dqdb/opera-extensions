function saveAddress(url)
{
	chrome.storage.sync.set(
	{
		url: url
	});
}

window.addEventListener("load", function (e)
{
	var address = $("#settings-address");
	var template = $("#settings-address-current-template");
	var list = $("#settings-address-current-list");

	chrome.storage.sync.get(
	{
		url: ""
	}, function (items)
	{
		address.val(items.url);
	});

	address.on("input", function()
	{
		saveAddress(address.val());
	});
	
	$("nav a").click(function (e)
	{
		e.preventDefault();
		$(this).tab('show');
	})
	
	$(".settings-address-current-url").click(function (e)
	{
		var url = $(this).attr("url");
		address.val(url);
		saveAddress(url);
	})
		
	chrome.tabs.query( {}, function (tabs)
	{
		for (var n = 0; n < tabs.length; n++)
		{
			var tab = tabs[n];
			list.append(template.clone(true).removeAttr("id").removeAttr("hidden").find(".settings-address-current-url").html(tab.title || tab.url).attr("url", tab.url).end());
		}
	});
	
}, false);
