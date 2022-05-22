const {
  recommend_resource,
  user_level,
  playlist_track_all,
  weblog,
  scrobble,
} = require('NeteaseCloudMusicApi');

const Const = require('../../common/const');
const Logger = require('../../common/logger');
const Store = require('../../common/store');
const Tools = require('../../common/tools');
const { PageEvent } = require('../../common/event');

class Listen {
  constructor() {
    this.logger = null;

    this.init();
  }

  async init() {
    this.logger = new Logger('Listen');

    this.onSetAutoListenTopic();
  }

  // 自动刷歌
  async asyncState() {
    if (!this.getAutoListen()) {
      this.logger.info('自动刷歌未开启');
      return;
    }

    if (this.getListening()) {
      this.logger.info('自动刷歌进行中');
      return;
    }

    let listenCount = 0;
    if (!this.check()) {
      this.setListening(true);

      const playList = await this.playList();
      this.logger.info(`本次刷歌歌单列表：${playList}`);

      topLoop: for (let i = 0; i < playList.length; i++) {
        this.logger.info(
          `-------------------当前歌单: < ${playList[i].name} > -------------------`
        );
        const list = await this.playListDetail(playList[i].id);

        for (let k = 0; k < list.length; k++) {
          // 如果已达刷歌上线，则退出循环
          if (
            Const.LISTEN_MAX_COUNT != -1 &&
            listenCount > Const.LISTEN_MAX_COUNT
          ) {
            break topLoop;
          }

          // todo 听歌
          await Tools.sleep(Const.LISTEN_SLEEP_TIME);
          try {
            await this.feedback(list[k]);
            listenCount++;
          } catch (error) {
            this.logger.info(
              `听歌失败，当前歌单：${playList[i].name},休息 ${Const.LISTEN_ERROR_SLEEP_TIME} 毫秒 ^-^`
            );
            this.logger.error('当前歌曲：', list[i]);
            this.logger.error('错误：', error);
            await Tools.sleep(Const.LISTEN_ERROR_SLEEP_TIME);
          }
        }
      }
      this.setListenedDate();
      this.setListening(false);

      this.logger.info(`今日刷歌完成，共计 ${listenCount - 1} 首 ~ ~`);
    }

    this.listenedEvent();
  }

