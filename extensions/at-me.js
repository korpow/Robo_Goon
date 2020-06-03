const atBotAnswers = [
  "Beep.",
  "All systems nominal.",
  "Hi!",
  "I am fully functional.",
  ":robot: Robo Goon online.",
  "I need a drink."
];

exports.onmessage = (botClient, message) => {
  if (message.mentions.users.has(botClient.user.id)) { //@ the bot
    message.channel.send(`${atBotAnswers[Math.floor(Math.random() * atBotAnswers.length)]}`);
  }
}
