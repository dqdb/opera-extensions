// Image Properties browser extension
// copyright (c) 2014 dqdb

var GifParser =
{
	parse: function(image, data, view)
	{
		// specification
		// http://www.w3.org/Graphics/GIF/spec-gif89a.txt
		
		// possible enhancements:
		// 1. translate comment extension into Tiff.ImageDescription
		// 2. translate plain text extension into Exif.UserComment
		// 3. translate application extension into Tiff.Software
		
		var version = view.getUint32(2, false);
		if (version != 0x46383761 && version != 0x46383961)
			return;
		
		image.type = "GIF";
		image.width = view.getUint16(6, true);
		image.height = view.getUint16(8, true);
		var packed = data[10];
		image.colorDepth = (packed & 0x07) + 1;
		image.frames = 0;
		var offset = 13; // header + logical screen descriptor
		if (packed & 0x80)
			offset += 3 * (1 << image.colorDepth); // global color table
		while (offset < data.length)
		{
			var type = data[offset];
			if (type == 0x21)
			{
				type = data[offset + 1];
				if (type == 0xf9) // gce
					offset += 8;
				else if (type == 0xff) // app
					offset = GifParser.parseSubBlock(data, view, offset + 14);
				else if (type == 0xfe) // comment
					offset = GifParser.parseSubBlock(data, view, offset + 2);
				else if (type == 0x01) // plain text
					offset = GifParser.parseSubBlock(data, view, offset + 15);
				else
					offset = GifParser.parseSubBlock(data, view, offset + 2);
			}
			else if (type == 0x2c)
			{
				packed = data[offset + 9];
				offset += 10; // image descriptor
				if (packed & 0x80)
					offset += 3 * (1 << ((packed & 0x07) + 1)); // local color table
				offset = GifParser.parseSubBlock(data, view, offset + 1, null); // image data
				image.frames++;
			}
			else
			{
				break;
			}
		}
	},
			
	parseSubBlock: function(data, view, offset)
	{
		for (;;)
		{
			var size = data[offset];
			if (size == 0)
				return offset + 1;

			offset += size + 1;
		}
	}
};
