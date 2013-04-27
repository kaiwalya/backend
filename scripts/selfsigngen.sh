mkdir -p config/certs

keyfile="./config/certs/localhost.key"
certfile="./config/certs/localhost.crt"
csrfile="./config/certs/localhost.csr"
configfile="./config/certs/localhost.cfg"
echo $keyfile $certfile $configfile
openssl genrsa -out $keyfile 2048
openssl req -new -config $configfile  -key $keyfile -out $csrfile 
openssl x509 -req -days 3650 -in $csrfile -signkey $keyfile -out $certfile
