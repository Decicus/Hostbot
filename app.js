var tmi = require('tmi.js');
var request = require('request');
var config = require('./config.js');
var fs = require('fs');

var client = new tmi.client(config.tmi);
var admins = config.admins;
var channelsFile = config.channelsFile;
var channels = {};
var priorities = {};

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
                return "Successfully removed \"" + channel + "\"";
            }
            return channel + " is not on the channel list";
        }
        return "Missing parameter: channel";
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

loadChannels(function(data) {
    channels = data;
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
