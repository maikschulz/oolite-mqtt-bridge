this.name           = "oolite-mqtt-bridge";
this.author         = "Maik Schulz";
this.copyright      = "(C) 2021 Maik Schulz";
this.licence        = "CC-NC-by-SA 2.0";
this.description    = "Pushes game data as JSON structures to the debug console";
this.version        = "0.1";

"use strict";

this.startUp = function()
{
	var callbackCounter = 0.0;
	var prevMsg = {
		'speed': player.ship.speed,
		'maxSpeed': player.ship.maxSpeed,
	};
			
	this.$fcb = addFrameCallback(function (delta)
	{
		if (!debugConsole)
			return;
		
		callbackCounter += delta;
		if (callbackCounter < 0.1)
			return;
			
		callbackCounter = 0.0;
		var msg = {
			'msgType': "controls",
			'speed': player.ship.speed,
			'maxSpeed': player.ship.maxSpeed
		}
		if (msg.speed !== prevMsg.speed || msg.maxSpeed !== prevMsg.maxSpeed) {
			debugConsole.consoleMessage(JSON.stringify(msg));
			prevMsg = msg;
		}
	});
	commsMessageReceived("", {'displayName': ""});
}

this.alertConditionChanged = function(newCondition, oldCondition)
{
	var msg = {
		'msgType': "alert",
		'alertCondition': newCondition
	}
	debugConsole.consoleMessage(JSON.stringify(msg));
}

this.commsMessageReceived = function(message, sender)
{
	var msg = {
		'msgType': "comms",
		'message': message,
		'sender': sender.displayName
	}
    debugConsole.consoleMessage(JSON.stringify(msg));
}