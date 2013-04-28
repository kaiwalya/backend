mongoat=$(which mongod)
if [ ! -x "$mongoat" ] ; then
    echo "mongod not found. Please install mongodb"
    exit -1
fi


. ~/.nvm/nvm.sh
nvm use 0.10.3
mkdir -p logs
APILOGFILE=`pwd -P`'/logs/api.log'
SITELOGFILE=`pwd -P`'/logs/site.log'
MONGOLOGFILE=`pwd -P`'/logs/mongo.log'
echo "" > $APILOGFILE
echo "" > $SITELOGFILE
echo "" > $MONGOLOGFILE
echo "Control + C to Quit"
node . $1 2>&1 | bunyan
echo ""
