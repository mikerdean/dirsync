const async = require('async');
const crypto = require('crypto');
const fs = require('fs');
const FileAction = require('./fileAction');
const path = require('path');
const PathType = require('./pathType');

class FileIndex {

    static build(source, destination, options, callback) {

        const directoryChecks = [
            async.apply(fs.access, source, fs.constants.F_OK | fs.constants.R_OK),
            async.apply(fs.access, destination, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK)
        ];

        async.parallel(directoryChecks, (err) => {

            if (err) {
                return callback(err);
            }

            FileIndex.buildFileMap(source, destination, options, callback);

        });

    }

    static buildFileMap(source, destination, options, callback) {

        fs.readdir(source, (err, files) => {

            if (err) {
                return callback(err);
            }

            const fileMap = new Map();

            async.each(files, (filename, callback) => {

                const sourcePath = path.join(source, filename);
                const destinationPath = path.join(destination, filename);

                fs.stat(sourcePath, (err, stat) => {
                    if (err) {
                        return callback(err);
                    } else {
                        let type = FileIndex.getPathType(stat);
                        FileIndex[type](sourcePath, stat, destinationPath, options, fileMap, callback);
                    }
                });

            }, (err) => {
                callback(err, fileMap);
            });

        });

    }

    /**
     * Get a compatible path type Symbol from an fs.Stats object
     * @param {fs.Stats} stat 
     */
    static getPathType(stat) {
        if (stat.isDirectory()) {
            return PathType.DIRECTORY;
        } else if (stat.isFile()) {
            return PathType.FILE;
        } else {
            return PathType.NONE;
        }
    }

    static [PathType.DIRECTORY](source, sourceStat, destination, options, fileMap, callback) {

        fs.stat(destination, (err) => {

            if (err) {
                fileMap.set(destination, new FileAction(source, destination, FileAction.ADD, true))
            }

            FileIndex.buildFileMap(source, destination, options, (err, map) => {

                if (err) {
                    return callback(err);
                } else {

                    for (let [key, value] of map) {
                        fileMap.set(key, value);
                    }
                    
                    return callback();
                }

            });

        });

    }

    static [PathType.FILE](source, sourceStat, destination, options, fileMap, callback) {

        fs.stat(destination, (err, destinationStat) => {

            if (err) {
                fileMap.set(destination, new FileAction(source, destination, FileAction.ADD));
                return callback();
            } else if (destinationStat.size !== sourceStat.size) {
                fileMap.set(destination, new FileAction(source, destination, FileAction.REPLACE));
                return callback();
            } else if (options.secure) {
                async.map([source, destination], FileIndex.hashFrom, (err, results) => {

                    if (err) {
                        return callback(err);
                    }

                    let [sourceSum, destinationSum] = results;
                    if (sourceSum !== destinationSum) {
                        fileMap.set(destination, new FileAction(source, destination, FileAction.REPLACE));
                    }

                    callback();

                });
            } else {
                callback();
            }

        });
        
    }

    static [PathType.NONE](source, sourceStat, destination, options, fileMap, callback) {
        process.nextTick(callback);
    }

    static hashFrom(path, callback) {
        const hash = crypto.createHash('md5');
        const input = fs.createReadStream(path);

        input.on('error', callback);

        input.on('end', () => {
            callback(null, hash.toString('hex'));
        });

        input.pipe(hash);
    }

}

module.exports = FileIndex;