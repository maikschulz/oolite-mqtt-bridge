# oolite-mqtt-bridge
An implementation of Oolite's debug console protocol to interface to MQTT

## Requirements
- A debug version of Oolite (http://oolite.org)
- The oolite-mqtt-bridge.oxp extension for Oolite
- An MQTT broker, for example Mosquitto
- Node.js to run this server
- A consumer for the MQTT topics, for example a Node-RED dashboard

## Limitations
- Currently does not work with Oolite on MacOS due to a bug in its debug protocol implementation.
- Does not authenticate against the MQTT broker

## Description
Receives JSON formatted game data from Oolite and forwards it to MQTT topics oolite/controls, oolite/alert, and oolite/comms

Messages to oolite/controls are sent every 0.1 seconds if any of the properties changed. Format:

    {
      'msgType': "controls",
      'speed': number, // current player ship speed
      'maxSpeed': number // current player ship max speed
    }
  
Messages to oolite/alert are sent if the alert condition of the player in Oolite changed. Format:

    {
      'msgType': "alert",
      'alertCondition': number // 0: docked, 1: green, 2: yellow, 3: red
    }
    
Messages to oolite/comms are sent if the player receives a comms messages in Oolite. Format:

    {
      'msgType': "comms",
      'message': string, // the message that was received
      'sender': string // the display name of the sender
    }
    
## Usage
First start MQTT, then start this server, then start Oolite. Consume messages from the MQTT topics and do something fun with the data.
