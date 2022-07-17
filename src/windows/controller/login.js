const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
  login_qr_key,
  login_qr_create,
  login_qr_check,
  login_status,

  login_cellphone,
  login,
} = require('NeteaseCloudMusicApi');

const Const = require('../../common/const');
const Logger = require('../../common/logger');
const Store = require('../../common/store');
const { PageEvent } = require('../../common/event');
const Tools = require('../../common/tools');
const Config = require('../../common/config');

class LoginWindow {
  constructor() {
    this.logger = null;

    this.loginWindow = null;
    this.session = null;

    this.init();
    // this.accountLogin();
  }

  async init() {
    this.logger = new Logger('LoginWindow');

    this.createWindow();
    this.debug();

    this.initIPCOn();

    if (Config.getLoginType() === Const.LOGIN_ACCOUNT_TYPE_CODE) {
      await Tools.sleep();
      this.generateQrCode();
    }
  }

  debug() {
    // Open the DevTools.
    if (this.loginWindow && Const.COMMON_DEBUG) {
      this.loginWindow.webContents.openDevTools();
    }
  }

  // 初始化事件监听
  initIPCOn() {
    // ipcMain;
    ipcMain.on('login-type-change', (event, data) => {
      this.logger.log('receive login-type-change event! type: ' + data);
      this.changeLoginType(data);
    });

    ipcMain.on('login-by-account', (event, data) => {
      this.logger.log('receive login-by-account event!', data);
      data.type = LoginWindow.getLoginType();
      this.accountLogin(data);
    });
  }

  ipcRemove() {
    ipcMain.removeAllListeners('login-type-change');
    ipcMain.removeAllListeners('login-by-account');
  }

  // 发送配置到前端
  sendLoginType() {
    this.loginWindow.webContents.send('login-type', Config.getLoginType());
  }

  // 更换登录类型
  changeLoginType(type) {
    switch (type) {
      case Const.LOGIN_ACCOUNT_TYPE_CODE:
        LoginWindow.setLoginType(Const.LOGIN_ACCOUNT_TYPE_CODE);
        this.generateQrCode();
        break;
      case Const.LOGIN_ACCOUNT_TYPE_PHONE:
        LoginWindow.setLoginType(Const.LOGIN_ACCOUNT_TYPE_PHONE);
        break;
      case Const.LOGIN_ACCOUNT_TYPE_EMAIL:
        LoginWindow.setLoginType(Const.LOGIN_ACCOUNT_TYPE_EMAIL);
        break;
      default:
        this.logger.error('登录类型未知，设置失败');
    }

    this.sendLoginType();
  }

  createWindow() {
    if (this.loginWindow) {
      this.logger.info('登录窗口已注册');
      return;
    }

    this.logger.info('注册登录窗口');

    // 登录
    this.loginWindow = new BrowserWindow({
      title: Const.LOGIN_WINDOW_TITLE,
      resizable: false,
      // icon: path.join(__dirname, '../../../assets/icon.png'),
      width: Const.LOGIN_WINDOW_SIZE_WIDTH,
      height: Const.LOGIN_WINDOW_SIZE_HEIGHT,

      webPreferences: {
        preload: path.join(__dirname, '../../inject/login.js'),
      },
    });

    this.loginWindow.loadFile(path.join(__dirname, '../views/login.html'));

    this.session = this.loginWindow.webContents.session;
  }

  show() {
    this.loginWindow.show();
    this.loginWindow.focus();
    this.init();
  }

  hide() {
    this.loginWindow.hide();
  }

  sendUpdateQrCode(data) {
    this.loginWindow.webContents.send('update-qr-code', data);
  }

  sendUpdateScanState(data) {
    this.loginWindow.webContents.send('update-scan-state', data);
  }

