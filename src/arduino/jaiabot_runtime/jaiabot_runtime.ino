#include <SPI.h>
#include <pb_decode.h>
#include <pb_encode.h>
#include <Servo.h>

#ifdef UENUM
#undef UENUM
#endif
#include "jaiabot/messages/nanopb/control_surfaces.pb.h"

#define DEBUG_MESSAGE(x) (x)

// Binary serial protocol
// [JAIA][2-byte size - big endian][bytes][JAIA]...
// TODO: Add CRC32?
constexpr const char* SERIAL_MAGIC = "JAIA";
constexpr int SERIAL_MAGIC_BYTES = 4;
constexpr int SIZE_BYTES = 2;
using serial_size_type = uint16_t;

constexpr int BITS_IN_BYTE = 8;

Servo rudder_servo, port_elevator_servo, stbd_elevator_servo, motor_servo;

constexpr int STBD_ELEVATOR_PIN = 2;
constexpr int RUDDER_PIN = 3;
constexpr int PORT_ELEVATOR_PIN = 4;
constexpr int MOTOR_PIN = 6;

// The timeout
unsigned long t_last_command = 0;
int32_t command_timeout = -1; 
void handle_timeout();
void halt_all();

static_assert(jaiabot_protobuf_ControlSurfaces_size < (1ul << (SIZE_BYTES*BITS_IN_BYTE)), "ControlSurfaces is too large, must fit in SIZE_BYTES word");

bool data_to_send = false;
bool data_to_receive = false;

jaiabot_protobuf_ControlSurfaces command = jaiabot_protobuf_ControlSurfaces_init_default;
jaiabot_protobuf_ControlSurfacesAck ack = jaiabot_protobuf_ControlSurfacesAck_init_default;

// Motor stuff
  const uint32_t max_motor_step = 10;
  int32_t motor = 0;

enum AckCode {
  STARTUP = 0,
  ACK = 1,
  TIMEOUT = 2,
};


void send_ack()
{
  const size_t max_ack_size = 256;

  bool status = true;
  uint8_t pb_binary_data[max_ack_size] = {0};
  serial_size_type message_length = 0;

  pb_ostream_t stream = pb_ostream_from_buffer(pb_binary_data, sizeof(pb_binary_data));
  status = pb_encode(&stream, jaiabot_protobuf_ControlSurfacesAck_fields, &ack);
  message_length = stream.bytes_written;

  if (status)
  {
    Serial.write(SERIAL_MAGIC, SERIAL_MAGIC_BYTES);
    Serial.write((message_length >> BITS_IN_BYTE) & 0xFF);
    Serial.write(message_length & 0xFF);
    Serial.write(pb_binary_data, message_length);
  }
  delay(10);
}

void setup()
{

  Serial.begin(115200);
  while (!Serial) {
    delay(1);
  }

  delay(100);

  motor_servo.attach(MOTOR_PIN);
  rudder_servo.attach(RUDDER_PIN);
  stbd_elevator_servo.attach(STBD_ELEVATOR_PIN);
  port_elevator_servo.attach(PORT_ELEVATOR_PIN);

  // Send startup code
  ack.code = STARTUP;
  send_ack();

}


int32_t clamp(int32_t v, int32_t min, int32_t max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}


void loop()
{

  constexpr int prefix_size = SERIAL_MAGIC_BYTES + SIZE_BYTES;

  handle_timeout();

  while (Serial.available() >= prefix_size) {
    handle_timeout();
    
    // read bytes until the next magic word start (hopefully)
    while (Serial.available() > 0  && Serial.peek() != SERIAL_MAGIC[0]) {
      handle_timeout();
      Serial.read();
    }

    uint8_t prefix[prefix_size] = {0};
    if (Serial.readBytes(prefix, prefix_size) == prefix_size)
    {
      if (memcmp(SERIAL_MAGIC, prefix, SERIAL_MAGIC_BYTES) == 0)
      {
        serial_size_type size = 0;
        size |= prefix[SERIAL_MAGIC_BYTES];
        size << BITS_IN_BYTE;
        size |= prefix[SERIAL_MAGIC_BYTES + 1];

        if (size <= jaiabot_protobuf_ControlSurfaces_size)
        {
          uint8_t pb_binary_data[jaiabot_protobuf_ControlSurfaces_size] = {0};
          if (Serial.readBytes(pb_binary_data, size) == size)
          {
            pb_istream_t stream = pb_istream_from_buffer(pb_binary_data, size);
            bool status = pb_decode(&stream, jaiabot_protobuf_ControlSurfaces_fields, &command);
            if (!status)
            {
              DEBUG_MESSAGE("Decoding ControlSurfaces protobuf failed:");
              DEBUG_MESSAGE(PB_GET_ERROR(&stream));
            }

            if (command.motor == 0) {
              motor = command.motor;
            }
            else {
              int32_t delta_motor = command.motor - motor;
              delta_motor = clamp(delta_motor, -max_motor_step, max_motor_step);
              motor += delta_motor;
            }

            // Keep motor value in useful range (not abs(motor) < 30)
            if (motor > 0 && motor < 30) {
              motor = 30;
            }
            if (motor > -30 && motor < 0) {
              motor = -30;
            }

            // Clamp and center rudder
            int32_t rudder = clamp(command.rudder + 15, -55, 100);

            motor_servo.writeMicroseconds (1500 - motor  * 400 / 100);
            rudder_servo.writeMicroseconds(1500 - rudder * 475 / 100);
            stbd_elevator_servo.writeMicroseconds(1500 - command.stbd_elevator * 475 / 100);
            port_elevator_servo.writeMicroseconds(1500 - command.port_elevator * 475 / 100);

            // Set the timeout vars
            t_last_command = millis();
            command_timeout = command.timeout * 1000;

            ack.code = ACK;
            send_ack();
          }
          else
          {
            DEBUG_MESSAGE("Read wrong number of bytes for PB data");
          }
        }
        else
        {
          DEBUG_MESSAGE("Size is wrong, expected <= jaiabot_protobuf_LoRaMessage_size");
        }

      }
      else
      {
        DEBUG_MESSAGE("Serial magic is wrong");
      }
    }
    else
    {
      DEBUG_MESSAGE("Read wrong number of bytes for prefix");
    }
  }

}

void handle_timeout() {
  if (command_timeout < 0) return;
  
  unsigned long now = millis();
  if (now - t_last_command > command_timeout) {
    command_timeout = -1;
    halt_all();

    ack.code = TIMEOUT;
    send_ack();
  }
}

void halt_all() {
  motor_servo.writeMicroseconds (1500 + 0 * 400 / 100);
  rudder_servo.writeMicroseconds(1500 + 0 * 475 / 100);
  stbd_elevator_servo.writeMicroseconds(1500 + 0 * 475 / 100);
  port_elevator_servo.writeMicroseconds(1500 + 0 * 475 / 100);
}

// from feather.pb.c - would be better to just add the file to the sketch
// but unclear how to do some from Arduino
PB_BIND(jaiabot_protobuf_ControlSurfaces, jaiabot_protobuf_ControlSurfaces, 2)
PB_BIND(jaiabot_protobuf_ControlSurfacesAck, jaiabot_protobuf_ControlSurfacesAck, 2)
