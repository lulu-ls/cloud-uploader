# 网易云音乐上传助手

#### 主要是为了解决 MAC 版本网易云音乐无上传音乐至云盘的功能，感觉很不方便，所以自己用 Electron 写了个工具，同时也希望能帮助到你 ~~

##### 增加了自动签到、自动刷歌 300 首功能，祝你早日成为 10 级大佬 ^ ^

#### 首页

![](https://github.com/lulu-ls/assets/blob/main/main-1.1.1.jpg?row=true)

#### 上传

![](https://github.com/lulu-ls/assets/blob/main/upload-1.1.1.jpg?row=true)

## 使用方法

### 1. 你可以直接点击右侧 Releases 下载打包好的文件直接安装

- mac 用户下载 dmg 文件
- linux 用户下载 deb 文件

### 2. 你可以自己构建项目

```bash
# 先克隆本项目
git clone https://github.com/lulu-ls/cloud-uploader.git
# 进入项目目录
cd cloud-uploader
# 安装相关依赖，这里使用 npm
npm install
# 启动项目，或直接进行下边的构建
npm run start
# 为 mac 系统构建项目（使用的是 electron-builder 默认构建到 dist 目录下）
npm run pkg_mac
# 为 linux 系统构建项目
npm run pkg_linux

```

## 功能

- 登录
- 上传音乐至我的云盘
- 退出登录
- 每日自动签到
- 每日自动刷歌 300 首(大概 1-3 分钟完成)
- 账号密码登录（包含手机号和邮箱）

## 更新日志

- 5/14 新增选择文件夹批量上传，上传间隔随机（缓解批量上传部分可能错误的问题）
- 5/22 新增
- 1. 退出登录
- 2. 自动签到
- 3. 自动刷歌 300 首, 刷歌数据可能会有延迟, 完成后如果没更新, 可以稍后再查看  
     ** 每日自动签到及自动刷歌 300，想了想并没有引入第三方定时库（太大[少则几十到几百个个依赖]且没必要）去做这件事。而是在每次窗口激活，去检查配置及是否已完成操作  
     ** 每日刷歌逻辑，获取用户每日推荐歌单，默认听歌 500 首为止，虽然每日上限 300，因为存在已听歌曲，默认设置了 200 首的冗余，可在配置文件修改
- 6/4 新增账号密码登录  
  \*\* 账号密码登录，所有的密码在调用登录接口之前都会使用 md5 进行加密，但是还是推荐使用二维码登录
- 7.17 修复一些崩溃问题，列表覆盖问题
- 7.23 增加代理功能（目前没提供前端，需要的同学可以修改 const.js - PROXY-ADDRESS 来实现代理，后续如果有必要会加到前端配置），整理代码

## 本项目参考以下资料

### 写法思路和上传的 API 参考下面的项目，感谢大佬~

- [electronic-wechat](https://github.com/geeeeeeeeek/electronic-wechat)
- [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

**刷歌思路参考下面项目**

- [netease-cloud-api](https://github.com/ZainCheung/netease-cloud-api)

### 相关学习资料：

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## 如果有任何疑问或者建议欢迎 ISSUE/PR，也可以加

QQ 群：853469710

## License

#### License [MIT](LICENSE.md)
