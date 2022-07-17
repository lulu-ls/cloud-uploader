const { app } = require('electron');

const LoginWindow = require('./windows/controller/login');
const UploaderWindow = require('./windows/controller/uploader');
const SignIn = require('./windows/controller/signIn');

const Logger = require('./common/logger');
const Const = require('./common/const');
const { PageEvent } = require('./common/event');
const Listen = require('./windows/controller/listen');

class CloudUploader {
  constructor() {
    this.loginWindow = null;
    this.uploaderWindow = null;
    this.logger = null;
    this.signIn = null;
    this.listen = null;

    // 初始化
    this.init();
  }

  init() {
    this.logger = new Logger('CloudUploader');
    // 签到模块
    this.signIn = new SignIn();

    // 刷歌模块
    this.listen = new Listen();

    this.initApp();
  }

  initApp() {
    app.on('ready', () => {
      this.activeWindow();

      // 登录成功
      PageEvent.on(Const.LOGIN_SUCCESS_EVENT_TOPIC, () => {
        this.loginWindow.destroy();
        this.activeUploaderWindow();
      });

      // 退出登录
      PageEvent.on(Const.LOGIN_LOGOUT_EVENT_TOPIC, () => {
        this.activeLoginWindow(true);
      });

      // 签到成功
      PageEvent.on(Const.SIGN_IN_SIGNED_EVENT_TOPIC, () => {
        this.uploaderWindow.sendSignInSuccess();
      });

      // 刷歌成功
      PageEvent.on(Const.LISTEN_FINISHED_EVENT_TOPIC, () => {
        this.uploaderWindow.sendListenFinished();
      });
    });

    app.on('activate', () => {
      this.logger.info('窗口激活事件 activate～');
      this.activeWindow();
    });

    app.on('window-all-closed', async () => {
      this.logger.info('窗口关闭事件 window-all-closed～', process.platform);
      await this.closeWindow();
      // 处理 UnhandledPromiseRejectionWarning: TypeError: Object has been destroyed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  async closeWindow() {
    return new Promise((resolve) => {
      if (this.listen) {
        this.listen.setListening(false);
      }

      // this.loginWindow = null;
      // this.uploaderWindow = null;
      resolve();
    });
  }

  async activeWindow() {
    if (!(await LoginWindow.checkLogin())) {
      this.activeLoginWindow();
    } else {
      this.activeUploaderWindow();
    }
  }

  activeLoginWindow(logout) {
    if (logout) {
      LoginWindow.logout();
    }

    if (this.loginWindow) {
      this.loginWindow.show();
    } else {
      this.loginWindow = new LoginWindow();
    }

    this.loginWindow.loginWindow.on('closed', async () => {
      this.logger.info('登录窗口关闭事件 closed～', process.platform);
      this.loginWindow.destroy();
      this.loginWindow = null;
      // 处理 UnhandledPromiseRejectionWarning: TypeError: Object has been destroyed
    });

    if (this.uploaderWindow) {
      this.uploaderWindow.hide();
    }

    setTimeout(() => {
      if (this.loginWindow) {
        this.loginWindow.sendLoginType();
      }
    }, 1500);
  }

  activeUploaderWindow() {
    if (this.uploaderWindow) {
      this.uploaderWindow.show();
    } else {
      this.uploaderWindow = new UploaderWindow();
    }

    this.uploaderWindow.uploaderWindow.on('closed', async () => {
      this.logger.info('上传窗口关闭事件 closed～', process.platform);
      this.uploaderWindow = null;
      // 处理 UnhandledPromiseRejectionWarning: TypeError: Object has been destroyed
    });

    // 首次直接发前端可能初始化问题，导致收不到消息，后边再研究下
    setTimeout(() => {
      if (this.uploaderWindow) {
        this.uploaderWindow.sendConfig();
      }

      this.signIn.asyncState();
      this.listen.asyncState();
    }, 1500);

    if (this.loginWindow) {
      this.loginWindow.hide();
    }
  }
}

new CloudUploader();
