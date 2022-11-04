const {contextBridge, ipcRenderer} = require('electron');
const fs = require('fs');
const path = require('path');

const Logger = require('../common/logger');
const Const = require('../common/const');

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
            this.initVersion();
        });
    }

    initIPCExpose() {
        // All of the Node.js APIs are available in the preload process.
        // It has the same sandbox as a Chrome extension.
        contextBridge.exposeInMainWorld('electronAPI', {
            logout: () => ipcRenderer.send('logout'),

            fileSelect: () => ipcRenderer.send('file-select'),
            dragSelect: (list) => ipcRenderer.send('drag-select', list),

            signIn: (flag) => ipcRenderer.send('auto-sign', flag),
            listen: (flag) => ipcRenderer.send('auto-listen', flag),

            openUrl: (url) => {
                this.openDefaultBrowser(url);
            },
        });
    }

    initVersion() {
        //
        const ele = document.getElementById('github');
        const packageJsonPath = path.join(
            path.dirname(path.dirname(__dirname)),
            'package.json'
        );
        const packageJsonData = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf8')
        );
        const version = packageJsonData.version;

        ele.innerText = `©2022 AlexLiu. ${version} Github`;
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
        ipcRenderer.on('async-state', (event, data) => {
            this.logger.log(`同步配置信息，${data}`);
            this.asyncState(data);
        });

        // 更新签到成功状态
        ipcRenderer.on('finished', (event, type) => {
            this.finished(type);
        });

        ipcRenderer.on('upload-log', (event, data) => {
            this.logger.log('接收到后端日志消息', data);
        });
    }

    finished(type) {
        if (type === Const.SIGN_IN_FINISHED_TYPE) {
            this.logger.log('接收到签到成功消息');
            const autoSignInText = document.querySelector('#autoSignInText');
            const autoSignInLoading = document.querySelector('#autoSignInLoading');
            const autoSignInSuccess = document.querySelector('#autoSignInSuccess');

            autoSignInText.innerHTML = '已签到';
            autoSignInLoading.style.display = 'none';
            autoSignInSuccess.style.display = 'block';

            localStorage.setItem(`sign-in-${this.getDate()}`, 1);
        } else if (type === Const.LISTEN_FINISHED_TYPE) {
            // 更新刷歌成功状态
            this.logger.log('接收到刷歌成功消息');

            const autoListenLoading = document.querySelector('#autoListenLoading');
            const autoListenFinished = document.querySelector('#autoListenFinished');
            const autoListenText = document.querySelector('#autoListenText');

            autoListenText.innerHTML = '刷歌完成';
            autoListenLoading.style.display = 'none';
            autoListenFinished.style.display = 'block';

            localStorage.setItem(`listen-${this.getDate()}`, 1);
        } else {
            this.logger.error('未知通知类型');
        }
    }

    asyncState(config = {}) {
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

        const autoListen = localStorage.getItem('autoListen');
        const autoSignIn = localStorage.getItem('autoSignIn');

        if (autoSignIn) {
            autoSignInBox.checked = true;
            if (!localStorage.getItem(`sign-in-${this.getDate()}`)) {
                ipcRenderer.send('auto-sign');

                autoSignInText.innerHTML = '同步中···';
                autoSignInLoading.style.display = 'block';
                autoSignInSuccess.style.display = 'none';
            } else {
                this.finished(Const.SIGN_IN_FINISHED_TYPE);
            }
        } else {
            autoSignInBox.checked = false;
        }

        if (autoListen) {
            autoListenBox.checked = true;

            if (!localStorage.getItem(`listen-${this.getDate()}`)) {
                ipcRenderer.send('auto-listen');

                autoListenText.innerHTML = '正在刷歌';
                autoListenLoading.style.display = 'block';
                autoListenFinished.style.display = 'none';
            } else {
                this.finished(Const.LISTEN_FINISHED_TYPE);
            }
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
        li.classList.remove('loading');
        li.classList.add('finish');
        // const lis = document.querySelectorAll(`#${data.path}`);
        // if (lis && lis.length > 0) {
        //   for (let i = 0; i < lis.length; i++) {
        //     const li = lis[i]
        //     li.classList.remove('loading');
        //     li.classList.add('finish');
        //   }
        //
        // }
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
        ul.innerHTML += str;
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

    getDate() {
        return new Date().toISOString().split('T').shift();
    }

    openDefaultBrowser(url) {
        var exec = require('child_process').exec;
        console.log(process.platform);
        switch (process.platform) {
            case 'darwin':
                exec('open ' + url);
                break;
            case 'win32':
                exec('start ' + url);
                break;
            default:
                exec('xdg-open', [url]);
        }
    }
}

new UploadPreload();
