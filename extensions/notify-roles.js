exports.commands = {
  noto: NotoCommand
};

function NotoCommand(botClient, message, args) {
  if (args.length < 1) {
    message.channel.send(`Command \`${botClient.config.prefix}noto\` requires an argument: help, list, join, leave, add, del`);
    return;
  }
  let foundNoto;
  switch (args[0]) {
    case "help":
      message.channel.send(`noto command help: ${botClient.config.prefix}noto [arg] {options} - notification squad self role management\`\`\`help         - This text\nlist         - List currently available notification roles\njoin {role}  - Get added to a noto role\nleave {role} - Remove an assigned noto role\nadd {@role} - Add a role to the available list (${botClient.config.botAdminRole} only)\ndel {role}   - Remove a role from the list (${botClient.config.botAdminRole} only)\`\`\``);
      break;

    case "list":
      message.channel.send(`Notification Roles List: ${(Object.keys(botClient.config.notoRoles).length < 1) ? "None 😢" : Object.keys(botClient.config.notoRoles).sort().join(", ")}`);
      break;

    case "join":
      if (args.length < 2) {
        message.channel.send(`Argument missing - Role name. Joinable Noto Roles: ${(Object.keys(botClient.config.notoRoles).length < 1) ? "None 😢" : Object.keys(botClient.config.notoRoles).sort().join(", ")}`);
        break;
      }
      foundNoto = Object.keys(botClient.config.notoRoles).find(role => role.toLowerCase() === args[1].toLowerCase());
      if (foundNoto) {
        message.member.roles.add(botClient.config.notoRoles[foundNoto]).then(() => {
          message.channel.send(`Notification Role **${foundNoto}** has been assigned.`);
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
      foundNoto = Object.keys(botClient.config.notoRoles).find(role => role.toLowerCase() === args[1].toLowerCase());
      if (foundNoto) {
        message.member.roles.remove(botClient.config.notoRoles[foundNoto]).then(() => {
          message.channel.send(`Notification Role **${foundNoto}** has been unassignd.`)
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
      if (!botClient.IsBotAdmin(message.member)) {
        message.channel.send(`Sorry you do not have permission to do that.`);
        break;
      }
      if (message.mentions.roles.size < 1) {
        message.channel.send(`Argument missing - @Role Mention`);
        break;
      }

      let myRole = message.guild.roles.cache.find(role => role.name === botClient.config.botSelfRole);
      let newNotoRole = message.mentions.roles.first();
      if (newNotoRole.position >= myRole.position) {
        message.channel.send(`:robot: Role **${newNotoRole.name}** must be below **${botClient.config.botSelfRole}** before I can manage it.`);
        break;
      }

      foundNoto = Object.keys(botClient.config.notoRoles).find(role => role.toLowerCase() === newNotoRole.name.toLowerCase());
      if (!foundNoto) {
        botClient.config.notoRoles[newNotoRole.name] = newNotoRole.id;
        botClient.SaveConfig();
        message.channel.send(`Role **${newNotoRole.name}** has been added to the list.`);
      }
      else {
        message.channel.send(`A **${newNotoRole.name}** Noto Role already exists please delete first if you wish to change the id.`);
      }
      break;

    case "del":
      if (!botClient.IsBotAdmin(message.member)) {
        message.channel.send(`Sorry you do not have permission to do that.`);
        break;
      }
      if (args.length < 2) {
        message.channel.send(`Argument missing - Role name`);
        break;
      }
      foundNoto = Object.keys(botClient.config.notoRoles).find(role => role.toLowerCase() === args[1].toLowerCase());
      if (foundNoto) {
        delete botClient.config.notoRoles[foundNoto];
        botClient.SaveConfig();
        message.channel.send(`Noto Role **${foundNoto}** has been removed from the list.`);
      }
      else {
        message.channel.send(`Noto Role \`${args[1]}\` does not exist`);
      }
      break;
  }
}
