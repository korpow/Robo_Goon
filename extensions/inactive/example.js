// optional: called when the user types {prefix}examplecommand in chat
exports.commands = {
  examplecommand: (botClient, message, args) => {}
};

// optional: called during botClient message events if in a guild channel, not from a bot, and not a command
exports.OnMessage = (botClient, message) => {}

// optional: added to an event called after all extensions are loaded
exports.Init = (botClient) => {}
