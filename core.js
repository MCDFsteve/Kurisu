// In core.js or a preload script
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const stopButton = document.getElementById('stopButton');
const confirmButton = document.getElementById('confirmButton');
let kurisucachePath;
let SYSlanguage;
let WebWarnText;
let LoadText;
let YesText;
let DoneText;
let NoText;
let Load2text;
let Loadatext;
let ConsoleText;
let MessageLang;
let TipsLang;
if (process.platform === 'win32' || process.platform === 'linux') {
    // 使用 __dirname 获取当前执行目录并拼接 C:\
    kurisucachePath = path.join(__dirname, 'kurisu.json');
} else {
    kurisucachePath = path.join(os.homedir(), 'Downloads', 'kurisu.json');
}
const fileJson = JSON.parse(fs.readFileSync(path.join(kurisucachePath), 'utf8'));
const downloadsPath = fileJson.downloadsPath;
const kurisuPath = path.join(downloadsPath, 'kurisu');
const configFilePath = path.join(kurisuPath, 'kirusu-config.json');
const messagesFolderPath = path.join(kurisuPath, 'messages');
const filePath = path.join(messagesFolderPath, 'message.json');
// 覆盖console.log
const originalLog = console.log;
const axios = require('axios');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const appVersion = packageJson.version;
// 更新版本号
const versionText = document.getElementById('version-text');
versionText.textContent = `ver${appVersion}`;
function checkInternetConnection() {
    return axios.get('https://www.baidu.com', {
        timeout: 10000  // 设置较短的超时时间，例如5秒
    })
        .then(response => true)  // 网络正常
        .catch(error => false);  // 网络连接失败
}

