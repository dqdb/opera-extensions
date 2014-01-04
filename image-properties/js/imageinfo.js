// Image Properties browser extension
// copyright (c) 2014 dqdb

function Rational(a, b)
{
	this.a = a;
	this.b = b || 1; // to avoid division by zero
}

Rational.prototype.simplify = function()
{
	var g = Math.gcd(this.a, this.b);
	return new Rational(this.a / g, this.b / g);
};

Rational.prototype.toDouble = function()
{
	return this.a / this.b;
};

Rational.prototype.toFixed = function(digits)
{
	return (this.a / this.b).toFixed(digits);
};

Rational.prototype.toString = Rational.prototype.toFormatted = function(digits)
{
	return this.toDouble().toFormatted(digits === undefined ? 3 : digits);
};

Rational.prototype.rebase = function(base)
{
	return new Rational(this.a * base / this.b, base);
};

Math.gcd = function(a, b)
{
	a = Math.abs(a);
	b = Math.abs(b);
	if (a == 0)
		return b;
	
	while (b)
	{
		if (a > b)
			a = a - b;
		else
			b = b - a;
	}
		
	return a;
};

if (!Math.trunc)
{
	Math.trunc = function(a)
	{
		return a >= 0 ? Math.floor(a) : Math.ceil(a);
	};
}

Number.prototype.removeTrailingZeros = /\.?0+$/;

Number.prototype.toFormatted = function(digits)
{
	var value = this.toFixed(digits);
	return value.indexOf(".") == -1 ? value : value.replace(Number.prototype.removeTrailingZeros, "");
};

DataView.prototype.getUrat32 = function(offset, endian)
{
	return new Rational(this.getUint32(offset, endian), this.getUint32(offset + 4, endian));
};

DataView.prototype.getRat32 = function(offset, endian)
{
	return new Rational(this.getInt32(offset, endian), this.getInt32(offset + 4, endian));
};

DataView.prototype.getTypeArray = function(offset, count, endian, method, size)
{
	var array = new Array(count);
	for (var n = 0; n < count; n++, offset += size)
		array[n] = method.call(this, offset, endian);
	return array;
}

DataView.prototype.getUint16Array = function(offset, count, endian)
{
	return this.getTypeArray(offset, count, endian, DataView.prototype.getUint16, 2);
};

DataView.prototype.getUint32Array = function(offset, count, endian)
{
	return this.getTypeArray(offset, count, endian, DataView.prototype.getUint32, 4);
};

DataView.prototype.getInt32Array = function(offset, count, endian)
{
	return this.getTypeArray(offset, count, endian, DataView.prototype.getInt32, 4);
};

DataView.prototype.getUrat32Array = function(offset, count, endian)
{
	return this.getTypeArray(offset, count, endian, DataView.prototype.getUrat32, 8);
};

DataView.prototype.getRat32Array = function(offset, count, endian)
{
	return this.getTypeArray(offset, count, endian, DataView.prototype.getRat32, 8);
};

String.fromAscii = function(data, start, end)
{
	start = start || 0;
	end = end || data.length;
	if (data instanceof Uint8Array || data instanceof Uint16Array)
	{
		var end1 = start;
		while (end1 < end && data[end1])
			end1++;
	
		return String.fromCharCode.apply(null, data.subarray(start, end1)).trim();
	}
	else
	{
		var result = "";
		for (; start < end; start++)
		{
			var c = data[start];
			if (c == 0)
				break;
			
			result += String.fromCharCode(c);
		}
		
		return result.trim();
	}
}

String.fromUnicode = function(data, endian, start, end)
{
	start = start || 0;
	end = (end || data.length) - 1;

	var result = "";
	var i1 = endian ? 0 : 1;
	var i2 = endian ? 1 : 0;
	for (; start < end; start += 2)
	{
		var c = data[start + i1] | (data[start + i2] << 8);
		if (c == 0)
			break;
		
		result += String.fromCharCode(c);
	}
	
	return result.trim();
}

