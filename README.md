## **Note:** This project is no longer being maintained.

# Hostbot
This is a simple hostbot that will automatically host a list of given channels, sorted by their priorities, when they go online. It will keep hosting a channel until it goes offline and then re-host a new channel afterwards.

## Features
- Continuous hosting of channels per the priority list. Once a channel goes offline, it will automatically attempt to find a new live channel to host following the priorities in the priority list.
    - Due to the Twitch API sometimes being a bit slow on updating "live" status of a stream, the automatic rehost will trigger 15 seconds after a host has ended due to the channel going offline.
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
- `!unhost` - Unhosts the current channel.
    - **NOTE**: Due to the way the bot detects unhosting of channels, this will automatically trigger a rehost if a prioritized channel is live. This is only really useful if you've removed a streamer from the priority list and wish to unhost when no one else is live on the priority list.
- `!status` - Replies with who is currently being hosted, if anyone.
- `!quit` - **WARNING**: This will *quit* the application completely and requires it to be restarted for commands/hosting to function if used.

## Installation
- Install [node and npm](https://nodejs.org/)
- Install dependencies using `npm install` in the directory of the project.
- Rename `config.sample.js` to `config.js` and edit the info of `config.js`
    - Generally speaking, you only need to modify `username` & `password` inside `config.tmi`, as well as `channels` for auto-connecting channels.
    - If the bot doesn't seem to receive/respond to messages, make sure you're on the right [chat cluster](https://discuss.dev.twitch.tv/t/psa-chat-servers-are-going-to-migrate-to-aws-ec2-servers/4877/107).
    - `clientId` requires a [Twitch developer application](https://secure.twitch.tv/settings/connections) - As of September 2016, the [client ID is **now required** for all API requests](https://blog.twitch.tv/client-id-required-for-kraken-api-calls-afbb8e95f843#.m73g3zxx9), which also affects this.
- Launch bot with `node app.js`

## License
[MIT License](LICENSE)

## Notes
- The channel used for hosting is always the first index in `config.tmi.channels`. This way you can specify which channel to host with, but still allow use of commands in different channels.
    - If no channels are specified in `config.tmi.channels` then it will default back to the username. This channel will also be automatically joined on startup if no other channels are specified in `config.tmi.channels`.

## Changelog
### Version 0.1.1:
- Hotfix for crash when the bot attempts to check hosts.

### Version 0.1.0:
- Modified how hosts are retrieved.
- Added workaround for host notifications not properly working.

### Version 0.0.2.1:
- Automatic rehosting's delay has been updated from 15 seconds to 120 seconds (2 minutes), as the Twitch API seems extremely slow when it comes to updating at times.

### Version 0.0.2:
- Automatic rehosting when the channel that was hosted goes offline is now delayed with 15 seconds, due to the fact the Twitch API isn't instant on updating live status.

### Version 0.0.1:
- Initial release.