console.log = function (...args) {
    ipcRenderer.send('console-log', args);
    originalLog.apply(console, args);
};
ipcRenderer.on('language-update', (event) => {
    LanguageUp();
});
function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));  // 从配置文件读取最新的配置
    const fileLabel = document.getElementById('fileLabel');
    const confirmButton = document.getElementById('confirmButton');
    const stopButton = document.getElementById('stopButton');
    const openButton = document.getElementById('openButton');
    const saveButton = document.getElementById('saveButton');
    const textarea = document.getElementById('userInput');
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    console.log('SYSlanguage by Core:', SYSlanguage);
    if (SYSlanguage === 'en') {
        fileLabel.textContent = 'Click/Drag to Upload Files';
        textarea.placeholder = 'Hmph! Speak here! What do you want me to do?';
        confirmButton.textContent = 'Execute Current Task';
        stopButton.textContent = 'Terminate Current Task';
        openButton.textContent = 'Open Output Directory';
        saveButton.textContent = 'Save Dialogue to Preset';
        WebWarnText = 'Connection timed out, please check your network environment.';
        YesText = '100% Hmph! Handled it for you!!';
        DoneText = '100% Ah! Why are you suddenly asking me to stop?';
        NoText = '100% Ah! Failed, failed, failed, failed:';
        LoadText = 'Loading';
        ConsoleText = 'Please check the console';
        MessageLang = 'message_en';
        TipsLang = 'tips_en';
        Load2text = 'Processing file';
    } else if (SYSlanguage === 'zh_cn') {
        fileLabel.textContent = '点击/拖放上传文件';
        textarea.placeholder = '哼！在这里说！想让我做什么？';
        confirmButton.textContent = '执行当前任务';
        stopButton.textContent = '终止当前任务';
        openButton.textContent = '打开输出目录';
        saveButton.textContent = '对话存至预设';
        WebWarnText = '连接超时，请检查网络环境。';
        YesText = '100% 哼！帮你处理好了！！';
        DoneText = '100% 啊！突然叫我停下是闹哪般？';
        NoText = '100% 啊！失败了失败了失败了失败了：';
        LoadText = '连接中';
        ConsoleText = '请查看控制台';
        MessageLang = 'message';
        TipsLang = 'tips';
        Load2text = '文件处理中';
    }
    else if (SYSlanguage === 'jp') {
        fileLabel.textContent = 'クリック/ドラッグしてファイルをアップロード';
        textarea.placeholder = 'うん！ここで言って！私に何をさせたいの？';
        confirmButton.textContent = '現在のタスクを実行';
        stopButton.textContent = '現在のタスクを中止';
        openButton.textContent = '出力ディレクトリを開く';
        saveButton.textContent = '対話をプリセットに保存';
        WebWarnText = '接続がタイムアウトしました。ネットワーク環境を確認してください。';
        YesText = '100% うん！処理完了！！';
        DoneText = '100% ああ！急に止めるのはどういうこと？';
        NoText = '100% ああ！失敗した、失敗した、失敗した、失敗した：';
        LoadText = '接続中';
        ConsoleText = 'コンソールを確認してください';
        MessageLang = 'message_jp';
        TipsLang = 'tips_jp';
        Load2text = 'ファイル処理中';
    }
    else if (SYSlanguage === 'zh_tw') {
        fileLabel.textContent = '點擊/拖放上傳文件';
        textarea.placeholder = '哼！在這裡說！想讓我做什麼？';
        confirmButton.textContent = '執行當前任務';
        stopButton.textContent = '終止當前任務';
        openButton.textContent = '打開輸出目錄';
        saveButton.textContent = '對話存至預設';
        WebWarnText = '連接超時，請檢查網絡環境。';
        YesText = '100% 哼！幫你處理好了！！';
        DoneText = '100% 啊！突然叫我停下是鬧哪般？';
        NoText = '100% 啊！失敗了失敗了失敗了失敗了：';
        LoadText = '連接中';
        ConsoleText = '請查看控制台';
        MessageLang = 'message';
        TipsLang = 'tips_zh_tw';
        Load2text = '文件處理中';
    } else if (SYSlanguage === 'ru') {
        fileLabel.textContent = 'Щелкните/перетащите для загрузки файла';
        textarea.placeholder = 'Хм! Говори здесь! Что ты хочешь, чтобы я сделал?';
        confirmButton.textContent = 'Выполнить текущую задачу';
        stopButton.textContent = 'Остановить текущую задачу';
        openButton.textContent = 'Открыть выходной каталог';
        saveButton.textContent = 'Сохранить диалог в предустановки';
        WebWarnText = 'Тайм-аут подключения, проверьте сетевую среду.';
        YesText = '100% Хм! Я всё сделал!!';
        DoneText = '100% Ах! Почему ты вдруг сказал мне остановиться?';
        NoText = '100% Ах! Не удалось, не удалось, не удалось, не удалось:';
        LoadText = 'Подключение';
        ConsoleText = 'Пожалуйста, проверьте консоль';
        MessageLang = 'message';
        TipsLang = 'tips_ru';
        Load2text = 'Обработка файла';
    } else if (SYSlanguage === 'ko') {
        fileLabel.textContent = '클릭/드래그하여 파일 업로드';
        textarea.placeholder = '흥! 여기서 말해봐! 내가 뭘 해줬으면 좋겠어?';
        confirmButton.textContent = '현재 작업 수행';
        stopButton.textContent = '현재 작업 중지';
        openButton.textContent = '출력 디렉토리 열기';
        saveButton.textContent = '대화를 프리셋에 저장';
        WebWarnText = '연결 시간 초과, 네트워크 환경을 확인하세요.';
        YesText = '100% 흥! 다 처리했어!!';
        DoneText = '100% 아! 갑자기 멈추라니 무슨 소리야?';
        NoText = '100% 아! 실패했어, 실패했어, 실패했어, 실패했어:';
        LoadText = '연결 중';
        ConsoleText = '콘솔을 확인하세요';
        MessageLang = 'message';
        TipsLang = 'tips_ko';
        Load2text = '파일 처리 중';
    }
}
document.addEventListener('DOMContentLoaded', function () {
    LanguageUp();
    if (stopButton) {
        stopButton.addEventListener('click', function () {
            stopButton.style.display = 'none';
            confirmButton.style.display = 'block';
            confirmButton.disabled = true;  // 仅在完成时启用按钮
            confirmButton.style.opacity = 0.5;
            ipcRenderer.send('stop-ffmpeg');  // 发送停止 FFmpeg 的事件
        });
    }
});

