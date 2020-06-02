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
  console.log(`Extension loading complete.`);
  botEvents.emit('extLateInit', botClient);
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

  // check for command prefix
  if (message.content.indexOf(botClient.config.prefix) !== 0) {
    botEvents.emit('onMessage', botClient, message);
  } else {
    let command = '';
    let args = [];
    // parse command and args if prefix present 
    if (message.content.split(' ').length > 1) {
      command = message.content.split(' ')[0].substring(1);
      args = ParseArgs(message.content.substring(message.content.indexOf(' ') + 1));
    }
    else {
      command = message.content.substring(1);
    }

    if (command === "reload") {
      botClient.LoadConfig();
      message.channel.send("Reload complete.");
    }

    if (message.channel.type === 'dm') {
      return;
    }
    if (botClient.commands[command]) {
      botClient.commands[command](botClient, message, args);
    }
    if (command === "help") {
      message.channel.send(`Commands: noto`);
    }

    if (command === "noto") {
      if (args.length < 1) {
        message.channel.send(`Command \`${botClient.config.prefix}${command}\` requires an argument: help, list, join, leave, add, del`)
      }
      switch (args[0]) {
        case "help":
          message.channel.send(`Command: ${botClient.config.prefix}${command} [arg] {options} - notification squad self role management\`\`\`help         - This text\nlist         - List currently available notification roles\njoin {role}  - Get added to a noto role\nleave {role} - Remove an assigned noto role\nadd {@role} - Add a role to the available list (${botClient.config.botAdminRole} only)\ndel {role}   - Remove a role from the list (${botClient.config.botAdminRole} only)\`\`\``);
          break;

        case "list":
          message.channel.send(`Active Notification Roles: ${(Object.keys(botClient.config.notoRoles).length < 1) ? "None 😢" : Object.keys(botClient.config.notoRoles).sort().join(", ")}`);
          break;

        case "join":
          if (args.length < 2) {
            message.channel.send(`Argument missing - Role name. Active Noto Roles: ${(Object.keys(botClient.config.notoRoles).length < 1) ? "None 😢" : Object.keys(botClient.config.notoRoles).sort().join(", ")}`);
            break;
          }
          if (botClient.config.notoRoles[args[1].toLowerCase()]) {
            message.member.roles.add(botClient.config.notoRoles[args[1].toLowerCase()]).then(() => {
              message.channel.send(`Notification Role \`${args[1].toLowerCase()}\` assigned.`);
            }).catch((err) => {
              console.error(err);
              message.channel.send(`:warning: Error: ${err.message} - member role assign failed.`);
            });
          }
          else {
            message.channel.send(`Noto Role \`${args[1]}\` not found. No changes made.`);
          }
          break;

        case "leave":
          if (args.length < 2) {
            message.channel.send(`Argument missing - Role name. Active Noto Roles: ${(Object.keys(botClient.config.notoRoles).length < 1) ? "None 😢" : Object.keys(botClient.config.notoRoles).sort().join(", ")}`);
            break;
          }
          if (botClient.config.notoRoles[args[1].toLowerCase()]) {
            message.member.roles.remove(botClient.config.notoRoles[args[1].toLowerCase()]).then(() => {
              message.channel.send(`Notification Role \`${args[1].toLowerCase()}\` removed.`)
            }).catch((err) => {
              console.error(err);
              message.channel.send(`:warning: Error: ${err.message} - member role removal failed.`);
            });
          }
          else {
            message.channel.send(`Noto Role \`${args[1]}\` not found. No changes made.`);
          }
          break;

        case "add":
          if (!(message.member.roles.cache.some(role => role.name === botClient.config.botAdminRole) || message.member.permissions.has('ADMINISTRATOR'))) {
            message.channel.send(`:no_entry: Sorry this command requires the \`${botClient.config.botAdminRole}\` role.`)
            break;
          }
          if (message.mentions.roles.size < 1) {
            message.channel.send(`Argument missing - @Role Mention`);
            break;
          }

          let myRole = message.guild.roles.cache.find(role => role.name === botClient.config.botSelfRole);
          let newNotoRole = message.mentions.roles.first();
          if (newNotoRole.position >= myRole.position) {
            message.channel.send(`:robot: Role \`${newNotoRole.name.toLowerCase()}\` must be below **${botClient.config.botSelfRole}** before I can manage it.`);
            break;
          }

          if (!botClient.config.notoRoles[newNotoRole.name.toLowerCase()]) {
            botClient.config.notoRoles[newNotoRole.name.toLowerCase()] = newNotoRole.id;
            botClient.SaveConfig();
            message.channel.send(`Role \`${newNotoRole.name.toLowerCase()}\` has been added to available Noto Roles.`);
          }
          else {
            message.channel.send(`A \`${newNotoRole.name.toLowerCase()}\` Noto Role already exists please delete first if you wish to change the id.`);
          }
          break;

        case "del":
          if (!(message.member.roles.cache.some(role => role.name === botClient.config.botAdminRole) || message.member.permissions.has('ADMINISTRATOR'))) {
            message.channel.send(`:no_entry: Sorry this command requires the \`${botClient.config.botAdminRole}\` role.`)
            break;
          }
          if (args.length < 2) {
            message.channel.send(`Argument missing - Role name`);
            break;
          }
          if (botClient.config.notoRoles[args[1].toLowerCase()]) {
            delete botClient.config.notoRoles[args[1].toLowerCase()]
            botClient.SaveConfig();
            message.channel.send(`Noto Role \`${args[1].toLowerCase()}\` has been removed from available Noto Roles`);
          }
          else {
            message.channel.send(`Noto Role \`${args[1].toLowerCase()}\` does not exist`);
          }
          break;
      }
    }

  }
});

botClient.login(secrets.token);