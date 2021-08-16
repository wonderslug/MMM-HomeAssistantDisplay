class Logger {
	constructor(name) {
		this.name = name;
	}

	info(...message) {
		console.info(`[${this.name}]`, message);
	}

	error(...message) {
		console.error(`[${this.name}]`, message);
	}

	debug(...message) {
		console.debug(`[${this.name}]`, message);
	}
}

module.exports = Logger