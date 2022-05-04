const { contextBridge, ipcRenderer } = require('electron');
const Logger = require('../common/logger');

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
    });
  }

  initIPCExpose() {
    // All of the Node.js APIs are available in the preload process.
    // It has the same sandbox as a Chrome extension.
    contextBridge.exposeInMainWorld('electronAPI', {
      // msg: (data) => ipcRenderer.send('msg-send', data),
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
}

new LoginPreload();