// 可以对console.error, console.warn等进行类似的覆盖
const originalError = console.error;
console.error = function (...args) {
    ipcRenderer.send('console-error', args);
    originalError.apply(console, args);
};
function saveInput() {
    const userInput = document.getElementById('userInput').value.trim();  // 获取用户输入并去除两边空白
    if (!userInput) {
        console.error('输入不能为空');
        return;  // 如果输入为空，则不执行任何操作
    }
    const timestamp = new Date().toISOString();
    const newEntry = {
        timestamp: timestamp,
        message: userInput,
        message_en: userInput,
        message_jp: userInput,
        message_zh_tw: userInput,
        message_ru: userInput,
        message_ko: userInput
    };

    fs.readFile(filePath, { encoding: 'utf8' }, (readErr, data) => {
        if (readErr) {
            if (readErr.code === 'ENOENT') {  // 文件不存在时，创建新文件
                console.log('文件不存在，创建新文件');
                fs.writeFile(filePath, JSON.stringify([newEntry], null, 2), writeErr => {
                    if (writeErr) {
                        console.error('创建新文件时出错:', writeErr);
                    } else {
                        console.log('首条消息保存成功！');
                    }
                });
            } else {
                console.error('读取文件时出错:', readErr);
            }
            return;
        }

        // 文件存在，解析 JSON 并将新条目添加到数组开头
        try {
            const messages = JSON.parse(data);
            messages.unshift(newEntry);  // 添加到数组的开始
            fs.writeFile(filePath, JSON.stringify(messages, null, 2), writeErr => {
                if (writeErr) {
                    console.error('写入文件时出错:', writeErr);
                } else {
                    console.log('消息添加到文件顶部成功！');
                }
            });
        } catch (parseErr) {
            console.error('解析 JSON 时出错:', parseErr);
        }
    });
}

document.getElementById('saveButton').addEventListener('click', saveInput);
function loadMessages() {
    fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
        if (err) {
            console.error('读取文件时出错:', err);
            return;
        }
        displayMessages(JSON.parse(data));
    });
}

function deleteMessage(index) {
    // 读取当前的文件内容
    fs.readFile(filePath, { encoding: 'utf8' }, (readErr, data) => {
        if (readErr) {
            console.error('读取文件时出错:', readErr);
            return;
        }

        let messages = JSON.parse(data); // 将字符串解析为JSON对象
        messages.splice(index, 1); // 删除指定索引的消息

        // 重新写入更新后的数据到文件
        fs.writeFile(filePath, JSON.stringify(messages, null, 2), writeErr => {
            if (writeErr) {
                console.error('写入更新的数据时出错:', writeErr);
                return;
            }
            loadMessages(); // 重新加载消息
        });
    });
}
function selectMessage(selectedMessage, messages) {
    let MessageMess;
    if (TipsLang === 'tips_en') {
        MessageMess = selectedMessage.message_en;
    } else if (TipsLang === 'tips') {
        MessageMess = selectedMessage.message;
    } else if (TipsLang === 'tips_jp') {
        MessageMess = selectedMessage.message_jp;
    } else if (TipsLang === 'tips_zh_tw') {
        MessageMess = selectedMessage.message_zh_tw;
    } else if (TipsLang === 'tips_ru') {
        MessageMess = selectedMessage.message_ru;
    } else if (TipsLang === 'tips_ko') {
        MessageMess = selectedMessage.message_ko;
    }

    console.log('选中的消息:', MessageMess); // 调试输出
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.value = MessageMess; // 将选中的文本放入输入框
    } else {
        console.error('找不到用户输入框元素');
        return;
    }

    // 重新排序消息
    const newMessages = messages.filter(m => m !== selectedMessage);
    newMessages.unshift(selectedMessage); // 将选中的消息加到数组前面

    // 更新并重新绑定事件
    updateMessagesAndBindEvents(newMessages);
}

function updateMessagesAndBindEvents(newMessages) {
    fs.writeFile(filePath, JSON.stringify(newMessages, null, 2), err => {
        if (err) {
            console.error('更新文件时出错:', err);
        } else {
            console.log('消息列表更新成功');
            displayMessages(newMessages); // 重新加载消息
        }
    });
}

