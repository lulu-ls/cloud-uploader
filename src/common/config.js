const Store = require('./store');
const Const = require('./const');

class Config {
  constructor() {}

  static info() {
    return {
      autoListen: !!this.getAutoListen(),
      autoSignIn: !!this.getAutoSignIn(),
    };
  }

  // 获取自动听歌
  static getAutoListen() {
    return Store.get('autoListen');
  }

  // 获取自动签到配置
  static getAutoSignIn() {
    return Store.get('autoSignIn');
  }

  // 获取登录类型
  static getLoginType() {
    const res = Store.get('loginType');
    if (!res) {
      return Const.LOGIN_ACCOUNT_TYPE_CODE;
    }
    return res;
  }
}

module.exports = Config;
