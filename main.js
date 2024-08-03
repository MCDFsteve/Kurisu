process.env.PYTHONIOENCODING = 'utf8';
let isMac = process.platform === 'darwin';
let outputWindow;
let biruWindow;
let settingsWindow;
let pluginsWindow;
let totalDuration; // 假设视频总时长是600秒
let mainWindow = null;
let ffmpegcode = 0;
let menuTemplate;
let menu;
let durationMatch;
let cuda_switch;
const { app, BrowserWindow, ipcMain, shell, screen, Menu, globalShortcut, dialog, } = require('electron');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');
// 定义原始 messages 文件夹的路径
const originalMessagesPath = path.join(__dirname, 'messages');
const shareFolderPath = path.join(originalMessagesPath, 'share');
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
const Steamworks = require('steamworks.js');
let steamClient;
let previousSubscribedItems = new Set();
let fetch;
const API_KEY = 'C723F6C25B3B7F9FF8B6A7B8CCFFBEEE';
const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY = 1000; // 重试延迟时间，单位为毫秒
const ItemState = {
    None: 0,
    Subscribed: 1 << 0,
    LegacyItem: 1 << 1,
    Installed: 1 << 2,
    NeedsUpdate: 1 << 3,
    Downloading: 1 << 4,
    DownloadPending: 1 << 5
};
// 假设配置文件路径
const configFilePath = path.join(kurisuPath, 'kirusu-config.json');
const WorkFilePath = path.join(kurisuPath, 'kirusu-work.json');
// 忽略证书错误
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// 确保关闭窗口时清理引用
app.on('window-all-closed', () => {
    if (steamClient) {
        steamClient.dispose();
    }
    if (outputWindow !== null) {
        outputWindow.close();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('browser-window-focus', () => {
    registerShortcuts();
});

// 当应用程序失去焦点时注销快捷键
app.on('browser-window-blur', () => {
    unregisterShortcuts();
});
app.whenReady().then(() => {
    if (isSteamRunning()) {
        initializeSteamWorkshop();
    }
    process.env.PYTHONIOENCODING = 'utf8'; // 强制使用 UTF-8 编码
    const kurisucachePath = path.join(__dirname, 'kurisu.json');;
    const data = { downloadsPath };
    fs.writeFileSync(kurisucachePath, JSON.stringify(data, null, 2), 'utf8');
    moveMessagesToKurisu();
    createOutputDirectory();
    createOutputWindow();
    createBiruWindow();
    createSettingsWindow();
    createPluginsWindow();
    createUpWindow();
    createWindow();
    MenuLang();
    syncMessagesWithDefault();
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
(async () => {
    fetch = (await import('node-fetch')).default;

    ipcMain.handle('get-subscribed-items', async () => {
        try {
            const subscribedItems = await getSubscribedItems();
            console.log('Subscribed Items:', subscribedItems);

            if (!Array.isArray(subscribedItems)) {
                throw new Error("Invalid subscribed items array");
            }

            // 确保所有项目ID转换为字符串
            const stringItems = subscribedItems.map(item => item.toString());
            const itemsDetails = await Promise.all(stringItems.map(async itemId => {
                const details = await getItemDetailsWithRetry(itemId, MAX_RETRIES);
                return details;
            }));
            console.log('Items Details:', itemsDetails);
            return itemsDetails;
        } catch (error) {
            console.error("Error getting subscribed items:", error);
            return [];
        }
    });

    async function getItemDetailsWithRetry(itemId, retries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const details = await getItemDetails(itemId);
                return details;
            } catch (error) {
                if (attempt < retries) {
                    console.warn(`Attempt ${attempt} failed for ${itemId}, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                } else {
                    console.error(`Failed to get item details for ${itemId} after ${retries} attempts:`, error);
                    return {
                        id: itemId,
                        title: 'No Title',
                        description: 'No Description',
                        previewUrl: 'default-image.png'
                    };
                }
            }
        }
    }
    async function getItemDetails(itemId) {
        const url = `https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`;
        const params = `key=${API_KEY}&itemcount=1&publishedfileids[0]=${itemId}`;

        console.log('Request Params:', params.toString()); // 输出请求参数

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            console.log('Response Status:', response.status);
            const responseText = await response.text();
            console.log('Response Text:', responseText);

            if (!response.ok) {
                throw new Error(`Failed to fetch item details: ${response.statusText}`);
            }

            const data = JSON.parse(responseText);
            const item = data.response.publishedfiledetails[0];
            console.log('Item Details:', item);

            return {
                id: itemId,
                title: item.title,
                description: item.description,
                previewUrl: item.preview_url
            };
        } catch (error) {
            console.error(`Error processing item details for ${itemId}:`, error);
            throw new Error(`Failed to get item details for ${itemId}: ${error.message}`);
        }
    }
})();
ipcMain.on('open-terminal-window', () => {
    showOutputWindow(); // 调用函数来创建窗口
});
ipcMain.on('open-settings-window', () => {
    showSettingsWindow(); // 调用函数来创建窗口
});
ipcMain.on('open-plugins-window', () => {
    showPluginsWindow(); // 调用函数来创建窗口
});
ipcMain.on('open-up-window', () => {
    showUpWindow(); // 调用函数来创建窗口
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
ipcMain.on('update-lang-rule', (event, langRule) => {
    const config = getConfig();
    config.langRule = langRule;
    updateConfigFile(config);
    MenuLang();
});
ipcMain.on('update-plugins', (event) => {
    MenuLang();
});
ipcMain.on('update-cuda', (event, cuda) => {
    const config = getConfig();
    config.cuda_switch = cuda;
    console.log("传输时的cuda状态：", cuda);
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
ipcMain.on('fullscreen-main-window', (event) => {
    if (mainWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.maximize();
    }
});
ipcMain.on('restore-main-window', (event) => {
    if (mainWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.unmaximize();
    }
});
ipcMain.on('minimize-main-window', (event) => {
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
ipcMain.on('fullscreen-biru-window', (event) => {
    if (biruWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.maximize();
    }
});
ipcMain.on('restore-biru-window', (event) => {
    if (biruWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.unmaximize();
    }
});
ipcMain.on('minimize-biru-window', (event) => {
    if (biruWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    }
});
///
ipcMain.on('close-up-window', () => {
    if (upWindow) {
        upWindow.close();
    }
});
ipcMain.on('fullscreen-up-window', (event) => {
    if (upWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.maximize();
    }
});
ipcMain.on('restore-up-window', (event) => {
    if (upWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.unmaximize();
    }
});
ipcMain.on('minimize-up-window', (event) => {
    if (upWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.minimize();
    }
});
///
ipcMain.on('close-plugins-window', () => {
    if (pluginsWindow) {
        pluginsWindow.close();
    }
});
ipcMain.on('fullscreen-plugins-window', (event) => {
    if (pluginsWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.maximize();
    }
});
ipcMain.on('restore-plugins-window', (event) => {
    if (pluginsWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.unmaximize();
    }
});
ipcMain.on('minimize-plugins-window', (event) => {
    if (pluginsWindow) {
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
ipcMain.on('fullscreen-output-window', (event) => {
    if (outputWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.maximize();
    }
});
ipcMain.on('restore-output-window', (event) => {
    if (outputWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.unmaximize();
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
ipcMain.on('fullscreen-settings-window', (event) => {
    if (settingsWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.maximize();
    }
});
ipcMain.on('restore-settings-window', (event) => {
    if (settingsWindow) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.unmaximize();
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
} function getSystemLangRule() {
    const locale = app.getLocale();
    if (locale.startsWith('zh')) {
        if (locale === 'zh-TW' || locale === 'zh_Hant_TW') {
            return 'zh_tw';
        }
        return 'zh_cn';
    } else if (locale.startsWith('ja')) {
        return 'jp';
    } else if (locale.startsWith('ru')) {
        return 'ru';
    } else if (locale.startsWith('ko')) {
        return 'ko';
    } else {
        return 'en';
    }
}
function createOutputDirectory() {
    let outputPath;
    let namingRule = 'timestamp';
    let langRule = getSystemLangRule();
    let cuda_switch = false; // 根据系统语言环境动态设置 langRule

    // 尝试从配置文件读取输出目录
    if (fs.existsSync(configFilePath)) {
        const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        outputPath = config.outputPath;

        // 检查是否存在 langRule，如果不存在则设置为默认值
        if (!config.langRule) {
            config.langRule = langRule;
        } else {
            langRule = config.langRule;  // 使用配置文件中的值
        }

        // 检查是否存在 namingRule，如果不存在则设置为默认值
        if (!config.namingRule) {
            config.namingRule = namingRule;
        } else {
            namingRule = config.namingRule;  // 使用配置文件中的值
        }
        if (!config.cuda_switch) {
            config.cuda_switch = cuda_switch;
        } else {
            cuda_switch = config.cuda_switch;  // 使用配置文件中的值
        }

        // 更新配置文件以确保默认值被写入
        updateConfigFile(config);
    }

    // 如果配置文件不存在或没有输出目录，则创建默认目录
    if (!outputPath) {
        outputPath = path.join(downloadsPath, 'kurisu', 'outputs');
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
            console.log('Output directory created at:', outputPath);
        }
        // 更新配置文件
        updateConfigFile({ outputPath: outputPath, namingRule: namingRule, langRule: langRule });
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
function registerShortcuts() {
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
}

function unregisterShortcuts() {
    globalShortcut.unregister('CommandOrControl+Q');
}
function syncMessagesWithDefault() {
    let messages = [];

    // 如果 message.json 文件存在，读取其内容
    if (fs.existsSync(messagesPath)) {
        try {
            const messageData = fs.readFileSync(messagesPath, 'utf8');
            if (messageData) {
                messages = JSON.parse(messageData);
            } else {
                console.warn('message.json 文件为空');
            }
        } catch (err) {
            console.error('读取 message.json 文件时出错:', err);
        }
    }

    const messagesById = new Map(messages.filter(msg => msg.id).map(msg => [msg.id, msg]));
    const messagesByTimestamp = new Map(messages.filter(msg => msg.timestamp).map(msg => [msg.timestamp, msg]));
    let updated = false;

    function updateOrAddMessage(message) {
        if (message.id) {
            const correspondingMessage = messagesById.get(message.id);
            if (!correspondingMessage) {
                messages.push(message);
                messagesById.set(message.id, message);
                updated = true;
            } else {
                if (message.id !== 1) { // 跳过 id 为 1 的条目
                    Object.assign(correspondingMessage, message);
                    updated = true;
                }
            }
        } else if (message.timestamp) {
            const correspondingMessage = messagesByTimestamp.get(message.timestamp);
            if (!correspondingMessage) {
                messages.push(message);
                messagesByTimestamp.set(message.timestamp, message);
                updated = true;
            } else {
                Object.assign(correspondingMessage, message);
                updated = true;
            }
        }
    }

    // 读取 default.json 并同步内容
    if (fs.existsSync(defaultPath)) {
        try {
            const defaultData = fs.readFileSync(defaultPath, 'utf8');
            const defaults = JSON.parse(defaultData);
            defaults.forEach(def => {
                def.family = 'default'; // 添加 family 参数，并去掉 .json 后缀名
                updateOrAddMessage(def);
            });
        } catch (err) {
            console.error('读取 default.json 文件时出错:', err);
        }
    }

    // 重新加载并覆盖 share 目录中的内容
    if (fs.existsSync(shareFolderPath)) {
        const jsonFiles = fs.readdirSync(shareFolderPath).filter(file => path.extname(file).toLowerCase() === '.json');
        jsonFiles.forEach(jsonFile => {
            const filePath = path.join(shareFolderPath, jsonFile);
            try {
                const fileData = fs.readFileSync(filePath, 'utf8');
                const additionalMessages = JSON.parse(fileData);
                additionalMessages.forEach(additionalMessage => {
                    additionalMessage.family = path.basename(jsonFile, '.json'); // 添加 family 参数，并去掉 .json 后缀名
                    updateOrAddMessage(additionalMessage);
                });
            } catch (err) {
                console.error(`读取 ${jsonFile} 文件时出错:`, err);
            }
        });
    }
    // 检查 message.json 中的消息是否在 default.json 和 share 文件夹中都找不到对应的文件
    messages = messages.filter(message => {
        if (!message.id) {
            // 跳过没有 id 的条目
            return true;
        }
        const existsInDefault = fs.existsSync(defaultPath) && JSON.parse(fs.readFileSync(defaultPath, 'utf8')).some(def => def.id === message.id);
        const existsInShare = fs.existsSync(shareFolderPath) && fs.readdirSync(shareFolderPath).filter(file => path.extname(file).toLowerCase() === '.json').some(jsonFile => {
            const filePath = path.join(shareFolderPath, jsonFile);
            const fileData = fs.readFileSync(filePath, 'utf8');
            const additionalMessages = JSON.parse(fileData);
            return additionalMessages.some(additionalMessage => additionalMessage.id === message.id);
        });

        if (!existsInDefault && !existsInShare) {
            messagesById.delete(message.id);
            updated = true;
            return false;
        }

        return true;
    });
    if (updated) {
        try {
            fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
            console.log('message.json 文件已更新');
        } catch (err) {
            console.error('写入更新的 message.json 文件时出错:', err);
        }
    }
}

// 使用 fs.watch 监控 share 文件夹
fs.watch(shareFolderPath, (eventType, filename) => {
    if (filename && path.extname(filename).toLowerCase() === '.json') {
        console.log(`检测到文件变动: ${filename}`);
        if (fs.existsSync(messagesPath)) {
            syncMessagesWithDefault();
        }
    }
    if (eventType === 'rename' && filename && !fs.existsSync(path.join(shareFolderPath, filename))) {
        console.log(`检测到文件删除: ${filename}`);
        if (fs.existsSync(messagesPath)) {
            syncMessagesWithDefault();
        }
    }
});

if (fs.existsSync(messagesPath)) {
    fs.watch(messagesPath, (eventType, filename) => {
        if (filename) {
            console.log(`检测到 message.json 文件变动: ${filename}`);
            if (fs.existsSync(messagesPath)) {
                //syncMessagesWithDefault();
            }
        }
    })
};
if (fs.existsSync(defaultPath)) {
    fs.watch(defaultPath, (eventType, filename) => {
        if (filename) {
            console.log(`检测到 default.json 文件变动: ${filename}`);
            if (fs.existsSync(messagesPath)) {
                syncMessagesWithDefault();
            }
        }
    })
};
function getConfig() {
    if (fs.existsSync(configFilePath)) {
        const configData = fs.readFileSync(configFilePath, 'utf8');
        return JSON.parse(configData);
    } else {
        // 如果配置文件不存在，返回默认配置
        const defaultConfig = {
            outputPath: getDefaultOutputPath(),
            namingRule: 'timestamp',
            langRule: 'en',// 默认命名规则
            cuda_switch: false,// 是否使用CUDA加速
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
async function generateFFmpegCommand(filePath, userCommand, ffmpegPath) {
    const originalFileName = path.basename(filePath, path.extname(filePath)); // 获取不含路径和后缀的文件名
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));  // 从配置文件读取最新的配置
    const outputPath = config.outputPath;  // 使用最新的输出路径
    const filePaths = filePath.split(', ').map(fp => fp.trim());

    // 打印输入路径
    if (filePaths.length === 1) {
        console.log('输入路径:', filePaths[0]);
    } else {
        filePaths.forEach((fp, index) => {
            console.log(`输入路径${index + 1}:`, fp);
        });
    }

    // 检查 default.json 文件中的命令
    const defaultPath = path.join(messagesFolderPath, 'message.json');
    if (fs.existsSync(defaultPath)) {
        let selectedMessage;
        const defaultData = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
        if (SYSlanguage === 'en') {
            selectedMessage = defaultData.find(item => item.message_en === userCommand);
        } else if (SYSlanguage === 'zh_cn') {
            selectedMessage = defaultData.find(item => item.message === userCommand);
        } else if (SYSlanguage === 'zh_tw') {
            selectedMessage = defaultData.find(item => item.message_zh_tw === userCommand);
        } else if (SYSlanguage === 'jp') {
            selectedMessage = defaultData.find(item => item.message_jp === userCommand);
        } else if (SYSlanguage === 'ru') {
            selectedMessage = defaultData.find(item => item.message_ru === userCommand);
        } else if (SYSlanguage === 'ko') {
            selectedMessage = defaultData.find(item => item.message_ko === userCommand);
        }
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

    // 如果没有预定义命令或没有匹配到，则生成默认命令
    if (userCommand == "") {
        userCommand = "转成mp4";
    }
    let cuda;
    console.log("关键词前的cuda状态：", config.cuda_switch);
    if (config.cuda_switch) {
        cuda = "使用cuda加速"
    } else {
        cuda = ""
    }
    const message1 = "从现在开始直到对话结束,你来扮演一个只会输出ffmpeg命令的终端（由于是终端所以只会输出命令,输出命令以外的任何你的话都会失去角色扮演属性。命令也不要拿代码框包裹而是直接打出来.扮演从现在就已经开始了，你不需要回复收到而是直接进入角色，将我输入给你的内容处理成可用的ffmpeg命令。因此请务必在最开头写上ffmpeg,我会在句首给出";
    const message2 = "输入和输出的文件路径都请完整保留原貌，不管怎么样都不许随意更改增减。如果文件夹名字是 影，那不要改成 影下。那如果没说是视频还是音频，那你直接看输入文件的后缀名是什么，是视频的话涉及到倍速，倒放什么的功能请连带音频一起处理。命令中请加入-y参数并放在-i之前。更改视频宽度和高度请确认为偶数，若为积数请px+1。如果遇到了使用-vf命令的情况则请用引号包裹-vf参数，-ss命令则请将-ss参数放在-i之前。只回复ffmpeg命令不回复除此之外的任何东西。";
    let content;
    console.log('filePaths:', filePaths);
    if (filePaths.length > 1) {
        console.log('多个文件');
        content = `${message1}多个输入文件的路径（逗号隔开）,输入输出文件路径用双引号括起来，请按顺序生成多个ffmpeg命令并使用 || 符号分隔给出，同时输出的文件名字请继承输入的文件名字。默认的输出文件请放在${outputPath}下。${message2} "${filePath}" ${userCommand}${cuda}`;
    } else {
        content = `${message1}输入文件的路径,输入输出文件路径用双引号括起来。默认的输出文件请放在${outputPath}下，、输出文件命名为${generateFileName(originalFileName)}（如果在描述里手动指定了新的路径则请使用指定的命名）。没指定输出文件的后缀名的情况则和输入文件一样。${message2} "${filePath}" ${userCommand}${cuda}`;
    }

    const postData = JSON.stringify({
        model: "gpt-4o-ca",
        temperature: 0.5,
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
function ensureDirectoryExistence(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new TypeError('The "path" argument must be of type string. Received null or invalid path.');
    }
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function getOutputFilePathFromCommand(command) {
    const outputFilePathMatch = command.match(/(?:-y\s+)?"?([^"]+)"?\s*$/);
    if (outputFilePathMatch) {
        return outputFilePathMatch[1];
    }
    return null;
}
function handleFFmpegCommand(win, command, totalDuration) {
    win.webContents.send('update-progress', -1);
    const outputFilePath = getOutputFilePathFromCommand(command);
    if (outputFilePath) {
        ensureDirectoryExistence(outputFilePath);
    } else {
        console.error('Invalid output file path extracted from the command.');
        win.webContents.send('ffmpeg-error', 'Invalid output file path.');
        return;
    }
    let durationExtracted;
    const options = { encoding: 'utf8' };
    const processffmpeg = exec(command, options);
    ffmpegcode = 0;
    let stderrBuffer = '';
    ipcMain.on('stop-ffmpeg', () => {
        if (processffmpeg) {
            if (process.platform === 'win32') {
                processffmpeg.kill('SIGTERM'); // 发送终止信号
            } else {
                processffmpeg.kill('SIGKILL'); // 发送终止信号
            }
            console.log('killed');
            ffmpegcode = 1;
            //process.exit(0);
        }
    });
    processffmpeg.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
        // 提取和更新持续时间
        const durationMatch0 = stderrBuffer.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
        //console.log('stderrBuffer:', stderrBuffer);
        if (durationMatch0 != null || durationMatch0 != undefined) {
            durationMatch = durationMatch0;
            //console.log('durationMatch:', durationMatch);
        }
        if (durationMatch) {
            totalDuration = parseTime(durationMatch[1]);
            durationExtracted = true;
        } else {
            totalDuration = 350;
        }
        // 在这里可以添加额外的错误日志处理
        const match = /time=(\d{2}:\d{2}:\d{2}\.\d{2})/.exec(data);
        if (match) {
            const currentTime = parseTime(match[1]);
            const progress = (currentTime / totalDuration) * 100;
            console.log('progress:', progress);
            win.webContents.send('update-progress', progress);
        };
        if (outputWindow && !outputWindow.isDestroyed()) {
            outputWindow.webContents.send('ffmpeg-output', data.toString());
        }
    });

    processffmpeg.on('exit', (code) => {
        if (code !== 0 && code !== 255) {
            console.error(`FFmpeg process exited with code ${code}`);
            win.webContents.send('ffmpeg-error', `${code}`);
        } else if (code == 255) {
            win.webContents.send('ffmpeg-stop', `100% 啊！突然叫我停下是闹哪般？`);
        } else {
            win.webContents.send('update-progress', 100);
        }
        if (outputWindow) {
            outputWindow.webContents.send('ffmpeg-output', `${code}`);
        }
    });

    processffmpeg.on('close', (code) => {
        if (code !== 0 && code !== 255 && code != null) {
            win.webContents.send('ffmpeg-error', `1${code}`);
        } else if (code == null) {
            win.webContents.send('ffmpeg-stop', `100% 啊！突然叫我停下是闹哪般？`);
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
function showPluginsWindow() {
    if (pluginsWindow === null) { // 如果窗口不存在，则创建它
        createPluginsWindow();
        console.log('settings is created');
    }
    pluginsWindow.show();
}
function showUpWindow() {
    if (upWindow === null) { // 如果窗口不存在，则创建它
        createUpWindow();
        console.log('upWindow is created');
    }
    upWindow.show();
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
    mainWindow.on('maximize', (e) => {
        mainWindow.webContents.send('full-progress');
    })
    mainWindow.on('unmaximize', (e) => {
        mainWindow.webContents.send('restore-progress');
    })
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
        minWidth: 400,
        minHeight: 300,
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
    outputWindow.on('maximize', (e) => {
        outputWindow.webContents.send('full-progress');
    })
    outputWindow.on('unmaximize', (e) => {
        outputWindow.webContents.send('restore-progress');
    })
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
        minWidth: 500,
        minHeight: 400,
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
function createUpWindow() {
    upWindow = new BrowserWindow({
        width: 500,
        height: 400,
        minWidth: 500,
        minHeight: 400,
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
    upWindow.setMenu(null);
    upWindow.loadFile('up.html');
    upWindow.on('close', (event) => {
        if (app.isQuitting) {
            // 允许窗口关闭
            upWindow = null;
        } else {
            // 阻止窗口关闭，仅仅隐藏窗口
            event.preventDefault();
            upWindow.hide();
        }
    });
}
function createSettingsWindow() {
    settingsWindow = new BrowserWindow({
        width: 600,
        height: 800,
        minWidth: 600,
        minHeight: 800,
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
    settingsWindow.on('maximize', (e) => {
        settingsWindow.webContents.send('full-progress');
    })
    settingsWindow.on('unmaximize', (e) => {
        settingsWindow.webContents.send('restore-progress');
    })
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
function createPluginsWindow() {
    pluginsWindow = new BrowserWindow({
        width: 400,
        height: 300,
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
    pluginsWindow.on('maximize', (e) => {
        pluginsWindow.webContents.send('full-progress');
    })
    pluginsWindow.on('unmaximize', (e) => {
        pluginsWindow.webContents.send('restore-progress');
    })
    pluginsWindow.setMenu(null);
    pluginsWindow.loadFile('plugins.html');
    pluginsWindow.on('close', (event) => {
        if (app.isQuitting) {
            // 允许窗口关闭
            pluginsWindow = null;
        } else {
            // 阻止窗口关闭，仅仅隐藏窗口
            event.preventDefault();
            pluginsWindow.hide();
        }
    });
}
function MenuLang() {
    let menuMenu;
    let menuSettings;
    let menuTmux;
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    cuda_switch = config.cuda_switch;
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    console.log('SYSlanguage and cuda:', SYSlanguage, cuda_switch);
    if (SYSlanguage === 'en') {
        menuBiru = "Changelog";
        menuMenu = 'Menu';
        menuSettings = 'Settings';
        menuTmux = 'Console';
    } else if (SYSlanguage === 'zh_cn') {
        menuBiru = "更新日志";
        menuMenu = "菜单";
        menuSettings = "设置";
        menuTmux = "控制台";
    }
    else if (SYSlanguage === 'jp') {
        menuBiru = "更新履歴";
        menuMenu = "メニュー";
        menuSettings = "設定";
        menuTmux = "コンソール";
    } else if (SYSlanguage === 'zh_tw') {
        menuBiru = "更新日誌";
        menuMenu = "選單";
        menuSettings = "設定";
        menuTmux = "主控台";
    } else if (SYSlanguage === 'ru') {
        menuBiru = "История обновлений";
        menuMenu = "Меню";
        menuSettings = "Настройки";
        menuTmux = "Консоль";
    } else if (SYSlanguage === 'ko') {
        menuBiru = "업데이트 로그";
        menuMenu = "메뉴";
        menuSettings = "설정";
        menuTmux = "콘솔";
    }
    console.log("菜单：", menuMenu, menuSettings, menuTmux);
    menuTemplate = [
        {
            label: `${menuMenu}`,
            submenu: [
                {
                    label: `${menuBiru}`,
                    click: () =>
                        showBiruWindow()
                },
                {
                    label: `${menuSettings}`,
                    click: () =>
                        showSettingsWindow()
                },
                {
                    label: `${menuTmux}`,
                    click: () =>
                        showOutputWindow()
                }
            ]
        }
    ];
    if (process.platform !== 'darwin') {
        mainWindow.setMenu(null); // 在非 macOS 平台隐藏菜单栏
    } else {
        menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
    };
    if (mainWindow) {
        mainWindow.webContents.send('language-update');
        mainWindow.loadFile('index.html');
    };
    if (settingsWindow) {
        settingsWindow.webContents.send('language-update');
        settingsWindow.loadFile('settings.html');
    }
    if (biruWindow) {
        biruWindow.webContents.send('language-update');
    }
    if (pluginsWindow) {
        pluginsWindow.webContents.send('language-update');
    }
    if (upWindow) {
        upWindow.webContents.send('language-update');
    }
}
async function isSteamRunning() {
    try {
        steamClient = Steamworks.init(3034460); // 使用你的应用程序ID
        if (steamClient && steamClient.workshop) {
            console.log("Steam client is running and Steamworks Workshop API initialized successfully.");
            return true;
        } else {
            console.error("Failed to initialize Steamworks Workshop API. steamClient.workshop is undefined.");
            return false;
        }
    } catch (error) {
        console.error("Steam is not running or Steam client install directory could not be determined:", error);
        return false;
    }
}

async function initializeSteamWorkshop() {
    try {
        await downloadSubscribedItems();
        startDownloadCheckLoop();
    } catch (error) {
        console.error("Failed to download subscribed items:", error);
    }
}

async function getSubscribedItems() {
    try {
        const subscribedItems = await steamClient.workshop.getSubscribedItems();
        return subscribedItems;
    } catch (error) {
        //console.error("Error getting subscribed items:", error);
        return [];
    }
}

async function downloadSubscribedItems() {
    const subscribedItems = await getSubscribedItems();
    for (const itemId of subscribedItems) {
        try {
            await steamClient.workshop.download(itemId, true);
        } catch (error) {
            console.error("Error downloading item:", itemId, error);
        }
    }
}

function startDownloadCheckLoop() {
    setInterval(async () => {
        try {
            const subscribedItems = await getSubscribedItems();
            const currentSubscribedItems = new Set(subscribedItems);

            // 找出被取消订阅的项目
            const unsubscribedItems = [...previousSubscribedItems].filter(itemId => !currentSubscribedItems.has(itemId));
            for (const itemId of unsubscribedItems) {
                await removeWorkshopFiles(itemId);
            }

            // 更新当前订阅项目列表
            previousSubscribedItems = currentSubscribedItems;

            // 处理当前订阅的项目
            for (const itemId of subscribedItems) {
                const itemState = await steamClient.workshop.state(itemId);
                if (itemState & ItemState.Installed) {
                    const itemInstallInfo = await steamClient.workshop.installInfo(itemId);
                    if (itemInstallInfo) {
                        const { folder } = itemInstallInfo;
                        moveWorkshopFilesToShareFolder(folder, itemId);

                        // 更新文件状态并通知 Steam 客户端
                        await steamClient.workshop.downloadInfo(itemId, true);
                    }
                }
            }
        } catch (error) {
            console.error("Error in download check loop:", error);
        }
    }, 3000); // 每10秒检查一次
}

function moveWorkshopFilesToShareFolder(workshopFolder, itemId) {
    if (!fs.existsSync(shareFolderPath)) {
        fs.mkdirSync(shareFolderPath);
    }

    const files = fs.readdirSync(workshopFolder);
    files.forEach(file => {
        const srcPath = path.join(workshopFolder, file);
        const destPath = path.join(shareFolderPath, file);
        fs.renameSync(srcPath, destPath);
        // 记录 itemId 和文件路径的映射关系
        recordFileMapping(itemId, destPath);
    });
}

function recordFileMapping(itemId, filePath) {
    let mapping = {};
    if (fs.existsSync(WorkFilePath)) {
        mapping = JSON.parse(fs.readFileSync(WorkFilePath, 'utf-8'));
    }
    if (!mapping[itemId]) {
        mapping[itemId] = [];
    }
    mapping[itemId].push(filePath);
    fs.writeFileSync(WorkFilePath, JSON.stringify(mapping, null, 2), 'utf-8');
}

async function removeWorkshopFiles(itemId) {
    try {
        if (fs.existsSync(WorkFilePath)) {
            const mapping = JSON.parse(fs.readFileSync(WorkFilePath, 'utf-8'));
            if (mapping[itemId]) {
                mapping[itemId].forEach(filePath => {
                    if (fs.existsSync(filePath)) {
                        fs.rmSync(filePath, { recursive: true, force: true });
                        console.log(`已移除取消订阅的项目文件: ${filePath}`);
                    } else {
                        console.log(`未找到要移除的项目文件: ${filePath}`);
                    }
                });
                delete mapping[itemId];
                fs.writeFileSync(WorkFilePath, JSON.stringify(mapping, null, 2), 'utf-8');
            } else {
                console.log(`未找到 itemId ${itemId} 的文件映射。`);
            }
        } else {
            console.log(`未找到映射文件。`);
        }
    } catch (error) {
        console.error(`Error removing files for item: ${itemId}`, error);
    }
}

// 初始化时调用一次
if (isSteamRunning()) {
    initializeSteamWorkshop();
}