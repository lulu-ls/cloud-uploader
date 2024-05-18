const Logger = require('./logger');
const Store = require('./store');
const Const = require('./const');

const CloudApi = require('NeteaseCloudMusicApi');

class Api {
    constructor() {
        this.logger = null;
        this.proxy = undefined;
        this.cookie = '';

        this.init();
    }

    init() {
        this.logger = new Logger('UploaderWindow');

        this.proxy = this.getProxy() || Const.PROXY_ADDRESS;
        this.cookie = this.getCookie();
    }

    // 待优化
    request(name = '', option = {}) {
        if (name === '') {
            return;
        }
        option.proxy = this.proxy;
        this.cookie = this.getCookie(); // 重新获取cookie
        option.cookie = this.cookie;

        if (!CloudApi[name]) {
            this.logger.error('api 不存在，请检查方法名称');
            return;
        }

        return CloudApi[name](option);
    }

    getCookie() {
        return Store.get('cookie');
    }

    getProxy() {
        return Store.get('proxy');
    }
}

const ApiInstance = new Api();

module.exports = ApiInstance;
