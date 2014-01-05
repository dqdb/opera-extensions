// Image Properties browser extension
// copyright (c) 2014 dqdb

var PngParser =
{
	parse: function(image, data, view)
	{
		// specifications
		// http://www.w3.org/TR/PNG/
		// https://wiki.mozilla.org/APNG_Specification
		
		// possible enhancements:
		// 1. translate tIME into Tiff.DateTime
		// 2. translate sRGB into Exif.ColorSpace
		// 3. translate tEXt, zTXt, iTXt into 
		//    Author -> Tiff.Artist
		//    Description -> Tiff.ImageDescription
		//    Copyright -> Tiff.Copyright, 
		//    Creation Time -> Exif.DateTimeOriginal
		//    Software -> Tiff.Software
		//    Disclaimer -> Exif.MakerNote
		//    Warning -> Exif.MakerNote
		//    Source -> Tiff.Make and Tiff.Model
		//    Comment -> Exif.UserComments
		//    any other -> Exif.UserComments
		// 4. translate pHYs into Tiff.ResolutionUnit, Tiff.XResolution and Tiff.YResolution
		// 5. translate cHRM into Tiff.WhitePoint and Tiff.PrimaryChromaticities
		// 6. translate gAMA into Exif.Gamma
		
		if (view.getUint16(2, false) != 0x4e47 || view.getUint32(4, false) != 0x0d0a1a0a)
			return;
		
		image.type = "PNG";
		for (var offset = 8; offset < data.length; )
		{
			var length = view.getUint32(offset, false);
			var type = view.getUint32(offset + 4, false);
			
			if (type == 0x49484452) // IHDR
			{
				image.width = view.getUint32(offset + 8, false);
				image.height = view.getUint32(offset + 12, false);
				image.colorDepth = data[offset + 16];
				var channels = data[offset + 17];
				if (channels == 2)
					channels = 3;
				else if (channels == 4)
					channels = 2;
				else if (channels == 6)
					channels = 4;
				else
					channels = 1;
				image.colorDepth *= channels;
			}
			else if (type == 0x6163544c) // acTL
			{
				image.frames = view.getUint32(offset + 8, false);
			}
			
			offset += length + 12;
		}
	}
};
