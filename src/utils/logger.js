const chalk = require('chalk');
const moment = require('moment');
const { LoggerError } = require('./CustomError');

// Initialize logs array
let logs = []; 

const timestamp = () => `[${moment().format("HH:mm:ss | DD-MM-YYYY")}]`;

// Function to strip ANSI escape codes
const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*m/g, '');

function log(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.blue.underline(('[LOG]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

function loader(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.green.underline(('[LOADER]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

function error(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.red.underline(('[ERROR]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

function warn(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.yellow.underline(('[WARN]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

function info(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.magenta.underline(('[INFO]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

function database(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.yellowBright.underline(('[DATABASE]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

function success(content) {
  if (!content) throw new LoggerError('No text found');
  const message = `${chalk.cyan(timestamp())} ${chalk.green.underline(('[SUCCESS]'))} ${content}`;
  console.log(message);
  logs.push(stripAnsi(message)); // Add to logs array without ANSI codes
}

// Export logs array for access in other files
module.exports = {
  log,
  loader,
  error,
  warn,
  info,
  database,
  success,
  logs // Export the logs array
};
