const { app } = require('electron');

const LoginWindow = require('./windows/controller/login');
const UploaderWindow = require('./windows/controller/uploader');

const Logger = require('./common/logger');
const Const = require('./common/const');
const { PageEvent } = require('./common/event');

class CloudUploader {
  constructor() {
    this.loginWindow = null;
    this.uploaderWindow = null;
    this.logger = null;

    // 初始化
    this.init();
  }

  init() {
    this.logger = new Logger('CloudUploader');

    this.initApp();
  }

  initApp() {
    app.on('ready', () => {
      this.activeWindow();

      PageEvent.on(Const.LOGIN_SUCCESS_EVENT_TOPIC, () => {
        this.activeUploaderWindow();
      });
    });

    app.on('activate', () => {
      this.activeWindow();
    });
  }

  async activeWindow() {
    if (!(await LoginWindow.checkLogin())) {
      this.activeLoginWindow();
    } else {
      this.activeUploaderWindow();
    }
  }

  activeLoginWindow() {
    if (this.loginWindow) {
      this.loginWindow.show();
    } else {
      this.loginWindow = new LoginWindow();
    }

    if (this.uploaderWindow) {
      this.uploaderWindow.hide();
    }
  }

  activeUploaderWindow() {
    if (this.uploaderWindow) {
      this.uploaderWindow.show();
    } else {
      this.uploaderWindow = new UploaderWindow();
    }

    if (this.loginWindow) {
      this.loginWindow.hide();
    }
  }
}

new CloudUploader();
