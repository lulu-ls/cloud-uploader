# 网易云音乐上传助手

**主要是为了解决 MAC 版本网易云音乐无上传音乐至云盘的功能，感觉很不方便，所以自己用 Electron 写了个工具，同时也希望能帮助到你 ~~**

#### 首页

![](https://github.com/lulu-ls/assets/blob/main/main.png?row=true)

#### 上传

![](https://github.com/lulu-ls/assets/blob/main/upload.png?row=true)

## 使用方法

### 1. 你可以直接点击右侧 Releases 下载打包好的文件直接安装

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
# 构建项目（使用的是 electron-builder 默认构建到 dist 目录下）
npm run pkg_mac

```

## 本项目参考以下资料

### 写法思路和上传的 API 参考下面的项目，感谢大佬~

- [electronic-wechat](https://github.com/geeeeeeeeek/electronic-wechat)
- [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)

### 相关学习资料：

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## 如果有任何疑问或者建议欢迎 PR，也可以加

QQ 群：853469710

## License

#### License [MIT](LICENSE.md)
