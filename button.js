const originalLog = console.log;
console.log = function (...args) {
    ipcRenderer.send('console-log', args);
    originalLog.apply(console, args);
};

ipcRenderer.on('language-update', (event) => {
    LanguageUp();
});
function isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    //return false;
}

if (isMacOS()) {
    document.body.style.backgroundColor = "transparent";
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
                ${styleName} {
            background-color: initial !important;
        }
        @media (prefers-color-scheme: dark) {
            ${styleName} {
            background-color: initial !important;
        }
    }
      `;
    document.head.appendChild(styleSheet);
}

// 当文档加载完成后，请求当前的输出路径
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
    console.log('成功触发的窗口：',buttonName);
} else {
    const closeButton = document.getElementById('close-button');
    const miniButton = document.getElementById('minimize-button');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const restoreButton = document.getElementById('restore-button');
    closeButton.classList.add('close-button-other');
    closeButton.style.display = 'block';
    closeButton.addEventListener('click', () => {
        //console.log('nipa');
        ipcRenderer.send(`close-${buttonName}-window`);
    });
    fullscreenButton.classList.add('fullscreen-button-other');
    fullscreenButton.style.display = 'block';
    fullscreenButton.addEventListener('click', () => {
        //console.log('nipa');
        fullscreenButton.style.display = 'none';
        restoreButton.style.display = 'block';
        ipcRenderer.send(`fullscreen-${buttonName}-window`);
    });
    restoreButton.classList.add('restore-button-other');
    restoreButton.addEventListener('click', () => {
        //console.log('nipa');
        fullscreenButton.style.display = 'block';
        restoreButton.style.display = 'none';
        ipcRenderer.send(`restore-${buttonName}-window`);
    });
    miniButton.classList.add('minimize-button-other');
    miniButton.style.display = 'block';
    miniButton.addEventListener('click', () => {
        // console.log('nipa');
        ipcRenderer.send(`minimize-${buttonName}-window`);
    });
}