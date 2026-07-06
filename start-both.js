const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const WEBSITE = path.join(ROOT, 'website');

function start(name, command, args, options) {
  const proc = spawn(command, args, { stdio: 'inherit', ...options });
  proc.on('error', (err) => console.error(`[${name}] Error:`, err.message));
  proc.on('exit', (code) => {
    console.error(`[${name}] Exited with code ${code}`);
    process.exit(code ?? 1);
  });
  return proc;
}

const bot = start('bot', 'node', ['src/app/bootstrap.js'], { cwd: ROOT });
const web = start('web', 'node', ['.next/standalone/server.js'], { cwd: WEBSITE });

function cleanup(signal) {
  bot.kill(signal);
  web.kill(signal);
}

process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
