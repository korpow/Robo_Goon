console.log('Bot starting.')

const Discord = require("discord.js");
const fs = require('fs');

const secrets = require("./secrets.json");
// secrets.token contains the bot's token
var config = {
  prefix: ".",
  notoRoles: {}
};

LoadDiscordBotConfig();

function LoadDiscordBotConfig() {
  fs.readFile('config.json', (err, data) => {
    if (err) {
      SaveDiscordBotConfig();
    }
    else {
      config = JSON.parse(data);
    }
  });
}

function SaveDiscordBotConfig() {
  fs.writeFile('config.json', JSON.stringify(config), (err) => {
    if (err) throw err;
  });
}

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

  // get the channel
  const channel = message.channel;

  // check for command prefix
  if (message.content.indexOf(config.prefix) !== 0) {
    if (message.mentions.has(botClient.user)) { //@ the bot
      message.channel.send(`Ready for action!`);
    }
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
      LoadDiscordBotConfig();
      message.channel.send("Reload complete.");
    }

    if (message.channel.type === 'dm') {
      return;
    }

    if (command === "help") {
      message.channel.send(`Commands: noto`);
    }

    if (command === "noto") {
      if (args.length < 1) {
        message.channel.send(`Command \`${config.prefix}${command}\` requires an argument: help, list, join, leave, add, del`)
      }
      switch (args[0]) {
        case "help":
          message.channel.send(`Command: ${config.prefix}${command} [arg] {options} - notification squad self role management\`\`\`help         - This text\nlist         - List currently available notification roles\njoin {role}  - Get added to a noto role\nleave {role} - Remove an assigned noto role\nadd {roleid} - Add a role to the available list (robomin only)\ndel {role}   - Remove a role from the list (robomin only)\`\`\``);
          break;

        case "list":
          message.channel.send(`Active Notification Roles: ${(Object.keys(config.notoRoles).length < 1) ? "None 😢" : Object.keys(config.notoRoles).join(", ")}`);
          break;

        case "join":
          if (args.length < 2) {
            message.channel.send(`Argument missing - Role name. Active Noto Roles: ${(Object.keys(config.notoRoles).length < 1) ? "None 😢" : Object.keys(config.notoRoles).join(", ")}`);
            break;
          }
          if (config.notoRoles[args[1].toLowerCase()]) {
            message.member.roles.add(config.notoRoles[args[1].toLowerCase()]).catch(console.error);
            message.channel.send(`Notification Role \`${args[1].toLowerCase()}\` assigned.`)
          }
          else {
            message.channel.send(`Noto Role \`${args[1]}\` not found. No changes made.`);
          }
          break;

        case "leave":
          if (args.length < 2) {
            message.channel.send(`Argument missing - Role name. Active Noto Roles: ${(Object.keys(config.notoRoles).length < 1) ? "None 😢" : Object.keys(config.notoRoles).join(", ")}`);
            break;
          }
          if (config.notoRoles[args[1].toLowerCase()]) {
            message.member.roles.remove(config.notoRoles[args[1].toLowerCase()]).catch(console.error);
            message.channel.send(`Notification Role \`${args[1].toLowerCase()}\` removed.`)
          }
          else {
            message.channel.send(`Noto Role \`${args[1]}\` not found. No changes made.`);
          }
          break;

        case "add":
          if (!(message.member.roles.cache.some(role => role.name === "Robomin") || message.member.permissions.has('ADMINISTRATOR'))) {
            message.channel.send(`Sorry this command requires the \`Robomin\` role.`)
            break;
          }
          if (args.length < 2) {
            message.channel.send(`Argument missing - roleid`);
            break;
          }
          let foundRole = await message.guild.roles.fetch(args[1]);
          if (!foundRole) {
            message.channel.send(`Unable to lookup roleid, please try again.`);
            break;
          }
          if (!config.notoRoles[foundRole.name.toLowerCase()]) {
            config.notoRoles[foundRole.name.toLowerCase()] = foundRole.id;
            SaveDiscordBotConfig();
            message.channel.send(`Role \`${foundRole.name.toLowerCase()}\` has been added to available Noto Roles`);
          }
          else {
            message.channel.send(`A \`${foundRole.name.toLowerCase()}\` Noto Role already exists please delete first if you wish to change the id`);
          }
          break;

        case "del":
          if (!(message.member.roles.cache.some(role => role.name === "Robomin") || message.member.permissions.has('ADMINISTRATOR'))) {
            message.channel.send(`Sorry this command requires the \`Robomin\` role.`)
            break;
          }
          if (args.length < 2) {
            message.channel.send(`Argument missing - Role name`);
            break;
          }
          if (config.notoRoles[args[1].toLowerCase()]) {
            delete config.notoRoles[args[1].toLowerCase()]
            SaveDiscordBotConfig();
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