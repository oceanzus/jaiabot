#!/usr/bin/python3
from time import sleep
from datetime import datetime
import random
import sys
import argparse
import socket
import ms5837

parser = argparse.ArgumentParser(description='Read temperature and pressure from a Bar30 sensor, and publish them over UDP port')
parser.add_argument('-p', '--port', metavar='port', default=20001, type=int, help='port to publish T & P')
parser.add_argument('--simulator', action='store_true')
args = parser.parse_args()

print(args)


class SensorError(Exception):
    pass


class Sensor:

    def __init__(self):
        self.is_setup = False
        self.pressure_0 = None

    def setup(self):
        if not self.is_setup:

            # Figure out which sensor we're dealing with
            bar02 = ms5837.MS5837_02BA()
            if not bar02.init():
                raise SensorError()
            if not bar02.read():
                raise SensorError()
            p_bar02 = bar02.pressure()
            del(bar02)

            bar30 = ms5837.MS5837_30BA()
            if not bar30.init():
                raise SensorError()
            if not bar30.read():
                raise SensorError()
            p_bar30 = bar30.pressure()
            del(bar30)

            ATM = 1013.25

            if abs(p_bar30 - ATM) < abs(p_bar02 - ATM):
                print('Auto-detected bar30 sensor')
                self.sensor = ms5837.MS5837_30BA()
            else:
                print('Auto-detected bar02 sensor')
                self.sensor = ms5837.MS5837_02BA()

            if self.sensor.init():
                self.is_setup = True
            else:
                raise SensorError()


    def read(self):
        if not self.is_setup:
            self.setup()

        try:
            if self.sensor.read():
                if self.pressure_0 is None:
                    self.pressure_0 = self.sensor.pressure()

                return (self.sensor.pressure() - self.pressure_0, self.sensor.temperature())
                
            else:
                print('Sensor read fail')
                self.is_setup = False
        except OSError as e:
            self.is_setup = False
            raise e


class SensorSimulator:

    def __init__(self):
        pass

    def setup(self):
        pass

    def read(self):
        return (random.uniform(1300, 1400), random.uniform(20, 25))


# Setup the Bar30
if args.simulator:
    sensor = SensorSimulator()
else:
    sensor = Sensor()


# Create socket
port = args.port

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(('', port))

while True:
    data, addr = sock.recvfrom(1024) # buffer size is 1024 bytes

    # Respond to anyone who sends us a packet
    try:
        p_mbar, t_celsius = sensor.read()
    except Exception as e:
        print(e)
        continue

    now = datetime.utcnow()
    line = '%s,%9.2f,%7.2f\n' % (now.strftime('%Y-%m-%dT%H:%M:%SZ'), p_mbar, t_celsius)

    print('Send: ', line)
    sock.sendto(line.encode('utf8'), addr)