function decodeGifSubBlock(data, view, offset)
{
	for (;;)
	{
		var size = data[offset];
		if (size == 0)
			return offset + 1;

		offset += size + 1;
	}
}

function decodeGif(image, data, view)
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
				offset = decodeGifSubBlock(data, view, offset + 14);
			else if (type == 0xfe) // comment
				offset = decodeGifSubBlock(data, view, offset + 2);
			else if (type == 0x01) // plain text
				offset = decodeGifSubBlock(data, view, offset + 15);
			else
				offset = decodeGifSubBlock(data, view, offset + 2);
		}
		else if (type == 0x2c)
		{
			packed = data[offset + 9];
			offset += 10; // image descriptor
			if (packed & 0x80)
				offset += 3 * (1 << ((packed & 0x07) + 1)); // local color table
			offset = decodeGifSubBlock(data, view, offset + 1, null); // image data
			image.frames++;
		}
		else
		{
			break;
		}
	}
}

function decodeBmp(image, data, view)
{
	// specification
	// http://msdn.microsoft.com/en-us/library/windows/desktop/dd183391(v=vs.85).aspx
	
	image.type = "BMP";
	image.width = view.getUint32(18, true);
	image.height = view.getUint32(22, true);
	image.colorDepth = view.getUint16(28, true);
}

function decodePng(image, data, view)
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

function decodeJpegIfd(image, data, view, offset, endian, tags)
{
	var items = {};
	
	var count = view.getUint16(offset, endian);
	offset += 2;
	for (var n = 0; n < count; n++, offset += 4)
	{
		var tag1 = view.getUint16(offset, endian);
		var type1 = view.getUint16(offset + 2, endian);
		var count1 = view.getUint32(offset + 4, endian);
		offset += 8; // last 4 bytes of the IFD entry is added by the for loop
		var offset1 = view.getUint32(offset, endian);
		var value1 = null;
		var tag = tags[tag1];
		
		// drop unknown tags
		if (tag == null)
			continue;
		
		if (type1 == 1 || type1 == 7)
		{
			// BYTE and UNDEFINED
			if (count1 == 1)
				value1 = data[offset];
			else if (count1 > 4)
				value1 = data.subarray(offset1, offset1 + count1);
			else
				value1 = data.subarray(offset, offset + count1);
		}
		else if (type1 == 2)
		{
			// ASCII
			if (count1 <= 4)
				offset1 = offset;
			
			value1 = String.fromAscii(data, offset1, offset1 + count1);
		}
		else if (type1 == 3)
		{
			// SHORT
			if (count1 == 1)
				value1 = view.getUint16(offset, endian);
			else if (count1 > 1)
				value1 = view.getUint16Array(count1 > 2 ? offset1 : offset, 2, endian);
		}
		else if (type1 == 4)
		{
			// LONG
			if (count1 == 1)
				value1 = offset1;
			else if (count1 > 1)
				value1 = view.getUint32Array(offset1, count1, endian);
		}
		else if (type1 == 5)
		{
			// RATIONAL
			if (count1 == 1)
				value1 = view.getUrat32(offset1, endian);
			else if (count1 > 1)
				value1 = view.getUrat32Array(offset1, count1, endian);
		}
		else if (type1 == 9)
		{
			// SLONG
			if (count1 == 1)
				value1 = view.getInt32(offset, endian);
			else if (count1 > 1)
				value1 = view.getInt32Array(offset1, count1, endian);
		}
		else if (type1 == 10)
		{
			// SRATIONAL
			if (count1 == 1)
				value1 = view.getRat32(offset1, endian);
			else if (count1 > 1)
				value1 = view.getRat32Array(offset1, count1, endian);
		}
		
		// drop unknown or invalid values
		if (value1 == null)
			continue;
		
		items[tag.id] = 
		{
			tag: tag,
			value: value1
		};
	}

	var formatItem = function(item)
	{
		if (item.tag.refs.length == 0)
		{
			if (item.tag.format)
			{
				item.text = item.tag.format(item.value, item.tag, image, data, view, endian);
			}
			else if (item.tag.values)
			{
				var value1 = item.tag.values[item.value];
				item.text = value1 === undefined ? item.value : value1;
			}
			else if (Array.isArray(item.value))
			{
				item.text = item.value.join(", ");
			}
			else if (item.value instanceof Uint8Array)
			{
				item.text = "[binary]";
			}
			else
			{
				item.text = item.value.toString();
			}
			
			if (item.tag.link)
				item.link = item.tag.link(item.value, item.tag, image, data, view, endian);
		}
		else
		{
			var args = [];
			for (var n = 1; n < arguments.length; n++)
				args.push(arguments[n]);
			
			for (var n = 0; n < item.tag.refs.length; n++)
			{
				var ref = item.tag.refs[n];
				var item1 = items[ref.name];
				var value1 = item1 == null ? null : ref.formatted ? item1.text : item1.value;
				if (value1 == null && ref.required)
					return;
				args.push(value1);
			}
			
			args.push(item.tag, image, data, view, endian);
			item.text = item.tag.format.apply(this, args);
			if (item.tag.link)
				item.link = item.tag.link.apply(this, args);
		}
	};
	
	// phase 1: simple values without reference
	for (var name in items)
	{
		var item = items[name];
		if (item.tag.refs.length == 0)
			formatItem(item);
	}

	// phase 2: simple values with reference
	for (var name in items)
	{
		var item = items[name];
		if (item.tag.refs.length > 0 && item.tag.format)
			item = formatItem(item, item.value);
	}
	
	// phase 3: composite values
	for (var name in tags)
	{
		var tag = tags[name];
		if (tag.composite && tag.format)
		{
			var item =
			{
				tag: tag
			};
			
			formatItem(item);
			if (item.text)
				items[tag.id] = item;
		}
	}
	
	// phase 4: save non-empty and not hidden tags
	for (var name in items)
	{
		var item = items[name];
		if (!item.text || item.tag.hidden)
			continue;

		var info = 
		{
			name: name,
			text: item.text,
			link: item.link
		};
		
		image.meta.push(info);
	}
			
	return items;
}

