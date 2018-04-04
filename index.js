
const fs = require("fs")
const path = require("path")

// return a promise, fail with "EEXIST" when the file already exists
function writeNewAsync(filepath, data){
	return new Promise((resolve, reject)=>{
		fs.writeFile(filepath, data ,{ flag: "wx" }, function(err){
			if (!err) resolve(true)
			else reject(err)
		})
	})
}

// simple promisification of fs.readdir
function readdirAsync(filepath){
	return new Promise((resolve, reject)=>{
		fs.readdir(filepath, (err, items)=>{
			if (err) reject(err)
			else resolve(items)
		})
	})
}

function lp(number, size=2){
	return String(number).padStart(size, "0")
}

class FileArchiver{
	constructor(basepath, basename, extension){
		this.basepath = path.normalize(basepath)
		this.basename = basename;
		this.extension = extension;
	}
	dateDirectory(date){
		return path.join(
			this.basepath,
			`${date.getUTCFullYear()}/${lp(date.getUTCMonth()+1)}/${lp(date.getUTCDate())}`
		)
	}
	filepath(date){
		const hour = lp(date.getUTCHours())
		const min = lp(date.getUTCMinutes())
		const sec = lp(date.getUTCSeconds())
		const ms = lp(date.getUTCMilliseconds(), 3)
		return path.join(
			this.dateDirectory(date),
			`${this.basename}${hour}:${min}:${sec}:${ms}.${this.extension}`
		)
	}
	async write(data, time){
		if (!time) time = Date.now()
		let madeDirs = false
		for(;;) {
			let date = new Date(time)
			let filepath = this.filepath(new Date(time))
			try {
				await writeNewAsync(filepath, data)
				return filepath
			} catch (e) {
				if (e.code==="ENOENT" && !madeDirs) {
					madeDirs = true
					this.mkdirs(date)
				} else if (e.code==="EEXIST") {
					time++;
					madeDirs = false // for when incrementing the time changes the day
				} else {
					throw e
				}
			}
		}
	}
	filteredNames(items){
		return items.filter(filename=>this.filterName(filename))
	}
	filterName(filename){
		return filename.startsWith(this.basename) && filename.endsWith("."+this.extension)
	}
	async last(...parts){
		let filepath = this.basepath
		try {
			for (let i=0; i<=3; i++) {
				if (parts[i]===undefined) {
					let items = await readdirAsync(filepath)
					if (i===3) {
						for (let j=items.length; j--;) {
							if (this.filterName(items[j])) {
								return filepath + path.sep + items[j]
							}
						}
						return
					}
					parts[i] = items[items.length-1]
				} else if (i && typeof parts[i]==="number") {
					parts[i] = lp(parts[i])
				}
				filepath += path.sep + parts[i]
			}
		} catch (e) {
			if (e.code==="ENOENT") return // nothing on that day
			throw e
		}
		return filepath
	}
	async list(...parts){
		let filepath = this.basepath
		try {
			for (let i=0; i<=3; i++) {
				if (parts[i]===undefined) {
					let items = await readdirAsync(filepath)
					if (!items) return []
					if (i===3) {
						items = this.filteredNames(items)
					}
					return items
				} else if (i && typeof parts[i]==="number") {
					parts[i] = lp(parts[i])
				}
				filepath += path.sep + parts[i]
			}
		} catch (e) {
			if (e.code==="ENOENT") return []
			throw e
		}
	}
	mkdirs(date){
		if (!date) date = new Date
		let filepath = this.dateDirectory(date)
		if (fs.existsSync(filepath)) return this
		const tokens = filepath.split(path.sep)
		filepath = ""
		for (let i=0; i<tokens.length; i++) {
			filepath += tokens[i] + path.sep
			if (fs.existsSync(filepath)) continue
			fs.mkdirSync(filepath)
		}
		return this
	}
}

module.exports = FileArchiver
