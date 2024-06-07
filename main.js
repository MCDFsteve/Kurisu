process.env.PYTHONIOENCODING = 'utf8';
let isMac = process.platform === 'darwin';
let outputWindow;
let biruWindow;
let totalDuration = 600; // 假设视频总时长是600秒
let mainWindow = null;
const { app, BrowserWindow, ipcMain, shell, screen,Menu, globalShortcut, dialog, } = require('electron');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');
// 定义原始 messages 文件夹的路径
const originalMessagesPath = path.join(__dirname, 'messages');
const originaldefaultPath = path.join(__dirname, 'messages', 'default.json');
// 定义目标路径，即用户下载文件夹下的 kurisu 文件夹
const downloadsPath = app.getPath('userData');
const kurisuPath = path.join(downloadsPath, 'kurisu');
const messagesFolderPath = path.join(kurisuPath, 'messages');
const messagesPath = path.join(messagesFolderPath, 'message.json');
const defaultPath = path.join(messagesFolderPath, 'default.json');
const targetMessagesPath = path.join(kurisuPath, 'messages');
const ffmpegmac = path.join(__dirname, 'ffmpeg', 'ffmpeg_mac');
const ffmpeglinux64 = path.join(__dirname, 'ffmpeg', 'ffmpeg_linux64');
const ffmpeglinuxarm = path.join(__dirname, 'ffmpeg', 'ffmpeg_linuxarm');
const ffmpegwin = path.join(__dirname, 'ffmpeg', 'ffmpeg_win', 'bin', 'ffmpeg.exe')
const https = require('https');
// 假设配置文件路径
const configFilePath = path.join(kurisuPath, 'kirusu-config.json');
const menuTemplate = [
    {
        label: '菜单',
        submenu: [
            {
                label: '关于',
                click: () =>
                    showBiruWindow()
            },
            {
                label: '设置',
                click: () =>
                    showSettingsWindow()
            },
            {
                label: '控制台',
                click: () =>
                    showOutputWindow()
            }
        ]
    }
];
// 忽略证书错误
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// 确保关闭窗口时清理引用
app.on('window-all-closed', () => {
    if (outputWindow !== null) {
        outputWindow.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.whenReady().then(() => {
    process.env.PYTHONIOENCODING = 'utf8'; // 强制使用 UTF-8 编码
    let kurisucachePath;
    if (process.platform === 'win32') {
        // 使用 __dirname 获取当前执行目录并拼接 C:\
        kurisucachePath = path.join(__dirname, 'kurisu.json');
    } else {
        kurisucachePath = path.join(os.homedir(), 'Downloads', 'kurisu.json');
    }
    const data = { downloadsPath };
    fs.writeFileSync(kurisucachePath, JSON.stringify(data, null, 2), 'utf8');
    syncMessagesWithDefault();
    // 注册全局快捷键 Command + Q
    const ret = globalShortcut.register('CommandOrControl+Q', () => {
        const allWindows = BrowserWindow.getAllWindows();
        const isAnyWindowFocused = allWindows.some(win => win.isFocused());

        if (isAnyWindowFocused) {
            // 结束应用程序
            app.quit();
        }
    });
    // 检查注册快捷键的状态
    if (!ret) {
        console.error('Registration failed');
    }
    moveMessagesToKurisu();
    createOutputWindow();
    createBiruWindow();
    createOutputDirectory();
    createSettingsWindow();
    createWindow();
});
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
ipcMain.on('open-settings-window', () => {
    showSettingsWindow(); // 调用函数来创建窗口
});
ipcMain.on('open-biru-window', () => {
    showBiruWindow(); // 调用函数来创建窗口
});
ipcMain.handle('generate-ffmpeg-command', async (event, filePathsString, userCommand) => {
    const ffmpegPath = getFFmpegPath();
    try {
        const commandsString = await generateFFmpegCommand(filePathsString, userCommand, `"${ffmpegPath}"`);
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
ipcMain.on('console-log', (event, args) => {
    console.log(...args);
});
ipcMain.on('console-error', (event, args) => {
    console.error(...args);
});
ipcMain.on('open-output-directory', () => {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));  // 从配置文件读取最新的配置
    const outputPath = config.outputPath;  // 使用最新的输出路径

    shell.openPath(outputPath).then(() => {
        console.log('Output directory opened successfully:', outputPath);
    }).catch(err => {
        console.error('Failed to open output directory:', err);
    });
});
ipcMain.on('update-naming-rule', (event, namingRule) => {
    const config = getConfig();
    config.namingRule = namingRule;
    updateConfigFile(config);
});
ipcMain.on('request-settings', (event) => {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));  // 从配置文件读取最新的配置
    event.sender.send('settings-data', config);
});
ipcMain.on('reset-output-directory-to-default', (event) => {
    const defaultOutputPath = getDefaultOutputPath();  // 获取默认输出路径
    updateConfigFile({ outputPath: defaultOutputPath });
    event.sender.send('output-path-updated', defaultOutputPath);  // 通知渲染进程更新显示
});
ipcMain.on('close-main-window', () => {
    if (mainWindow) {
        app.quit();
    }
});
ipcMain.on('fullscreen-window', () => {
    if (mainWindow) {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        animateWindowResize(mainWindow, width, height,200);
    }
});
ipcMain.on('restore-window', () => {
    if (mainWindow) {
        animateWindowResize(mainWindow, 800, 600,200);
    }
});
ipcMain.on('minimize-window', (event) => {
    if (mainWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    }
});
///
ipcMain.on('close-biru-window', () => {
    if (biruWindow) {
        biruWindow.close();
    }
});
ipcMain.on('fullscreen-biru-window', () => {
    if (biruWindow) {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        animateWindowResize(biruWindow, width, height,200);
    }
});
ipcMain.on('restore-biru-window', () => {
    if (biruWindow) {
        animateWindowResize(biruWindow, 500, 400,200);
    }
});
ipcMain.on('minimize-biru-window', (event) => {
    if (biruWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    }
});
///
ipcMain.on('close-output-window', () => {
    if (outputWindow) {
        outputWindow.close();
    }
});
ipcMain.on('fullscreen-output-window', () => {
    if (outputWindow) {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        animateWindowResize(outputWindow, width, height,200);
    }
});
ipcMain.on('restore-output-window', () => {
    if (outputWindow) {
        animateWindowResize(outputWindow, 400, 300,200);
    }
});
ipcMain.on('minimize-output-window', (event) => {
    if (outputWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    }
});
///
ipcMain.on('close-settings-window', () => {
    if (settingsWindow) {
        settingsWindow.close();
    }
});
ipcMain.on('fullscreen-settings-window', () => {
    if (settingsWindow) {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        animateWindowResize(settingsWindow, width, height,200);
    }
});
ipcMain.on('restore-settings-window', () => {
    if (settingsWindow) {
        animateWindowResize(settingsWindow, 500, 500,200);
    }
});
ipcMain.on('minimize-settings-window', (event) => {
    if (settingsWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    }
});
ipcMain.on('request-current-output-path', (event) => {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));  // 从配置文件读取最新的配置
    const outputPath = config.outputPath;  // 使用最新的输出路径
    event.sender.send('current-output-path', outputPath);  // 假设outputPath是你存储输出路径的变量
});
ipcMain.on('open-output-directory-dialog', (event) => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const newOutputPath = result.filePaths[0];
            updateConfigFile({ outputPath: newOutputPath });
            event.sender.send('output-path-updated', newOutputPath);
        }
    });
});
function moveMessagesToKurisu() {

    // 创建 kurisu 目录如果它不存在
    if (!fs.existsSync(kurisuPath)) {
        fs.mkdirSync(kurisuPath, { recursive: true });
        console.log('Kurisu directory created at:', kurisuPath);
    }

    // 检查目标 messages 目录是否已存在
    if (!fs.existsSync(targetMessagesPath)) {
        // 将 messages 文件夹复制到目标路径
        fs.copySync(originalMessagesPath, targetMessagesPath);
        console.log('Messages directory moved to:', targetMessagesPath);
    } else {
        console.log('Messages directory already exists at:', targetMessagesPath);
    }
    // 直接复制 default.json 文件到目标目录，覆盖已有文件
    const sourceDefaultJson = path.join(originalMessagesPath, 'default.json');
    const targetDefaultJson = path.join(targetMessagesPath, 'default.json');
    fs.copyFileSync(sourceDefaultJson, targetDefaultJson);
    console.log('Default settings file copied to:', targetDefaultJson);
}
function createOutputDirectory() {
    let outputPath;

    // 尝试从配置文件读取输出目录
    if (fs.existsSync(configFilePath)) {
        const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        outputPath = config.outputPath;
    }

    // 如果配置文件不存在或没有输出目录，则创建默认目录
    if (!outputPath) {
        namingRule = 'timestamp';
        outputPath = path.join(downloadsPath, 'kurisu', 'outputs');
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
            console.log('Output directory created at:', outputPath);
        }
        // 更新配置文件
        updateConfigFile({ outputPath: outputPath, namingRule: namingRule });
    }

    return outputPath;
}
function updateConfigFile(settings) {
    const config = fs.existsSync(configFilePath) ? JSON.parse(fs.readFileSync(configFilePath, 'utf8')) : {};

    // 更新配置文件中的每个设置，而不是替换整个配置对象
    Object.keys(settings).forEach(key => {
        config[key] = settings[key];
    });

    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
}
function animateWindowResize(window, targetWidth, targetHeight, duration) {
    const currentBounds = window.getBounds();
    const startTime = Date.now();
    const initialX = currentBounds.x;
    const initialY = currentBounds.y;
    const initialWidth = currentBounds.width;
    const initialHeight = currentBounds.height;
    const steps = Math.round(duration / 16.67); // 大约每秒 60 帧
    const stepWidth = (targetWidth - initialWidth) / steps;
    const stepHeight = (targetHeight - initialHeight) / steps;
    const stepX = (targetWidth - initialWidth) / (2 * steps);
    const stepY = (targetHeight - initialHeight) / (2 * steps);

    function step() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = easeInOutQuad(progress);

        const newWidth = initialWidth + (targetWidth - initialWidth) * easeProgress;
        const newHeight = initialHeight + (targetHeight - initialHeight) * easeProgress;
        const newX = initialX - (newWidth - initialWidth) / 2;
        const newY = initialY - (newHeight - initialHeight) / 2;

        window.setBounds({
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        });

        if (progress < 1) {
            setTimeout(step, 16.67); // 使用 setTimeout 来模拟 requestAnimationFrame 的效果
        } else {
            window.setBounds({
                width: targetWidth,
                height: targetHeight,
                x: Math.round((screen.getPrimaryDisplay().workAreaSize.width - targetWidth) / 2),
                y: Math.round((screen.getPrimaryDisplay().workAreaSize.height - targetHeight) / 2)
            });
        }
    }

    setTimeout(step, 16.67); // 初始调用
}
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function syncMessagesWithDefault() {
    // 检查 message.json 文件是否存在
    if (!fs.existsSync(messagesPath)) {
        // 如果不存在，从 default.json 读取内容并创建 message.json
        fs.readFile(originaldefaultPath, { encoding: 'utf8' }, (err, defaultData) => {
            if (err) {
                console.error('读取 default.json 文件时出错:', err);
                return;
            }
            // 将 default.json 的内容写入新创建的 message.json
            fs.writeFile(messagesPath, defaultData, { encoding: 'utf8' }, (err) => {
                if (err) {
                    console.error('创建 message.json 文件时出错:', err);
                } else {
                    console.log('message.json 文件已创建并初始化');
                }
            });
        });
    } else {
        // 如果文件已存在，执行现有的同步逻辑
        fs.readFile(messagesPath, { encoding: 'utf8' }, (err, messageData) => {
            if (err) {
                console.error('读取 message.json 文件时出错:', err);
                return;
            }
            fs.readFile(defaultPath, { encoding: 'utf8' }, (err, defaultData) => {
                if (err) {
                    console.error('读取 default.json 文件时出错:', err);
                    return;
                }

                const messages = JSON.parse(messageData);
                const defaults = JSON.parse(defaultData);
                const messagesById = new Map(messages.map(msg => [msg.id, msg]));
                let updated = false;

                defaults.forEach(def => {
                    const correspondingMessage = messagesById.get(def.id);
                    if (!correspondingMessage || correspondingMessage.message !== def.message || correspondingMessage.tips !== def.tips) {
                        if (correspondingMessage) {
                            correspondingMessage.message = def.message;
                            correspondingMessage.tips = def.tips;
                        } else {
                            messages.push(def);
                        }
                        updated = true;
                    }
                });

                if (updated) {
                    fs.writeFile(messagesPath, JSON.stringify(messages, null, 2), (err) => {
                        if (err) {
                            console.error('写入更新的 message.json 文件时出错:', err);
                        } else {
                            console.log('message.json 文件已更新');
                        }
                    });
                }
            });
        });
    }
}
function getConfig() {
    if (fs.existsSync(configFilePath)) {
        const configData = fs.readFileSync(configFilePath, 'utf8');
        return JSON.parse(configData);
    } else {
        // 如果配置文件不存在，返回默认配置
        const defaultConfig = {
            outputPath: getDefaultOutputPath(),
            namingRule: 'timestamp' // 默认命名规则
        };
        updateConfigFile(defaultConfig); // 创建配置文件
        return defaultConfig;
    }
}
function generateFileName(originalName) {
    const config = getConfig();
    if (config.namingRule === 'timestamp') {
        return getCurrentTimestamp();
    } else {
        return originalName;
    }
}
function getFFmpegPath() {
    switch (os.platform()) {
        case 'darwin': // macOS
            return path.join(ffmpegmac);
        case 'win32': // Windows
            return path.join(ffmpegwin);
        case 'linux': // Linux
            const arch = os.arch();
            if (arch === 'x64') {
                return path.join(ffmpeglinux64);
            } else if (arch === 'arm64') {
                return path.join(ffmpeglinuxarm);
            } else {
                throw new Error('Unsupported Linux architecture: ' + arch);
            }
        default:
            throw new Error('Unsupported platform');
    }
}
function generateFFmpegCommand(filePath, userCommand, ffmpegPath) {
    const originalFileName = path.basename(filePath, path.extname(filePath)); // 获取不含路径和后缀的文件名
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));  // 从配置文件读取最新的配置
    const outputPath = config.outputPath;  // 使用最新的输出路径
    const filePaths = filePath.split('？').map(fp => fp.trim());
    // 检查 default.json 文件中的命令
    const defaultPath = path.join(messagesFolderPath, 'default.json');
    if (fs.existsSync(defaultPath)) {
        const defaultData = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
        const selectedMessage = defaultData.find(item => item.message === userCommand);
        if (selectedMessage && selectedMessage.command) {
            // 处理 ${.gif} 这样的占位符
            let commands = filePaths.map((fp, index) => {
                let command = selectedMessage.command.replace('${filePath}', `"${fp.trim()}"`);
                const fileBaseName = path.basename(fp.trim(), path.extname(fp.trim()));
                let outputFileName;
                const match = selectedMessage.command.match(/\$\{(\.\w+)\}/);
                if (match) {
                    // 如果提供了后缀名占位符，则使用它替换输入文件的后缀名
                    outputFileName = generateFileName(fileBaseName) + match[1];
                } else {
                    // 否则继承输入文件的后缀名
                    outputFileName = generateFileName(fileBaseName) + path.extname(fp.trim());
                }
                command = command.replace('${outputPath}', `"${path.join(outputPath, outputFileName)}"`);
                command = command.replace(/\$\{\.\w+\}/, ''); // 移除后缀占位符
                const ffmpegExecutablePath = getFFmpegPath();
                command = command.replace(/ffmpeg/g, `"${ffmpegExecutablePath}"`);
                return command;
            }).join(' || ');
            outputWindow.webContents.send('ffmpeg-output', 'Received ffmpeg command: ' + commands);
            console.log('Using predefined command:', commands);
            return Promise.resolve(commands);
        }
    }
    const message1 = "从现在开始直到对话结束,请将我输入给你的内容处理成可用的ffmpeg命令，因此请务必在最开头写上ffmpeg,我会在句首给出";
    const message2 = "命令中请加入-y参数并放在-i之前。更改视频宽度和高度请确认为偶数，若为积数请px+1。如果遇到了使用-vf命令的情况则请用引号包裹-vf参数，-ss命令则请将-ss参数放在-i之前。只回复ffmpeg命令不回复除此之外的任何东西";
    let content;
    console.log('filePaths:',filePaths);
    if (filePaths.length > 1) {
        content = `${message1}多个输入文件的路径（逗号隔开）,输入输出文件路径用双引号括起来，请按顺序生成多个ffmpeg命令并使用 || 符号分隔给出，同时输出的文件名字请继承输入的文件名字。默认的输出文件请放在${outputPath}下。${message2} "${filePath}" ${userCommand}`;
    } else {
        content = `${message1}输入文件的路径,输入输出文件路径用双引号括起来。默认的输出文件请放在${outputPath}下，、输出文件命名为${generateFileName(originalFileName)}（如果在描述里手动指定了新的路径则请使用指定的命名）。没指定输出文件的后缀名的情况则和输入文件一样。${message2} "${filePath}" ${userCommand}`;
    }

    const postData = JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0.9,
        messages: [{
            role: "user",
            content: JSON.stringify(content) // 将content转换为字符串
        }]
    });

    const options = {
        hostname: 'ffmpeg.dfsteve.top',
        path: '/ffmpeg.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    console.log('Sending POST request with:', postData);

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    let command = response.choices[0].message.content;
                    command = command.replace(/\\\\/g, "\\");
                    const ffmpegExecutablePath = getFFmpegPath();
                    command = command.replace(/ffmpeg/g, `"${ffmpegExecutablePath}"`);
                    console.log('Received ffmpeg command:', command);
                    if (outputWindow) {
                        outputWindow.webContents.send('ffmpeg-output', 'Received ffmpeg command: ' + command);
                    }
                    resolve(command);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
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

function getDefaultOutputPath() {
    const defaultOutputPath = path.join(downloadsPath, 'kurisu', 'outputs');
    if (!fs.existsSync(defaultOutputPath)) {
        fs.mkdirSync(defaultOutputPath, { recursive: true });
    }
    return defaultOutputPath;
}
function getMediaDuration(filePath, callback) {
    const ffmpegExecutablePath = getFFmpegPath();  // 获取正确的ffmpeg路径
    const command = `"${ffmpegExecutablePath}" -i "${filePath}" 2>&1`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing ffmpeg:', error);
            return callback(error, null);
        }

        // 使用正则表达式从 stderr 中提取时长
        const durationPattern = /Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/;
        const match = durationPattern.exec(stderr);
        if (match && match[1]) {
            const duration = parseTime(match[1]);
            callback(null, duration);
        } else {
            callback(new Error('Duration not found'), null);
        }
    });
}
function handleFFmpegCommand(win, command, totalDuration) {
    const options = { encoding: 'utf8' };
    const process = exec(command, options);
    ipcMain.on('stop-ffmpeg', () => {
        if (process) {
            process.kill('SIGTERM');  // 发送终止信号
            console.log('killed');
        }
    });
    process.stderr.on('data', (data) => {
        const dataString = data.toString();
        // 提取和更新持续时间
        const durationMatch = dataString.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (durationMatch) {
            totalDuration = parseTime(durationMatch[1]);
            console.log('Total Duration:', totalDuration);  // 打印总持续时间
        }
        // 在这里可以添加额外的错误日志处理
        const match = /time=(\d{2}:\d{2}:\d{2}\.\d{2})/.exec(data);
        if (match) {
            const currentTime = parseTime(match[1]);
            const progress = (currentTime / totalDuration) * 100;
            console.log('Total Duration:', progress);
            win.webContents.send('update-progress', progress);
        };
        if (outputWindow) {
            outputWindow.webContents.send('ffmpeg-output', data.toString());
        }
    });

    process.on('exit', (code) => {
        if (code !== 0 && code !== 255) {
            console.error(`FFmpeg process exited with code ${code}`);
            win.webContents.send('ffmpeg-error', `100% 失败了失败了失败了失败了：code ${code}`);
        } else if (code == 255) {
            win.webContents.send('ffmpeg-stop', `啊！突然叫我停下是闹哪般？`);
        }else {
            win.webContents.send('update-progress', 100);
        }
        if (outputWindow) {
            outputWindow.webContents.send('ffmpeg-output', `FFmpeg process exited with code ${code}`);
        }
    });

    process.on('close', (code) => {
        if (code !== 0 && code !== 255) {
            win.webContents.send('ffmpeg-error', `100% 啊！失败了失败了失败了失败了：code ${code}`);
        }
    });
}
function parseTime(timeStr) {
    const parts = timeStr.split(':').map(part => parseFloat(part));
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
function showBiruWindow() {
    if (biruWindow === null) { // 如果窗口不存在，则创建它
        createBiruWindow();
        console.log('biru is created');
    }
    biruWindow.show();
}
function showSettingsWindow() {
    if (settingsWindow === null) { // 如果窗口不存在，则创建它
        createSettingsWindow();
        console.log('settings is created');
    }
    settingsWindow.show();
}
function showOutputWindow() {
    if (outputWindow === null) { // 如果窗口不存在，则创建它
        createOutputWindow();
    }
    outputWindow.show(); // 显示窗口
}
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'window_icon.png'),
        titleBarStyle: 'hiddenInset',
        fullscreen: false,
        vibrancy: 'sidebar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: !isMac,
        titleBarStyle: isMac ? 'hiddenInset' : undefined,
        frame: isMac ? undefined : false
    });
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
function createOutputWindow() {
    outputWindow = new BrowserWindow({
        width: 400,
        height: 300,
        icon: path.join(__dirname, 'window_icon.png'),
        show: false,
        vibrancy: 'sidebar',
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: !isMac,
        titleBarStyle: isMac ? 'hiddenInset' : undefined,
        frame: isMac ? undefined : false
    });
    outputWindow.setMenu(null);
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
function createBiruWindow() {
    biruWindow = new BrowserWindow({
        width: 500,
        height: 400,
        icon: path.join(__dirname, 'window_icon.png'),
        show: false,
        fullscreen: false,
        alwaysOnTop: true,
        vibrancy: 'sidebar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: !isMac,
        titleBarStyle: isMac ? 'hiddenInset' : undefined,
        frame: isMac ? undefined : false
    });
    biruWindow.setMenu(null);
    biruWindow.loadFile('biru.html');
    biruWindow.on('close', (event) => {
        if (app.isQuitting) {
            // 允许窗口关闭
            biruWindow = null;
        } else {
            // 阻止窗口关闭，仅仅隐藏窗口
            event.preventDefault();
            biruWindow.hide();
        }
    });
}
function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 500,
        height: 500,
        icon: path.join(__dirname, 'window_icon.png'),
        show: false,
        fullscreen: false,
        vibrancy: 'sidebar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: !isMac,
        titleBarStyle: isMac ? 'hiddenInset' : undefined,
        frame: isMac ? undefined : false
    });
    settingsWindow.setMenu(null);
    settingsWindow.loadFile('settings.html');
    settingsWindow.on('close', (event) => {
        if (app.isQuitting) {
            // 允许窗口关闭
            settingsWindow = null;
        } else {
            // 阻止窗口关闭，仅仅隐藏窗口
            event.preventDefault();
            settingsWindow.hide();
        }
    });
}