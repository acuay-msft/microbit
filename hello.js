"use strict";
// Get a builder instance
var builder = require("botbuilder");

// Create a connector
var connector = new builder.ConsoleConnector().listen();

// Create an universal connector
var bot = new builder.UniversalBot(connector);

// // add in the dialog
// bot.dialog('/', function(session){
//     //session.send('Hello, bot!');
//     var userMessage = session.message.text;
//     session.send('You said: ' + userMessage);
// })

bot.dialog('/',[
    function(session){
        builder.Prompts.text(session, "Please enter your name");
    },

    function(session, result){
        session.send('You said: ' + result.response);
    }
])