#!/bin/sh
while ! docker exec docker_db_1 mysql --user=root --password=example -e "SELECT 1" >/dev/null 2>&1; do
    sleep 1
done