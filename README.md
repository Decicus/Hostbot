# Hostbot
This is a simple hostbot that will automatically host a list of given channels, randomly, when they go online. It will keep hosting a channel until it goes offline and then re-host a new channel afterwards.

## Installation
- Install [node and npm](https://nodejs.org/)
- Install dependencies using `npm install` in the directory of package.json
- Rename `config.sample.js` to `config.js` and edit the info of `config.js`
- Launch bot with `node app.js`

## License
[MIT License](LICENSE)

## Notes
- The channel used for hosting is always the first index in `config.tmi.channels`. This way you can specify which channel to host with, but still allow use of commands in different channels.
    - If no channels are specified in `config.tmi.channels` then it will default back to the username.
