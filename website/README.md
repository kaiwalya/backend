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

Install Bunyan [Optional]
--------------

We use bunyan for logging. It needs to be installed globally if you want to make sense of the json spit out by the server when it runs. 
	npm install -g bunyan

To view the logs through bunyan pipe the server output to bunyan

	node . | bunyan
