// Image Properties browser extension
// copyright (c) 2014 dqdb

var ImageParser =
{
	parse: function(image, data, contentType)
	{
		image.contentType = contentType;
		if (data)
		{
			image.size = data.length;
			
			try
			{
				// use DataView only for short and int operations
				// use Uint8Array for byte operations because it is a lot faster than DataView
				var view = new DataView(data.buffer);
				var type = view.getUint16(0, false);
				if (type == 0x4749)
					GifParser.parse(image, data, view);
				else if (type == 0xffd8)
					JpegParser.parse(image, data, view);
				else if (type == 0x8950)
					PngParser.parse(image, data, view);
				else if (type == 0x424d)
					BitmapParser.parse(image, data, view);
				else if (type == 0x5249)
					WebPParser.parse(image, data, view);
			}
			catch (ex)
			{
				// swallow decoding problems in non-developer builds
				// throw ex;
			}
		}
	},
		
	loadUrl: function(url, callback)
	{
		try
		{
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);
			xhr.responseType = "arraybuffer";
			xhr.onreadystatechange = function()
			{
				if (xhr.readyState == 4)
				{
					// 0 for local files
					// 200 for HTTP
					var contentType = null;
					var data = null;
					if (xhr.status == 200 || xhr.status == 0)
					{
						contentType = xhr.getResponseHeader("Content-Type");
						if (xhr.response)
							data = new Uint8Array(xhr.response);
					}

					callback(data, contentType);
				}
			};
			
			return xhr.send();
		}
		catch (ex)
		{
			callback(null, null);
		}
	},
		
	loadDataUrl: function(url, callback)
	{
		var BASE64_MARKER = ";base64,";
		var raw;
		var contentType;
		if (url.indexOf(BASE64_MARKER) == -1)
		{
			var parts = url.split(',');
			contentType = parts[0].split(':')[1];
			raw = decodeURIComponent(parts[1]);
		}
		else
		{
			var parts = url.split(BASE64_MARKER);
			contentType = parts[0].split(':')[1];
			raw = window.atob(parts[1]);
		}
		
		var data = new Uint8Array(raw.length);
		for (var n = 0; n < raw.length; n++)
			data[n] = raw.charCodeAt(n);
		
		callback(data, contentType);
	},

	loadData: function(data, callback)
	{
		callback(data, null);
	}
};
