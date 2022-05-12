#!/bin/bash

set -e

if [ ! -d proto_include/goby ]; then
    ln -s /usr/include/goby proto_include/goby
fi

protoc -I/usr/local/include/ -Iproto_include/ --python_out=. proto_include/goby/middleware/protobuf/*.proto proto_include/jaiabot/messages/*.proto

echo "✅ Successfully built messages"
