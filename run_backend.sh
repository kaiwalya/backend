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
tail -n 0 -f $APILOGFILE | bunyan &
tail -n 0 -f $SITELOGFILE | bunyan &
tail -n 0 -f $MONGOLOGFILE | bunyan &
echo "Control + C to Quit"
tsc --module amd --target ES5 -w www/scripts/*.ts &
node backend
ps aux | grep "tsc --module amd --target ES5 -w www/scripts/" | xargs -L 1 'kill'
ps aux | grep $APILOGFILE | grep tail | awk '{print $2}' | xargs -L 1 'kill'
ps aux | grep $SITELOGFILE | grep tail | awk '{print $2}' | xargs -L 1 'kill'
ps aux | grep $MONGOLOGFILE | grep tail | awk '{print $2}' | xargs -L 1 'kill'
echo ""
