var script1 = document.createElement("script");
script1.src = chrome.extension.getURL("prompt.js");
(document.head || document.documentElement).appendChild(script1);
