// Image Properties browser extension
// copyright (c) 2014 dqdb

var ImageParser =
{
	parse: function(image, data)
	{
		if (data)
		{
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
				// swallow decoding problems
				throw ex;
			}
		}
	}
};
