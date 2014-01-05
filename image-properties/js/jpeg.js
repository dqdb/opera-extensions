// Image Properties browser extension
// copyright (c) 2014 dqdb

var JpegParser =
{
	parse: function(image, data, view)
	{
		// specifications
		// http://www.w3.org/Graphics/JPEG/itu-t81.pdf
		// http://www.cipa.jp/std/documents/e/DC-008-2012_E.pdf

		// notes:
		// 1. only Exif metainfo is supported (and IPTC, XMP, FlashPix, etc. are not)
		// 2. only tags part of the Exif specification are supported (and vendor-specific ones are not)
		// 3. only tags with visually interpretable meaning are supported (and StripOffset, OECF tag, etc. are not)
		// 4. coherent tags may be combined into virtual ones (for example GPSLatitudeRef, GPSLatitude, GPSLongitudeRef and
		//    GPSLongitude are converted into a simple GPS coordinate)

		image.type = "JPEG";
		image.meta = [];
		
		for (var offset = 2; offset < data.length; )
		{
			if (data[offset] != 0xff)
				break;
			
			var marker = data[offset + 1];
			if (marker == 0xd9) // EOI
			{
				// this if branch is theoretically unnecessary (see SOFn branch)
				break;
			}
			else if (marker == 0xe1) // APP1
			{
				if (view.getUint32(offset + 4, false) == 0x45786966) // and contains Exif info
				{
					var size1 = view.getUint16(offset + 2, false) - 8;
					var offset1 = offset + 10;
					var data1 = data.subarray(offset1, offset1 + size1);
					var view1 =	new DataView(data.buffer, offset1, size1);
					ExifParser.parse(image, data1, view1);
				}
			}
			else if (marker != 0xc4 && marker != 0xc9 && marker != 0xcc && marker >= 0xc0 && marker <= 0xcf) // SOFn but not DHT, JPG and DAC
			{
				image.colorDepth = data[offset + 4] * data[offset + 9];
				image.height = view.getUint16(offset + 5, false);
				image.width = view.getUint16(offset + 7, false);
				
				// Exif | 4.5.4 Basic Structure of JPEG Compressed Data 
				// Compressed data files are recorded in conformance with the JPEG DCT format specified in ISO/IEC 10918-1, with 
				// the Application Market Segment (APP1) inserted. APP1 is recorded immediately after the SOI marker indicating the 
				// beginning of the file (see Figure 6). Multiple APP2 may be recorded as necessary, starting immediately after APP1. 

				// JPEG | B.6 Summary
				// The order of the constituent parts of interchange format and all marker segment structures is summarized in Figures B.16
				// and B.17.
				
				// this means that we can stop processing after SOFn because if there was Exif info embedded then it has been processed already
				break;
			}

			offset += 2 + view.getUint16(offset + 2, false);
		}
	}
};
