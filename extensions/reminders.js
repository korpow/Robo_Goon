const { format } = require('fecha');
const SEC = 1000, MIN = 60 * SEC, HOUR = 60 * MIN, DAY = 24 * HOUR, WEEK = 7 * DAY, YEAR = 365 * DAY;
const activeTimeouts = {};

exports.Init = (botClient) => {
  CheckForUpcoming(botClient);
  // check every 5 minutes for reminders to queue
  setInterval(() => {
    CheckForUpcoming(botClient);
  }, 5 * MIN);
};

exports.commands = {
  remindme: RemindmeCommand,
  remindrole: RemindroleCommand,
};

function RemindmeCommand(botClient, message, args) {
  // todo: add count, help, list, and forget arguments
  if (args.length < 2) {
    message.channel.send(`Usage **${botClient.config.prefix}remindme** [how long: 4h20m / timestamp] *thing to remember*`);
    return;
  }
  SaveReminder(botClient, message.channel, args[0], `<@!${message.author.id}>`, args.slice(1).join(' '));
}

function RemindroleCommand(botClient, message, args) {
  // todo: add count, help, list, and forget arguments
  if (args.length < 3) {
    message.channel.send(`Usage **${botClient.config.prefix}remindrole** [@Role or role] [how long: 4h20m / timestamp] *thing to remember*`);
    return;
  }
  let roleMention;
  if (args[0].startsWith('<@&')) { // mentions are the id https://docs.discord.club/embedg/reference/mentions
    roleMention = args[0];
  }
  else {
    let foundRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === args[0].toLowerCase());
    if (!foundRole) {
      message.channel.send(`Role lookup failed.`);
      return;
    }
    roleMention = `<@&${foundRole.id}>`;
  }
  SaveReminder(botClient, message.channel, args[1], roleMention, args.slice(2).join(' '), `<@!${message.author.id}>`);
}

function SaveReminder(botClient, channel, remindWhen, remindWho, remindWhat, remindFrom = null) {
  let remindMilli;
  // if any symbols or spaces try Date() to parse absolute time, works best with ISO 8601
  // will also accept stuff like '02/22/2022@02:22:22 PM EDT' or YYYY-MM-DD
  if (/\W/.test(remindWhen)) {
    remindMilli = new Date(remindWhen).getTime();
    if (isNaN(remindMilli)) {
      channel.send(`Absolute timestamp \`${remindWhen}\` is invalid.`);
      return;
    }
    else if (remindMilli < new Date().getTime()) {
      channel.send(`Absolute timestamp \`${remindWhen}\` seems to be ${((new Date().getTime() - remindMilli) / YEAR).toFixed(2)} years in the past.`);
      return;
    }
  }
  else {
    // parse relative time
    remindMilli = new Date().getTime();
    const relativeArr = remindWhen.toLowerCase().match(/[0-9]+[a-z]/g);
    if (!relativeArr) {
      channel.send(`Relative date format invalid.`);
      return;
    }
    for (const timeSpan of relativeArr) {
      switch (timeSpan.slice(-1)) {
        case 'y':
          remindMilli += parseInt(timeSpan) * YEAR;
          break;
        case 'w':
          remindMilli += parseInt(timeSpan) * WEEK;
          break;
        case 'd':
          remindMilli += parseInt(timeSpan) * DAY;
          break;
        case 'h':
          remindMilli += parseInt(timeSpan) * HOUR;
          break;
        case 'm':
          remindMilli += parseInt(timeSpan) * MIN;
          break;
        case 's':
          remindMilli += parseInt(timeSpan) * SEC;
          break;
        default:
          channel.send(`Relative date format invalid.`);
          return;
      }
    }
  }

  // add new reminder to the list
  const nextId = Math.max(...botClient.config.reminders.map(r => r.id), 0) + 1;
  botClient.config.reminders.push(
    {
      id: nextId,
      time: remindMilli,
      channel: channel.id,
      for: remindWho,
      from: remindFrom,
      content: remindWhat
    }
  );
  botClient.SaveConfig();

  // if it is coming up soon queue it without delay
  if (remindMilli - new Date().getTime() < 12 * MIN) {
    activeTimeouts[nextId] = setTimeout(() => {
      channel.send(`:outbox_tray: ${remindWho}${(remindFrom) ? `(${remindFrom})` : ''} ${remindWhat}`);
      DeleteReminder(botClient, nextId);
    }, Math.max(remindMilli - new Date().getTime(), 500));
  }

  const remindDate = new Date(remindMilli);
  const timeZoneShort = remindDate.toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];
  channel.send(`:inbox_tray: reminder #${nextId} set for ${format(remindDate, 'dddd, MMMM Do YYYY, h:mm:ssa')} **${timeZoneShort}**`);
}

function CheckForUpcoming(botClient) {
  const poppingSoon = botClient.config.reminders.filter(r => r.time < new Date().getTime() + (6 * MIN));
  for (const reminder of poppingSoon) { // could cause ratelimiting if we ever have a large 0 delay backlog
    if (!activeTimeouts[reminder.id]) {
      activeTimeouts[reminder.id] = setTimeout(() => {
        botClient.channels.fetch(reminder.channel).then(channel => channel.send(`:outbox_tray: ${reminder.for}${(reminder.from) ? `(${reminder.from})` : ''} ${reminder.content}`));
        DeleteReminder(botClient, reminder.id);
      }, Math.max(reminder.time - new Date().getTime(), 0));
    }
  }
}

function DeleteReminder(botClient, reminderId) {
  delete activeTimeouts[reminderId];
  botClient.config.reminders.splice(botClient.config.reminders.findIndex(r => r.id === reminderId), 1);
  botClient.SaveConfig();
}
