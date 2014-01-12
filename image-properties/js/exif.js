// Image Properties browser extension
// copyright (c) 2014 dqdb

var ExifParser =
{
	parse: function(image, data, view)
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
		
		var items = {};
		ExifParser.parseItems(image, data, view, view.getUint32(4, endian), endian, "Tiff", items);
		ExifParser.parseSubItems(image, data, view, "Tiff.ExifIFDPointer", endian, "Exif", items);
		ExifParser.parseSubItems(image, data, view, "Tiff.GPSInfoIFDPointer", endian, "Gps", items);
		ExifParser.parseSubItems(image, data, view, "Exif.InteroperabilityIFD", endian, "Interoperability", items);

		// phase 1: simple values without reference
		for (var name in items)
		{
			var item = items[name];
			if (item.tag.refs.length == 0)
				ExifParser.formatItem(items, item);
		}

		// phase 2: simple values with reference
		for (var name in items)
		{
			var item = items[name];
			if (item.tag.refs.length > 0 && item.tag.format)
				item = ExifParser.formatItem(items, item, item.value);
		}
		
		// phase 3: composite values
		for (var name in ExifParser.composite)
		{
			var tag = ExifParser.composite[name];
			if (tag.composite && tag.format)
			{
				var item = ExifParser.createItem(tag, null, image, data, view, endian);
				ExifParser.formatItem(items, item);
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

			ExifParser.initializeTag(item.tag);
			var info = 
			{
				caption: item.tag.caption,
				text: item.text,
				link: item.link
			};
			
			image.meta.push(info);
		}
	},
		
	parseItems: function(image, data, view, offset, endian, group, items)
	{
		var tags = ExifTags[group];
		if (!offset || !tags)
			return;
		
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
			
			items[tag.id] = ExifParser.createItem(tag, value1, image, data, view, endian);
		}
	},

	parseSubItems: function(image, data, view, offset, endian, group, items)
	{
		offset = items[offset];
		if (offset && offset.value)
			ExifParser.parseItems(image, data, view, offset.value, endian, group, items)
	},
		
	createItem: function(tag, value, image, data, view, endian)
	{
		var item =
		{
			tag: tag,
			value: value,
			image: image,
			data: data,
			view: view,
			endian: endian
		};
		return item;
	},

	formatItem: function(items, item)
	{
		if (item.tag.refs.length == 0)
		{
			if (item.tag.format)
			{
				item.text = item.tag.format(item.value, item);
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
				item.link = item.tag.link(item.value, item);
		}
		else
		{
			var args = [];
			for (var n = 2; n < arguments.length; n++)
				args.push(arguments[n]);
			
			for (var n = 0; n < item.tag.refs.length; n++)
			{
				var ref = item.tag.refs[n];
				var item1 = items[ref.id];
				var value1 = item1 == null ? null : ref.formatted ? item1.text : item1.value;
				if (value1 == null && ref.required)
					return;
				args.push(value1);
			}
			
			args.push(item);
			item.text = item.tag.format.apply(this, args);
			if (item.tag.link)
				item.link = item.tag.link.apply(this, args);
		}
	},
	
	composite:
	{
		// filled by initialize
	},
	
	initializeTag: function(tag)
	{
		if (tag.caption)
			return;
		
		if (tag.values)
		{
			for (value1 in tag.values)
			{
				var value = chrome.i18n.getMessage(tag.name + "_" + value1);
				if (value)
					tag.values[value1] = value;
			}
		}
		
		tag.caption = chrome.i18n.getMessage(tag.name) || tag.name;
		delete tag.name;
		
	},
		
	initialize: function(groups)
	{
		for (group1 in groups)
		{
			var group = groups[group1];
			var group2 = group1 + ".";
			for (tag1 in group)
			{
				var tag = group[tag1];
				tag.name = group1 + tag.id;
				if (tag.id.indexOf(".") == -1)
					tag.id = group2 + tag.id;
				
				for (var n = 0; n < tag.refs.length; n++)
				{
					var ref = tag.refs[n];
					if (ref.id.indexOf(".") == -1)
						ref.id = group2 + ref.id;
				}
				
				if (tag.composite)
					ExifParser.composite[tag.id] = tag;
			}
		}
	},

	// helper function to create i18n files
	getMessages: function()
	{
		var messages = {};
		var point = /\./;
		for (group1 in ExifTags)
		{
			var group = ExifTags[group1];
			for (tag1 in group)
			{
				var tag = group[tag1];
				if (tag.hidden)
					continue;
				
				ExifParser.initializeTag(tag);
				var id = tag.id.replace(point, "");
				messages[id] = { message: tag.caption };
				if (tag.values)
				{
					for (value1 in tag.values)
					{
						var value = tag.values[value1];
						if (value != null)
							messages[id + "_" + value1] = { message: value };
					}
				}
			}
		}
		
		return JSON.stringify(messages);
	}
};
