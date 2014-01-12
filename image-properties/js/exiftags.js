// Image Properties browser extension
// copyright (c) 2014 dqdb

// based on Exif 2.3 specification and ExifTool source code (for clarification)

// Why is the PDF file of the specification protected against 
// copying text from it? What was the point of that? 

// anonymous function to prevent namespace pollution
var ExifTags = (function()
{
	var hidden = {};
	var optional = {};
	var text = {};
	var link = {};
	
	var formatResolution = function(resolution, unit)
	{
		unit = unit || "dpi";
		return resolution + " " + unit;
	}
	
	// algorithm based on ExifTool implementation
	var formatFraction = function(value)
	{
		value *= 1.00001;
		if (isNaN(value))
			return "0";
		var value1 = Math.trunc(value);
		if (value1 / value > 0.999)
			return value1.toFixed();
		
		value1 = Math.trunc(value * 2);
		if (value1 / (value * 2) > 0.999)
			return value1.toFixed() + "/2";
		
		value1 = Math.trunc(value * 3);
		if (value1 / (value * 3) > 0.999)
			return value1.toFixed() + "/3";
		else
			return value.toFormatted(3);
	}
		
	var formatCoordinate = function(coordinate, coordinateRef)
	{
		if (coordinate.length != 3)
			return null;
		
		var degrees = coordinate[0];
		var minutes = coordinate[1];
		var seconds = coordinate[2];
		
		var s = coordinateRef + degrees.toFormatted(3) + "°";
		if (minutes.a || seconds.a)
			s += " " + minutes.toFormatted(3) + "'";
		if (seconds.a)
			s += " " + seconds.toFormatted(3) + '\"';
		return s;
	}
	
	var formatCoordinateDouble = function(coordinate, coordinateRef)
	{
		if (coordinate.length != 3)
			return null;
		
		var result = coordinate[0].toDouble() + coordinate[1].toDouble() / 60 + coordinate[2].toDouble() / 3600;
		if (coordinateRef == "S" || coordinateRef == "W")
			result = -result;
		 return result.toFormatted(6);
	}
	
	var formatZero = function(value, digits)
	{
		value = value.toString();
		return value.length >= digits ? value : ("00000000" + value).substr(digits);
	}
	
	var formatDateTime = function(dateTime, subSecTime)
	{
		dateTime = dateTime.trim() || null;
		if (dateTime && subSecTime)
			return dateTime + "." + subSecTime;
		return dateTime;
	}
	
	var formatTime = function(value)
	{
		if (value.length != 3)
			return null;
		
		var time = Math.floor(value[0].toDouble() * 3600 + value[1].toDouble() * 60 + value[2].toDouble() + 0.5);
		var hours = (time / 3600) >> 0;
		time %= 3600;
		var minutes = (time / 60) >> 0;
		var seconds = time % 60;
		
		return formatZero(hours, 2) + ":" + formatZero(minutes, 2) + ":" + formatZero(seconds, 2);
	}
	
	var formatExposureTime = function(value)
	{
		if (typeof value === "number")
		{
			if (value > 0 && value <= 1 / 4)
				return "1/" + Math.floor(1 / value + 0.5);
			else
				return value.toFormatted(2);
		}
		else if (!(value instanceof Rational))
		{
			return value.toString();
		}
		else if (value.a == 0 || value.b == 0)
		{
			return "0";
		}
		
		value = value.simplify();
		if (value.a < value.b)
			return value.a + "/" + value.b;
		else
			return value.toFormatted(1);
	};
	
	var simple = function(id)
	{
		var tag = 
		{
			id: id,
			refs: []
		};
		
		var required = true;
		var formatted = false;
		var format = true;
		for (var n = 1; n < arguments.length; n++)
		{
			var arg = arguments[n];
			if (arg === hidden)
			{
				tag.hidden = true;
			}
			else if (arg === optional)
			{
				required = false;
			}
			else if (arg === text)
			{
				formatted = true;
			}
			else if (arg === link)
			{
				format = false;
			}
			else if (typeof arg === "function")
			{
				if (format)
					tag.format = arg;
				else
					tag.link = arg;
				format = true;
			}
			else if (typeof arg === "object")
			{
				tag.values = arg;
			}
			else if (typeof arg === "string")
			{
				var ref =
				{
					required: required,
					formatted: formatted,
					id: arg
				}
				tag.refs.push(ref);
				required = true;
				text = false;
			}
		}
		return tag;
	};

	var composite = function(id)
	{
		var tag = simple.apply(null, arguments);
		tag.composite = true;
		return tag;
	};
	
	var tags =
	{
		Tiff:
		{
			// 0x0100: simple("ImageWidth", hidden),
			// 0x0101: simple("ImageLength", hidden),
			// 0x0102: simple("BitsPerSample"),
			// 0x0103: simple("Compression"),
			// 0x0106: simple("PhotometricInterpretation"),
			0x010e: simple("ImageDescription"),
			0x010f: simple("Make"),
			0x0110: simple("Model"),
			// 0x0111: simple("StripOffsets"),
			0x0112: simple("Orientation",
			{
				1: "Horizontal (normal)",
				2: "Mirror horizontal",
				3: "Rotate 180",
				4: "Mirror vertical",
				5: "Mirror horizontal and rotate 270 CW",
				6: "Rotate 90 CW",
				7: "Mirror horizontal and rotate 90 CW",
				8: "Rotate 270 CW"
			}),
			// 0x0115: simple("SamplesPerPixel"),
			// 0x0116: simple("RowsPerStrip"),
			// 0x0117: simple("StripByteCounts"),
			
			0x011a: simple("XResolution", optional, text, "ResolutionUnit", formatResolution),
			0x011b: simple("YResolution", optional, text,"ResolutionUnit", formatResolution),
			// 0x011c: simple("PlanarConfiguration"),
			0x0128: simple("ResolutionUnit", hidden,
			{
				2: "dpi",
				3: "dpcm"
			}),
					
			// 0x012d: simple("TransferFunction"),
			0x0131: simple("Software"),
			0x0132: simple("DateTime", optional, "Exif.SubSecTimeOriginal", formatDateTime),
			0x013b: simple("Artist"),
			// 0x013e: simple("WhitePoint"),
			// 0x013f: simple("PrimaryChromaticities"),
			// 0x0201: simple("JPEGInterchangeFormat"),
			// 0x0202: simple("JPEGInterchangeFormatLength"),
			// 0x0211: simple("YCbCrCoefficients"),
			// 0x0212: simple("YCbCrSubSampling"),
			0x0213: simple("YCbCrPositioning",
			{
				1: "Centered",
				2: "Co-sited"
			}),
			// 0x0214: simple("ReferenceBlackWhite"),
			0x8298: simple("Copyright"),
				
			0x8769: simple("ExifIFDPointer", hidden),
			0x8825: simple("GPSInfoIFDPointer", hidden)
		},
			
		Exif:
		{
			0x829A: simple("ExposureTime", function(value)
			{
				return formatExposureTime(value) + " s";
			}),
			0x829d: simple("FNumber", function(value)
			{
				if (value instanceof Number)
					return value.toFormatted(1);
				else if (!(value instanceof Rational))
					return value.toString();
				else if (value.b == 0)
					return "";
				else if (value.a < value.b)
					return "f/" + value.toFormatted(2);
				else
					return "f/" + value.toFormatted(1);
			}),
			0x8822: simple("ExposureProgram",
			{
				0: "Not defined",
				1: "Manual",
				2: "Program",
				3: "Aperture priority",
				4: "Shutter priority",
				5: "Creative program",
				6: "Action program",
				7: "Portrait mode",
				8: "Landscape mode",
				9: "Bulb" // ExifTool
			}),
				
			// 0x8824: simple("SpectralSensitivity"),
			0x8827: simple("PhotographicSensitivity", hidden), // aka ISOSpeedRatings
			// 0x8828: simple("OECF"),
			0x8830: simple("SensitivityType", 
			{
				0: null,
				1: "Standard output sensitivity",
				2: "Recommended exposure index",
				3: "ISO speed",
				4: "Standard output sensitivity and recommended exposure index",
				5: "Standard output sensitivity and ISO speed",
				6: "Recommended exposure index and ISO speed",
				7: "Standard output sensitivity, recommended exposure index and ISO speed"
			}),
			0x8831: simple("StandardOutputSensitivity"),
			0x8832: simple("RecommendedExposureIndex"),
			0x8833: simple("ISOSpeed"),
			// 0x8834: simple("ISOSpeedLatitudeyyy"),
			// 0x8835: simple("ISOSpeedLatitudezzz"),
			ISOSpeedRatings: composite("ISOSpeedRatings", optional, "PhotographicSensitivity",
				optional, "SensitivityType", optional, "StandardOutputSensitivity", 
				optional, "RecommendedExposureIndex", optional, "ISOSpeed", function(sensitivity, type, sos, rei, iso)
			{
				if (type == 1 || type == 4 || type == 5 || type == 7)
					return sos || sensitivity;
				else if (type == 2 || type == 6)
					return rei || sensitivity;
				else if (type == 3)
					return iso || sensitivity;

				return sensitivity;
			}),
			
			// 0x9000: simple("ExifVersion"),
			0x9003: simple("DateTimeOriginal", optional, "SubSecTimeOriginal", formatDateTime),
			0x9004: simple("DateTimeDigitized", optional, "SubSecTimeDigitized", formatDateTime),
			0x9101: simple("ComponentsConfiguration", function(value)
			{
				if ((!Array.isArray(value) && (!value instanceof Uint8Array)) || value.length < 4)
					return null;
				
				var components = ["", "Y", "Cb", "Cr", "R", "G", "B"];
				var text = "";
				for (var n = 0; n < 4; n++)
				{
					var component = value[n];
					if (component >= 1 && component < components.length)
						text += components[component];
				}
				
				return text || null;
			}),
			0x9102: simple("CompressedBitsPerPixel"),
				
			0x9201: simple("ShutterSpeedValue", function(value)
			{
				return formatExposureTime(Math.pow(2, -value.toDouble())) + " s";
			}),
			0x9202: simple("ApertureValue", function(value)
			{
				value = Math.pow(2, value.toDouble() / 2);
				return "f/" + value.toFormatted(value < 1 ? 2 : 1);
			}),
			0x9203: simple("BrightnessValue"),
			0x9204: simple("ExposureBiasValue", function(value)
			{
				return formatFraction(value.toDouble()) + " " + Strings.ExifExposureValue;
			}),
			0x9205: simple("MaxApertureValue", function(value)
			{
				value = Math.pow(2, value.toDouble() / 2);
				return "f/" + value.toFormatted(value < 1 ? 2 : 1);
			}),
			0x9206: simple("SubjectDistance", function(value)
			{
				if (value.a == 0)
					return Strings.ExifUnknown;
				else if (value.a == 0xffffffff)
					return "∞";
				else
					return value.toFormatted(2) + " m";
			}),
			0x9207: simple("MeteringMode",
			{
				0: "Unknown",
				1: "Average",
				2: "Center-weighted average",
				3: "Spot",
				4: "Multi-spot",
				5: "Multi-segment",
				6: "Partial",
				255: "Other"
			}),
			0x9208: simple("LightSource",
			{
				0: "Unknown",
				1: "Daylight",
				2: "Fluorescent",
				3: "Tungsten (incandescent light)",
				4: "Flash",
				9: "Fine weather",
				10: "Cloudy weather",
				11: "Shade",
				12: "Daylight fluorescent", // D 5700 - 7100K
				13: "Day white fluorescent", // N 4600 - 5500K
				14: "Cool white fluorescent", // W 3800 - 4500K
				15: "White fluorescent", // WW 3250 - 3800K
				16: "Warm white fluorescent", // L 2600 - 3250K
				17: "Standard light A",
				18: "Standard light B",
				19: "Standard light C",
				20: "D55",
				21: "D65",
				22: "D75",
				23: "D50",
				24: "ISO studio tungsten",
				255: "Other light source"
			}),
			0x9209: simple("Flash",
			{
				// values source: http://dev.exiv2.org/projects/exiv2/repository/entry/trunk/src/tags.cpp
				0x00: "No flash",
				0x01: "Fired",
				0x05: "Fired, return light not detected",
				0x07: "Fired, return light detected",
				0x08: "Yes, did not fire",
				0x09: "Yes, compulsory",
				0x0d: "Yes, compulsory, return light not detected",
				0x0f: "Yes, compulsory, return light detected",
				0x10: "No, compulsory",
				0x14: "No, did not fire, return light not detected",
				0x18: "No, auto",
				0x19: "Yes, auto",
				0x1d: "Yes, auto, return light not detected",
				0x1f: "Yes, auto, return light detected",
				0x20: "No flash function",
				0x20: "No, no flash function",
				0x41: "Yes, red-eye reduction",
				0x45: "Yes, red-eye reduction, return light not detected",
				0x47: "Yes, red-eye reduction, return light detected",
				0x49: "Yes, compulsory, red-eye reduction",
				0x4d: "Yes, compulsory, red-eye reduction, return light not detected",
				0x4f: "Yes, compulsory, red-eye reduction, return light detected",
				0x50: "No, red-eye reduction",
				0x58: "No, auto, red-eye reduction",
				0x59: "Yes, auto, red-eye reduction",
				0x5d: "Yes, auto, red-eye reduction, return light not detected",
				0x5f: "Yes, auto, red-eye reduction, return light detected"
			}),
			0x920a: simple("FocalLength", function(value)
			{
				return value.toFormatted(1) + " mm";
			}),
			// 0x9214: simple("SubjectArea"),
			// 0x927c: simple("MakerNote"),
			0x9286: simple("UserComment", function(value, item)
			{
				var comment = "";
				if (value instanceof Uint8Array && value.length > 8)
				{
					var codepage = String.fromAscii(value, 0, 8);
					if (codepage === "ASCII")
						comment = String.fromAscii(value, 8);
					else if (codepage === "UNICODE")
						comment = String.fromUnicode(value, item.endian, 8);
				}
				return comment || null;
			}),
			0x9290: simple("SubSecTime", hidden),
			0x9291: simple("SubSecTimeOriginal", hidden),
			0x9292: simple("SubSecTimeDigitized", hidden),
			// 0xa000: simple("FlashpixVersion"),
			
			0xa001: simple("ColorSpace",
			{
				1: "sRGB",
				2: "Adobe RGB", // ExifTool
				0xffff: "Uncalibrated",
				0xfffe: "ICC Profile", // ExifTool
				0xfffd: "Wide Gamut RGB" // ExifTool
			}),
			
			// 0xa002: simple("PixelXDimension"),
			// 0xa003: simple("PixelYDimension"),
			0xa004: simple("RelatedSoundFile"),

			0xa005: simple("InteroperabilityIFD", hidden),
			
			0xa20b: simple("FlashEnergy"),
			// 0xa20c: simple("SpatialFrequencyResponse"),
			0xa20e: simple("FocalPlaneXResolution", optional, text, "FocalPlaneResolutionUnit", formatResolution),
			0xa20f: simple("FocalPlaneYResolution", optional, text, "FocalPlaneResolutionUnit", formatResolution),
			0xa210: simple("FocalPlaneResolutionUnit", hidden,
			{
				2: "dpi",
				3: "dpcm"
			}),
			// 0xa214: simple("SubjectLocation"),
			// 0xa215: simple("ExposureIndex"),
			0xa217: simple("SensingMethod",
			{
				1: "Not defined",
				2: "One-chip color area sensor",
				3: "Two-chip color area sensor",
				4: "Three-chip color area sensor",
				5: "Color sequential area sensor",
				7: "Trilinear sensor",
				8: "Color sequential linear sensor"
			}),
			0xa300: simple("FileSource",
			{
				1: "Film scanner",
				2: "Reflection print scanner",
				3: "Digital camera"
			}),
			0xa301: simple("SceneType",
			{
				1: "Directly photographed image"
			}),
			0xa302: simple("CFAPattern", function(value)
			{
				var pattern = "";
				if (value instanceof Uint8Array && value.length >= 4)
				{
					var columns = (value[0] << 8) + value[1];
					var rows = (value[2] << 8) + value[3];
					if (columns && rows && value.length >= 4 + columns * rows)
					{
						var colors = 
						[ 
							Strings.ColorRed, Strings.ColorGreen, Strings.ColorBlue,  
							Strings.ColorCyan, Strings.ColorMagenta, Strings.ColorYellow, Strings.ColorWhite
						];
						var offset = 4;
						for (var y = 0; y < rows; y++)
						{
							pattern += "[";
							for (var x = 0; x < columns; x++)
							{
								var color = value[offset++];
								if (x > 0)
									pattern += ",";
								pattern += color >= 0 && color < colors.length ? colors[color] : "?";
							}
							pattern += "]";
						}
					}
				}
				return pattern || null;
			}),
			// 0xa401: simple("CustomRendered"),
			0xa402: simple("ExposureMode",
			{
				0: "Auto exposure",
				1: "Manual exposure",
				2: "Auto bracket"
			}),
			0xa403: simple("WhiteBalance",
			{
				0: "Auto",
				1: "Manual"
			}),
			0xa404: simple("DigitalZoomRatio", function(value)
			{
				return value.a == 0 ? null : value.toFormatted(2) + "x";
			}),
			0xa405: simple("FocalLengthIn35mmFilm", function(value)
			{
				return value.toFormatted(1) + " mm";
			}),
			0xa406: simple("SceneCaptureType",
			{
				0: "Standard",
				1: "Landscape",
				2: "Portrait",
				3: "Night scene"
			}),
			0xa407: simple("GainControl",
			{
				0: "None",
				1: "Low gain up",
				2: "High gain up",
				3: "Low gain down",
				4: "High gain down"
			}),
			0xa408: simple("Contrast",
			{
				0: "Normal",
				1: "Low",
				2: "High"
			}),
			0xa409: simple("Saturation",
			{
				0: "Normal",
				1: "Low",
				2: "High"
			}),
			0xa40a: simple("Sharpness",
			{
				0: "Normal",
				1: "Low",
				2: "High"
			}),
			// 0xa40b: simple("DeviceSettingDescription"),
			0xa40c: simple("SubjectDistanceRange",
			{
				0: "Unknown",
				1: "Macro",
				2: "Close",
				3: "Distant"
			}),
			0xa420: simple("ImageUniqueID"),
			0xa430: simple("CameraOwnerName"),
			0xa431: simple("BodySerialNumber"),
			0xa432: simple("LensSpecification", function(value)
			{
				if (value.length != 4)
					return null;
				
				var min = value[0].toDouble();
				var max = value[1].toDouble();
				var info = min.toFormatted(1);
				if (max && max != min)
					info += "-" + max.toFormatted(1);
				info += "mm";
				var min = value[2].toDouble();
				var max = value[3].toDouble();
				if (min)
					info += " f/" + min.toFormatted(min < 1 ? 2 : 1);
				if (max && max != min)
					info += "-" + max.toFormatted(max < 1 ? 2 : 1);
				
				return info;
			}),
			0xa433: simple("LensMake"),
			0xa434: simple("LensModel"),
			0xa435: simple("LensSerialNumber"),
			
			0xa500: simple("Gamma")
		},
			
		Gps:
		{
			// 0x0000: simple("GPSVersionID"),
				
			0x0001: simple("GPSLatitudeRef", hidden),
			0x0002: simple("GPSLatitude", hidden),
			0x0003: simple("GPSLongitudeRef", hidden),
			0x0004: simple("GPSLongitude", hidden),
			GPSPosition: composite("GPSPosition", "GPSLatitudeRef", "GPSLatitude", "GPSLongitudeRef", "GPSLongitude", function(latitudeRef, latitude, longitudeRef, longitude)
			{
				var latitude1 = formatCoordinate(latitude, latitudeRef);
				var longitude1 = formatCoordinate(longitude, longitudeRef);
				return latitude1 && longitude1 ? latitude1 + " " + longitude1 : null;
			}, link, function(latitudeRef, latitude, longitudeRef, longitude)
			{
				var latitude1 = formatCoordinateDouble(latitude, latitudeRef);
				var longitude1 = formatCoordinateDouble(longitude, longitudeRef);
				if (!latitude || !longitude1)
					return null;
				
				var url = "http://www.bing.com/maps/?v=2&cp={lat}~{long}&lvl=14&sty=r&q={lat}+{long}";
				// var url = "https://maps.google.com/maps?q={lat}+{long}";
				return url.replace(/{lat}/g, latitude1).replace(/{long}/g, longitude1);
			}),
				
			0x0005: simple("GPSAltitudeRef", hidden),
			0x0006: simple("GPSAltitude", "GPSAltitudeRef", function(altitude, altitudeRef)
			{
				altitude = altitude.toFormatted(2) + " m";
				return altitudeRef == 1 ? "-" + altitude : altitude;
			}),
					
			0x001d: simple("GPSDateStamp", hidden),
			0x0007: simple("GPSTimeStamp", hidden),
			GPSDateTimeStamp: composite("GPSDateTimeStamp", optional, "GPSDateStamp", optional, "GPSTimeStamp", function(date, time)
			{
				if (date && time)
					return date + " " + formatTime(time) + " UTC";
				else if (date)
					return date;
				else if (time)
					return formatTime(time) + " UTC";
				else
					return null;
			}),
			
			
			0x0008: simple("GPSSatellites"),
			0x0009: simple("GPSStatus",
			{
				"A": "Active (measurement in progress)",
				"V": "Void (measurement interrupted)"
			}),
			0x000a: simple("GPSMeasureMode",
			{
				"2": "2-dimensional measurement",
				"3": "3-dimensional measurement"
			}),
			0x000b: simple("GPSDOP"),

			0x000c: simple("GPSSpeedRef", hidden,
			{
				K: "km/h",
				M: "mph",
				N: "knots"
			}),
			0x000d: simple("GPSSpeed", text, "GPSSpeedRef", function(speed, speedRef)
			{
				return speed.toFormatted(2) + " " + speedRef;
			}),
				
			// 0x000e: simple("GPSTrackRef"),
			// 0x000f: simple("GPSTrack"),
			
			0x0010: simple("GPSImgDirectionRef", hidden,
			{
				T: "true direction",
				M: "magnetic direction"
			}),
			0x0011: simple("GPSImgDirection", optional, text, "GPSImgDirectionRef", function(direction, directionRef)
			{
				direction = direction.toFormatted(2) + "°";
				if (directionRef)
					direction += " (" + directionRef + ")";
				return direction;
			}),
				
			0x0012: simple("GPSMapDatum"),
			// 0x0013: simple("GPSDestLatitudeRef"),
			// 0x0014: simple("GPSDestLatitude"),
			// 0x0015: simple("GPSDestLongitudeRef"),
			// 0x0016: simple("GPSDestLongitude"),
			// 0x0017: simple("GPSDestBearingRef"),
			// 0x0018: simple("GPSDestBearing"),
			// 0x0019: simple("GPSDestDistanceRef"),
			// 0x001a: simple("GPSDestDistance"),
			0x001b: simple("GPSProcessingMethod", function(value)
			{
				return String.fromArray(value);
			}),
			// 0x001c: simple("GPSAreaInformation"),
			0x001e: simple("GPSDifferential",
			{
				0: "Not available",
				1: "Applied"
			}),
			0x001f: simple("GPSHPositioningError")
				
		},
		
		Interoperability:
		{
			0x0001: simple("InteroperabilityIndex",
			{
				"R98": "DCF basic file (sRGB)",
				"THM": "DCF thumbnail file",
				"R03": "DCF option file (Adobe RGB)"
			})
		}
	};
	
	ExifParser.initialize(tags);
	return tags;
})();
