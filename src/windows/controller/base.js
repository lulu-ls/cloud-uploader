const { BrowserWindow } = require('electron');
const Logger = require('../../common/logger');
const Const = require('../../common/const');

class BaseWindow {
  constructor() {
    this.window = null;
    this.session = null;
    this.name = '';
    this.logger = null;
    this.config = null;
  }

  init() {
    this.logger = new Logger(this.name);

    this.logger.info(`${this.name}窗口初始化`);
    this.createWindow();
    this.initWindowEvents();
    this.debug();
  }

  createWindow() {
    if (this.window) {
      this.logger.info(`${this.name}窗口已注册`);
      return;
    }

    this.logger.info(`注册${this.name}窗口`);

    // 登录
    this.window = new BrowserWindow({
      title: this.config.TITLE,
      resizable: this.config.RESIZE,
      // icon: path.join(__dirname, '../../../assets/icon.png'),
      width: this.config.SIZE_WIDTH,
      height: this.config.SIZE_HEIGHT,
      minWidth: this.config.SIZE_MIN_WIDTH,
      minHeight: this.config.SIZE_MIN_HEIGHT,

      webPreferences: {
        preload: this.config.PRELOAD,
      },
    });

    this.window.loadFile(this.config.LOAD_FILE);

    this.session = this.window.webContents.session;
  }

  debug() {
    // Open the DevTools.
    if (this.window && Const.COMMON_DEBUG) {
      this.window.webContents.openDevTools();
    }
  }

  initWindowEvents() {
    this.window.on('close', (e) => {
      if (this.window.isVisible()) {
        e.preventDefault();
        this.hide();
      }
    });

    this.window.on('show', (e) => {
      e.preventDefault();
      this.show();
    });
  }

  sendMsg(topic, data) {
    this.window.webContents.send(topic, data);
  }

  show() {
    this.window.show();
    this.window.focus();
  }

  hide() {
    this.window.hide();
  }
}

module.exports = BaseWindow;
