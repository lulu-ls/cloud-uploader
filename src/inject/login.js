const { contextBridge, ipcRenderer } = require('electron');
const Logger = require('../common/logger');
const Const = require('../common/const');
// const Config = require('../common/config');

class LoginPreload {
  constructor() {
    this.logger = null;

    this.init();
  }

  init() {
    this.logger = new Logger('LoginPreload');

    this.windowLoaded();
    this.initIPCExpose();
  }

  windowLoaded() {
    window.addEventListener('DOMContentLoaded', () => {
      this.initIPCOn();
      this.initType();
    });
  }

  initIPCExpose() {
    // All of the Node.js APIs are available in the preload process.
    // It has the same sandbox as a Chrome extension.
    contextBridge.exposeInMainWorld('electronAPI', {
      loginByAccount: (data) => ipcRenderer.send('login-by-account', data),
      initType: () => {
        this.initType();
      },
    });
  }

  initIPCOn() {
    // 更新二维码
    ipcRenderer.on('update-qr-code', (event, data) => {
      this.logger.log('收到更新二维码请求', data);
      const qrcode = document.querySelector('#qrcode');
      qrcode.src = data;
    });

    // 更新扫码状态
    ipcRenderer.on('update-scan-state', (event, data) => {
      this.logger.log('收到更新扫码请求', data);
      const foot = document.querySelector('#foot');
      foot.innerHTML = data;
    });
  }

  initType() {
    const type = Number(localStorage.getItem('loginType')) || 0;

    this.logger.log('登录类型', type);

    const eleQr = document.querySelector(`#login-by-qr`);
    const elePhone = document.querySelector(`#login-by-phone`);
    const eleEmail = document.querySelector(`#login-by-email`);

    switch (type) {
      case Const.LOGIN_ACCOUNT_TYPE_CODE:
        eleQr.style.display = 'block';
        elePhone.style.display = 'none';
        eleEmail.style.display = 'none';
        ipcRenderer.send('login-by-account', {
          type: Const.LOGIN_ACCOUNT_TYPE_CODE,
        });
        break;
      case Const.LOGIN_ACCOUNT_TYPE_PHONE:
        eleQr.style.display = 'none';
        elePhone.style.display = 'block';
        eleEmail.style.display = 'none';
        break;
      case Const.LOGIN_ACCOUNT_TYPE_EMAIL:
        eleQr.style.display = 'none';
        elePhone.style.display = 'none';
        eleEmail.style.display = 'block';
        break;
      default:
        this.logger.error('登录类型未知，设置失败');
    }
  }
}

new LoginPreload();
