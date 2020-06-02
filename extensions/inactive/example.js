exports.commands = {
  examplecommand: (botClient, message, args) => {} // called when the user types {prefix}examplecommand in chat
};

exports.onmessage = (botClient, message) => {} // added to the main onMessage event called for any message in a guild channel and not from a bot

exports.lateinit = (botClient) => {} // added to an event called after all extensions are loaded
