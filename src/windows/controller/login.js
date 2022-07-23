const BaseWindow = require('./base');
const Api = require('../../common/api');

const Const = require('../../common/const');
const Store = require('../../common/store');
const { PageEvent } = require('../../common/event');
const Tools = require('../../common/tools');

class LoginWindow extends BaseWindow {
  constructor() {
    super();
    this.name = 'LoginWindow';
    this.config = Const.LOGIN_WINDOW;
    this.updateVersion = 0;

    this.init();
  }

  async generateQrCode() {
    this.logger.info('创建登录二维码');

    try {
      const key = await this.qrCodeKey();
      const qrInfo = await this.createQrCode(key);

      this.sendMsg('update-qr-code', qrInfo.qrimg);
      this.updateQrCodeState(key, ++this.updateVersion);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async qrCodeKey() {
    return new Promise(async (resolve, reject) => {
      const cookie = this.session.cookies;

      // 获取 key
      const keyRes = await Api.login_qr_key({
        cookie,
        proxy: Const.PROXY_ADDRESS,
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
      const createRes = await Api.login_qr_create({
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
  async updateQrCodeState(key, ver) {
    // 800 为二维码过期,801 为等待扫码,802 为待确认,803 为授权登录成功(803 状态码下会返回 cookies)

    if (ver < this.updateVersion) {
      this.logger.info(
        `二维码版本过期，终止刷新,ver: ${ver},updateVersion: ${this.updateVersion}`
      );
      return;
    }

    const stateRes = await Api.login_qr_check({
      key,
      proxy: Const.PROXY_ADDRESS,
    });

    this.logger.info(stateRes);

    if (stateRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
      if (stateRes.body) {
        // 更新二维码状态
        if (stateRes.body.code !== Const.CLOUD_MUSIC_SCAN_WAIT_STATUS) {
          this.sendMsg('update-scan-state', stateRes.body.message);
        }

        // 如果登录成功记录 cookie，发送登录成功通知
        if (stateRes.body.code === Const.CLOUD_MUSIC_SCAN_FINISHED_STATUS) {
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
      this.updateQrCodeState(key, ver);
    }, 3000);
  }

  /* 账号密码登录 */
  async accountLogin(accountInfo = {}) {
    const { type, account, password } = accountInfo;
    // this.logger.info(`调用账号密码登录，类型：${type}，账户：${account}`);
    if (type === Const.LOGIN_ACCOUNT_TYPE_CODE) {
      this.generateQrCode();
      return;
    }

    this.updateVersion++;

    const md5Password = Tools.md5(password);

    try {
      if (type === Const.LOGIN_ACCOUNT_TYPE_PHONE) {
        const res = await Api.login_cellphone({
          phone: account,
          md5_password: md5Password,

          proxy: Const.PROXY_ADDRESS,
        });

        this.logger.info(res);

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          Store.set('cookie', res.body.cookie);

          this.loginedEvent();
        }

        this.logger.info('手机登录完成');
        return;
      }

      if (type === Const.LOGIN_ACCOUNT_TYPE_EMAIL) {
        const res = await Api.login({
          email: account,
          md5_password: md5Password,
          proxy: Const.PROXY_ADDRESS,
        });

        this.logger.info(res);

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
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
    const cookie = LoginWindow.getCookie();

    if (!cookie) {
      return false;
    }

    const res = await Api.login_status({ cookie });

    if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
      return true;
    }

    return false;
  }

  static getCookie() {
    return Store.get('cookie');
  }

  // 注销其实就是清空存储信息
  static logout() {
    Store.clear();
  }

  // login event
  loginedEvent() {
    this.updateVersion++;
    PageEvent.emit(Const.LOGIN_SUCCESS_EVENT_TOPIC);
  }
}

module.exports = LoginWindow;

// test code
// new LoginWindow().accountLogin({
//   account: '',
//   type: 1,
//   password: '',
// });
