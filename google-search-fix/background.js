// masks Opera to Chrome 34 on all Google sites
// copyright (c) 2014 dqdb

// regex mask based on parseUri 1.2.2 strict mode by Steven Levithan
// http://blog.stevenlevithan.com/archives/parseuri
urlRegex = /^(?:([^:\/?#]+):)?(?:\/\/([^:\/?#]*)(?::\d*)?)?((?:\/[^#]*)+)(?:#.*)?$/;

chrome.webRequest.onBeforeSendHeaders.addListener(function (details)
{
	var headers = details.requestHeaders;
	var matches = urlRegex.exec(details.url);
	if (matches != null && matches.length == 4)
	{
		var host = matches[2];
 		if (host.indexOf("google") != -1 || host.indexOf("goo.gl") != -1)
        {
        	for (var n = 0; n < headers.length; n++)
        	{
        		var p = headers[n];
        		if (p.name == "User-Agent")
        		{
        			p.value = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36";
        			break;
        		}
        	}
        }
	}
	
	return { requestHeaders: headers };
},
{
	urls: ["<all_urls>"]
}, ["blocking", "requestHeaders"]);