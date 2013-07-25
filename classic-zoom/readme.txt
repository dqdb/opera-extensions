Opera Classic Zoom
Copyright (c) 2013 dqdb

This extension emulates the zoom behavior of Opera 12.

Features:
* tries to keep scroll position during zooming in or out
* newly opened tabs inherits the zoom level of their parents
* zoom using Ctrl+Shift+mouse wheel
* restore zoom level after Opera restart

Hotkeys:
  Plus: increase zoom by 10%
  Ctrl+Plus: increase zoom by 100%
  Minus: decrease zoom by 10%
  Ctrl+Minus: decrease zoom by 100%
  *: restore zoom to 100%

Known issues:
* embedded iframes are not zoomed after page load (I have no idea how to trick cross site frame policy)
* zoom level is lost when reopening recently closed tabs
* this extension uses CSS for zooming, it is not compatible with and related to the built-in zoom feature of Opera 15
* it leaks some localStorage space when closing secondary browser windows

Changes in version 1.2.0
* completely new content script to modify zoom level at document_start (content is zoomed before displaying it)
* renamed to Classic Zoom

Changes in version 1.1.0
* restore zoom level after Opera restart
* zoom using Ctrl+Shift+mouse wheel

Extension icon copyright by dAKirby309
http://www.iconarchive.com/show/windows-8-metro-icons-by-dakirby309/Apps-Magnifier-Metro-icon.html

