const { BrowserWindow } = require('electron');
const path = require('path');
const {
  login_qr_key,
  login_qr_create,
  login_qr_check,
  login_status,
} = require('NeteaseCloudMusicApi');

const Const = require('../../common/const');
const Logger = require('../../common/logger');
const Store = require('../../common/store');
const { PageEvent } = require('../../common/event');

class LoginWindow {
  constructor() {
    this.logger = null;

    this.loginWindow = null;
    this.session = null;
    this.interval = null;

    this.init();
  }

  init() {
    this.logger = new Logger('LoginWindow');

    this.createWindow();
    this.debug();

    this.generateQrCode();

    // test code
    //
    // const img =
    //   'data:image/png;base64,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';
    // this.sendUpdateQrCode(img);
    // this.sendUpdateScanState('登录中...');
  }

  debug() {
    // Open the DevTools.
    if (this.loginWindow && Const.COMMON_DEBUG) {
      this.loginWindow.webContents.openDevTools();
    }
  }

  createWindow() {
    if (this.loginWindow) {
      this.logger.info('登录窗口已注册');
      return;
    }

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
    try {
      const key = await this.qrCodeKey();
      const qrInfo = await this.createQrCode(key);

      this.sendUpdateQrCode(qrInfo.qrimg);
      this.updateQrCodeState(key);
    } catch (error) {
      this.logger.error(error);
    }
  }

  // 注销其实就是清空存储信息
  logout() {
    Store.clear();
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

    this.interval = setInterval(async () => {
      // {
      //   status: 200,
      //   body: {
      //     code: 801,
      //     message: '等待扫码',
      //     cookie: 'NMTID=00O6qTtcwpWsSRZQE2KlAjdg5exwREAAAGAg5Lvtw; Max-Age=315360000; Expires=Thu, 29 Apr 2032 07:01:26 GMT; Path=/;'
      //   },
      //   cookie: [
      //     'NMTID=00O6qTtcwpWsSRZQE2KlAjdg5exwREAAAGAg5Lvtw; Max-Age=315360000; Expires=Thu, 29 Apr 2032 07:01:26 GMT; Path=/;'
      //   ]
      // }

      // {
      //   status: 200,
      //   body: {
      //     code: 803,
      //     message: '授权登陆成功',
      //     cookie: 'MUSIC_R_T=149446871820 .......... Expires=Sat, 20 May 2090 10:31:26 GMT; Path=/openapi/clientlog; HTTPOnly'
      //   },
      //   cookie: [
      //     'MUSIC_R_T=1494468718209; Max-Age=2147483647; Expires=Sat, 20 May 2090 10:31:26 GMT; Path=/weapi/clientlog; HTTPOnly',
      //     '..........',
      //     'MUSIC_A_T=1494468690506; Max-Age=2147483647; Expires=Sat, 20 May 2090 10:31:26 GMT; Path=/openapi/clientlog; HTTPOnly'
      //   ]
      // }
      const stateRes = await login_qr_check({
        key,
      });

      this.logger.info(stateRes);

      if (stateRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
        if (stateRes.body) {
          // 如果登录成功记录 cookie，发送登录成功通知
          if (stateRes.body.code === Const.CLOUD_MUSIC_SCAN_FINISHED_STATUS) {
            Store.set('isLogin', true);
            Store.set('cookie', stateRes.body.cookie);

            clearInterval(this.interval);
            this.loginedEvent();
          }

          // 如果二维码过期自动更新
          if (stateRes.body.code === Const.CLOUD_MUSIC_SCAN_EXPIRE_STATUS) {
            this.generateQrCode();
            return;
          }

          // 更新二维码状态
          if (stateRes.body.code !== Const.CLOUD_MUSIC_SCAN_WAIT_STATUS) {
            this.sendUpdateScanState(stateRes.body.message);
          }
        }
      }
    }, 3000);
  }

  static getCookie() {
    return Store.get('cookie');
  }

  static getIsLogin() {
    return Store.get('isLogin');
  }

  // 检查登录状态
  static async checkLogin() {
    const isLogin = this.getIsLogin();
    const cookie = this.getCookie();

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

  // login event
  loginedEvent() {
    PageEvent.emit(Const.LOGIN_SUCCESS_EVENT_TOPIC);
  }
}

module.exports = LoginWindow;
