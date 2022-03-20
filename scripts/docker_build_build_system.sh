#!/bin/bash

set -e

script_dir=$(dirname $0)
jaia_root=${script_dir}/..

docker build --no-cache -t build_system ${jaia_root}/.docker/focal/arm64
