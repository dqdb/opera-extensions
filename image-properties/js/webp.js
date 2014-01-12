// Image Properties browser extension
// copyright (c) 2014 dqdb

var WebPParser =
{
	parse: function(image, data, view)
	{
		// specification
		// https://developers.google.com/speed/webp/docs/riff_container
		
		if (data.length < 20 || view.getUint16(2, false) != 0x4646 || view.getUint32(8, false) != 0x57454250)
			return;
		
		image.type = "WebP";
		
		var type = view.getUint32(12, false);
		var size = view.getUint32(16, true);
		if (type == 0x56503820) // VP8
			WebPParser.parseLossy(image, data, view, 20, size);
		else if (type == 0x5650384c) // VP8L
			WebPParser.parseLossless(image, data, view, 20, size);
		else if (type == 0x56503858) // VP8X
			WebPParser.parseExtended(image, data, view, 20, size);
	},
	
	parseLossy: function(image, data, view, offset, size)
	{
		// specification
		// http://tools.ietf.org/html/rfc6386
		
		// invalid or not key frame
		if (size < 10 || (data[offset] & 0x01) || data[offset + 3] != 0x9d || data[offset + 4] != 0x01 || data[offset + 5] != 0x2a)
			return;
		
		image.width = view.getUint16(offset + 6, true) & 0x3fff;
		image.height = view.getUint16(offset + 8, true) & 0x3fff;
		image.colorDepth = 24; // 8 bits per component and YUV coding
		image.lossless = false;
	},

	parseLossless: function(image, data, view, offset, size)
	{
		// specification
		// https://gerrit.chromium.org/gerrit/gitweb?p=webm/libwebp.git;a=blob;f=doc/webp-lossless-bitstream-spec.txt;hb=master
		
		if (size < 5 || data[offset] != 0x2f)
			return;
		
		var flags = view.getUint32(offset + 1, true);
		image.width = (flags & 0x3fff) + 1;
		image.height = ((flags >> 14) & 0x3fff) + 1;
		image.colorDepth = (flags & 0x10000000) ? 32 : 24; // 8 bits per component with/without alpha
		image.lossless = true;
	},

	parseExtended: function(image, data, view, offset, size)
	{
		// specification
		// https://developers.google.com/speed/webp/docs/riff_container#extended-file-format
		
		if (size != 10)
			return;
		
		var flags = view.getUint32(offset, true);
		image.width = view.getUint32(offset + 4, true) & 0x00ffffff;
		image.height = view.getUint32(offset + 7, true) & 0x00ffffff;
		image.colorDepth = (flags & 0x10) ? 32 : 24; // 8 bits per component with/without alpha

		if (!(flags & 0x0a))
			return; // neither ANIM nor EXIF -> further processing is not required

		image.frames = 1;

		for (offset += 10; offset < data.length; )
		{
			var type = view.getUint32(offset, false);
			size = view.getUint32(offset + 4, true);
			offset += 8;
			
			if (type == 0x414e4d46) // ANMF
			{
				image.frames++;
				if (size >= 20)
					image.lossless = view.getUint32(offset + 16, false) == 0x5650384c;
			}
			else if (type == 0x5650384c) // EXIF
			{
				var data1 = data.subarray(offset, offset + size);
				var view1 = new DataView(data.buffer, offset, size);
				
				// heavily untested because I did not find any WebP image with Exif info on the web
				ExifParser.parse(image, data1, view1);
			}

			offset += (size + 1) & 0xfffffffe; // align offset to even
		}
	}
};

