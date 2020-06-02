console.log('Bot starting.')

const Discord = require("discord.js");
const fs = require('fs');
const events = require('events');
class BotEvents extends events { }
const botEvents = new BotEvents;
const secrets = require("./secrets.json");
// secrets.token contains the bot's token

function ParseArgs(argsString) {
  return argsString.match(/\\?.|^$/g).reduce((p, c) => {
    if (c === '"') {
      p.quote ^= 1;
    } else if (!p.quote && c === ' ') {
      p.a.push('');
    } else {
      p.a[p.a.length - 1] += c.replace(/\\(.)/, "$1");
    }
    return p;
  }, { a: [''] }).a
}

const botClient = new Discord.Client();

botClient.config = {
  prefix: ".",
  botSelfRole: "Robomin",
  botAdminRole: "Robomin",
  githubLogUrl: "",
  notoRoles: {}
};

botClient.commands = {};
botClient.SaveConfig = () => {
  fs.writeFile('config.json', JSON.stringify(botClient.config), (err) => {
    if (err) throw err;
  });
}
botClient.LoadConfig = () => {
  fs.readFile('config.json', (err, data) => {
    if (err) {
      botClient.SaveConfig();
    }
    else {
      Object.assign(botClient.config, JSON.parse(data));
    }
  });
}
botClient.LoadConfig();

fs.readdir('./extensions/', (err, files) => {
  if (err) console.error(err);
  files = files.filter(f => f.endsWith('.js'));
  console.log(`Found ${files.length} extensions.`);
  files.forEach(f => {
    let ext = require(`./extensions/${f}`);
    console.log(`Loading extension: ${f}`);
    if (ext.commands) {
      if (Object.keys(botClient.commands).some(r => Object.keys(ext.commands).includes(r))) {
        console.error(`Extension ${f} has conflicting commands causing overwrite`);
      }
      Object.assign(botClient.commands, ext.commands);
    }
    if (ext.onmessage) {
      botEvents.on('onMessage', ext.onmessage);
    }
    if (ext.lateinit) {
      botEvents.on('extLateInit', ext.lateinit);
    }
  });
  botEvents.emit('extLateInit', botClient);
  console.log(`Extension loading complete.`);
});

botClient.on("ready", () => {
  console.log(`Bot connected and ready.`);
});

botClient.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

botClient.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

botClient.on("message", async message => {
  // don't reply to bots
  if (message.author.bot)
    return;
  if (message.channel.type === 'dm')
    return;
  // check for command prefix
  if (message.content.indexOf(botClient.config.prefix) !== 0) {
    // send nomal messages to the extensions that care
    botEvents.emit('onMessage', botClient, message);
  } else {
    // we got one, parse command and args
    let command = '';
    let args = [];
    if (message.content.split(' ').length > 1) {
      command = message.content.split(' ')[0].substring(1);
      args = ParseArgs(message.content.substring(message.content.indexOf(' ') + 1));
    }
    else {
      command = message.content.substring(1);
    }

    if (botClient.commands[command]) {
      botClient.commands[command](botClient, message, args);
    }
  }
});

botClient.login(secrets.token);
