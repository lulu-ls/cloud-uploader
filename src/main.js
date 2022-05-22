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

  activeLoginWindow(logout) {
    if (this.loginWindow) {
      this.loginWindow.show();
    } else {
      this.loginWindow = new LoginWindow();
    }

    if (logout) {
      this.loginWindow.logout();
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

    // 首次直接发前端可能初始化问题，导致收不到消息，后边再研究下
    setTimeout(() => {
      this.uploaderWindow.sendConfig();

      this.signIn.asyncState();
      this.listen.asyncState();
    }, 1500);

    if (this.loginWindow) {
      this.loginWindow.hide();
    }
  }
}

new CloudUploader();
