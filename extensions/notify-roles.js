exports.commands = {
  noto: NotoCommand
};

function NotoCommand(botClient, message, args) {
  if (args.length < 1) {
    message.channel.send(`Command \`${botClient.config.prefix}noto\` requires an argument: help, list, join, leave, add, del`)
  }
  switch (args[0]) {
    case "help":
      message.channel.send(`Command: ${botClient.config.prefix}noto [arg] {options} - notification squad self role management\`\`\`help         - This text\nlist         - List currently available notification roles\njoin {role}  - Get added to a noto role\nleave {role} - Remove an assigned noto role\nadd {@role} - Add a role to the available list (${botClient.config.botAdminRole} only)\ndel {role}   - Remove a role from the list (${botClient.config.botAdminRole} only)\`\`\``);
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
