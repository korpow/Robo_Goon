const { spawn } = require('child_process');

var gitStatus = {
  log: "",
  workingClean: true
};
const gitLatestLog = spawn('git', ['log', `--pretty=format:'%h(%cn) - %s'`, '-n 1']);
const gitIsWorkingClean = spawn('git', ['status', '--porcelain']);

gitLatestLog.stdout.on('data', (data) => {
  gitStatus.log = data.toString().replace(/^'(.*)'$/, '$1');
});
gitIsWorkingClean.stdout.on('data', () => {
  // if --porcelain outputs anything then the working dir is dirty
  gitStatus.workingClean = false;
});

// todo: add pull command with buffered stdout relay, have better alias handling
exports.commands = {
  githash: PrintGitLatestLog,
  revision: PrintGitLatestLog
};

function PrintGitLatestLog(botClient, message) {
  message.channel.send(`Running commit: \`${gitStatus.log}\` ${(gitStatus.workingClean) ? '' : '*+ changes*'}`);
}
