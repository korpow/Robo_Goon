const { calculateEquity } = require('poker-odds');

process.on('message', message => {
  let result;
  try {
    result = calculateEquity(...message.calcArgs);
  }
  catch (error) {
    result = error.toString();
  }
  process.send({
    chanId: message.chanId,
    results: result,
    board: (message.calcArgs[1].length > 0) ? message.calcArgs[1] : false
  });
});
