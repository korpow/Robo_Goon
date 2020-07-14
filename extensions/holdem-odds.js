const { fork } = require('child_process');
// poker-odds calculateEquity() is blocking so let it run in a child process
const holdemWorker = fork('extensions/workers/holdem-odds.js');

exports.commands = {
  handeval: HandEvalCommand
};

exports.Init = (botClient) => {
  // processes calculation results and send to the channel they are wanted
  holdemWorker.on('message', async (data) => {
    const results = data.results;
    const channel = await botClient.channels.fetch(data.chanId);
    if (!Array.isArray(results)) {
      // the fork ran into an error calling calculateEquity(), probably bad user input
      channel.stopTyping();
      channel.send(`handeval poker-odds lib exception: ${results}`);
      return;
    }
    const embedReply = {
      title: "Hand: hand [vs hand vs hand]",
      // "description": "```diff\n+ Win    11.11%\n= Tie    22.22%```",
      color: 0x009b0c,
      footer: {
        text: "Total hands played: #count"
      },
      fields: [
        {
          name: "Showdown Rank",
          value: "pair",
          inline: true
        },
        {
          name: "% of the Time",
          value: "21.3%",
          inline: true
        }
      ]
    }
    const playedHands = results[0].count;
    embedReply.footer.text = `Total boards dealt: ${playedHands}`;

    if (results.length === 1) {
      // single hand
      embedReply.title = `Hand: ${results[0].hand.join('')}${(data.board) ? `\nBoard: ${data.board.join('')}` : ''}`;
      embedReply.fields[0].value = results[0].handChances.map(hc => hc.name).join('\n');
      embedReply.fields[1].value = results[0].handChances.map(hc => sigFigs((hc.count / playedHands) * 100, 3)).join('%\n');
      embedReply.fields[1].value += '%';
    }
    else {
      // multiple hands
      let favHand;
      embedReply.fields = [];
      for (hand of results) {
        embedReply.fields.push({
          name: hand.hand.join(''),
          value: `\`\`\`diff\n+ Wins  ${sigFigs((hand.wins / playedHands) * 100, 3)}%\n= Ties  ${sigFigs((hand.ties / playedHands) * 100, 3)}%\`\`\``,
          inline: true
        });
        if (hand.favourite) {
          favHand = hand.hand.join('');
        }
      }
      embedReply.title = `Hands: ${results.map(hand => hand.hand.join('')).join(' vs ')}${(data.board) ? `\nBoard: ${data.board.join('')}` : ''}`;
      embedReply.description = `Favourite Hand: ${(favHand) ? `**${favHand}** :tada:` : `**none?** :thinking:`}`;
    }
    channel.stopTyping();
    channel.send({ embed: embedReply });
  });
};

function HandEvalCommand(botClient, message, args) {
  if (args.length < 1) {
    message.channel.send(`Usage **${botClient.config.prefix}handeval** \`[hand] {...more hands} {board}\`\nA hand is 2 cards with value and suit ex. 5hTd (5 of Hearts, 10 of Diamonds). The optional Board is 3 or more cards hyphen separated ex. Ac-2d-3c-4s\nRunning a single hand outputs hand rank odds at showdown. Multiple hands output the win/tie odds for each.`);
    return;
  }

  let hands = [];
  let board = [];
  for (arg of args) {
    if (arg.length == 4) {
      hands.push(SplitHand(arg));
    }
    else if (arg.length > 7) {
      board = arg.split('-');
    }
    else {
      // totally invalid argument detected
      message.channel.send(`handeval error: An input hand or board is invalid. Run **${botClient.config.prefix}handeval** for instructions.`);
      return;
    }
  }
  if (hands.length > 20) {
    message.channel.send(`handeval error: No more than 20 hands can be evaluated at once.`);
    return;
  }

  message.channel.startTyping();
  // include all data for atomic operation in fork message
  holdemWorker.send({ chanId: message.channel.id, calcArgs: [hands, board, botClient.config.handevalIterations] });
}

function SplitHand(argHand) {
  return [argHand.substring(0, 2), argHand.substring(2, 4)];
}

// https://stackoverflow.com/a/202476
function sigFigs(n, sig) {
  if (isNaN(n) || n < 0.001) {
    return 0;
  }
  var mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.LN10) - 1);
  return Math.round(n * mult) / mult;
}
