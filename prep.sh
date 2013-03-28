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
npm install -g jscov
pushd backend
npm install
popd
