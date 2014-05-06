var DefaultWindowPrompt = window.prompt;
window.prompt = function(text, defaultText)
{
	return DefaultWindowPrompt(text);
};

