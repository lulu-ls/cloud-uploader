const { Menu, MenuItem, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Api = require('../../common/api');

const Const = require('../../common/const');
const Logger = require('../../common/logger');
const Tools = require('../../common/tools');
const Store = require('../../common/store');
const { PageEvent } = require('../../common/event');
const BaseWindow = require('./base');

class UploaderWindow extends BaseWindow {
  constructor() {
    super();
    this.config = Const.UPLOAD_WINDOW;
    this.name = 'UploaderWindow';

    this.init();
    this.register();
  }

  // 监测粘贴事件
  register() {
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

  // 发送签到成功消息到前端 'sign-in-success'
  sendSignInSuccess() {
    this.sendMsg('finished', Const.SIGN_IN_FINISHED_TYPE);
  }

  // 发送刷歌成功消息到前端
  sendListenFinished() {
    this.sendMsg('finished', Const.LISTEN_FINISHED_TYPE);
  }

  // 获取可上传列表
  async check(fileList) {
    return new Promise(async (resolve, reject) => {
      if (!Array.isArray(fileList)) {
        resolve([]);
        return;
      }

      // 获取音频文件
      const res = await this.folderFiles(fileList);

      if (res.length <= 0) {
        Tools.dialog(this.window, {
          detail: '没有可上传文件',
        });
        resolve([]);
        return;
      }

      Tools.showNotification({
        title: '开始上传',
        body: `共计${res.length}个音乐文件, 请耐心等待！`,
      });

      resolve(res);
      return;
    });
  }

  folderFiles(fileList) {
    return new Promise(async (resolve, reject) => {
      const res = [];

      for (let i = 0; i < fileList.length; i++) {
        const element = fileList[i];
        if (Tools.isAudio(element)) {
          const name = path.basename(element);
          res.push({
            path: element,
            name: name,
          });
        } else {
          const parentFolder = await this.isFolder(element);
          if (!parentFolder) {
            continue;
          }

          const chiList = await this.readFolder(element);
          const chiItems = await this.folderFiles(chiList);
          res.push(...chiItems);
        }
      }

      resolve(res);
    });
  }

  readFolder(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, function (err, files) {
        if (err) {
          Logger.def('上传失败，读取文件夹失败：', dir, err);
          resolve([]);
        }

        const fullPathRes = files.map((v) => path.join(dir, v));
        resolve(fullPathRes);
      });
    });
  }

  isFolder(dir) {
    return new Promise((resolve, reject) => {
      fs.stat(dir, function (err, stat) {
        if (err) {
          Logger.def('上传失败，判断是否是文件错误：', dir, err);
          resolve(false);
          return;
        }
        resolve(stat.isDirectory());
        // stat.isFile()
      });
    });
  }

  async fileSelect() {
    try {
      const res = await dialog.showOpenDialog({
        title: '请选择需要上传的音乐',
        buttonLabel: '开始上传',
        properties: ['openFile', 'openDirectory', 'multiSelections'],
      });

      if (res.canceled) {
        Tools.dialog(this.window, { detail: '您还没有选择任何文件' });
        this.logger.log(this.window, { detail: '未选择任何文件' });
        return;
      }
      this.startUpload(res.filePaths);
    } catch (error) {
      this.logger.error(error);
      Tools.dialog(this.window, { detail: '选择文件报错' });
      return;
    }
  }

  async startUpload(files = []) {
    const list = await this.check(files);

    if (!list || list.length <= 0) {
      return;
    }

    this.logger.log('开始上传列表: ', list);

    // 发送上传列表到前端
    this.sendMsg('display-upload-list', list);

    let successCount = 0;
    try {
      for (let index = 0; index < list.length; index++) {
        const element = list[index];

        await this.sleep();

        const res = await Api.request('cloud', {
          songFile: {
            name: element.name,
            data: fs.readFileSync(element.path),
          },
        });

        // 歌曲匹配纠错
        // if (
        //   res &&
        //   res.body &&
        //   res.body.privateCloud &&
        //   res.body.privateCloud.songId
        // ) {
        //   const res1 = await Api.request('cloud_match', {
        //     songFile: {
        //       name: element.name,
        //       data: fs.readFileSync(element.path),
        //     },
        //   });

        //   console.log(res1);
        // }

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          successCount++;
          // 发送上传成功消息到前端
          this.sendMsg('upload-item-success', element);
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

  sleep(time) {
    if (!time && Const.UPLOADER_UPLOAD_INTERVAL_TIME) {
      if (
        Const.UPLOADER_UPLOAD_INTERVAL_TIME.Max &&
        Const.UPLOADER_UPLOAD_INTERVAL_TIME.Min
      ) {
        // 生成 max 和 min 之间的随机数
        time = parseInt(
          Math.random() *
            (Const.UPLOADER_UPLOAD_INTERVAL_TIME.Max -
              Const.UPLOADER_UPLOAD_INTERVAL_TIME.Min +
              1) +
            Const.UPLOADER_UPLOAD_INTERVAL_TIME.Min,
          10
        );
      } else {
        time = Const.UPLOADER_UPLOAD_INTERVAL_TIME;
      }
    }

    this.logger.info(`本次上传休息时间为 ${time} 毫秒`);
    return Tools.sleep(time);
  }

  logoutTopic() {
    PageEvent.emit(Const.LOGIN_LOGOUT_EVENT_TOPIC);
  }
}

module.exports = UploaderWindow;
