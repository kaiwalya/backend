The Web API Service
===============

Download all dependencies
------------------

All the dependencies to run the files are specified in the package.json file.

	cd webservice
	npm run-script ready


To run the service
------------------

	node .	

Install Mocha
-------------

We use mocha for doing unit tests.
	
	sudo npm install -g mocha

To Test

	mocha



Install Package manager for sublime [http://wbond.net/sublime_packages/package_control/installation]
-------------
Open your console using "Control + `" and paste the string below in the console.

	import urllib2,os; pf='Package Control.sublime-package'; ipp=sublime.installed_packages_path(); os.makedirs(ipp) if not os.path.exists(ipp) else None; urllib2.install_opener(urllib2.build_opener(urllib2.ProxyHandler())); open(os.path.join(ipp,pf),'wb').write(urllib2.urlopen('http://sublime.wbond.net/'+pf.replace(' ','%20')).read()); print('Please restart Sublime Text to finish installation')


Install JSHint
--------------
This provides code formatting for javascript.

# Command + Shift + P
# Type "install pack", Press enter on "Install Package"
# Type and find "Sublime-JSHint"
# Restart sublime

In Terminal

	sudo install -g jshint
 



Install Bunyan [Optional]
--------------

We use bunyan for logging. It needs to be installed globally if you want to make sense of the json spit out by the server when it runs. 
	sudo npm install -g bunyan

To view the logs through bunyan pipe the server output to bunyan

	node . | bunyan