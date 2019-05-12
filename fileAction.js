const fs = require('fs');

const _add = Symbol('add');
const _delete = Symbol('delete');
const _replace = Symbol('replace');

class FileAction {

	/**
	 * Callback when commiting a FileAction
	 * @callback commitCallback
	 * @param {string} err
	 */

	static get ADD() {
		return _add;
	}

	static get DELETE() {
		return _delete;
	}

	static get REPLACE() {
		return _replace;
	}

	/**
	 * Construct a new FileAction
	 * @param {string} source The source path
	 * @param {string} destination The destination path
	 * @param {Symbol} action The action to take
	 * @param {boolean} isDirectory The source is a directory
	 */
	constructor(source, destination, action, isDirectory = false) {
		this.source = source;
		this.destination = destination;
		this.action = action;
		this.isDirectory = isDirectory;
	}

	/**
	 * Commit the file action to disk
	 * @param {commitCallback} callback 
	 */
	commit(callback) {
		if (this.isDirectory) {

			if (this.action === FileAction.ADD) {
				fs.mkdir(this.destination, callback);
			} else if (this.action === FileAction.DELETE) {
				fs.rmdir(this.destination, callback);
			} else {
				callback('Directory action not allowed');
			}

		} else if (this.action === FileAction.ADD || this.action === FileAction.REPLACE) {

			const read = fs.createReadStream(this.source);
			const write = fs.createWriteStream(this.destination, { flags: 'w+' });
			
			read.pipe(write);
			
			write.on('error', callback);
			write.on('finish', callback);

		} else if (this.action === FileAction.DELETE) {

			fs.unlink(destination, callback);

		} else {
			callback('File action not allowed');
		}
	}

	/**
	 * Convert the FileAction into a descriptive string
	 */
	toString() {
		let descr;
		if (this.action === FileAction.ADD) {
            descr = 'Creating ';
        } else if (this.action === FileAction.DELETE) {
            descr = 'Removing ';
        } else if (this.action === FileAction.REPLACE) {
            descr = 'Replacing ';
        } else {
            descr = '';
		}
		return descr + this.destination;
	}

}

module.exports = FileAction;