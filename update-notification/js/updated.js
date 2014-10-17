window.addEventListener("load", function (e)
{
	$("#close").click(function(e)
	{
		e.preventDefault();
		window.close();
	});

	$("[data-i18n]").each(function(index, e)
	{
		e = $(e);
		e.html(chrome.i18n.getMessage(e.data("i18n")));
	});
	
	var versions = window.location.search.slice(1).split(",");
	var major = versions[1].split(".")[0];
	$("#previous-version").html(versions[0]);
	$("#installed-version").html(versions[1]);
	$("#changelog-version").html(major);
	$("#changelog-link").attr("href", "http://blogs.opera.com/desktop/changelog-" + major + "/");
}, false);
