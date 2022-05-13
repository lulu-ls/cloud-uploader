const { BrowserWindow, Menu, MenuItem, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { cloud } = require('NeteaseCloudMusicApi');

const Const = require('../../common/const');
const Logger = require('../../common/logger');
const Tools = require('../../common/tools');
const Store = require('../../common/store');

class UploaderWindow {
  constructor() {
    this.uploaderWindow = null;
    this.logger = null;

    this.init();
  }

  debug() {
    // Open the DevTools.
    if (this.uploaderWindow && Const.COMMON_DEBUG) {
      this.uploaderWindow.webContents.openDevTools();
    }
  }

  init() {
    this.logger = new Logger('UploaderWindow');

    this.createWindow();
    this.initMenu();
    this.initIPCOn();

    this.debug();
  }

  createWindow() {
    // 登录
    this.uploaderWindow = new BrowserWindow({
      title: Const.UPLOADER_TITLE,
      // resizable: false,
      // icon: nativeImage.createFromPath(
      //   path.join(__dirname, '../../../assets/image/cloud-upload.png')
      // ),
      width: Const.UPLOADER_WINDOW_SIZE_WIDTH,
      height: Const.UPLOADER_WINDOW_SIZE_HEIGHT,
      minWidth: Const.UPLOADER_WINDOW_SIZE_MIN_WIDTH,
      minHeight: Const.UPLOADER_WINDOW_SIZE_MIN_HEIGHT,

      webPreferences: {
        preload: path.join(__dirname, '../../inject/uploader.js'),
      },
    });

    this.uploaderWindow.loadFile(
      path.join(__dirname, '../views/uploader.html')
    );
  }

  show() {
    this.uploaderWindow.show();
    this.uploaderWindow.focus();
  }

  hide() {
    this.uploaderWindow.hide();
  }

  // 发送上传列表到前端
  sendReceiveUploadList(data = []) {
    this.uploaderWindow.webContents.send('display-upload-list', data);
  }

  // 发送上传成功消息到前端
  sendUploadItemSuccess(data = {}) {
    this.uploaderWindow.webContents.send('upload-item-success', data);
  }

  // 监测粘贴事件
  initMenu() {
    const menu = new Menu();
    menu.append(
      new MenuItem({
        label: '上传音乐',
        submenu: [
          {
            role: 'help',
            accelerator: process.platform === 'darwin' ? 'Cmd+v' : 'Ctrl+v',
            click: () => {
              const clip = require('electron-clipboard-ex');
              const fileList = clip.readFilePaths();

              this.startUpload(fileList);
            },
          },
        ],
      })
    );
    Menu.setApplicationMenu(menu);
  }

  // 注册IPC事件监听
  initIPCOn() {
    // ipcMain;
    ipcMain.on('file-select', (event) => {
      this.logger.log('receive file-select event!');
      this.fileSelect();
    });

    ipcMain.on('drag-select', (event, files) => {
      this.logger.log('receive drag-select event!', files);
      this.startUpload(files);
    });
  }

  // 获取可上传列表
  check(fileList) {
    const res = [];

    if (!Array.isArray(fileList)) {
      return;
    }

    // 获取音频文件
    for (let i = 0; i < fileList.length; i++) {
      if (Tools.isAudio(fileList[i])) {
        const name = path.basename(fileList[i]);
        res.push({
          path: fileList[i],
          name: name,
        });
      }
    }

    if (res.length <= 0) {
      Tools.dialog(this.uploaderWindow, {
        detail: '没有可上传文件',
      });
      return;
    }

    Tools.showNotification({
      title: '开始上传',
      body: `共计${res.length}个音乐文件, 请耐心等待！`,
    });

    return res;
  }

  async fileSelect() {
    try {
      const res = await dialog.showOpenDialog({
        title: '请选择需要上传的音乐',
        buttonLabel: '开始上传',
        properties: ['openFile', 'multiSelections'],
      });

      if (res.canceled) {
        Tools.dialog(this.uploaderWindow, { detail: '您还没有选择任何文件' });
        this.logger.log(this.uploaderWindow, { detail: '未选择任何文件' });
        return;
      }

      this.startUpload(res.filePaths);
    } catch (error) {
      this.logger.error(error);
      Tools.dialog(this.uploaderWindow, { detail: '选择文件报错' });
      return;
    }
  }

  getCookie() {
    return Store.get('cookie');
  }

  async startUpload(files = []) {
    const list = this.check(files);
    this.logger.log('开始上传列表: ', list);

    this.sendReceiveUploadList(list);

    let successCount = 0;
    try {
      for (let index = 0; index < list.length; index++) {
        const element = list[index];

        await this.sleep();

        const res = await cloud({
          songFile: {
            name: element.name,
            data: fs.readFileSync(element.path),
          },
          cookie: this.getCookie(),
        });

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          successCount++;
          this.sendUploadItemSuccess(element);
        } else {
          this.logger.error('上传失败, 元素为: ', element);
        }
      }
    } catch (error) {
      this.logger.error('上传失败, error: ', error);
    }

    Tools.showNotification({
      title: '上传完成',
      body: `共计${list.length}个音乐文件, 上传成功${successCount}个！`,
    });
  }

  sleep(time = 1000) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
}

module.exports = UploaderWindow;
