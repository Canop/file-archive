# file-archive

A simple and fast archiver storing files in a date based directory tree, handling collisions and directory creation.

[![Chat on Miaou](https://dystroy.org/miaou/static/shields/room-en.svg?v=1)](https://dystroy.org/miaou/1?Miaou)
[![Chat on Miaou](https://dystroy.org/miaou/static/shields/room-fr.svg?v=1)](https://dystroy.org/miaou/3?Code_Croissants)

## Usage

### Preparing the archive

Initialize your instance of `FileArchiver`:

	const FileArchive = require("file-archive")
	const archive = new FileArchive("/var/stuff", "map-", "json")

This operation makes no change on disk.

### Adding to the archive

	let filepath = await archive.write(buffer) // you can pass byte buffers or strings

This writes a new file and gives you its filepath, for example

	"/var/stuff/2018/04/03/map-20:01:05:667.json"

If you're calling this function several times in the same millisecond, the collision will be catched and different files will be written (by incrementing the milliseconds part of the name).

Having several FileArchivers mapped to the same directory is totally OK. It lets you store several types of files in the same directory hierarchy.

It's possible to pass a specific time (instead of having the current one used):

	let filepath = await archive.write(buffer, someTimeMillis)

### Finding the last entry

You can easily get the last entry for a year, a month, a day, or in the archive:

	let filepath = await archive.last(2018, 4)
	let filepath = await archive.last("2018", "04")
	let filepath = await archive.last(2018, 4, 3)
	let filepath = await archive.last()

This function returns `undefined` when there's nothing for that specific period.

### Listing

You can list the years in the archive, the months in a year, the days in a month, or the entries in a day:

	let years = await archive.list()
	let monthsOf2018 = await archive.list(2018)
	let daysOfMay = await archive.list("2018", "05")
	let entriesThatSpecificDay = await archive.list(2018, 5, 7)
