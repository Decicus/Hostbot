# Hostbot
This is a simple hostbot that will automatically host a list of given channels, randomly, when they go online. It will keep hosting a channel until it goes offline and then re-host a new channel afterwards.

## Features
- Continuous hosting of channels per the priority list. Once a channel goes offline, it will automatically attempt to find a new live channel to host following the priorities in the priority list.
- Priority levels go from highest number to lowest. If no priority is specified when a channel is added, then the priority will be 0.
- Each priority level can contain either one or multiple channels.
    - If the highest priority level with live channels have multiple channels currently live, it will pick a random live channel from the specific priority level.

## Commands
Commands, by default, all require the users that wish to use it to be an 'admin'. Admins are specified in the `config.admins` array.

The format of commands will be `<required parameter>` and `[optional parameter]`. The rest are static keywords.

- `!addstreamer <channel name> [priority]` - Adds a streamer to the list of channels to be hosted. `[priority]` can be any number, but if it's not specified it defaults to 0.
    - If a streamer is already added, this will update their `priority`.
- `!removestreamer <channel name>` - Removes a streamer from the list of channels to be hosted.
- `!listpriorities <priority>` - Lists what channels are listed under `<priority>`, if any.
- `!host` - Hosts a new channel by sorting through the priorities, regardless if any channel is being hosted or not.
- `!rehost` - An alias of `!host`.
- `!status` - Replies with who is currently being hosted, if anyone.
- `!quit` - **WARNING**: This will *quit* the application completely and requires it to be restarted for commands/hosting to function if used.

## Installation
- Install [node and npm](https://nodejs.org/)
- Install dependencies using `npm install` in the directory of the project.
- Rename `config.sample.js` to `config.js` and edit the info of `config.js`
    - Generally speaking, you only need to modify `username` & `password` inside `config.tmi`, as well as `channels` for auto-connecting channels.
    - If the bot doesn't seem to receive/respond to messages, make sure you're on the right [chat cluster](https://discuss.dev.twitch.tv/t/psa-chat-servers-are-going-to-migrate-to-aws-ec2-servers/4877/107).
    - `clientId` requires a [Twitch developer application](https://secure.twitch.tv/settings/connections) - This isn't necessary for the time being, but is still highly recommended.
- Launch bot with `node app.js`

## License
[MIT License](LICENSE)

## Notes
- The channel used for hosting is always the first index in `config.tmi.channels`. This way you can specify which channel to host with, but still allow use of commands in different channels.
    - If no channels are specified in `config.tmi.channels` then it will default back to the username. This channel will also be automatically joined on startup if no other channels are specified in `config.tmi.channels`.
