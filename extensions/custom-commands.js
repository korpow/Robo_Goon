exports.Init = (botClient) => {
  Object.keys(botClient.config.customCommands).forEach(custCommand => {
    if (!botClient.commands[custCommand]) {
      botClient.commands[custCommand] = (botClient, message) => {
        message.channel.send(botClient.config.customCommands[custCommand]);
      };
    }
    else {
      console.warn(`Skipping loading custom command '${custCommand}' as it would conflict with a loaded extension.`);
    }
  });
};

exports.commands = {
  cc: CustomCommandsCommand
};

function CustomCommandsCommand(botClient, message, args) {
  if (args.length < 1) {
    message.channel.send(`Command \`${botClient.config.prefix}cc\` requires an argument: help, list, add, update, del`);
    return;
  }
  else if (message.mentions.everyone || message.mentions.roles.size > 0 || message.mentions.users.size > 0){
    message.channel.send(`Sorry custom commands only support #channel mentions.`);
    return;
  }

  switch (args[0].toLowerCase()) {
    case "help":
      message.channel.send(`Command cc help: ${botClient.config.prefix}cc [arg] {options} - custom commands management\`\`\`help                     - This text\nlist                     - List current custom commands\nadd {command} {reply}    - Add a new custom command\nupdate {command} {reply} - Update an existing custom command\ndel {command}            - Remove a custom command\`\`\``);
      break;

    case "list":
      message.channel.send(`Custom commands list: ${(Object.keys(botClient.config.customCommands).length < 1) ? "There are no custom commands 😢" : Object.keys(botClient.config.customCommands).sort().join(', ')}`);
      break;

    case "add":
      if (args.length < 3) {
        message.channel.send(`Arg __add__ requires parameters: command name, reply`);
        break;
      }
      args[1] = args[1].toLowerCase();
      if (botClient.commands[args[1]]) {
        message.channel.send(`A **${args[1]}** command already exists.`);
        break;
      }
      botClient.config.customCommands[args[1]] = args.slice(2).join(' ');
      botClient.SaveConfig();
      botClient.commands[args[1]] = (botClient, message) => {
        message.channel.send(args.slice(2).join(' '));
      };
      message.channel.send(`Custom command **${args[1]}** created.`);
      break;

    case "update":
      if (args.length < 3) {
        message.channel.send(`Arg __update__ requires parameters: command name, reply`);
        break;
      }
      args[1] = args[1].toLowerCase();
      if (!botClient.config.customCommands[args[1]]) {
        message.channel.send(`Custom command **${args[1]}** does not exist.`);
        break;
      }
      botClient.config.customCommands[args[1]] = args.slice(2).join(' ');
      botClient.SaveConfig();
      botClient.commands[args[1]] = (botClient, message) => {
        message.channel.send(args.slice(2).join(' '));
      };
      message.channel.send(`Custom command **${args[1]}** updated.`);
      break;

    case "del":
      if (args.length < 2) {
        message.channel.send(`Arg __del__ requires parameter: command name`);
        break;
      }
      args[1] = args[1].toLowerCase();
      if (!botClient.config.customCommands[args[1]]) {
        message.channel.send(`Custom command **${args[1]}** does not exist.`);
        break;
      }
      delete botClient.config.customCommands[args[1]];
      botClient.SaveConfig();
      delete botClient.commands[args[1]];
      message.channel.send(`Custom command **${args[1]}** deleted.`);
      break;
  }
}
