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
  botClient.config.githubLogUrl = ""; // todo: delete this line when discord supports inline named link Markdown
  message.channel.send(`Running ${(botClient.config.githubLogUrl) ? `[commit](${botClient.config.githubLogUrl + gitStatus.log.substr(0, 7)})` : 'commit'}: \`${gitStatus.log}\` ${(gitStatus.workingClean) ? '' : '*+ changes*'}`);
}
