const async = require('async');
const EventEmitter = require('events').EventEmitter;
const FileAction = require('./fileAction');
const FileIndex = require('./fileIndex');

class Engine extends EventEmitter {

    /**
     * Construct the synchronisation engine
     * @param {string} source The source directory
     * @param {string[]} destinations The destination directories
     * @param {*} options Synchronisation options
     */
    constructor(source, destinations, options) {
        super();
        this.source = source;
        this.destinations = destinations;
        this.options = options;
        this.limit = 1;
    }
 
    /**
     * Initialize the synchronisation engine
     */
    initialize() {

        if (!this.source || !this.destinations || this.destinations.length === 0) {
            this.emit('error', 'Please provide at least one source and destination');
            this.emit('end');
            return;
        }

        // collate the maps for all destinations into one big Map<string, FileAction>
        // using the "magic" of async.map and an array spread (...)

        this.emit('data', 'Beginning the creation of the file index');
        
        async.map(
            this.destinations, 
            (destination, callback) => {
                FileIndex.build(this.source, destination, this.options, callback);
            },
            (err, maps) => {
                if (err) {
                    this.emit('error', err);
                    this.emit('end');
                } else {
                    this.processFileActions(new Map(...maps));
                }
            }    
        );

    }

    /**
     * Process a map of file locations and the actions to take
     * @param {Map<string, FileAction>} fileActions The file actions map to process
     */
    processFileActions(fileActions) {
        this.emit('data', 'Indexing complete');
        this.emit('data', `Making ${fileActions.size} changes`);
        async.eachLimit(fileActions, this.limit, (fileAction, callback) => {
            const [path, action] = fileAction;
            this.emit('data', action);
            action.commit(callback);
        }, (err) => {
            if (err) {
                this.emit('error', err);
            }
            this.emit('end');
        });
    }
}

module.exports = Engine;