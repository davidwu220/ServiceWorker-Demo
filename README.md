# ServiceWorker-Demo
ServiceWorker-Demo makes use of two browser APIs to offer client-side page persistence for Oracle APEX applications:

1. **ServiceWorker** allows Javascript files to run as "service workers" - background processes that can intercept network requests and offer an alternative to the browser cache.
We use this to save static resources, like the page HTML, CSS, and JS.
2. **IndexedDB** is a transaction-based client-side database that can store arbitrary Javascript objects. 
We use IndexedDB here to store form and form field data from the page. By default, we update our IndexedDB on change events and at fixed intervals.
On page load, form field data is reset to its default values; we offer the option either continue, discarding the saved IndexedDB data, or to restore form field from the IndexedDB.

**Note that regions and items that the client hasn't loaded yet will** ***not*** **work offline.**
This includes items that open a popup window, pages that source data from SQL queries, and pages that the browser has not previously seen before going offline. Because of way that APEX stores session state data in the URL, it's difficult to determine which pages to be cached in advance. If possible, limit offline availability to a single page that doesn't pull data from the server after page load.

# Installation and Setup

## Tomcat configuration
***HTTPS / TLS / SSL*** must be enabled for ServiceWorker to work - the ServiceWorker standard requires that pages that serve a ServiceWorker must have a secure origin.

### sw.js
***sw.js*** must be placed in the *ROOT webapp* if Oracle Rest Data Services is configured to run as a servlet under Apache Tomcat.
This is a security restriction imposed by the ServiceWorker standard - the scope of the ServiceWorker must be higher or equal to the page location. 

Effectively, this means that if the page is served at `example.com/ords/f?p=123:345`, then sw.js must be served at `example.com/sw.js` or `example.com/ords/sw.js`. 

On the filesystem, this looks like `$CATALINA_HOME/webapps/ROOT/sw.js` for `example.com/sw.js`. It might be possible to use URL remapping within Tomcat such that a static file could be served under `example.com/ords/` - investigate further?

## Other JS files
All other javascript files - those under the ***js*** directory - can be either served under the filesystem or uploaded as a shared component for the applicaiton.

To serve under the filesystem, drop the js folder into the ROOT webapp.
Or, upload other files individually under `Applicaiton X` > `Shared Components` > `Static Application Files`

## Referencing files
All Javascript files must be referenced on the page(s) where ServiceWorker and IndexedDB functionality is required. 

The easiest way to do this is under the **File URLs** section on each page - one line per file.
- For files on the filesystem, use these:
```
../js/main.js
../js/db.js
../js/networkTest.js
../sw.js
```

- For files used as share components, use these:
```
#APP_IMAGES#/main.js
#APP_IMAGES#/db.js
#APP_IMAGES#/networkTest.js
```

# Using ServiceWorker-Demo
ServiceWorker will automatically cache pages without human intervention, but IndexedDB requires some work for integration with APEX.

At a minimum, the page needs
1. an inline dialog region that displays on page load, prompting the user to load or discard locally-saved changes.
2. A save button/status indicator that forces all fields on the page to be saved.
3. An On Change dynamic action that saves an individual field on focus out.

## Modal dialog
main.js will, on page load, attempt to determine if there's a discrepancy between the input fields on the page and the saved values in IndexedDB; if there is, a modal dialog prompts the user to either restore or discard the changes.

The dialog region should have a **static ID** set under the `Advanced` section of its region properties. The same static ID should be set in the `_MODAL_DIALOG` variable in the main.js file.

The dialog should have two buttons: one to load values from IndexedDB, and another to discard values from IndexedDB. They should have dynamic actions attached that execute `APEX_LOADALL()` and `APEX_DISCARDALL()` as Javascript, respectively. It doesn't seem to matter what the affected elements for these actions are.

## Status indicator
The status indicator should have a dynamic action that executes `APEX_SAVEALL()` as Javascript upon click. It should have a **static ID** set; the corresponding variable in [[[config_file]]].

## Region change dynamic action
The Region change dynamic action should fire when any input field within the region is changed (but, for some reason, usually fires when one clicks away from the field). The event should have a selection type of `Region` and the Region should be whatever the content body is called. The associated action should affect only the `event source`; it should execute `APEX_SAVEFIELD(this)` as Javascript.

# Force clearing all page assets
Sometimes the serviceworker may keep caching an old version of a file, or the IndexedDB may break.

In production, increment the version numbers in `sw.js` and `db.js` to force the scripts to drop previous or bad versions.

In development, unregister the current ServiceWorker and purge the cache and local storage through `Developer Tools` > `Application` > `Clear Storage` - check all of the boxes before selecting `Clear Site Data`.
