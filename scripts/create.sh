#/bin/bash
# set -e
FULLSCRIPTPATH=$(readlink --canonicalize $0) # full path, in case ./create.sh used
BASEDIR=$(dirname $FULLSCRIPTPATH)
# BASEDIR=$(dirname $0) # can use this if specifying full path to .sh

GREEN='\033[0;32m'
NC='\033[0m' # No Color

DBHOST=0.0.0.0
DBUSER=root
DBPASS=test_pass
DBDATABASE=test

printf "${GREEN}create test db, user, & tables${NC}\n"
set -x
mysql --host=$DBHOST --port=3306 --user=$DBUSER --password=$DBPASS < $BASEDIR/create-db-user-tables.sql
mysql --host=$DBHOST --port=3306 --user=$DBUSER --password=$DBPASS --database=$DBDATABASE -e "SHOW TABLES;"

set +x
