const { contextBridge, ipcRenderer } = require('electron');
const Logger = require('../common/logger');

class UploadPreload {
  constructor() {
    this.logger = null;

    this.init();
  }

  init() {
    this.logger = new Logger('UploadPreload');
    this.logger.info('UploadPreload init start...');

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
      logout: () => ipcRenderer.send('logout'),

      fileSelect: () => ipcRenderer.send('file-select'),
      dragSelect: (list) => ipcRenderer.send('drag-select', list),

      setAutoSignIn: (flag) => ipcRenderer.send('auto-sign-in-set', flag),
      setAutoListen: (flag) => ipcRenderer.send('auto-listen-set', flag),
    });
  }

  initIPCOn() {
    // 更新列表
    ipcRenderer.on('display-upload-list', (event, data) => {
      this.logger.log('接收到上传列表消息', data);
      this.updateList(data);
    });

    // 更新上传成功状态
    ipcRenderer.on('upload-item-success', (event, data) => {
      this.logger.log('接收到上传成功消息', data);
      this.updateItemSuccess(data);
    });

    // 配置信息
    ipcRenderer.on('config-info', (event, data) => {
      this.logger.log(`收到配置信息，${data}`);
      this.config(data);
    });

    // 更新签到成功状态
    ipcRenderer.on('sign-in-success', (event) => {
      this.logger.log('接收到签到成功消息');
      const autoSignInText = document.querySelector('#autoSignInText');
      const autoSignInLoading = document.querySelector('#autoSignInLoading');
      const autoSignInSuccess = document.querySelector('#autoSignInSuccess');

      autoSignInText.innerHTML = '已签到';
      autoSignInLoading.style.display = 'none';
      autoSignInSuccess.style.display = 'block';
    });

    // 更新刷歌成功状态
    ipcRenderer.on('listen-finished', (event) => {
      this.logger.log('接收到刷歌成功消息');

      const autoListenLoading = document.querySelector('#autoListenLoading');
      const autoListenFinished = document.querySelector('#autoListenFinished');
      const autoListenText = document.querySelector('#autoListenText');

      autoListenText.innerHTML = '刷歌完成';
      autoListenLoading.style.display = 'none';
      autoListenFinished.style.display = 'block';
    });
  }

  config(config = {}) {
    // autoSignIn;
    const autoSignInBox = document.querySelector('#autoSignInBox');
    const autoSignInLoading = document.querySelector('#autoSignInLoading');
    const autoSignInSuccess = document.querySelector('#autoSignInSuccess');
    const autoSignInText = document.querySelector('#autoSignInText');

    // autoListen;
    const autoListenBox = document.querySelector('#autoListenBox');
    const autoListenLoading = document.querySelector('#autoListenLoading');
    const autoListenFinished = document.querySelector('#autoListenFinished');
    const autoListenText = document.querySelector('#autoListenText');

    const { autoListen, autoSignIn } = config;

    if (autoSignIn) {
      autoSignInBox.checked = true;
      autoSignInText.innerHTML = '同步中···';
      autoSignInLoading.style.display = 'block';
      autoSignInSuccess.style.display = 'none';
    } else {
      autoSignInBox.checked = false;
    }

    if (autoListen) {
      autoListenBox.checked = true;
      autoListenText.innerHTML = '正在刷歌';
      autoListenLoading.style.display = 'block';
      autoListenFinished.style.display = 'none';
    } else {
      autoListenBox.checked = false;
    }

    const settingLoading = document.querySelector('#setting-loading');
    const settingFinished = document.querySelector('#setting-content');

    settingLoading.style.display = 'none';
    settingFinished.style.display = 'block';
  }

  updateItemSuccess(data = {}) {
    const li = document.getElementById(data.path);
    if (li) {
      li.classList.remove('loading');
      li.classList.add('finish');
    }
  }

  // 更新上传列表
  updateList(data = []) {
    const ul = document.querySelector('#uploader-list');
    const none = document.querySelector('.uploader-list-none-item');
    none.classList.add('display-none');

    let str = '';
    for (let index = 0; index < data.length; index++) {
      str += this.createItemTemplate(data[index]);
    }
    ul.innerHTML = str;
  }

  // 创建模版
  createItemTemplate(item = {}) {
    return `<li>
                <div class="uploader-row">
                  <div class="uploader-row-title">${item.name}</div>
                  <div id="${item.path}" class="loading"></div>
                </div>
            </li>`;
  }
}

new UploadPreload();
