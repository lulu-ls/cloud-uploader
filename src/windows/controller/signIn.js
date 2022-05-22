const { daily_signin } = require('NeteaseCloudMusicApi');

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

    this.onSetAutoSignInTopic();
  }

  async asyncState() {
    if (!this.getAutoSignIn()) {
      this.logger.info('自动签到未开启');
      return;
    }

    if (!this.check()) {
      try {
        await this.sign();
      } catch (error) {
        return;
      }
    }

    this.signedEvent();
  }

  async sign() {
    return new Promise(async (resolve, reject) => {
      const cookie = this.getCookie();

      const signInRes = await daily_signin({
        cookie,
      });

      // { status: 200, body: { point: 5, code: 200 }, cookie: [] }
      this.logger.info(signInRes);

      if (signInRes && signInRes.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
        // 签到成功
        // signInRes.body.point 所获积分数量
        this.logger.info(`签到成功，获得积分：${signInRes.body.point}`);
        this.setSigned();
        resolve('签到成功');
      } else {
        this.logger.error('签到失败');
        reject('签到失败');
      }
    });
  }

  // 检查是否已签到
  check() {
    const currSignedDate = this.getSigned();
    const now = new Date().toISOString().split('T').shift();
    this.logger.info(
      `上次签到时间：${currSignedDate}, 当前日期：${now}, 是否已签到：${
        currSignedDate === now
      }`
    );

    return now === currSignedDate;
  }

  // 设置已签到
  setSigned() {
    // 记录当前日期
    this.logger.info(
      `记录签到日期成功, ${new Date().toISOString().split('T').shift()}`
    );
    Store.set('signedDate', new Date().toISOString().split('T').shift());
  }

  // 获取已签到日期
  getSigned() {
    return Store.get('signedDate');
  }

  // 获取登录 cookie
  getCookie() {
    return Store.get('cookie');
  }

  // 获取自动签到配置
  getAutoSignIn() {
    return Store.get('autoSignIn');
  }

  // 设置自动签到状态
  setAutoSignIn(flag) {
    if (!flag) {
      flag = false;
    } else {
      flag = true;
    }

    this.logger.info(`设置自动签到成功，值：${flag}`);
    Store.set('autoSignIn', flag);
    // 开始同步状态
    if (flag) {
      this.asyncState();
    }
  }
  //接收自动签到topic
  onSetAutoSignInTopic() {
    PageEvent.on(Const.SIGN_IN_SET_AUTO_EVENT_TOPIC, (flag) => {
      this.setAutoSignIn(flag);
    });
  }

  // sign in event
  signedEvent() {
    this.logger.info('发送签到成功消息');
    PageEvent.emit(Const.SIGN_IN_SIGNED_EVENT_TOPIC);
  }
}

module.exports = SignIn;
