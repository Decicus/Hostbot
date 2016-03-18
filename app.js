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
var hostChannel = config.tmi.channels[0] || config.tmi.identity.username;
var clientId = config.clientId;
var interval = null;

var commands = {
    "!addstreamer": function(params) {
        var channel = params[1];
        var priority = (params[2] && parseInt(params[2]) || 0);
        if(channel) {
            var sharedPriorities = (priorities[priority] || []);
            if(channels[channel]) {
                var oldPriority = channels[channel];
                var getIndex = sharedPriorities.indexOf(channel);
                if(getIndex > -1) {
                    sharedPriorities.splice(getIndex, 1);
                }
            }
            channel = channel.toLowerCase();
            channels[channel] = priority;
            sharedPriorities.push(channel);
            priorities[priority] = sharedPriorities;
            saveChannels();
            return "Successfully added \"" + channel + "\" with priority: " + priority;
        }
        return "Missing parameter: channel";
    },
    "!removestreamer": function(params) {
        var channel = params[1];
        if(channel) {
            channel = channel.toLowerCase();
            if(channels[channel]) {
                var priority = channels[channel];
                priorities[priority].splice(priorities[priority].indexOf(channel), 1);
                delete channels[channel];
                saveChannels();
                return "Successfully removed \"" + channel + "\"";
            }
            return channel + " is not on the channel list";
        }
        return "Missing parameter: channel";
    },
    "!listpriorities": function(params) {
        var priority = params[1];
        if(priority) {
            priority = parseInt(priority);
            if(priorities[priority]) {
                return priorities[priority].join(", ");
            }
            return "No channels listed under priority: " + priority;
        }
        return "Missing parameter: priority";
    }
};

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

function pickPrioritizedChannel(callback) {
    var allChannels = Object.keys(channels);
    var parameters = [
        'channel=' + allChannels.join(","),
        'limit=100',
        'stream_type=live',
        'client_id=' + clientId
    ];
    request('https://api.twitch.tv/kraken/streams?' + parameters.join("&"), callback);
}

function hostNewChannel() {
    var liveChannels = [];
    pickPrioritizedChannel(function(error, response, body) {
        body = JSON.parse(body);
        if(body.streams && body.streams.length > 0) {
            _.each(body.streams, function(data) {
                var channelName = data.channel.name;
                liveChannels.push(channelName);
            });
            if(liveChannels.length > 0) {
                // TODO: Sort through priorities of channels.
                // Host top-prioritized channel or pick random of top prioritized channels if multiple
                return;
            }
        }
       startTimer(300000);
    });
}

function startTimer(delay) {
    interval = setInterval(function () {
        hostNewChannel();
        clearInterval(interval);
    }, delay);
}

loadChannels(function(data) {
    channels = data;
    _.each(channels, function(priority, channel) {
        if(!priorities[priority]) {
            priorities[priority] = [];
        }
        priorities[priority].push(channel);
    });
});

client.connect();
client.on('chat', function(channel, user, msg, isSelf) {
    if(!isSelf && admins.indexOf(user.username) !== -1) {
        var split = msg.split(" ");
        var command = split[0];
        if(commands[command]) {
            var params = split.splice(1);
            client.say(channel, user["display-name"] + " - " + commands[command](params) + ".");
        }
    }
});

client.on('notice', function(channel, id, message) {
    if(id === 'host_target_went_offline') {
        hostNewChannel();
    }
});

client.on('unhost', function() {
    hostNewChannel();
});
