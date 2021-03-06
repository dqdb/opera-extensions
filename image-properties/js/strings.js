// Image Properties browser extension
// copyright (c) 2014 dqdb

var Strings = {};

(function()
{
	var names = 
	[
		"MenuItem", "ExifExposureValue", "ExifUnknown",	
		"ColorRed", "ColorGreen", "ColorBlue", "ColorCyan", "ColorMagenta", "ColorYellow", "ColorWhite"
	];
	
	for (var n = 0; n < names.length; n++)
	{
		var name = names[n];
		Strings[name] = chrome.i18n.getMessage(name) || name;
	}
})();