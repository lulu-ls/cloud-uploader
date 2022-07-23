const Store = require('electron-store');

const schema = {
  cookie: {
    // 登录 cookie
    type: 'string',
    default: '',
  },
  proxy: {
    // 代理地址
    type: 'string',
    default: '',
  },
};

const store = new Store({ schema });

module.exports = store;
