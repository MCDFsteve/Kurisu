process.env.PYTHONIOENCODING = 'utf8';
const { app, BrowserWindow, ipcMain, shell, Menu, globalShortcut, nativeTheme } = require('electron');
const axios = require('axios');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');
const outputPath = path.join(__dirname, 'outputs');
ipcMain.on('console-log', (event, args) => {
    console.log(...args);
});

ipcMain.on('console-error', (event, args) => {
    console.error(...args);
});
function getFFmpegPath() {
    switch (process.platform) {
        case 'darwin':
            return path.join(__dirname, 'ffmpeg/ffmpeg_mac/ffmpeg');
        case 'win32':
            return path.join(__dirname, 'ffmpeg/ffmpeg_win/bin/ffmpeg.exe');
        default:
            throw new Error('Unsupported platform');
    }
}
ipcMain.on('open-output-directory', () => {
    shell.openPath(outputPath).then(() => {
        console.log('Output directory opened successfully');
    }).catch(err => {
        console.error('Failed to open output directory:', err);
    });
});

function generateFFmpegCommand(filePath, userCommand, ffmpegPath) {
    const fileCount = filePath.split(',').length;
    const message1 = "从现在开始直到对话结束,请将我输入给你的内容处理成可用的ffmpeg命令,我会在句首给出";
    const message2 = "命令中请加入-y参数并放在-i之前。更改视频宽度和高度请确认为偶数，若为积数请px+1。如果遇到了使用-vf命令的情况则请用引号包裹-vf参数，-ss命令则请将-ss参数放在-i之前。只回复ffmpeg命令不回复除此之外的任何东西";
    let content;
    if (fileCount > 1) {
        content = `${message1}多个输入文件的路径（逗号隔开）,输入输出文件路径用双引号括起来，请按顺序生成多个ffmpeg命令并使用 || 符号分隔给出，同时输出的文件名字请继承输入的文件名字。默认的输出文件请放在${outputPath}下。${message2} ${filePath} ${userCommand}`;
    } else {
        content = `${message1}输入文件的路径,输入输出文件路径用双引号括起来。默认的输出文件请放在${outputPath}下，、输出文件命名为${getCurrentTimestamp()}（如果在描述里手动指定了新的路径则请使用指定的命名）。${message2} ${filePath} ${userCommand}`;
    }
    const postData = {
        model: "gpt-3.5-turbo",
        temperature: 0.1,
        messages: [{
            role: "user",
            content: content
        }]
    };

    console.log('Sending POST request with:', postData);

    return axios.post('https://dfsteve.top/ffmpeg.php', postData, {
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    })
        .then(response => {
            const command = response.data.choices[0].message.content;
            console.log('Received ffmpeg command:', command);
            return command;
        })
        .catch(error => {
            console.error('Error generating ffmpeg command:', error);
            throw error;
        });
}

function getCurrentTimestamp() {
    const now = new Date();
    return now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') + '_' +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0');
}
const totalDuration = 600; // 假设视频总时长是600秒

// 确保关闭窗口时清理引用
app.on('window-all-closed', () => {
    if (outputWindow !== null) {
        outputWindow.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
ipcMain.handle('generate-ffmpeg-command', async (event, filePathsString, userCommand) => {
    const ffmpegPath = getFFmpegPath();
    try {
        const commandsString = await generateFFmpegCommand(filePathsString, userCommand, ffmpegPath);
        const commands = commandsString.split('||'); // 使用新的分隔符
        console.log("Received ffmpeg commands split by '||':", commands); // 打印拆分后的命令列表

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            mainWindow.webContents.send('update-progress', 0);
            handleFFmpegCommand(mainWindow, command, totalDuration); // 确保传递正确的窗口对象
        }


        return "All commands executed successfully";
    } catch (error) {
        console.error(error);
        throw error;
    }
});


let outputWindow;
function createOutputWindow() {
    outputWindow = new BrowserWindow({
        width: 400,
        height: 300,
        icon: path.join(__dirname, 'window_icon.png'),
        show: false,
        vibrancy: 'sidebar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    outputWindow.setMenu(null);
    let isMac = os.platform() === 'darwin'; // 判断是否是 macOS
    outputWindow.loadFile('ffmpeg_output.html');
    // 将操作系统和主题模式信息发送到渲染进程
    outputWindow.webContents.on('did-finish-load', () => {
        outputWindow.webContents.send('platform-info', { isMac });
    });
    outputWindow.on('close', (event) => {
        if (app.isQuitting) {
            // 允许窗口关闭
            outputWindow = null;
        } else {
            // 阻止窗口关闭，仅仅隐藏窗口
            event.preventDefault();
            outputWindow.hide();
        }
    });
}
function handleFFmpegCommand(win, command, totalDuration) {
    const options = {
        encoding: 'utf8'
    };
    const process = exec(command, options);
    process.stderr.on('data', (data) => {
        // 使用正则表达式匹配时间戳信息
        const match = /time=(\d{2}:\d{2}:\d{2}\.\d{2})/.exec(data);
        if (match) {
            const currentTime = parseTime(match[1]);
            const progress = (currentTime / totalDuration) * 100;
            win.webContents.send('update-progress', progress);
        };
        if (outputWindow) {
            outputWindow.webContents.send('ffmpeg-output', data.toString());
        }
    });
    process.on('exit', (code) => {
        if (outputWindow) {
            outputWindow.webContents.send('ffmpeg-output', `FFmpeg process exited with code ${code}`);
        }
    });
    process.on('close', (code) => {
        win.webContents.send('update-progress', 100); // 处理完成时进度设置为100%
    });
}
app.whenReady().then(() => {
    process.env.PYTHONIOENCODING = 'utf8'; // 强制使用 UTF-8 编码
    if (process.platform === 'darwin') {
        globalShortcut.register('Command+Q', () => {
            app.quit();
        });
    }
    createOutputWindow();
    createWindow();
});
function parseTime(timeStr) {
    const parts = timeStr.split(':').map(part => parseFloat(part));
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

let mainWindow = null;
const menuTemplate = [
    {
        label: '菜单',
        submenu: [
            {
                label: '控制台',
                click: () =>
                    showOutputWindow()
            }
        ]
    }
];
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'window_icon.png'),
        titleBarStyle: 'hiddenInset',
        vibrancy: 'sidebar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    let isMac = os.platform() === 'darwin'; // 判断是否是 macOS
    mainWindow.loadFile('index.html');
    // 将操作系统和主题模式信息发送到渲染进程
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('platform-info', { isMac });
    });
    if (process.platform !== 'darwin') {
        mainWindow.setMenu(null); // 在非 macOS 平台隐藏菜单栏
    } else {
        const menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
    };
    mainWindow.on('close', () => {
        app.isQuitting = true;
    });
    mainWindow.on('closed', () => {
        app.quit(); // 结束应用程序
    });
}
app.whenReady().then(() => {
    app.setAppUserModelId('com.dfsteve.kurisu'); // 设置应用程序的 User Model ID
    app.setBadgeCount(0); // 设置任务栏图标上的计数
    app.dock.setIcon(path.join(__dirname, 'window_icon.png'));
});
app.on('before-quit', () => {
    app.isQuitting = true;
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
ipcMain.on('open-terminal-window', () => {
    showOutputWindow(); // 调用函数来创建窗口
});
function showOutputWindow() {
    if (outputWindow === null) { // 如果窗口不存在，则创建它
        createOutputWindow();
    }
    outputWindow.show(); // 显示窗口
}