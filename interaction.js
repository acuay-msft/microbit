"use strict";
// Get a builder instance
var builder = require("botbuilder");
var restify = require("restify");
var githubClient = require("./github-client.js");

//================================================
// Bot setup
//================================================

// Create a connector
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Create an universal connector
var bot = new builder.UniversalBot(connector);
var dialog = new builder.IntentDialog();

dialog.matches(/^search/i, [
    function(session, args, next){
        if(session.message.text.toLowerCase() == 'search'){
            // TODO: Prompt user for text
            builder.Prompts.text(session, 'Who do you want to search for?');
        } else {
            var query = session.message.text.substring(7);
            next({ response: query });
        }
    },

    function(session, result, next) {
        var query = result.response;
        if(!query){
            session.endDialog('Request cancelled');
        } else {
            githubClient.executeSearch(query, function(profiles){
                var totalCount = profiles.total_count;
                if(totalCount == 0){
                    session.endDialog('Sorry, no results found.');
                } else if(totalCount > 10){
                    session.endDialog('More than 10 results were found. Please provide a more restrictive query.');
                } else {
                    session.dialogData.property = null;
                    // convert the results into an array of login names
                    var usernames = profiles.items.map(function(item){return item.login });

                    // TODO: Prompt user with list
                    builder.Prompts.choice(session, 'What profile did you want to load?', usernames, {listStyle: builder.ListStyle.button});
                }
            });

        }
    },

    function(session, result, next){
        // TODO: Display final request
        //session.send(result.response.entity);

        githubClient.loadProfile(result.response.entity, function(profile){
            // Alternatively we can show the result as a card
            var card = new builder.HeroCard();
            card.title(profile.login);
            card.images([builder.CardImage.create(session, profile.avatar_url)]);
    
            if(profile.name) card.subtitle(profile.name);
    
            var text = '';
            if(profile.company) text += profile.company + '\n';
            if(profile.email) text += profile.email + '\n';
            if(profile.bio) text += profile.bio;
            card.text(text);
    
            card.tap(new builder.CardAction.openUrl(session, profile.html_url));
    
            var message = new builder.Message(session).attachments([card]);
            session.send(message);
        });
    }
])

bot.dialog('/', dialog);

// Set up the restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());


