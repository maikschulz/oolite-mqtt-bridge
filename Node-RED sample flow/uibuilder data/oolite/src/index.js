/* jshint browser: true, esversion: 5, asi: true */
/*globals Vue, uibuilder */
// @ts-nocheck
/*
  Copyright (c) 2021 Julian Knight (Totally Information)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
'use strict'

/** @see https://totallyinformation.github.io/node-red-contrib-uibuilder/#/front-end-library */

// eslint-disable-next-line no-unused-vars
const app = new Vue({
    el: '#app',

    data() { return {

        speed           : 0,
        alertCondition  : 0,
        commsMessages   : [],
        bridgeStatus    : "manned"
        /*
        startMsg    : 'Vue has started, waiting for messages',
        feVersion   : '',
        counterBtn  : 0,
        inputText   : null,
        inputChkBox : false,
        socketConnectedState : false,
        serverTimeOffset     : '[unknown]',
        imgProps             : { width: 75, height: 75 },
        msgRecvd    : '[Nothing]',
        msgsReceived: 0,
        msgCtrl     : '[Nothing]',
        msgsControl : 0,

        msgSent     : '[Nothing]',
        msgsSent    : 0,
        msgCtrlSent : '[Nothing]',
        msgsCtrlSent: 0,

        isLoggedOn  : false,
        userId      : null,
        userPw      : null,
        inputId     : '',
        */
    }}, // --- End of data --- //

    computed: {
        hCommsMessages: function () {
            var commsMessages = this.commsMessages;
            if (commsMessages.length == 0) return "";
            else {
                var commsMessageFormatted = "";
                commsMessages.forEach(function(item, index, array) {
                    commsMessageFormatted = commsMessageFormatted + item.sender + ": " + item.message + "<br>";
                });
                return commsMessageFormatted;
            }
        }
    }, // --- End of computed --- //

    methods: {
        setBridgeStatus: function (status) {
            this.bridgeStatus = status;
            uibuilder.send({'payload': {'bridge': status}});
        }
    },
    
    // Available hooks: beforeCreate,created,beforeMount,mounted,beforeUpdate,updated,beforeDestroy,destroyed, activated,deactivated, errorCaptured

    /** Called after the Vue app has been created. A good place to put startup code */
    created: function() {

        // Example of retrieving data from uibuilder
        //this.feVersion = uibuilder.get('version')

        /** **REQUIRED** Start uibuilder comms with Node-RED @since v2.0.0-dev3
         * Pass the namespace and ioPath variables if hosting page is not in the instance root folder
         * e.g. If you get continual `uibuilderfe:ioSetup: SOCKET CONNECT ERROR` error messages.
         * e.g. uibuilder.start('/uib', '/uibuilder/vendor/socket.io') // change to use your paths/names
         * @param {Object=|string=} namespace Optional. Object containing ref to vueApp, Object containing settings, or String IO Namespace override. changes self.ioNamespace from the default.
         * @param {string=} ioPath Optional. changes self.ioPath from the default
         * @param {Object=} vueApp Optional. Reference to the VueJS instance. Used for Vue extensions.
         */
        uibuilder.start(this) // Single param passing vue app to allow Vue extensions to be used.

        //console.log(this)

    }, // --- End of created hook --- //

    /** Called once all Vue component instances have been loaded and the virtual DOM built */
    mounted: function(){

        //console.debug('[indexjs:Vue.mounted] app mounted - setting up uibuilder watchers')

        var app = this  // Reference to `this` in case we need it for more complex functions

        // If msg changes - msg is updated when a standard msg is received from Node-RED over Socket.IO
        uibuilder.onChange('msg', function(msg){
            //console.info('[indexjs:uibuilder.onChange] msg received from Node-RED server:', msg)
            var ooliteMessage = msg.payload;
            switch (ooliteMessage.msgType) {
                case 'controls':
                    app.speed = ooliteMessage.speed;
                    break;
                case 'alert':
                    app.alertCondition = ooliteMessage.alertCondition;
                    if (app.alertCondition == 3) {
                        uibuilder.send({'payload': {'command': 'alert'}});
                    }
                    break;
                case 'comms':
                    uibuilder.send({'payload': {'command': 'message', 'message': ooliteMessage.message}});
                    app.commsMessages.push({'sender':ooliteMessage.sender, 'message':ooliteMessage.message});
                    if (app.commsMessages.length > 10) {
                        app.commsMessages.shift();
                    }
                    break;
                default:
                    break;
            }
        })

        //#region ---- Debug info, can be removed for live use ---- //

        /** You can use the following to help trace how messages flow back and forth.
         * You can then amend this processing to suite your requirements.
         */

        // If we receive a control message from Node-RED, we can get the new data here - we pass it to a Vue variable
        uibuilder.onChange('ctrlMsg', function(msg){
            //console.info('[indexjs:uibuilder.onChange:ctrlMsg] CONTROL msg received from Node-RED server:', msg)
            app.msgCtrl = msg
            app.msgsControl = uibuilder.get('msgsCtrl')
        })

        /** You probably only need these to help you understand the order of processing
         * If a message is sent back to Node-RED, we can grab a copy here if we want to
         */
        uibuilder.onChange('sentMsg', function(msg){
            //console.info('[indexjs:uibuilder.onChange:sentMsg] msg sent to Node-RED server:', msg)
            app.msgSent = msg
            app.msgsSent = uibuilder.get('msgsSent')
        })

        /** If we send a control message to Node-RED, we can get a copy of it here */
        uibuilder.onChange('sentCtrlMsg', function(msg){
            //console.info('[indexjs:uibuilder.onChange:sentCtrlMsg] Control message sent to Node-RED server:', msg)
            app.msgCtrlSent = msg
            app.msgsCtrlSent = uibuilder.get('msgsSentCtrl')
        })

        /** If Socket.IO connects/disconnects, we get true/false here */
        uibuilder.onChange('ioConnected', function(connected){
            //console.info('[indexjs:uibuilder.onChange:ioConnected] Socket.IO Connection Status Changed to:', connected)
            app.socketConnectedState = connected
        })
        /** If Server Time Offset changes */
        uibuilder.onChange('serverTimeOffset', function(serverTimeOffset){
            //console.info('[indexjs:uibuilder.onChange:serverTimeOffset] Offset of time between the browser and the server has changed to:', serverTimeOffset)
            app.serverTimeOffset = serverTimeOffset
        })

        /** If user is logged on/off */
        uibuilder.onChange('isAuthorised', function(isAuthorised){
            //console.info('[indexjs:uibuilder.onChange:isAuthorised] isAuthorised changed. User logged on?:', isAuthorised)
            //console.log('authData: ', uibuilder.get('authData'))
            //console.log('authTokenExpiry: ', uibuilder.get('authTokenExpiry'))
            app.isLoggedOn = isAuthorised
        })

        //#endregion ---- Debug info, can be removed for live use ---- //

    }, // --- End of mounted hook --- //

}) // --- End of app1 --- //

// EOF