var alarmName = "update-notifications";

function UpdateManager()
{
	var userAgent = window.navigator.userAgent;
	var versionInfo = userAgent.match(/OPR\/(\S+)(?: \(Edition (\w+)\))?/);
	if (!versionInfo)
		return;

	this.availableVersion = this.installedVersion = versionInfo[1];
	this.isStable = versionInfo.length == 2;
	this.edition = this.isStable ? "stable" : versionInfo[2];
	this.platform = userAgent.match("Windows") ? "win" : userAgent.match("Linux") ? "linux" : userAgent.match("OS X") ? "mac" : null; 
	this.url = this.isStable ? "https://ftp.opera.com/ftp/pub/opera/desktop/" : "https://ftp.opera.com/pub/opera-" + this.edition;
}

UpdateManager.prototype.format = function(version)
{
	return "Opera " + (this.isStable ? "" : this.edition) + " " + version;
};

UpdateManager.prototype.isUpdateAvailable = function(callback)
{
	if (!this.url)
		return;
	
	var xhr = new XMLHttpRequest();
	var self = this;
	xhr.onerror = function()
	{
		callback(self.installedVersion, self.availableVersion);
	};
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState === 4)
		{
			var versions = xhr.responseText.match(/<a href=\"(\d+\.\d+\.\d+\.\d+(_\d+)?)\/\">/g).map(function(version)
			{
				return version.slice(9, -3);
			}).sort(function(a, b)
			{
				var prepare = function(s)
				{
					return s.replace("_", ".").split(".").map(function(x) { return parseInt(x); });
				}
				
				a = prepare(a);
				b = prepare(b);
				for (var n = 0; ; n++)
  				{
					if (n >= a.length || n >= b.length)
      					return b.length - a.length;
    				else if (a[n] != b[n])
    					return b[n] - a[n];
  				}
			});
			
			self.checkUpdates(versions, callback);
		}
	};
	xhr.open("GET", this.url, true);
	xhr.send(null);
}

UpdateManager.prototype.checkUpdates = function(versions, callback)
{
	var version = versions.shift();
	if (typeof version === "undefined" || version === this.availableVersion)
	{
		callback(this.installedVersion, this.availableVersion);
	}
	else
	{
		var xhr = new XMLHttpRequest();
		var self = this;
		xhr.onerror = function()
		{
			callback(self.installedVersion, self.availableVersion);
		};
		xhr.onreadystatechange = function()
		{
			if (xhr.readyState === 4)
			{
				if (xhr.responseText.indexOf("<a href=\"" + self.platform +"/\">") != -1)
				{
					self.availableVersion = version;
					callback(self.installedVersion, self.availableVersion);
				}
				else
				{
					self.checkUpdates(versions, callback);
				}
			}
		};

		xhr.open("GET", this.url + "/" + version + "/", true);
		xhr.send(null);
	}
};

function Extension()
{
	this.updateManager = new UpdateManager();
	
	if (localStorage.lastInstalledVersion && localStorage.lastInstalledVersion !== this.updateManager.installedVersion)
	{
		chrome.tabs.create({
			url: chrome.extension.getURL("html/updated.html?" + localStorage.lastInstalledVersion + "," + this.updateManager.installedVersion)
		});
	}
	
	localStorage.lastInstalledVersion = this.updateManager.installedVersion;
}

Extension.prototype.acknowledge = function()
{
	if (this.hasUpdate)
	{
		this.hasUpdate = false;
		chrome.browserAction.setBadgeText({ text: "" });
		chrome.browserAction.setIcon({
			path:
			{
	        	"19": "images/toolbar-normal19.png",
			    "38": "images/toolbar-normal38.png"
			}
	    });

		chrome.tabs.create({
			url: "opera://about"
		});
	}
}

Extension.prototype.checkUpdate = function()
{
	this.stop();
	
	var self = this;
	this.updateManager.isUpdateAvailable(function(installedVersion, availableVersion)
	{
		if (availableVersion !== localStorage.lastAvailableVersion && availableVersion !== installedVersion)
		{
			var notification = new Notification(self.updateManager.format(availableVersion), 
				{
					body: chrome.i18n.getMessage("updateAvailableNotification"),
					icon: chrome.extension.getURL("images/notification.png")
				});
			
			chrome.browserAction.setBadgeText({ text: "!" });
			chrome.browserAction.setIcon({
				path:
				{
		        	"19": "images/toolbar-highlight19.png",
        		    "38": "images/toolbar-highlight38.png"
        		}
	        });
		
			self.hasUpdate = true;
			notification.onclick = function()
			{
				self.acknowledge();
			};
			
			localStorage.lastAvailableVersion = availableVersion;

			if (self.settings.displayTimeout)
			{
				window.setTimeout(function()
				{
					notification.close();
				}, self.settings.displayTimeout * 1000);
			}
		}
		
		self.start();
	});
}

Extension.prototype.start = function()
{
	var self = this;
	this.settings = Settings.getDefaultSettings();
	
	chrome.storage.sync.get(this.settings, function(storedSettings)
	{
		for (var key in storedSettings)
			if (storedSettings.hasOwnProperty(key))
				self.settings[key] = storedSettings[key];

		if (self.settings.checkInterval)
			chrome.alarms.create(alarmName, { delayInMinutes: self.settings.checkInterval } );
	});
}

Extension.prototype.stop = function()
{
	chrome.alarms.clear(alarmName);
};

var extension = new Extension();

chrome.extension.onRequest.addListener(function(request, sender, sendResponse)
{
	if (request.command === "check")
	{
		extension.checkUpdate();
	}
	else if (request.command === "settings")
	{
		extension.stop();
		extension.start();
	}
	
	sendResponse({});
});

chrome.alarms.onAlarm.addListener(function(alarm)
{
	if (alarm.name === alarmName)
	{
		extension.checkUpdate();
	}
});

chrome.browserAction.setBadgeBackgroundColor({ color: "#c9302c" });
chrome.browserAction.onClicked.addListener(function(tab)
{
	if (extension.hasUpdate)
		extension.acknowledge();
	else
		extension.checkUpdate();
});

extension.checkUpdate();
	