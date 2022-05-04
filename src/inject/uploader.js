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
      fileSelect: () => ipcRenderer.send('file-select'),
      dragSelect: (list) => ipcRenderer.send('drag-select', list),
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
