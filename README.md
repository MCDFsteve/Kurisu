# Kurisu
## 一个靠口头描述来转换文件格式的程序
### 字面意思，就是口述。
例如，你拖动或者上传了一份mp4，然后你只需在输入框内描述你想干的内容。
像是“转成webm”“只保留视频第10秒到20秒之间的内容”“提取音频文件”“将视频倒放”这类。
然后点击按钮们等待进度条完成就行。
运用了chatgpt和ffmpeg的对接。
请多多尝试。
### 如果你要尝试本地部署，请参照package内的库，逐步进行
```javascript
npm install
```
安装。并前往ffmpeg官网下载对应你操作系统的ffmpeg，放入项目根目录的ffmpeg文件夹下，取名ffmpeg_你的操作系统简称（例如ffmpeg_win ffmpeg_mac）
### macOS用户请注意，直接运行程序会提示已损坏，请在终端输入sudo xattr -dr com.apple.quarantine 程序.app的运行路径（可以从访达拖放），输入密码以后就能正常打开了
<img width="800" alt="image" src="https://github.com/MCDFsteve/Kurisu/assets/71605531/4ee5bab1-84c2-4609-bf66-d4c2a19447af">



