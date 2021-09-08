#!/bin/bash

#BOARD=adafruit:avr:feather32u4
#PORT=/dev/ttyACM0

BOARD=arduino:avr:leonardo
PORT=/dev/ttyACM0

arduino-cli compile -b ${BOARD}
arduino-cli upload -v -p ${PORT} -b ${BOARD}