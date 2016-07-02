var tmi = require('tmi.js');
var request = require('request');
var config = require('./config.js');
var fs = require('fs');
var _ = require('underscore');

var client = new tmi.client(config.tmi);
var admins = config.admins;
var channelsFile = config.channelsFile;
var channels = {};
var priorities = {};
var hostChannel = config.tmi.channels[0] || ("#" + config.tmi.identity.username);
var clientId = config.clientId || ""; // A client ID technically isn't necessary, but it's nice to include to prevent rate-limits: https://github.com/justintv/Twitch-API#rate-limits
var interval = {
    streams: null,
    hosting: null
};
var lastChannel = null;
var queuedHost = false;

var commands = {
    "!addstreamer": function(params, cb) {
        var channel = params[0];
        var priority = (params[1] && parseInt(params[1]) || 0);
        if(channel) {
            var sharedPriorities = (priorities[priority] || []);
            channel = channel.toLowerCase();
            if(channels[channel]) {
                var oldPriority = channels[channel];
                var oldIndex = priorities[oldPriority].indexOf(channel);
                if(oldIndex > -1) {
                    priorities[oldPriority].splice(oldIndex, 1);
                }
            }
            channels[channel] = priority;
            sharedPriorities.push(channel);
            priorities[priority] = sharedPriorities;
            saveChannels();
            cb("Successfully added \"" + channel + "\" with priority: " + priority);
            return;
        }
        cb("Missing parameter: channel");
        return;
    },
    "!removestreamer": function(params, cb) {
        var channel = params[0];
        if(channel) {
            channel = channel.toLowerCase();
            if(channels[channel] !== undefined) {
                var priority = channels[channel];
                priorities[priority].splice(priorities[priority].indexOf(channel), 1);
                delete channels[channel];
                saveChannels();
                cb("Successfully removed \"" + channel + "\"");
                return;
            }
            cb(channel + " is not on the channel list");
            return;
        }
        cb("Missing parameter: channel");
        return;
    },
    "!listpriorities": function(params, cb) {
        var priority = params[0];
        if(priority) {
            priority = parseInt(priority);
            if(priorities[priority] && priorities[priority].length > 0) {
                cb(priorities[priority].join(", "));
                return;
            }
            cb("No channels listed under priority: " + priority);
            return;
        }
        cb("Missing parameter: priority");
        return;
    },
    "!host": function() {
        hostNewChannel();
    },
    "!rehost": function() {
        hostNewChannel();
    },
    "!unhost": function() {
        client.unhost(hostChannel);
    },
    "!status": function(params, cb) {
        checkHosting(function(error, response, body) {
            body = JSON.parse(body);
            cb("Currently hosting: " + (body.hosts[0].target_login || 'None'));
        });
    },
    "!quit": function() {
        quit();
    }
};

function quit() {
    client.say(hostChannel, "Exiting application");
    client.disconnect();
    process.exit();
}

function loadChannels(callback) {
    fs.readFile(channelsFile, 'utf8', function(error, data) {
        if (error) {
            throw error;
        }
        callback(JSON.parse(data));
    });
}

function saveChannels() {
    fs.writeFile(channelsFile, JSON.stringify(channels), function(error) {
        if (error) {
            throw error;
        }
    });
}

function checkHosting(callback) {
    request("https://api.twitch.tv/kraken/channels/" + hostChannel.replace("#", ""), function(err, response, body) {
        body = JSON.parse(body);
        var id = body._id;
        var url = 'https://tmi.twitch.tv/hosts?include_logins=1&host=' + id;
        request(url, callback);
    });
}

function getLiveChannels(callback) {
    var allChannels = Object.keys(channels);
    var liveChannels = [];
    var count = 0;
    var parameters = [
        'limit=100',
        'stream_type=live',
        'client_id=' + clientId
    ];
    _.each(allChannels, function(channel, index) {
        request('https://api.twitch.tv/kraken/streams/' + channel + "?" + parameters.join("&"), function(error, response, body) {
            body = JSON.parse(body);
            if(body.stream) {
                liveChannels.push(channel);
            }

            if(index === (allChannels.length - 1)) {
                callback(liveChannels);
            }
        });
    });
}

