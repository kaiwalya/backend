if [ ! -e ~/.nvm/install.sh ];
then
	echo "Installing NVM..."
	curl https://raw.github.com/creationix/nvm/master/install.sh | sh $LOG
else
	echo "Updating NVM..."
	~/.nvm/install.sh
fi
. ~/.profile
nvm install 0.10.1
nvm use 0.10.1
npm install -g jake
npm install -g bunyan
npm install -g jshint
npm install -g node-inspector
npm install -g node-dev
npm install -g supervisor
npm install -g mocha
npm install -g jscover
pushd backend
npm install
popd

#Directory for logs
mkdir logs

#Create a dummy readme to npm doesnt keep complaining
touch backend/README.md
echo "Dummy" >> backend/README.md

