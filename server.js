const net = require('net');
const plist = require('plist-ex');
var mqtt = require('mqtt');

const port = 8563;
const host = '127.0.0.1';
const protocolVersion = version(1,1,0);

var ooliteConnected = false;

var responseCount = 0;
var shipData;

const server = net.createServer();
server.listen(port, host, () => {
    console.log('TCP server is running on port ' + port + '.');
});

var mqttClient = null;

let sockets = [];

server.on('connection', function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sockets.push(sock);

    sock.on('data', function(data) {
        receive(sock, data);
    });

    sock.on('close', function(data) {
        let index = sockets.findIndex(function(o) {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })
        if (index !== -1) sockets.splice(index, 1);
        console.log('CLOSED: ' + sock.remoteAddress + ':' + sock.remotePort);
        ooliteConnected = false;
    });
});

function receive(socket, data) {
    if (!socket.chunk) {
        socket.chunk = {
            messageSize: 0,
            buffer: Buffer.alloc(0),
            bufferStack: Buffer.alloc(0)
        };
    }
    socket.chunk.bufferStack = Buffer.concat([socket.chunk.bufferStack, data]);
    var reCheck = false;
    do {
        reCheck = false;
        if (socket.chunk.messageSize == 0 && socket.chunk.bufferStack.length >= 4) {
            socket.chunk.messageSize = socket.chunk.bufferStack.readInt32BE(0);
        }

        if (socket.chunk.messageSize != 0 && socket.chunk.bufferStack.length >= socket.chunk.messageSize + 4) {
            var buffer = socket.chunk.bufferStack.slice(4, socket.chunk.messageSize + 4);
            socket.chunk.messageSize = 0;
            socket.chunk.bufferStack = socket.chunk.bufferStack.slice(buffer.length + 4);
            onMessage(socket, buffer);
            reCheck = socket.chunk.bufferStack.length > 0;
        }
    } while (reCheck);
}

function transmit(socket, response) {
    if (!ooliteConnected && response['packet type'] !== 'Reject Connection') {
        console.log("cannot transmit message, Oolite is not connected");
        return;
    }

    data = plist.build(response);
    var buffer = Buffer.from(data.toString(), "binary");
    var consolidatedBuffer = Buffer.alloc(4 + buffer.length);
    consolidatedBuffer.writeInt32BE(buffer.length, 0);
    buffer.copy(consolidatedBuffer, 4);
    socket.write(consolidatedBuffer, function(err) {
        if (err) console.log(err);
    });
}

function onMessage(socket, buffer) {
    var message = plist.parseStringSync(buffer.toString());
    switch(message['packet type']) {
        case 'Request Connection':
            handleRequestConnection(socket, message);
            break;
        case 'Clear Console':
        case 'Note Configuration':
        case 'Note Configuration Change':
        case 'Show Console':
            //we ignore these
            break;
        case 'Close Connection':
            handleCloseConnection(socket, message);
            break;
        case 'Console Output':
            handleConsoleOutput(socket, message);
            break;
        case 'Ping':
            handlePing(socket, message);
            break;
        default:
            handleUnknown(socket, message);
            break;
    }
}

function handleRequestConnection(socket, message) {
    console.log("Oolite requests connection");
    remoteVersion = message['protocol version'];
    var requestConnectionResponse;
    if (versionCompatible(protocolVersion, remoteVersion)) {
        mqttClient = mqtt.connect("mqtt://raspberrypi.local");
        mqttClient.on("connect", function() {	
            console.log("connected to MQTT");
        });
        mqttClient.on("error", function(error) {
            console.log("Can't connect to MQTT: " + error);
        });

        requestConnectionResponse = {
            'packet type': 'Approve Connection',
            'console identity': 'OoliteConnector'
        };
        ooliteConnected = true;
    }
    else {
        requestConnectionResponse = {
            'packet type': 'Reject Connection',
            'console identity': 'Protocol version mismatch'
        };
    }
    transmit(socket, requestConnectionResponse);

}

function handleCloseConnection(socket, message) {
    ooliteConnected = false;
    console.log("Oolite disconnected");
    mqttClient.end();
    console.log("Disconnected from MQTT");
}

function handleConsoleOutput(socket, message) {
    if (mqttClient.connected == true) {
        msg = JSON.parse(message['message']);
        switch(msg.msgType) {
            case 'controls':
                mqttClient.publish("oolite/controls", JSON.stringify(msg));
                break;
            case 'alert':
                mqttClient.publish("oolite/alert", JSON.stringify(msg));
                break;
            case 'comms':
                mqttClient.publish("oolite/comms", JSON.stringify(msg));
                break;
            default:
                break;
        } 
    }
}

function handlePing(socket, message) {
    console.log("Oolite sent ping, sending pong");
    pongMessage = {
        'packet type': 'Pong',
        'message': message['message']
    }
    transmit(socket, pongMessage);
}

function handleUnknown(socket, message) {
    console.log("No handler for packet type " + message['packet type']);
}

function version(format, major, minor) {
    return 65536 * format + 256 * major + minor;
}

function versionFormat(version) {
    return (version / 65536) % 256;
}

function versionMajor(version) {
    return (version / 256) % 256;
}

function versionMinor(version) {
    return version % 256;
}

function versionCompatible(myVersion, remoteVersion) {
    return versionFormat(remoteVersion) == versionFormat(myVersion) && versionMajor(remoteVersion) <= versionMajor(myVersion);
}