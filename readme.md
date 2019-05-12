# dirsync

A file directory synchronisation script.

## Usage

```
Usage: index [options] <source> <destination ...>

Options:
  -c, --create         attempt to create the destination directory if it doesn't exist
  -l, --log [logfile]  generate a log file of changes
  -r, --remove         remove files in the destination directory that do not exist in the source directory structure
  -s, --secure         use a secure hash check to compare files
  -v, --verbose        enable verbose log output
  -h, --help           output usage information
```