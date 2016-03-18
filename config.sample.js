var config = {};

config.tmi = {
    options: {
        debug: false
    },
    connection: {
        cluster: "chat",
        reconnect: true
    },
    identity: {
        username: 'decicus',
        password: 'oauth:YOUR_OAUTH_HERE'
    },
    channels: ["#decicus"]
};

config.admins = ['decicus'];

config.channelsFile = './channels.json';

module.exports = config;
