var restify = require('restify');
var builder = require('botbuilder');
var localtunnel = require('localtunnel');
var opn = require('opn');

// LOCALTUNNEL ===================================================
if (process.env !== 'production') {
  var tunnel = localtunnel(3978, { subdomain: 'syscoassist' }, function(err, tunnel) {
    let log = err ? `tunnel failz....... ${err}` : `everyday im tunnelin...... ${tunnel.url}`;
    console.log(log);
    if (!err) {
      opn(tunnel.url);
    }
  });

  tunnel.on('close', function() {
    // tunnels are closed
    console.log(`tunnelin......finished..... ${tunnel.url}`);
  });
}



// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create bot and add dialogs
var connector = new builder.ChatConnector({
    appId: "d1693dec-3795-496d-b590-9ebe4bdd7c10",
    appPassword: "9csLGLz2SDeWGTt5rQ8auNd"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.dialog('/', function (session) {
    session.send('Hello World');
});

bot.dialog('/createSubscription', function (session, args) {
    // Serialize users address to a string.
    var address = JSON.stringify(session.message.address);

    // Save subscription with address to storage.
    session.sendTyping();
    createSubscription(args.userId, address, function (err) {
        // Notify the user of success or failure and end the dialog.
        var reply = err ? 'unable to create subscription.' : 'subscription created';
        session.endDialog(reply);
    });
});
