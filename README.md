# A Discord.js based bot for all your automatic henchmen needs.

## Download
```sh
git clone git@github.com:korpow/robo-goon.git
cd robo-goon
npm i
```

## Set Bot Token
If you do not have a token learn about how to get one [here](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)

Create a `secrets.json` file in the root of your clone next to `main.js` and paste your token in the following format
```json
{
  "token": "Your Token Here"
}
```


## Test
Make sure the modules and token are working, also generates `config.json`
```sh
node main.js
```

## Configure
Edit `config.json` as you see fit:
```js
{
  "prefix": ".",                  // Command prefix character i.e. ".help"
  "botSelfRole": "Robogoon",      // Name of the bots role
  "botAdminRole": "Robomin",      // Name of the role that can run admin commands. Guild ADMINISTRATORS bypass this
  "missingCommandReply": true,    // When true always responds to the the prefix
  "handevalIterations": 100000,   // For holdem-odds: tune the max allowed hand simulations
  "notoRoles": {},                // Simple Storage for an extension, populated programatically
  "customCommands": {},           // "
  "reminders": []                 // "
}
```
## Run It
```sh
npm start
```
