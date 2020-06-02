const atBotAnswers = [
  "Beep.",
  "All systems nominal.",
  "Hi!",
  "I am fully functional.",
  ":robot: Robo Goon online."
];

exports.onmessage = (botClient, message) => {
  if (message.mentions.has(botClient.user)) { //@ the bot
    message.channel.send(`${atBotAnswers[Math.floor(Math.random() * atBotAnswers.length)]}`);
  }
}
