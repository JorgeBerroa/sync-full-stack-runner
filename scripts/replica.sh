#!/bin/bash

sleep 10s
mongo --host syncqueue:27018 <<EOF

var config = {"_id": "rs0", "members":[
{"_id": 0, "host": "syncqueue:27018"}]
}
rs.initiate(config, { force: true });