function displayMessages(messages) {
    const container = document.getElementById('messageContainer');
    const bottomPanel = document.getElementsByClassName('bottom-panel')[0];

    // 首先清空现有内容和移除现有的所有事件监听器
    container.innerHTML = '';

    // 重新绑定事件监听器
    container.addEventListener('mouseover', function (event) {
        if (event.target.closest('.selected-message')) {
            const messageDiv = event.target.closest('.selected-message');
            const tips = messageDiv.dataset.tips;
            if (tips) {
                bottomPanel.textContent = tips;
                bottomPanel.className = 'bottom-tips';
            }
        }
    });

    container.addEventListener('mouseout', function (event) {
        if (event.target.closest('.selected-message')) {
            bottomPanel.textContent = '';
            bottomPanel.className = '';
        }
    });
    let MessageTips;
    let MessageMess;
    messages.forEach((message, index) => {
        if (TipsLang === 'tips_en') {
            MessageTips = message.tips_en;
            MessageMess = message.message_en;
        } else if (TipsLang === 'tips') {
            MessageTips = message.tips;
            MessageMess = message.message;
        } else if (TipsLang === 'tips_jp') {
            MessageTips = message.tips_jp;
            MessageMess = message.message_jp;
        } else if (TipsLang === 'tips_zh_tw') {
            MessageTips = message.tips_zh_tw;
            MessageMess = message.message_zh_tw;
        } else if (TipsLang === 'tips_ru') {
            MessageTips = message.tips_ru;
            MessageMess = message.message_ru;
        } else if (TipsLang === 'tips_ko') {
            MessageTips = message.tips_ko;
            MessageMess = message.message_ko;
        }
        const messageDiv = document.createElement('div');
        messageDiv.className = 'selected-message';
        messageDiv.dataset.tips = MessageTips || ''; // 存储tips在元素上，方便访问

        const textSpan = document.createElement('span');
        textSpan.textContent = MessageMess;
        messageDiv.appendChild(textSpan);

        messageDiv.onclick = () => selectMessage(message, messages);

        if (!message.tips) {
            const deleteButton = document.createElement('img');
            deleteButton.src = 'icons/delete.png';
            deleteButton.className = 'delete-icon';
            deleteButton.onclick = function (event) {
                event.stopPropagation(); // 防止点击按钮时触发消息选择
                deleteMessage(index);
            };
            messageDiv.appendChild(deleteButton);
        }

        container.appendChild(messageDiv);
    });
}

// 调用这个函数以初始化消息显示并绑定事件
document.addEventListener('DOMContentLoaded', () => {
    loadMessages(); // 初始加载消息
    watchFileChanges(); // 开始监视文件变化
});

