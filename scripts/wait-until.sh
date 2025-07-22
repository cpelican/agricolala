#!/usr/bin/env bash

command="${1}"
timeout="${2:-60}"

echo "Waiting for command: ${command}"
echo "Timeout: ${timeout} seconds"

i=1
until eval "${command}" > /dev/null 2>&1
do
    echo "Attempt ${i}/${timeout}: Command failed, retrying in 1 second..."
    ((i++))

    if [ "${i}" -gt "${timeout}" ]; then
        echo "Command was never successful, aborting due to ${timeout}s timeout!"
        exit 1
    fi

    sleep 1
done

echo "Command succeeded after ${i} attempts!"