  // 获取歌单
  async playList() {
    return new Promise(async (resolve, reject) => {
      try {
        const cookie = this.getCookie();

        const res = await recommend_resource({
          cookie,
        });

        // { status: 200, body: { point: 5, code: 200 }, cookie: [] }
        this.logger.info(res);

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          // {
          //   status: 200,
          //   body: {
          //     code: 200,
          //     featureFirst: true,
          //     haveRcmdSongs: false,
          //     recommend: [
          //       [Object], [Object],
          //       [Object], [Object],
          //       [Object], [Object],
          //       [Object], [Object]
          //     ]
          //   },
          //   cookie: []
          // }
          this.logger.info(
            `获取每日推荐歌单成功，共计 ${res.body.recommend.length} 个`
          );
          const playList = res.body.recommend.map((v) => {
            return { id: v.id, name: v.name };
          });

          resolve(playList);
        } else {
          this.logger.error('获取每日推荐歌单失败');
          reject('获取每日推荐歌单失败');
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  // 歌单歌曲列表
  async playListDetail(id = 0) {
    return new Promise(async (resolve, reject) => {
      const res = await playlist_track_all({
        id,
      });
      // {
      //   status: 200,
      //   body: {
      //     songs: [
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object]
      //     ],
      //     privileges: [
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object], [Object],
      //       [Object], [Object], [Object]
      //     ],
      //     code: 200
      //   },
      //   cookie: [
      //     'NMTID=Max-Age=315360000; Expires=Wed, 19 May 2032 00:56:57 GMT; Path=/;'
      //   ]
      // }
      this.logger.info(res);

      if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
        this.logger.info(
          `获取歌单详情成功，id ${id} 共计 ${res.body.songs.length} 首歌曲`
        );
        const playSongs = res.body.songs.map((v) => {
          return {
            id: v.id,
            sourceId: id,
            dt: v.dt,
            name: v.name,
          };
        });

        resolve(playSongs);
      } else {
        this.logger.error('获取歌单歌曲列表失败');
        reject('获取歌单歌曲列表失败');
      }
    });
  }

  // 听歌
  async feedback(song = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const { id, sourceId, dt } = song;
        if (!id) {
          return reject('缺少id');
        }

        if (!sourceId) {
          return reject('缺少sourceId');
        }

        if (!dt) {
          return reject('缺少dt');
        }

        const cookie = this.getCookie();

        const res = await scrobble({
          cookie,

          id: song.id,
          sourceid: song.sourceId,
          time: song.dt,
          t: new Date().getTime(),
        });

        this.logger.info(res);

        if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
          this.logger.info(
            `听歌反馈成功, 歌曲信息 ${song.id} 歌曲名称 「${song.name}」`
          );
          resolve();
        } else {
          this.logger.error('听歌反馈失败');
          reject('听歌反馈失败');
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // 获取用户等级信息
  // level() {
  //   return new Promise(async (resolve, reject) => {
  //     const cookie = this.getCookie();

  //     const res = await user_level({
  //       cookie,
  //     });

  //     // {
  //     //   status: 200,
  //     //   body: {
  //     //     full: false,
  //     //     data: {
  //     //       userId: 483508892,
  //     //       info: '60G音乐云盘免费容量$黑名单上限120$云音乐商城满100减12元优惠券$价值1200云贝',
  //     //       progress: 0.9846666666666667,
  //     //       nextPlayCount: 12000,
  //     //       nextLoginCount: 350,
  //     //       nowPlayCount: 11816,
  //     //       nowLoginCount: 350,
  //     //       level: 9
  //     //     },
  //     //     code: 200
  //     //   },
  //     //   cookie: []
  //     // }
  //     this.logger.info(res);

  //     if (res && res.status === Const.CLOUD_MUSIC_SUCCESS_STATUS) {
  //       return resolve(res.body.data);
  //     }

  //     this.logger.error('获取等级信息失败');
  //     reject('获取等级信息失败');
  //   });
  // }

  // 计算提示信息
  // calculateTip(data) {
  //   const {
  //     nextPlayCount,
  //     nowPlayCount,
  //     nextLoginCount,
  //     nowLoginCount,
  //     level,
  //   } = data;

  //   const tips = {
  //     levelTip: `距离十级大佬还有 ${10 - level} 级 ～～`,
  //     levelNextTip: `距离下一级还需要听歌 ${nextPlayCount - nowPlayCount} 首`,
  //     loginNextTip: `距离下一级还需登录 ${nextLoginCount - nowLoginCount} 天`,
  //   };

  //   return {
  //     ...data,
  //     ...tips,
  //   };
  // }

  // 检查是否已刷歌
  check() {
    const currSignedDate = this.getListenedDate();
    const now = new Date().toISOString().split('T').shift();
    this.logger.info(
      `上次刷歌时间：${currSignedDate}, 当前日期：${now}, 是否已刷歌：${
        currSignedDate === now
      }`
    );

    return now === currSignedDate;
  }

  setListening(flag = true) {
    Store.set('listening', flag);
  }

  getListening() {
    return !!Store.get('listening');
  }

  // 设置已听歌
  setListenedDate() {
    // 记录当前日期
    this.logger.info(
      `记录听歌日期成功, ${new Date().toISOString().split('T').shift()}`
    );
    Store.set('listenedDate', new Date().toISOString().split('T').shift());
  }

  // 获取已听歌日期
  getListenedDate() {
    return Store.get('listenedDate');
  }

  // 获取自动听歌
  getAutoListen() {
    return Store.get('autoListen');
  }

  // 设置自动听歌状态
  setAutoListen(flag) {
    if (!flag) {
      flag = false;
    } else {
      flag = true;
    }

    this.logger.info(`设置自动听歌成功，值：${flag}`);
    Store.set('autoListen', flag);
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

  // 获取登录 cookie
  getCookie() {
    return Store.get('cookie');
  }

  //接收自动刷歌 topic
  onSetAutoListenTopic() {
    PageEvent.on(Const.LISTEN_SET_AUTO_EVENT_TOPIC, (flag) => {
      this.setAutoListen(flag);
    });
  }

  // listen in event
  listenedEvent() {
    this.logger.info('发送听歌完成消息');
    PageEvent.emit(Const.LISTEN_FINISHED_EVENT_TOPIC);
  }
}

module.exports = Listen;
