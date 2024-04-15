const { app, BrowserWindow, ipcMain,shell } = require('electron');
const axios = require('axios');
const path = require('path');
const exec = require('child_process').exec;

const outputPath = path.join(__dirname, 'outputs');
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
    const postData = {
        model: "gpt-3.5-turbo",
        messages: [{
            role: "user",
            content: `从现在开始直到对话结束,请将我输入给你的内容处理成可用的ffmpeg命令,我会在句首给出输入文件的路径,输出文件请放在${outputPath}下，如果特别指定了输出文件的名字则使用指定的名字，没有指定的话请让文件命名为${getCurrentTimestamp()}.如果需要更改视频的宽度或者高度请记得看会不会变成单数，如果变成了单数请在px上加一。如果用到了-vf命令则请用引号将-vf参数的值括起来以避免特殊字符被解释。如果用到了-ss命令则请将其放置在ffmpeg之后，-i之前的位置以确保FFmpeg会在解码视频之前进行时间截取。只回复ffmpeg命令不回复除此之外的任何东西 ${filePath} ${userCommand}`
        }]
    };
    console.log('Sending POST request with:', postData);
    return axios.post('https://dfsteve.top/ffmpeg.php', postData)
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
ipcMain.handle('generate-ffmpeg-command', async (event, filePath, userCommand) => {
    const ffmpegPath = getFFmpegPath();
    try {
        const command = await generateFFmpegCommand(filePath, userCommand, ffmpegPath);
        const finalCommand = command.replace(/^ffmpeg/, ffmpegPath);
        mainWindow.webContents.send('update-progress', 0);
        handleFFmpegCommand(mainWindow, finalCommand, totalDuration);
        return command;
    } catch (error) {
        console.error(error);
    }
});
let outputWindow;
function createOutputWindow() {
    outputWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    outputWindow.loadFile('ffmpeg_output.html');
}
function handleFFmpegCommand(win, command, totalDuration) {
    const process = exec(command);
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
app.whenReady().then(createOutputWindow); 
function parseTime(timeStr) {
    const parts = timeStr.split(':').map(part => parseFloat(part));
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
