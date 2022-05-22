const Store = require('electron-store');

const schema = {
  isLogin: {
    // 是否已登录
    type: 'boolean',
    default: false,
  },
  cookie: {
    // 登录 cookie
    type: 'string',
    default: '',
  },
  signedDate: {
    // 签到日期
    type: 'string',
    default: '',
  },
  autoSignIn: {
    // 自动签到是否开启
    type: 'boolean',
    default: false,
  },
  listenedDate: {
    // 刷歌日期
    type: 'string',
    default: '',
  },
  listening: {
    // 自动刷歌是否进行中
    type: 'boolean',
    default: false,
  },
  autoListen: {
    // 自动刷歌是否开启
    type: 'boolean',
    default: false,
  },
};

const store = new Store(schema);

module.exports = store;
