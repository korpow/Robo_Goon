const { calculateEquity } = require('poker-odds');

exports.commands = {
  handeval: CalcOdds
};

function CalcOdds(botClient, message, args) {
  if (args.length < 1) {
    message.channel.send(`Usage **${botClient.config.prefix}handeval** \`[hand] {...more hands} {board}\`\nA hand is 2 cards with value and suit ex. 5hTd (5 of Hearts, 10 of Diamonds). The optional Board is 3 or more cards hyphen separated ex. Ac-2d-3c-4s\nRunning a single hand outputs hand rank odds at showdown. Multiple hands output the win/tie/loss odds for each.`);
    return;
  }
  if (args[0].length != 4) {
    // todo: no hands input error
    return;
  }
  let embedReply = {
    title: "Hand: hand [vs hand vs hand]",
    // "description": "```diff\n+ Win    11.11%\n- Lose   11.11%\n= Tie    22.22%```",
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
  let hands = [];
  let board;
  for (arg of args) {
    if (arg.length == 4) {
      hands.push(SplitHand(arg));
    }
    else if (arg.length > 7) {
      board = arg.split('-');
    }
    else {
      // todo: bad board arg error
      return;
    }
  }
  if (hands.length > 20) {
    // todo: too many hands error
    return;
  }
  try {
    const results = calculateEquity(hands, board);
    const playedHands = results[0].count;
    embedReply.footer.text = `Total hands played: ${playedHands}`;
    if (hands.length === 1) {
      // single hand
      embedReply.title = `Hand: ${args[0]}${(board) ? `\nBoard: ${board.join('')}` : ''}`;
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
          value: `\`\`\`diff\n+ Win   ${sigFigs((hand.wins / playedHands) * 100, 3)}%\n= Tie   ${sigFigs((hand.ties / playedHands) * 100, 3)}%\n- Lose  ${sigFigs(((playedHands - (hand.wins + hand.ties)) / playedHands) * 100, 3)}%\`\`\``,
          inline: true
        });
        if (hand.favourite) {
          favHand = hand.hand.join('');
        }
      }
      embedReply.title = `Hands: ${hands.map(hand => hand.join('')).join(' vs ')}${(board) ? `\nBoard: ${board.join('')}` : ''}`;
      embedReply.description = `Favourite Hand: ${(favHand) ? `**${favHand}** :tada:` : `**none?**`}`;

    }

    message.channel.send({ embed: embedReply });
  } catch (error) {
    message.channel.send(`Error from poker-odds package: ${error}`);
  }
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