  async generateQrCode() {
    this.logger.info('创建登录二维码');

    try {
      const key = await this.qrCodeKey();
      const qrInfo = await this.createQrCode(key);

      this.sendUpdateQrCode(qrInfo.qrimg);
      this.updateQrCodeState(key);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async qrCodeKey() {
    return new Promise(async (resolve, reject) => {
      const cookie = this.session.cookies;

      // 获取 key
      // {
      //   status: 200,
      //   body: {
      //     data: { code: 200, unikey: 'cd492ac4-e174-433a-bf2f-6a6519e27098' },
      //     code: 200
      //   },
      //   cookie: [
      //     'NMTID=00OCzjCPzSj-UT3-E6FhMe4JODoJEUAAAGAek68Gg; Max-Age=315360000; Expires=Tue, 27 Apr 2032 11:50:21 GMT; Path=/;'
      //   ]
      // }
      const keyRes = await login_qr_key({
        cookie,
      });

      this.logger.info(keyRes);

      if (keyRes && keyRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
        // 获取二维码
        if (keyRes.body && keyRes.body.data && keyRes.body.data.unikey) {
          resolve(keyRes.body.data.unikey);
        } else {
          this.logger.error('获取 union key 失败[1]');
          reject('获取 union key 失败[1]');
        }
      } else {
        this.logger.error('获取 union key 失败[2]');
        reject('获取 union key 失败[2]');
      }
    });
  }

  async createQrCode(key) {
    return new Promise(async (resolve, reject) => {
      //{
      //   code: 200,
      //   status: 200,
      //   body: {
      //     code: 200,
      //     data: {
      //       qrurl: 'https://music.163.com/login?codekey=undefined',
      //       qrimg: 'data:image/png;base64,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'
      //     }
      //   }
      // }

      const createRes = await login_qr_create({
        key,
        qrimg: true,
      });

      this.logger.info(createRes);

      if (createRes && createRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
        if (createRes.body && createRes.body.data && createRes.body.data) {
          resolve(createRes.body.data);
        } else {
          this.logger.error('获取 qr code image 失败[1]');
          reject('获取 qr code image 失败[1]');
        }
      } else {
        this.logger.error('获取 qr code image 失败[2]');
        reject('获取 qr code image 失败[2]');
      }
    });
  }

  // 查看并更新扫码状态
  async updateQrCodeState(key) {
    // 800 为二维码过期,801 为等待扫码,802 为待确认,803 为授权登录成功(803 状态码下会返回 cookies)

    const stateRes = await login_qr_check({
      key,
    });

    this.logger.info(stateRes);

    if (stateRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
      if (stateRes.body) {
        // 更新二维码状态
        if (stateRes.body.code !== Const.CLOUD_MUSIC_SCAN_WAIT_STATUS) {
          this.sendUpdateScanState(stateRes.body.message);
        }

        // 如果登录成功记录 cookie，发送登录成功通知
        if (stateRes.body.code === Const.CLOUD_MUSIC_SCAN_FINISHED_STATUS) {
          Store.set('isLogin', true);
          Store.set('cookie', stateRes.body.cookie);

          this.loginedEvent();
          return;
        }

        // 如果二维码过期自动更新
        if (stateRes.body.code === Const.CLOUD_MUSIC_SCAN_EXPIRE_STATUS) {
          this.generateQrCode();
          return;
        }
      }
    }

    setTimeout(() => {
      this.updateQrCodeState(key);
    }, 3000);
  }

  /* 账号密码登录 */
  async accountLogin(accountInfo = {}) {
    const { type, account, password } = accountInfo;
    // this.logger.info(`调用账号密码登录，类型：${type}，账户：${account}`);

    const md5Password = Tools.md5(password);

    try {
      if (type === Const.LOGIN_ACCOUNT_TYPE_PHONE) {
        const res = await login_cellphone({
          phone: account,
          md5_password: md5Password,
        });

        this.logger.info(res);

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          Store.set('isLogin', true);
          Store.set('cookie', res.body.cookie);

          this.loginedEvent();
        }

        this.logger.info('手机登录完成');
        return;
      }

      if (type === Const.LOGIN_ACCOUNT_TYPE_EMAIL) {
        const res = await login({
          email: account,
          md5_password: md5Password,
        });

        this.logger.info(res);

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          Store.set('isLogin', true);
          Store.set('cookie', res.body.cookie);

          this.loginedEvent();
        }

        this.logger.info('邮箱登录完成');
        return;
      }

      this.logger.error('登录类型未知');
    } catch (error) {
      this.logger.error('登录失败，error：', error);
      Tools.dialog(this.uploaderWindow, {
        detail: '登录失败，请检查账号密码',
      });
    }
  }

  // 检查登录状态
  static async checkLogin() {
    const isLogin = LoginWindow.getIsLogin();
    const cookie = LoginWindow.getCookie();

    if (!isLogin || !cookie) {
      return false;
    }

    // {
    //   status: 200,
    //   body: { data: { code: 200, account: [Object], profile: [Object] } },
    //   cookie: []
    // }
    const res = await login_status({ cookie });

    if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
      return true;
    }

    return false;
  }

  static getCookie() {
    return Store.get('cookie');
  }

  static getIsLogin() {
    return Store.get('isLogin');
  }

  static getLoginType() {
    return Store.get('loginType');
  }

  static setLoginType(type) {
    return Store.set('loginType', type);
  }

  // 注销其实就是清空存储信息
  static async logout() {
    // 登录类型不清除
    // const loginType = LoginWindow.getLoginType();
    Store.clear();
    // Store.delete()
    // setTimeout(() => {
    //   try {
    //     LoginWindow.setLoginType(loginType);
    //   } catch (error) {
    //     Logger.def(error);
    //   }
    // }, 0);
  }

  // login event
  loginedEvent() {
    PageEvent.emit(Const.LOGIN_SUCCESS_EVENT_TOPIC);
  }

  destroy() {
    this.ipcRemove();
  }
}

module.exports = LoginWindow;

// test code
// new LoginWindow().accountLogin({
//   account: '',
//   type: 1,
//   password: '',
// });
