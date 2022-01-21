#/bin/bash
DBHOST=0.0.0.0
DBUSER=test
DBPASS=test123
DBDATABASE=test

mysql --host=$DBHOST --port=3306 --user=$DBUSER --password=$DBPASS --database=$DBDATABASE -e "select * from dateTable;"
mysql --host=$DBHOST --port=3306 --user=$DBUSER --password=$DBPASS --database=$DBDATABASE -e "select * from timestampTable;"
