console.log('Bot starting.')

const Discord = require("discord.js");
const fs = require("fs");
const events = require("events");
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
  missingCommandReply: true,
  githubLogUrl: "",
  notoRoles: {},
  customCommands: {}
};

botClient.commands = {};
botClient.IsBotAdmin = (member) => {
  return member.roles.cache.some(role => role.name === botClient.config.botAdminRole) || member.permissions.has('MANAGE_GUILD');
};
botClient.SaveConfig = () => {
  fs.writeFile('config.json', JSON.stringify(botClient.config, null, 2), (err) => {
    if (err) throw err;
  });
};
botClient.LoadConfig = () => {
  fs.readFile('config.json', (err, data) => {
    if (err) {
      console.error(err);
    }
    else {
      Object.assign(botClient.config, JSON.parse(data));
    }
  });
};
// initially load config syncronosly so it is available for extension Init
try {
  Object.assign(botClient.config, JSON.parse(fs.readFileSync('config.json')));
}
catch {
  console.warn(`config.json is missing, creating now.`);
  botClient.SaveConfig();
}

fs.readdir('./extensions/', (err, files) => {
  if (err) console.error(err);
  files = files.filter(f => f.endsWith('.js'));
  console.log(`Found ${files.length} extensions.`);
  files.forEach(f => {
    let ext = require(`./extensions/${f}`);
    console.log(`Loading: ${f}`);
    if (ext.commands) {
      if (Object.keys(botClient.commands).some(key => Object.keys(ext.commands).includes(key))) {
        console.error(`Extension ${f} has conflicting commands. Skipping.`);
      }
      else {
        Object.assign(botClient.commands, ext.commands);
      }
    }
    if (ext.OnMessage) {
      botEvents.on('onMessage', ext.OnMessage);
    }
    if (ext.Init) {
      botEvents.on('extInit', ext.Init);
    }
  });
  botEvents.emit('extInit', botClient);
  console.log(`Extension loading complete!`);
});

botClient.on('ready', () => {
  console.log(`Bot client connection ready!`);
});

botClient.on('guildCreate', (guild) => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

botClient.on('guildDelete', (guild) => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

botClient.on('message', (message) => {
  // don't listen to bots, or DMs
  if (message.author.bot || message.channel.type === 'dm')
    return;
  // check for command prefix
  if (typeof(botClient.config.prefix) !== 'string' || message.content.indexOf(botClient.config.prefix) !== 0) {
    // send normal messages to all extensions that care
    botEvents.emit('onMessage', botClient, message);
  }
  else {
    // command get, parse and execute if it exists
    if (message.content.length === 1 || message.content.charAt(1) === botClient.config.prefix) {
      return; // do nothing if just the prefix or it is repeated
    }

    let command = '';
    let args = [];
    if (message.content.split(' ').length > 1) {
      command = message.content.split(' ')[0].substring(botClient.config.prefix.length).toLowerCase();
      args = ParseArgs(message.content.substring(message.content.indexOf(' ') + 1));
    }
    else {
      command = message.content.substring(botClient.config.prefix.length).toLowerCase();
    }

    if (botClient.commands[command]) {
      botClient.commands[command](botClient, message, args);
    }
    else if (botClient.config.missingCommandReply) {
      message.channel.send(`Command: \`${botClient.config.prefix}${command}\` not found.`);
    }
  }
});

botClient.login(secrets.token);
