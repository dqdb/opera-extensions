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

Number.removeTrailingZeros = /\.?0+$/;

Number.prototype.toFormatted = function(digits)
{
	var value = this.toFixed(digits);
	return value.indexOf(".") == -1 ? value : value.replace(Number.removeTrailingZeros, "");
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
