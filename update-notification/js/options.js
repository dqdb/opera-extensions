window.addEventListener("load", function (e)
{
	var checkInterval = $("#settings-check-interval");
	var displayTimeout = $("#settings-display-timeout");
	this.settings = Settings.getDefaultSettings();
	
	var saveSettings = function()
	{
		chrome.storage.sync.set(settings);
		chrome.extension.sendRequest({ command: "settings" });
	};
	
	$("[data-i18n]").each(function(index, e)
	{
		e = $(e);
		e.text(chrome.i18n.getMessage(e.data("i18n")));
	});
	
	$("[data-title-i18n]").each(function(index, e)
	{
		e = $(e);
		e.attr("title", chrome.i18n.getMessage(e.data("title-i18n")));
	});

	displayTimeout.tooltip();

	chrome.storage.sync.get(settings, function(storedSettings)
	{
		settings = $.extend(settings, storedSettings);
		checkInterval.val(settings.checkInterval);
		displayTimeout.val(settings.displayTimeout);
	});

	checkInterval.on("change", function()
	{
		settings.checkInterval = parseInt(checkInterval.val());
		saveSettings();
	});
	
	displayTimeout.on("change", function()
	{
		settings.displayTimeout = parseInt(displayTimeout.val());
		saveSettings();
	});

	$("#settings-check-now").click(function (e)
	{
		e.preventDefault();
		chrome.extension.sendRequest({ command: "check" });
	});
	
	$("nav a").click(function (e)
	{
		e.preventDefault();
		$(this).tab('show');
	})
	
}, false);
