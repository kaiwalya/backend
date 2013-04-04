. ~/.nvm/nvm.sh
pwd
APILOGFILE=`pwd -P`'/logs/api.log'
SITELOGFILE=`pwd -P`'/logs/site.log'
echo "" > $APILOGFILE
echo "" > $SITELOGFILE
tail -f $APILOGFILE | bunyan &
tail -f $SITELOGFILE | bunyan &
echo "Control + C to Quit"
node backend
ps aux | grep $APILOGFILE | grep tail | awk '{print $2}' | xargs -L 1 'kill'
ps aux | grep $SITELOGFILE | grep tail | awk '{print $2}' | xargs -L 1 'kill'
echo ""
