const Const = require('./const');

class Logger {
  constructor(...arg) {
    this.name = '';
    if (arg && arg[0]) {
      this.name = arg[0];
    }
  }

  log(...data) {
    if (Const.COMMON_DEBUG) {
      console.log(this.prefix(), ...data);
    }
  }
  error(...data) {
    if (Const.COMMON_DEBUG) {
      console.error(this.prefix(), ...data);
    }
  }
  info(...data) {
    if (Const.COMMON_DEBUG) {
      console.info(this.prefix(), ...data);
    }
  }
  warn(...data) {
    if (Const.COMMON_DEBUG) {
      console.warn(this.prefix(), ...data);
    }
  }

  prefix() {
    return this.name + ' ' + new Date().toString();
  }
}

module.exports = Logger;