function pickPrioritizedChannel(liveChannels, cb) {
    var priorities = {};
    _.each(liveChannels, function(channel, index) {
        var priority = channels[channel];
        if(!priorities[priority]) {
            priorities[priority] = [];
        }
        priorities[priority].push(channel);

        if(index === (liveChannels.length - 1)) {
            var highest = Object.keys(priorities).sort(function(a, b) {return a - b;}).reverse()[0];
            var chan = randArray(priorities[highest]);
            cb(chan);
        }
    });
}

function hostNewChannel() {
    clearInterval(interval.streams);
    getLiveChannels(function(liveChannels) {
        console.log("Fetched live channels: " + (liveChannels.length === 0 ? "No one is live" : liveChannels.join(", ")));
        if(liveChannels.length > 0) {
            pickPrioritizedChannel(liveChannels, function(priorityChannel) {
                client.host(hostChannel, priorityChannel);
                lastChannel = priorityChannel;
                console.log("Hosting channel: " + priorityChannel);
                startHostTimer(300000);
            });
        } else {
            startTimer(300000);
        }
    });
}

function startTimer(delay) {
    console.log("Started timer for checking of live streams");
    interval.streams = setInterval(function () {
        hostNewChannel();
        console.log("Cleared timer for checking of live streams");
    }, delay);
}

function startHostTimer(delay) {
    console.log("Started timer for host-checking");
    interval.hosting = setInterval(function() {
        checkHosting(function(error, response, body) {
            body = JSON.parse(body);
            var host = body.hosts[0];
            if(!host.target_login) {
                clearInterval(interval.hosting);
                if(lastChannel) {
                    console.log("Currently not hosting anyone - Executing /unhost command.");
                    client.unhost(hostChannel); // Do the /unhost command, so the "unhost" event triggers.
                } else {
                    hostNewChannel();
                }
            } else {
                console.log("Still hosting: " + host.target_login + " - Host-checking timer will restart");
            }
        });
    }, delay);
}

function randArray(array) {
    // Credit: http://stackoverflow.com/a/4550514
    return array[Math.floor(Math.random() * array.length)];
}

loadChannels(function(data) {
    channels = data;
    _.each(channels, function(priority, channel) {
        if(!priorities[priority]) {
            priorities[priority] = [];
        }
        priorities[priority].push(channel);
    });
    console.log("Channels have been loaded.");
    checkHosting(function(error, response, body) {
        body = JSON.parse(body);
        var host = body.hosts[0];
        console.log("Fetching host info");
        if(!host.target_login) {
            // If channel isn't hosting anyone at the time of boot, host new channel.
            console.log("Attempting to host a channel");
            hostNewChannel();
        } else {
            console.log("Already hosting: " + host.target_login);
        }
    });
});

client.connect();

client.on('logon', function() {
    if(!config.tmi.channels || config.tmi.channels.length === 0) {
        client.join(hostChannel);
    }
});

client.on('chat', function(channel, user, msg, isSelf) {
    if(!isSelf && admins.indexOf(user.username) !== -1) {
        var split = msg.split(" ");
        var command = split[0].toLowerCase();

        if(commands[command]) {
            var params = split.splice(1);
            commands[command](params, function(message, data) {
                client.say(channel, user["display-name"] + " - " + message + ".");
            });
        }
    }
});

client.on('notice', function(channel, id, message) {
    if(id === 'host_target_went_offline') {
        queuedHost = true;
        setTimeout(function () {
            lastChannel = null;
            queuedHost = false;
            hostNewChannel();
        }, 180000); // Set a delay, since Twitch API is sometimes extremely slow on updating when someone goes offline.
    }
});

client.on('unhost', function() {
    setTimeout(function() {
        if (!queuedHost) {
            hostNewChannel();
        }
    }, 5000);
});

process.on('SIGTERM', function() {
    quit();
});
