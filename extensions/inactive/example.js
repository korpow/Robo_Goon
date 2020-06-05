// optional: called when the user types {prefix}examplecommand in chat
exports.commands = {
  examplecommand: (botClient, message, args) => {}
};

// optional: called during message event for any in a guild channel and not from a bot, borderline unnecessary
exports.OnMessage = (botClient, message) => {}

// optional: added to an event called after all extensions are loaded can directly listen to botClient events
exports.Init = (botClient) => {}
