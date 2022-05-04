const Store = require('electron-store');

const schema = {
  isLogin: {
    type: 'boolean',
    default: false,
  },
  cookie: {
    type: 'string',
    default: '',
  },
};

const store = new Store(schema);

module.exports = store;
