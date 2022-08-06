const Api = require('../../common/api');

const Const = require('../../common/const');
const Logger = require('../../common/logger');
const Store = require('../../common/store');
const { PageEvent } = require('../../common/event');

class SignIn {
  constructor() {
    this.logger = null;

    this.init();
  }

  init() {
    this.logger = new Logger('SignIn');
  }

  async asyncState() {
    try {
      await this.sign();
    } catch (error) {
      this.logger.error(error);
      return;
    }

    this.signedEvent();
  }

  async sign() {
    return new Promise(async (resolve, reject) => {
      const cookie = this.getCookie();

      const signInRes = await Api.request('daily_signin');

      // { status: 200, body: { point: 5, code: 200 }, cookie: [] }
      this.logger.info(signInRes);

      if (signInRes && signInRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
        // 签到成功
        // signInRes.body.point 所获积分数量
        this.logger.info(`签到成功，获得积分：${signInRes.body.point}`);
        resolve('签到成功');
      } else {
        this.logger.error('签到失败');
        reject('签到失败');
      }
    });
  }

  // 检查是否已签到
  // check() {
  //   const currSignedDate = this.getSigned();
  //   const now = new Date().toISOString().split('T').shift();
  //   this.logger.info(
  //     `上次签到时间：${currSignedDate}, 当前日期：${now}, 是否已签到：${
  //       currSignedDate === now
  //     }`
  //   );

  //   return now === currSignedDate;
  // }

  // 获取登录 cookie
  getCookie() {
    return Store.get('cookie');
  }

  // sign in event
  signedEvent() {
    this.logger.info('发送签到成功消息');
    PageEvent.emit(Const.SIGN_IN_SIGNED_EVENT_TOPIC);
  }
}

module.exports = SignIn;
