var image = document.body.firstElementChild;
if (image && image.tagName == "IMG" && image.src == window.location.href)
{
	// comment this line or change background color to the desired value
	document.body.style.background = "#404040";
	
	var centerImage = function(e)
	{
		var marginLeft = Math.max((window.innerWidth - image.width) >> 1, 0);
		var marginTop = Math.max((window.innerHeight - image.height) >> 1, 0);
		image.style.marginTop = marginTop + "px";
		image.style.marginLeft = marginLeft + "px";
	};
	
	image.addEventListener("click", centerImage);
	window.addEventListener("resize", centerImage);
	centerImage();
}