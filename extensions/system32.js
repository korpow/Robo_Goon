exports.commands = {
  help: HelpCommand,
  reload: ReloadCommand,
  terminate: KillCommand
};

function HelpCommand(botClient, message) {
  message.channel.send(`Commands: ${Object.keys(botClient.commands).sort().join(', ')}`);
}

function ReloadCommand(botClient, message) {
  if (!(message.member.roles.cache.some(role => role.name === botClient.config.botAdminRole) || message.member.permissions.has('ADMINISTRATOR'))) {
    message.channel.send(`:no_entry: Sorry you do not have permission to do that. I live on.`)
    return;
  }
  botClient.LoadConfig();
  message.channel.send("Reload complete.");
}

function KillCommand(botClient, message) {
  if (!(message.member.roles.cache.some(role => role.name === botClient.config.botAdminRole) || message.member.permissions.has('ADMINISTRATOR'))) {
    message.channel.send(`:no_entry: Sorry you do not have permission to do that. I live on.`)
    return;
  }
  console.warn(`Got kill/terminate command from ${message.author.tag}`);
  process.exit();
}