function decodeJpegApp1(image, data, view)
{
	var endian = view.getUint16(0);
	if (endian == 0x4949)
		endian = true;
	else if (endian == 0x4d4d)
		endian = false;
	else
		return;
	
	if (view.getUint16(2, endian) != 42)
		return;
	
	var tiff = decodeJpegIfd(image, data, view, view.getUint32(4, endian), endian, ImageTags.Tiff);
	if (tiff.ExifIFDPointer)
	{
		var exif = decodeJpegIfd(image, data, view, tiff.ExifIFDPointer.value, endian, ImageTags.Exif);
		if (exif.InteroperabilityIFD)
			decodeJpegIfd(image, data, view, exif.InteroperabilityIFD.value, endian, ImageTags.Interoperability);
	}
	if (tiff.GPSInfoIFDPointer)
		decodeJpegIfd(image, data, view, tiff.GPSInfoIFDPointer.value, endian, ImageTags.Gps);
}

function decodeJpeg(image, data, view)
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
				decodeJpegApp1(image, data1, view1);
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

function decodeWebP(image, data, view)
{
	if (view.getUint16(2, false) != 0x4646 || view.getUint32(8, false) != 0x57454250)
		return;
	
	image.type = "WebP";
}

function decodeImage(image, data)
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
				decodeGif(image, data, view);
			else if (type == 0xffd8)
				decodeJpeg(image, data, view);
			else if (type == 0x8950)
				decodePng(image, data, view);
			else if (type == 0x424d)
				decodeBmp(image, data, view);
			else if (type == 0x5249)
				decodeWebP(image, data, view);
		}
		catch (ex)
		{
			// swallow decoding problems
			throw ex;
		}
	}
	
	delete image.url;
	alert(JSON.stringify(image));
	console.log(image);
}
