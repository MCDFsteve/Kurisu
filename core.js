// In core.js or a preload script
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'messages', 'message.json');
// 覆盖console.log
const originalLog = console.log;
console.log = function (...args) {
    ipcRenderer.send('console-log', args);
    originalLog.apply(console, args);
};

// 可以对console.error, console.warn等进行类似的覆盖
const originalError = console.error;
console.error = function (...args) {
    ipcRenderer.send('console-error', args);
    originalError.apply(console, args);
};
function saveInput() {
    const userInput = document.getElementById('userInput').value;
    const timestamp = new Date().toISOString();
    const newEntry = {
        timestamp: timestamp,
        message: userInput
    };

    const filePath = path.join(__dirname, 'messages', 'message.json');

    // 先读取当前的文件内容
    fs.readFile(filePath, {encoding: 'utf8'}, (readErr, data) => {
        if (readErr) {
            if (readErr.code === 'ENOENT') {  // 文件不存在，创建新文件
                console.log('文件不存在，创建新文件');
                fs.writeFile(filePath, JSON.stringify([newEntry], null, 2), writeErr => {
                    if (writeErr) {
                        console.error('创建新文件时出错:', writeErr);
                        return;
                    }
                    console.log('消息保存成功！');
                });
            } else {
                console.error('读取文件时出错:', readErr);
            }
            return;
        }

        // 文件存在，解析 JSON，追加数据，然后重新写入
        try {
            const messages = JSON.parse(data);  // 将字符串解析为JSON对象
            messages.push(newEntry);  // 将新消息添加到数组中
            fs.writeFile(filePath, JSON.stringify(messages, null, 2), writeErr => {
                if (writeErr) {
                    console.error('写入文件时出错:', writeErr);
                    return;
                }
                console.log('消息追加保存成功！');
            });
        } catch (parseErr) {
            console.error('解析 JSON 时出错:', parseErr);
        }
    });
}

document.getElementById('saveButton').addEventListener('click', saveInput);
function loadMessages() {
    fs.readFile(filePath, {encoding: 'utf8'}, (err, data) => {
        if (err) {
            console.error('读取文件时出错:', err);
            return;
        }
        displayMessages(JSON.parse(data));
    });
}
function displayMessages(messages) {
    const container = document.getElementById('messageContainer');
    const bottomPanel = document.getElementsByClassName('bottom-panel')[0];  // 获取底部面板的引用
    container.innerHTML = ''; // 清空现有内容
    messages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'selected-message';

        const textSpan = document.createElement('span'); // 创建文本容器
        textSpan.textContent = message.message;
        messageDiv.appendChild(textSpan);
        if (message.tips) {
            messageDiv.addEventListener('mouseover', () => {
                bottomPanel.textContent = message.tips;  
                bottomPanel.className = 'bottom-tips'; // 应用新的 CSS 类
            });
            messageDiv.addEventListener('mouseout', () => {
                bottomPanel.textContent = '';  
                bottomPanel.className = ''; // 移除 CSS 类
            });
        }
        if (!message.tips) {
            const deleteButton = document.createElement('img');
            deleteButton.src = 'icons/delete.png';
            deleteButton.className = 'delete-icon';
            deleteButton.onclick = function(event) {
                event.stopPropagation(); // 防止点击按钮时触发消息选择
                deleteMessage(index);
            };
            messageDiv.appendChild(deleteButton);
        }

        messageDiv.onclick = () => selectMessage(message, messages);
        container.appendChild(messageDiv);
    });
}

