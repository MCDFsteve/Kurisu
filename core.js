// In core.js or a preload script
const { ipcRenderer } = require('electron');
function openOutputDir() {
    ipcRenderer.send('open-output-directory');
}

// When the button is clicked
function sendRequest() {
    const fileInput = document.getElementById('fileInput');
    const userInput = document.getElementById('userInput');
    const confirmButton = document.getElementById('confirmButton');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('statusText');

    if (fileInput.files.length === 0) {
        console.error('No file selected');
        // Use dialog or other method to alert user
        return;
    }
    // 在发送请求之前重置进度条和文本
    progressBar.value = 0;
    progressText.textContent = '0%';
    statusText.innerText = '';
    // 禁用按钮并改变样式
    confirmButton.disabled = true;
    confirmButton.style.opacity = 0.5;

    const filePath = fileInput.files[0].path;
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
    
    
        ipcRenderer.invoke('generate-ffmpeg-command', filePath, userCommand)
        .then(command => {
            // Use dialog or other method to show command
        })
        .catch(error => {
            console.error('Error:', error);
            // Use dialog or other method to show error
        });
}
