touch ~/.profile

OS=`uname`

if [ ! -e ~/.nvm/install.sh ];
then
	echo "Installing NVM..."
	curl https://raw.github.com/creationix/nvm/master/install.sh | sh $LOG
else
	echo "Updating NVM..."
	~/.nvm/install.sh
fi
. ~/.nvm/nvm.sh
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
mkdir -p logs

#Create a dummy readme to npm doesnt keep complaining
touch backend/README.md
echo "Dummy" >> backend/README.md

#Tell used to install mongod if not found
mongoat=$(which mongod)
if [ ! -x "$mongoat" ] ; then
    echo "mongod not found. Please install mongodb"
    exit -1
fi