function deleteMessage(index) {
    // 读取当前的文件内容
    fs.readFile(filePath, {encoding: 'utf8'}, (readErr, data) => {
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
    console.log('选中的消息:', selectedMessage.message); // 调试输出
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.value = selectedMessage.message; // 将选中的文本放入输入框
    } else {
        console.error('找不到用户输入框元素');
    }

    // 重新排序消息
    const newMessages = messages.filter(m => m !== selectedMessage);
    newMessages.unshift(selectedMessage); // 将选中的消息加到数组前面

    // 重新写入文件并更新显示
    fs.writeFile(filePath, JSON.stringify(newMessages, null, 2), err => {
        if (err) {
            console.error('更新文件时出错:', err);
        } else {
            console.log('消息列表更新成功');
            displayMessages(newMessages); // 重新加载消息
        }
    });
}
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
        if (fileInput.files.length > 0 ) {
            confirmButton.disabled = false;
            saveButton.disabled = false;
            confirmButton.style.opacity = 1;
            saveButton.style.opacity = 1;
        } else {
            confirmButton.disabled = true;
            saveButton.disabled = true;
            confirmButton.style.opacity = 0.5;
            saveButton.style.opacity = 0.5;
        }
    }

    // 为文件选择和输入框变化添加事件监听
    fileInput.addEventListener('change', updateButtonState);
    userInput.addEventListener('input', updateButtonState);

    // 初始化按钮状态
    updateButtonState();
});
document.addEventListener('DOMContentLoaded', function () {
    const terminalButton = document.querySelector('img[alt="控制台"]'); // 通过 alt 文本选择 terminal 按钮
    if (terminalButton) {
        terminalButton.addEventListener('click', function () {
            ipcRenderer.send('open-terminal-window'); // 发送事件到主进程
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
function updateProgress(progress) {
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');  // HTML中用于显示百分比的元素

    progressBar.style.width = progress + '%';  // 更新进度条的宽度
    progressPercentage.textContent = progress.toFixed(0) + '%';  // 更新HTML中的百分比显示
    if (progress === 100){
        progressPercentage.textContent = progress.toFixed(0) + '%'+'处理成功';
    }
}

function sendRequest() {
    const fileInput = document.getElementById('fileInput');
    const userInput = document.getElementById('userInput');
    const confirmButton = document.getElementById('confirmButton');
    const progressBar = document.getElementById('progressBar');

    if (fileInput.files.length === 0) {
        console.error('No file selected');
        return;
    }

    const filePaths = Array.from(fileInput.files).map(file => file.path);
    const filePathsString = filePaths.join(', ');

    progressBar.value = 0;
    confirmButton.disabled = true;
    confirmButton.style.opacity = 0.5;

    const userCommand = userInput.value;
    ipcRenderer.on('update-progress', (event, progress) => {
        updateProgress(progress);  // 使用新函数来更新进度条
    
        if (progress === 100) {
            confirmButton.disabled = false;  // 仅在完成时启用按钮
            confirmButton.style.opacity = 1;
        }
    });
    
    ipcRenderer.invoke('generate-ffmpeg-command', filePathsString, userCommand)
        .then(command => {
            console.log("Received ffmpeg command:", command); // Debug: 打印接收到的命令
            const commands = command.split('||'); // 使用新的分隔符拆分命令
            console.log("Split commands:", commands); // Debug: 打印拆分后的命令
            executeCommandsSequentially(commands, 0);
        })
        .catch(error => {
            console.error('Error:', error);
            confirmButton.disabled = false;
            confirmButton.style.opacity = 1;
        });
}

function executeCommandsSequentially(commands, index) {
    if (index >= commands.length) {
        return; // 所有命令执行完毕
    }

    const command = commands[index].trim(); // 清除可能的空白字符
    console.log(`Executing command ${index + 1}:`, command); // Debug: 打印正在执行的命令
    executeFFmpegCommand(command).then(() => {
        const progress = ((index + 1) / commands.length) * 100;
        progressBar.value = progress;
        progressText.textContent = `${progress.toFixed(0)}%`;
        if (index === commands.length - 1) {
            statusText.innerText = '处理完成';
            confirmButton.disabled = false;
            confirmButton.style.opacity = 1;
        } else {
            executeCommandsSequentially(commands, index + 1); // 执行下一命令
        }
    });
}
function simulateProgress(startProgress) {
    let progress = Math.max(startProgress, progressBar.value);
    const intervalId = setInterval(() => {
        progress += 1; // 每次增加 1%
        progressBar.value = progress;
        progressText.textContent = `${progress}%`;
    }, 1000); // 每 2000 毫秒（2 秒）增加一次进度
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
    userInput.style.height = (topPanel.clientHeight - 60) + 'px'; // 减去一些内边距
}

// 在页面加载和窗口大小变化时调整输入框高度
window.onload = adjustInputHeight;
window.onresize = adjustInputHeight;
