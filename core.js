// In core.js or a preload script
const { ipcRenderer } = require('electron');
function openOutputDir() {
    ipcRenderer.send('open-output-directory');
}
// 获取文件输入元素和文本元素
var fileInput = document.getElementById('fileInput');
var uploadButtonText = document.getElementById('uploadButtonText');

// 监听文件选择的变化
fileInput.addEventListener('change', function() {
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

    function updateButtonState() {
        // 检查文件是否已上传并且输入框中有文字
        if (fileInput.files.length > 0 && userInput.value.trim() !== '') {
            confirmButton.disabled = false;
            confirmButton.style.opacity = 1;
        } else {
            confirmButton.disabled = true;
            confirmButton.style.opacity = 0.5;
        }
    }

    // 为文件选择和输入框变化添加事件监听
    fileInput.addEventListener('change', updateButtonState);
    userInput.addEventListener('input', updateButtonState);

    // 初始化按钮状态
    updateButtonState();
});
document.addEventListener('DOMContentLoaded', function() {
    const terminalButton = document.querySelector('img[alt="控制台"]'); // 通过 alt 文本选择 terminal 按钮
    if (terminalButton) {
        terminalButton.addEventListener('click', function() {
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

function sendRequest() {
    const fileInput = document.getElementById('fileInput');
    const userInput = document.getElementById('userInput');
    const confirmButton = document.getElementById('confirmButton');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('statusText');

    if (fileInput.files.length === 0) {
        console.error('No file selected');
        return;
    }

    const filePaths = Array.from(fileInput.files).map(file => file.path);
    const filePathsString = filePaths.join(', ');

    progressBar.value = 0;
    progressText.textContent = '0%';
    statusText.innerText = '';
    confirmButton.disabled = true;
    confirmButton.style.opacity = 0.5;

    const userCommand = userInput.value;
    ipcRenderer.on('update-progress', (event, progress) => {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const statusText = document.getElementById('statusText');
    
        progressBar.value = progress;
        progressText.textContent = progress.toFixed(0) + '%';  // 更新文本显示进度百分比
    
        if (progress === 100) {
            statusText.innerText = '处理完成';
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

