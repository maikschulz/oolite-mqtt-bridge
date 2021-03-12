# oolite-mqtt-bridge
An implementation of Oolite's debug console protocol to interface to MQTT

![Node-RED UIBuilder-based Oolite Dashboard](https://github.com/maikschulz/oolite-mqtt-bridge/blob/master/uibuilder-demo-01.png?raw=true)
![Node-RED UIBuilder flow for the Oolite Dashboard](https://github.com/maikschulz/oolite-mqtt-bridge/blob/master/uibuilder-flow-01.png?raw=true)

## Requirements
- A debug version of Oolite (http://oolite.org)
- The oolite-mqtt-bridge.oxp extension for Oolite
- An MQTT broker, for example Mosquitto
- Node.js to run this server
- A consumer for the MQTT topics, for example a Node-RED dashboard (two samples are included, one for Node-RED Dashboard, one for Node-RED UIBuilder)

## Limitations
- Currently does not work with Oolite on MacOS due to a bug in its debug protocol implementation.
- Only supports MQTT without authentication at the moment

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

## Installation
I use a Windows 10 machine to run Oolite and the oolite-mqtt-bridge server, and and Raspberry Pi 3B to run MQTT and Node-RED, all in my local network.

### Raspberry Pi
- My Raspberry Pi runs a Debian flavor (Raspberry Pi OS Lite). You need to install node.js and Node-RED, good instructions to install both at the same time are in the Node-RED documentation here: https://nodered.org/docs/getting-started/raspberrypi
- In Node-RED you need to go to the palette manager and add either node-red-contrib-uibuilder, or node-red-dashboard. Dashboard is simpler to use but more limited in design, UIBuilder needs HTML, CSS, and JavaScript skills. In this repository I provide sample flows for both, which can be imported into Node-RED. Note that my UIBuilder flow also refers to components in my home automation: a Sonos speaker to read out Oolite comms messages, and a smart bulb to flash red when the alert condition becomes red. Both only happen when the bridge is not manned (you click a button to notify about your absence/presence). You might want to replace them with debug nodes or whatever makes sense in your home.
- In order to generate audio from messages I use PicoTTS (the text-to-speech engine that Google integrated into Android, so light-weight enough for a Raspberry Pi):
    ```
    wget -q https://ftp-master.debian.org/keys/release-10.asc -O- | sudo apt-key add -
    echo "deb http://deb.debian.org/debian buster non-free" | sudo tee -a /etc/apt/sources.list
    sudo apt-get update
    sudo apt-get install libttspico-utils
    ```
- In addition, I installed sox to be able to get reliable information on the length of the generated audio (my Sonos doesn't always get it right otherwise and either stops too early to switch back to what was playing before, or makes too long a pause).
    ```
    sudo apt-get install sox
    ```
- Finally, you need an MQTT server. I use Mosquitto, here is a page that explains the installation on Raspberry Pi: https://randomnerdtutorials.com/how-to-install-mosquitto-broker-on-raspberry-pi/. Since oolite-mqtt-bridge does not support authentication yet, you need to edit /etc/mosquitto/mosquitto.conf and append
    ```
    allow_anonymous true
    ```

### Windows
- Download and install Oolite from http://oolite.org/download/, then download and install the "Developer release converter" from the same page (scroll down to find it)
- Copy the oolite-mqtt-bridge.oxp folder from this repository to the AddOns directory (typically C:\Oolite\AddOns)
- Install node.js from https://nodejs.org/en/download/
- Download the code from this repository as a zip (use the green Download button above), and unpack it
- Install the dependencies
    ```
    cd <directory of unzipped oolite-mqtt-bridge>
    npm install
    ```
    

## Usage
First start MQTT, then start this server, then start Oolite. Consume messages from the MQTT topics and do something fun with the data.
