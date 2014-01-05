// Image Properties browser extension
// copyright (c) 2014 dqdb

var BitmapParser =
{
	parse: function(image, data, view)
	{
		// specification
		// http://msdn.microsoft.com/en-us/library/windows/desktop/dd183391(v=vs.85).aspx
		
		image.type = "BMP";
		image.width = view.getUint32(18, true);
		image.height = view.getUint32(22, true);
		image.colorDepth = view.getUint16(28, true);
	}
};
