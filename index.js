const cmd = require('commander');
const colors = require('colors/safe');
const Engine = require('./engine');
const fs = require('fs');
const moment = require('moment');
const os = require('os');

// ####################
// initialize the command line processing

cmd.usage('[options] <source> <destination ...>')
    .option('-c, --create', 'attempt to create the destination directory if it doesn\'t exist')
    .option('-l, --log [logfile]', 'generate a log file of changes')
	.option('-r, --remove', 'remove files in the destination directory that do not exist in the source directory structure')
    .option('-s, --secure', 'use a secure hash check to compare files')
    .option('-v, --verbose', 'enable verbose log output');
    
cmd.parse(process.argv);

// ####################
// initialize the synchronisation engine

const logStore = [];

const getCurrentDate = function(format = 'YYYY-MM-DD HH:mm:ss.SSS') {
    return moment().format(format);
};

const toConsole = function(fn, msg, name = 'dirsync') {
    let dt = getCurrentDate();
    console.log(`${fn(name)} ${colors.gray('>')} ${dt} ${colors.gray('>')} ${msg}`);
};

const toFile = function(msg, name = 'dirsync') {
    let dt = getCurrentDate();
    logStore.push(`${name} > ${dt} > ${msg}`);
};

const dirsync = new Engine(cmd.args[0], cmd.args.slice(1), { create: cmd.create, remove: cmd.remove, log: cmd.log, secure: cmd.secure, verbose: cmd.verbose });
dirsync.on('data', msg => toConsole(colors.green, msg));
dirsync.on('error', msg => toConsole(colors.red, msg));
dirsync.on('end', () => toConsole(colors.green, 'Done'));

if (cmd.log) {
    dirsync.on('data', msg => toFile(msg));
    dirsync.on('error', msg => toFile(msg));
    dirsync.on('end', () => {
        fs.writeFile(cmd.log, Buffer.from(logStore.join(os.EOL), 'utf8'), (err) => {
            if (err) {
                toConsole(colors.red, err);
            }
        });
    });
}

dirsync.initialize();