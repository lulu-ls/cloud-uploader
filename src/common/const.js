'use strict';
const path = require('path');

// 常量定义
module.exports = {
    // 公共变量
    COMMON_DEBUG: true, // 是否为调试模式

    // 登录窗口
    LOGIN_WINDOW: {
        TITLE: '登录',
        SIZE_WIDTH: 350,
        SIZE_HEIGHT: 550,
        RESIZE: true,
        PRELOAD: path.join(__dirname, '../inject/login.js'),
        LOAD_FILE: path.join(__dirname, '../windows/views/login.html'),
    },
    LOGIN_SUCCESS_EVENT_TOPIC: 'login-success',
    LOGIN_LOGOUT_EVENT_TOPIC: 'login-logout',
    LOGIN_ACCOUNT_TYPE_CODE: 0, // 二维码登录
    LOGIN_ACCOUNT_TYPE_PHONE: 1, // 手机号登录
    LOGIN_ACCOUNT_TYPE_EMAIL: 2, // 邮箱登录

    // 上传窗口
    UPLOAD_WINDOW: {
        TITLE: '上传音乐',
        SIZE_WIDTH: 800,
        SIZE_HEIGHT: 600,
        SIZE_MIN_WIDTH: 350,
        SIZE_MIN_HEIGHT: 550,
        RESIZE: true,
        PRELOAD: path.join(__dirname, '../inject/uploader.js'),
        LOAD_FILE: path.join(__dirname, '../windows/views/uploader.html'),
    },
    // UPLOADER_UPLOAD_INTERVAL_TIME: 100, // 上传间隔，避免频繁请求接口导致失败，也可以用下面这种配置方式
    UPLOADER_UPLOAD_INTERVAL_TIME: {
        // 上传间隔会在 min 和 max 之间随机，更有效的避免频率限制导致的失败
        Min: 1000,
        Max: 3000,
    },

    // 完成通知
    SIGN_IN_FINISHED_TYPE: 1,
    LISTEN_FINISHED_TYPE: 2,

    // 签到模块
    SIGN_IN_SIGNED_EVENT_TOPIC: 'sign-in-success',
    SIGN_IN_START_EVENT_TOPIC: 'sign-in-start',

    // 自动刷歌 300，最好设置大于 300 或者 -1 留一点冗余，因为可能有已听过的，导致刷不够 300
    LISTEN_MAX_COUNT: 350, //每日最多听歌数量，-1 会听完首页每日推荐歌单所有歌曲
    LISTEN_SLEEP_TIME: 100, // 默认 100 毫秒
    LISTEN_ERROR_SLEEP_TIME: 5000, // 刷歌出现接口错误（一般为请求频繁），休息时间
    LISTEN_FINISHED_EVENT_TOPIC: 'listen-finished', // 刷歌完成通知
    LISTEN_START_EVENT_TOPIC: 'listen-start', // 设置自动刷歌通知

    // 网易云音乐api
    CLOUD_MUSIC_SUCCESS_STATUS: 200,
    // 二维码状态
    CLOUD_MUSIC_SCAN_EXPIRE_STATUS: 800,
    CLOUD_MUSIC_SCAN_WAIT_STATUS: 801,
    CLOUD_MUSIC_SCAN_FINISHED_STATUS: 803,

    // 代理地址
    PROXY_ADDRESS: '', // 例：http://127.0.0.1:7891
};
