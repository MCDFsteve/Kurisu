const { ipcRenderer } = require('electron');
const buttonName = 'output';
const styleName = '#ffmpegOutput,body';
ipcRenderer.on('ffmpeg-output', (event, message) => {
    const outputElement = document.getElementById('ffmpegOutput');
    const atBottom = outputElement.scrollHeight - outputElement.clientHeight <= outputElement.scrollTop + 1;

    // 创建一个新的 div 来放置每条新的消息
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    outputElement.appendChild(messageElement);

    // 如果已经在底部，添加新内容后滚动到底部
    if (atBottom) {
        messageElement.scrollIntoView({ behavior: 'smooth' });
    }
});
document.addEventListener('keydown', function (event) {
    const isCtrlPressed = event.ctrlKey || event.metaKey; // 支持Mac的Command键
    const outputElement = document.getElementById('ffmpegOutput');

    if (isCtrlPressed) {
        switch (event.key.toLowerCase()) {
            case 'a': // 全选
                if (document.activeElement === outputElement) {
                    window.getSelection().selectAllChildren(outputElement);
                    event.preventDefault(); // 阻止默认全选行为
                }
                break;
            case 'c': // 复制
                if (window.getSelection().toString() && document.activeElement === outputElement) {
                    navigator.clipboard.writeText(window.getSelection().toString())
                        .then(() => console.log('内容已复制到剪贴板'))
                        .catch(err => console.error('复制到剪贴板失败', err));
                    event.preventDefault(); // 阻止默认复制行为
                }
                break;
        }
    }
});