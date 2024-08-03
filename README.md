# Kurisu
## 一个靠口头描述来转换文件格式的程序
### 字面意思，就是口述。
例如，你拖动或者上传了一份mp4，然后你只需在输入框内描述你想干的内容。
像是“转成webm”“只保留视频第10秒到20秒之间的内容”“提取音频文件”“将视频倒放”这类。
然后点击按钮们等待进度条完成就行。
运用了ChatGPT和FFmpeg的对接。
请多多尝试。

### ChatGPT使用了4o，它是免费提供使用的。如果您想进行赞助，可以前往 https://store.steampowered.com/app/3034460/ 购买此软件的Steam版本，此版本可以享受到创意工坊功能，社区以及自动更新。

FFmpeg来自 https://ffmpeg.org/ 使用了官网编译好的二进制可执行文件

如果你想自己编译项目或者修改项目，请在拉取项目以后对照<code>package.json</code>内对所需要的库进行<code>npm install</code>拉取。

### macOS用户请注意，直接运行程序会提示已损坏，请在终端输入sudo xattr -dr com.apple.quarantine 程序.app的运行路径（可以从访达拖放），输入密码以后就能正常打开了
<img width="800" alt="image" src="https://github.com/MCDFsteve/Kurisu/assets/71605531/4ee5bab1-84c2-4609-bf66-d4c2a19447af">



