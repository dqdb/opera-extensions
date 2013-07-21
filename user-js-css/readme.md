User JS and CSS
Copyright (c) 2013 dqdb

This is an empty template for custom user JS and CSS scripts. Install this as unpacked extension in Opera, and add user CSS/JS files like in Opera 12.

#Installation
1. download [this](https://github.com/dqdb/opera-extensions/blob/master/user-js-css/template.zip) ZIP file and extract to a folder
2. open Opera, press **Ctrl+Shift+E** and click **Developer Mode** in the top right corner
3. click **Load unpacked extension**, browse for the folder of previously extracted files and click **Ok**

#Adding user CSS

##New user CSS
1. save the *.css* file in the *css* folder of the extension
2. open the *manifest.json* file in a text editor
3. duplicate the *example user CSS* block in the *content_scripts* part of the file, remove comment slashes (*//*). Add trailing command, if required.
3. enumerate all pages and/or subpages in ``matches`` value where you want to work your CSS rules
4. set the ``css`` to the filename
5. open Opera, press **Ctrl+Shift+E**, look up **User JS and CSS extension** and click **Reload**

This method works also for Opera 12 CSS files.

###Example
1. the goal is to set the background color to black on all pages on [prohardver.hu](http://prohardver.hu), [mobilarena.hu](http://mobilarena.hu) and [itcafe.hu](http://itcafe.hu) sites.
2. create *ph.css* in the *css* folder with this content:

        body { background: black; }
3. add these line into the *content_scripts* block of the *manifest.json* file (add trailing comma if reuqired):

        {
          "matches": [ "http://prohardver.hu/*", "http://mobilarena.hu", "http://itcafe.hu" ], 
          "css": [ "css/ph.css" ] 
        }


##Stylish-compatible user CSS
1. download the original *.css* file into the *css* folder and open it in a text editor
2. search for the ``@-moz-document`` line
3. you have to transform this line before updating *manifest.json*. 

 Convert this rule:

        @-moz-document domain("facebook.com")

 into this:

        "matches": [ "*://facebook.com/*" ], [/C][/M]

 Convert this rule:

        @-moz-document url-prefix(http://www.google.com),
                       url-prefix(http://images.google.com),[/C][/M]

 into this:

        "matches": [ "http://www.google.com/*", "http://images.google.com/*" ],

4. delete the header of the *.css* file, and delete ``{``and ``}`` characters surrounding the CSS rules.

 Original *.css* file:

        @namespace url(http://www.w3.org/1999/xhtml);
        @-moz-document url-prefix(http://prohardver.hu),
                       url-prefix(http://mobilarena.hu)
        {
            body { background: black; }
        }

 Modified *.css* file:

        body { background: black; }


#Adding user JS
1. save the file in the *js* folder
2. open the *manifest.json* file in a text editor
3. duplicate the *example user JS* block in the *content_scripts* part of the file, remove comment slashes (*//*). Add trailing command, if required.
4. open the previously downloaded *.js* file and enumerate all ``@include`` rules separating by commas in the ``matches`` value
5. *opttional>* specify a ``runAt`` value for the script to modify its execution time (details can be fouund [here](https://developer.chrome.com/extensions/content_scripts.html)). You should set this value to ``document_start`` for **.js* scripts, and ``document_end`` or ``document_idle`` for **.user.js* scripts
6. open Opera, press **Ctrl+Shift+E**, look up **User JS and CSS extension** and click **Reload**

###Example
1. download [this](http://userscripts.org/scripts/review/69696) script as *redirect_to_gamepod.js* into the *js* folder
2. add these lines to the *content_scripts* block of *manifest.json* (add trailing comma if required):

        { 
            "matches": [ "http://prohardver.hu/*", "http://mobilarena.hu/*", "http://itcafe.hu/*", "http://logout.hu/*", "http://gamepod.hu/*" ], 
            "js": [ "js/redirect_to_gamepod.js" ] 
        } 

##Porting event handlers
If your code uses ``window.addEventListener("load", callback)`` to run some code after the page has loaded, you should set ``runAt`` to ``document_end`` and run the callback code directly.

If your code uses ``window.addEventListener("DOMContentLoaded", callback)`` to run some code, you should set ``runAt`` to ``document_start`` and run the callback code directly.

For other cases see next section.

##Important note
Porting a user CSS is easy, but porting a user JS is much more difficult. Finding the proper execution time and modifying the event listener logics is the hardest part to get user scripts to work in Opera 15. In most cases the simple rules above are enough, but in complexer situations (especially when you are inexperienced writing this type of code), your first step should be searching for an appropriate extension. And if this attempt failed, be patient during the trial-and-error-and-fix process. Porting your next user JS will be easier and faster :)

#Credits
Extension icon copyright by [dAKirby309](http://www.iconarchive.com/show/windows-8-metro-icons-by-dakirby309/Apps-Notepad-Metro-icon.html)