function watchFileChanges() {
    fs.watch(filePath, (eventType, filename) => {
        if (filename && eventType === 'change') {
            console.log('文件变化检测到:', filename);
            loadMessages(); // 重新加载消息
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    loadMessages(); // 初始加载消息
    watchFileChanges(); // 开始监视文件变化
});

function openOutputDir() {
    ipcRenderer.send('open-output-directory');
}
// 获取文件输入元素和文本元素
var fileInput = document.getElementById('fileInput');
var uploadButtonText = document.getElementById('uploadButtonText');
ipcRenderer.on('platform-info', (event, { isMac }) => {
    if (isMac) {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
        .left-panel {
          background-color: initial !important;
        }
        @media (prefers-color-scheme: dark) {
          .left-panel {
            background-color: initial !important;
          }
        }
      `;
        document.head.appendChild(styleSheet);
    }
});
// 监听文件选择的变化
fileInput.addEventListener('change', function () {
    // 检查是否选择了文件
    if (fileInput.files.length > 0) {
        // 获取第一个文件的名字
        var fileName = fileInput.files[0].name;
        // 更新按钮文本为文件名
        uploadButtonText.textContent = fileName;
    } else {
        // 如果没有选择文件，则显示默认文本
        uploadButtonText.textContent = '这里什么都没有';
    }
});
function updateFileName() {
    var input = document.getElementById('fileInput');
    var fileLabel = document.getElementById('fileLabel');
    if (input.files.length > 0) {
        var file = input.files[0];
        fileLabel.textContent = file.name; // 显示文件名
    } else {
        fileLabel.textContent = '点击上传文件'; // 如果没有文件，则显示默认文本
    }
}
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const userInput = document.getElementById('userInput');
    const confirmButton = document.getElementById('confirmButton');
    const saveButton = document.getElementById('saveButton');

    function updateButtonState() {
        // 检查文件是否已上传并且输入框中有文字
        confirmButton.disabled = false;
        saveButton.disabled = false;
        confirmButton.style.opacity = 1;
        saveButton.style.opacity = 1;
    }

    // 为文件选择和输入框变化添加事件监听
    fileInput.addEventListener('change', updateButtonState);
    userInput.addEventListener('input', updateButtonState);

    // 初始化按钮状态
    updateButtonState();
});
document.addEventListener('DOMContentLoaded', function () {
    const terminalButton = document.querySelector('img[id="terminalbutton"]'); // 通过 alt 文本选择 terminal 按钮
    if (terminalButton) {
        terminalButton.addEventListener('click', function () {
            ipcRenderer.send('open-terminal-window'); // 发送事件到主进程
        });
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const terminalButton = document.querySelector('img[id="settingsbutton"]'); // 通过 alt 文本选择 terminal 按钮
    if (terminalButton) {
        terminalButton.addEventListener('click', function () {
            ipcRenderer.send('open-settings-window'); // 发送事件到主进程
        });
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const biruButton = document.querySelector('img[id="birubutton"]'); // 通过 alt 文本选择 terminal 按钮
    if (biruButton) {
        biruButton.addEventListener('click', function () {
            ipcRenderer.send('open-biru-window'); // 发送事件到主进程
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('dragstart', (event) => {
        if (event.target.tagName.toUpperCase() === 'IMG') {
            event.preventDefault();  // 阻止所有图片的拖动事件
        }
    });
});
let hideTextTimeout;  // 用于隐藏文本的定时器
function updateProgress(progress, errorMessage = null) {
    const confirmButton = document.getElementById('confirmButton');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressPercentage');
    const progressLine = document.getElementById('progressBar');  // 确保这里是进度条的ID

    // 清除之前可能设置的定时器
    clearTimeout(hideTextTimeout);

    // 根据错误状态更新进度条和文本
    if (errorMessage) {
        clearInterval(dotsInterval);
        progressText.textContent = errorMessage + `${ConsoleText}`;
        progressLine.style.backgroundColor = 'rgb(211, 105, 105)';  // 错误时显示红色
        progressBar.style.width = '100%';
        confirmButton.disabled = false;  // 仅在完成时启用按钮
        confirmButton.style.opacity = 1;
    } else {
        stopButton.disabled = false;
        stopButton.style.opacity = 1;
        progressBar.style.width = progress + '%';
        progressText.textContent = progress.toFixed(0) + '%';
        progressLine.style.backgroundColor = 'rgb(105, 131, 211)';  // 重置颜色为默认或成功颜色
        if (progress === 100) {
            progressText.textContent = `${YesText}`;  // Success message
        }
    }

    // 确保文本可见
    progressText.style.opacity = '1';
}
async function sendRequest() {
    const isConnected = await checkInternetConnection();
    const fileInput = document.getElementById('fileInput');
    const userInput = document.getElementById('userInput');
    const confirmButton = document.getElementById('confirmButton');
    const stopButton = document.getElementById('stopButton');
    const progressText = document.getElementById('progressPercentage');
    const progressBar = document.getElementById('progressBar');
    const progressLine = document.getElementById('progressBar');
    if (fileInput.files.length === 0) {
        console.error('No file selected');
        return;
    }

    const filePaths = Array.from(fileInput.files).map(file => file.path);
    const filePathsString = filePaths.join(', ');
    if (!isConnected) {
        progressText.textContent = `${WebWarnText}`;
        progressBar.style.backgroundColor = 'rgb(211, 105, 105)'; // 红色进度条
        confirmButton.disabled = false;
        confirmButton.style.opacity = 1;
        return;  // 直接返回，不继续执行后续代码
    }
    // 初始化请求，显示连接中动画
    Loadatext = LoadText;
    stopButton.disabled = true;
    stopButton.style.opacity = 0.5;
    progressText.textContent = `${Loadatext}`;
    let dotCount = 0;
    let dotsInterval = setInterval(() => {
        progressText.textContent = `${Loadatext}` + '.'.repeat(dotCount % 4);
        dotCount++;
    }, 500); // 每500毫秒更新一次文本
    progressBar.value = 0;
    confirmButton.disabled = true;
    confirmButton.style.display = 'none';
    stopButton.style.display = 'block';
    // 设置超时处理
    let timeoutId = setTimeout(() => {
        clearInterval(dotsInterval);
        progressText.textContent = `${WebWarnText}`;
        progressBar.style.backgroundColor = 'rgb(211, 105, 105)'; // 红色进度条
        confirmButton.disabled = false;
        confirmButton.style.display = 'block';
        stopButton.style.display = 'none';
    }, 60000); // 20秒超时
    const userCommand = userInput.value;
    ipcRenderer.on('update-progress', (event, progress) => {
        if (progress < 0) {
            Loadatext = Load2text;
            stopButton.disabled = false;
            stopButton.style.opacity = 1;
        }
        else if (progress > 0) {
            clearInterval(dotsInterval);
            updateProgress(progress);  // 取消“连接中”动画
        } // 使用新函数来更新进度条
        if (progress === 100) {
            Loadatext = LoadText;
            confirmButton.disabled = false;  // 仅在完成时启用按钮
            confirmButton.style.display = 'block';
            stopButton.style.display = 'none';
        }
    });
    ipcRenderer.on('ffmpeg-error', (event, message) => {
        console.error(message); // 可以在控制台输出错误信息
        clearInterval(dotsInterval);
        progressText.textContent = `${NoText}` + `${message}` + `${ConsoleText}`;
        progressLine.style.backgroundColor = 'rgb(211, 105, 105)';  // 错误时显示红色
        progressBar.style.width = '100%';
        confirmButton.disabled = false;  // 仅在完成时启用按钮
        confirmButton.style.display = 'block';
        stopButton.style.display = 'none';
    });
    ipcRenderer.on('ffmpeg-stop', (event, message) => {
        clearInterval(dotsInterval);
        progressText.textContent = `${DoneText}`;
        progressLine.style.backgroundColor = 'rgb(211, 179, 105)';
        progressBar.style.width = '100%';
        confirmButton.style.display = 'block';
        stopButton.style.display = 'none';
        const dotsInterval2 = setInterval(() => {
            confirmButton.disabled = false;  // 仅在完成时启用按钮
            confirmButton.style.opacity = 1;
        }, 500);
    });
    ipcRenderer.invoke('generate-ffmpeg-command', filePathsString, userCommand)
        .then(command => {
            console.log("Received ffmpeg command:", command); // Debug: 打印接收到的命令
            clearTimeout(timeoutId);  // 取消超时处理
            const commands = command.split('||'); // 使用新的分隔符拆分命令
            console.log("Split commands:", commands); // Debug: 打印拆分后的命令
            executeCommandsSequentially(commands, 0);
        })
        .catch(error => {
            console.error('Error:', error);
            clearTimeout(timeoutId);  // 取消超时处理
            confirmButton.disabled = false;
            confirmButton.style.display = 'block';
            stopButton.style.display = 'none';
        });
}

function executeCommandsSequentially(commands, index) {
    if (index >= commands.length) {
        return; // 所有命令执行完毕
    }
    const confirmButton = document.getElementById('confirmButton');
    const stopButton = document.getElementById('stopButton');
    const command = commands[index].trim(); // 清除可能的空白字符
    console.log(`Executing command ${index + 1}:`, command); // Debug: 打印正在执行的命令
    executeFFmpegCommand(command).then(() => {
        const progress = ((index + 1) / commands.length) * 100;
        progress.value = progress;
        progress.textContent = `${progress.toFixed(0)}%`;
        if (index === commands.length - 1) {
            statusText.innerText = '处理完成';
            confirmButton.disabled = false;
            confirmButton.style.display = 'block';
            stopButton.style.display = 'none';
        } else {
            executeCommandsSequentially(commands, index + 1); // 执行下一命令
        }
    });
}
function simulateProgress(startProgress) {
    let progress = Math.max(startProgress, progress.value);
    const intervalId = setInterval(() => {
        if (progress < 100) {
            progress += 1; // 每次增加 1%
        }
        // 当进度大于99时，界面显示固定为99%，直到实际进度到100%
        if (progress > 99) {
            progressBar.value = 99;
            progressText.textContent = '99%';
        } else {
            progressBar.value = progress;
            progressText.textContent = `${progress}%`;
        }
    }, 1000);
}

function executeFFmpegCommand(command) {
    return new Promise((resolve, reject) => {
        const process = exec(command, (error) => {
            if (error) {
                console.error(`Execution error: ${error}`);
                reject(error);
                return;
            }
            resolve();
        });

        // 可选: 处理标准错误输出中的数据
        process.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
    });
}
function adjustInputHeight() {
    var topPanel = document.querySelector('.top-panel');
    var userInput = document.getElementById('userInput');
    userInput.style.height = (topPanel.clientHeight - 80) + 'px'; // 减去一些内边距
}
document.addEventListener('keydown', function (event) {
    const userInput = document.getElementById('userInput');

    // 检测是否按下 Ctrl 或 Cmd（Mac 上）
    const isCtrlCmdPressed = event.ctrlKey || event.metaKey;

    // 按键操作
    switch (event.key) {
        case 'a': // 全选
            if (isCtrlCmdPressed) {
                if (document.activeElement === userInput) {
                    userInput.select();
                    console.log('全选成功！');
                }
                event.preventDefault();  // 阻止默认的全选事件
            }
            break;
        case 'c': // 复制
            if (isCtrlCmdPressed) {
                if (document.activeElement === userInput) {
                    document.execCommand('copy');
                    console.log('复制成功！');
                }
                event.preventDefault();  // 阻止默认的复制事件
            }
            break;
        case 'x': // 剪切
            if (isCtrlCmdPressed) {
                if (document.activeElement === userInput) {
                    document.execCommand('cut');
                    console.log('剪切成功！');
                }
                event.preventDefault();  // 阻止默认的剪切事件
            }
            break;
        case 'v': // 粘贴
            if (isCtrlCmdPressed) {
                if (document.activeElement === userInput) {
                    document.execCommand('paste');
                    console.log('粘贴成功！');
                }
                event.preventDefault();  // 阻止默认的粘贴事件
            }
            break;
        case 'z': // 撤回
            if (isCtrlCmdPressed) {
                if (document.activeElement === userInput) {
                    document.execCommand('undo');
                    console.log('撤回成功！');
                }
                event.preventDefault();  // 阻止默认的撤回事件
            }
            break;
        case 'y': // 重做
            if (isCtrlCmdPressed) {
                if (document.activeElement === userInput) {
                    document.execCommand('redo');
                    console.log('重做成功！');
                }
                event.preventDefault();  // 阻止默认的重做事件
            }
            break;
    }
});

// 在页面加载和窗口大小变化时调整输入框高度
window.onload = adjustInputHeight;
window.onresize = adjustInputHeight;
function isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}
ipcRenderer.on('full-progress', (event) => {
    const closeButton = document.getElementById('close-button');
    const miniButton = document.getElementById('minimize-button');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const restoreButton = document.getElementById('restore-button');
    fullscreenButton.style.display = 'none';
    restoreButton.style.display = 'block';
});
ipcRenderer.on('restore-progress', (event) => {
    const closeButton = document.getElementById('close-button');
    const miniButton = document.getElementById('minimize-button');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const restoreButton = document.getElementById('restore-button');
    fullscreenButton.style.display = 'block';
    restoreButton.style.display = 'none';
});
if (isMacOS()) {
    console.log('mac');
} else {
    const closeButton = document.getElementById('close-button');
    const miniButton = document.getElementById('minimize-button');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const restoreButton = document.getElementById('restore-button');
    closeButton.classList.add('close-button-other');
    closeButton.style.display = 'block';
    closeButton.addEventListener('click', () => {
        console.log('nipa');
        ipcRenderer.send('close-main-window');
    });
    fullscreenButton.classList.add('fullscreen-button-other');
    fullscreenButton.style.display = 'block';
    fullscreenButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'none';
        restoreButton.style.display = 'block';
        ipcRenderer.send('fullscreen-window');
    });
    restoreButton.classList.add('restore-button-other');
    restoreButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'block';
        restoreButton.style.display = 'none';
        ipcRenderer.send('restore-window');
    });
    miniButton.classList.add('minimize-button-other');
    miniButton.style.display = 'block';
    miniButton.addEventListener('click', () => {
        console.log('nipa');
        ipcRenderer.send('minimize-window');
    });
}