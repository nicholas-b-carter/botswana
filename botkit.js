require('dotenv').config();
const apiai = require('botkit-middleware-apiai')({
  token: process.env.api_ai_token,
  skip_bot: false, // or false. If true, the middleware don't send the bot reply/says to api.ai
  sessionId: 'ttttttiiiiiiiiiiigggggggghhhhhhttttttt'
});
const Botkit = require('botkit');
const os = require('os');
const commandLineArgs = require('command-line-args');
const localtunnel = require('localtunnel');

//const apiai = apiaibotkit(process.env.api_ai_token);

const ops = commandLineArgs([
    {name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
        type: Boolean, defaultValue: false},
    {name: 'ltsubdomain', alias: 's', args: 1,
        description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
        type: String, defaultValue: null}
]);

if(ops.lt === false && ops.ltsubdomain !== null) {
    console.log("error: --ltsubdomain can only be used together with --lt.");
    process.exit();
}

const controller = Botkit.botframeworkbot({
    debug: true
});

const bot = controller.spawn({
    appId: process.env.app_id,
    appPassword: process.env.app_password
});

controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            const tunnel = localtunnel(process.env.port || 3000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/botframework/receive');
            });

            tunnel.on('close', function() {
                console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
                process.exit();
            });
        }
    });
});

// api-ai stuffs
controller.middleware.receive.use(apiai.receive);

/*
controller.hears('.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    apiai.process(message, bot);
});
apiai.action('smalltalk.greetings', function (message, resp, bot) {
        console.log('smalltalk', arguments);
        var responseText = resp.result.fulfillment.speech;
        bot.reply(message, responseText);
    })
    .action('input.unknown', function (message, resp, bot) {
        console.log('unknown', arguments);
        bot.reply(message, "Sorry, I don't understand");
    });

apiai.action('order.create', function (message, resp, bot) {
    console.log('creating that order', arguments);
    var responseText = resp.result.fulfillment.speech;
    bot.reply(message, responseText);
});
apiai.all(function (message, resp, bot) {
    console.log(resp.result.action);
});
 */

// apiai.hears for intents. in this example is 'hello' the intent
controller.hears(['hello'],'direct_message',apiai.hears,function(bot, message) {
    console.log('apai hearzzzz', bot, message);
    bot.reply(message, 'hearzzzz');
});

// apiai.action for actions. in this example is 'user.setName' the action
controller.hears(['order.create'],'direct_message',apiai.action,function(bot, message) {
    console.log('apai actionzzz', bot, message);
    bot.reply(message, 'actionzzzz');
});


controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});

controller.hears(['call me (.*)'], 'message_received', function(bot, message) {
    const matches = message.text.match(/call me (.*)/i);
    const name = matches[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message,'Your name is ' + user.name);
        } else {
            bot.reply(message,'I don\'t know yet!');
        }
    });
});


controller.hears(['shutdown'],'message_received',function(bot, message) {

    bot.startConversation(message,function(err, convo) {
        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function(response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
            }
        ]);
    });
});


controller.hears(['uptime','identify yourself','who are you','what is your name'],'message_received',function(bot, message) {

    const hostname = os.hostname();
    const uptime = formatUptime(process.uptime());

    bot.reply(message,'I am a bot! I have been running for ' + uptime + ' on ' + hostname + '.');

});

function formatUptime(uptime) {
    let unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}