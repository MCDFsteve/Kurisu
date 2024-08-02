const path = require('path');
const fs = require('fs');
const os = require('os');
const { ipcRenderer } = require('electron');
let SYSlanguage;
const kurisucachePath = path.join(__dirname, 'kurisu.json');
const fileJson = JSON.parse(fs.readFileSync(path.join(kurisucachePath), 'utf8'));
const downloadsPath = fileJson.downloadsPath;
const kurisuPath = path.join(downloadsPath, 'kurisu');
const configFilePath = path.join(kurisuPath, 'kirusu-config.json');
const messagesPath = path.join(kurisuPath, 'messages', 'message.json');
const settingsUi = document.getElementById('family');

// 覆盖console.log
const originalLog = console.log;
console.log = function (...args) {
    ipcRenderer.send('console-log', args);
    originalLog.apply(console, args);
};

ipcRenderer.on('language-update', (event) => {
    LanguageUp();
});

function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    const TitleLang = document.getElementById('title');
    console.log('SYSlanguage by Plugins:', SYSlanguage);
    if (SYSlanguage === 'en') {
        TitleLang.textContent = 'Preset Management';
    } else if (SYSlanguage === 'zh_cn') {
        TitleLang.textContent = '预设管理';
    }
    else if (SYSlanguage === 'jp') {
        TitleLang.textContent = 'プリセット管理';
    }
    else if (SYSlanguage === 'zh_tw') {
        TitleLang.textContent = '預設管理';
    }
    else if (SYSlanguage === 'ru') {
        TitleLang.textContent = 'Управление предустановками';
    }
    else if (SYSlanguage === 'ko') {
        TitleLang.textContent = '프리셋 관리';
    }
}

function isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

if (isMacOS()) {
    console.log("hello world");
    document.body.style.backgroundColor = "transparent";
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
                #settingsui {
            background-color: initial !important;
        }
        @media (prefers-color-scheme: dark) {
            #settingsui {
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
        ipcRenderer.send('close-plugins-window');
    });
    fullscreenButton.classList.add('fullscreen-button-other');
    fullscreenButton.style.display = 'block';
    fullscreenButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'none';
        restoreButton.style.display = 'block';
        ipcRenderer.send('fullscreen-plugins-window');
    });
    restoreButton.classList.add('restore-button-other');
    restoreButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'block';
        restoreButton.style.display = 'none';
        ipcRenderer.send('restore-plugins-window');
    });
    miniButton.classList.add('minimize-button-other');
    miniButton.style.display = 'block';
    miniButton.addEventListener('click', () => {
        console.log('nipa');
        ipcRenderer.send('minimize-plugins-window');
    });
}

// 读取 messages.json 文件并生成复选框
function createFamilyCheckboxes() {
    if (fs.existsSync(messagesPath)) {
        const messageData = fs.readFileSync(messagesPath, 'utf8');
        const messages = JSON.parse(messageData);
        const families = new Set();
        const displayedFamilies = new Set();

        // 清空之前生成的复选框
        settingsUi.innerHTML = '';

        // 过滤掉包含 timestamp 参数的消息
        const filteredMessages = messages.filter(message => !message.timestamp);

        filteredMessages.forEach(message => {
            if (message.family) {
                families.add(message.family);
            }
        });

        families.forEach(family => {
            // 检查是否已经显示过
            if (displayedFamilies.has(family)) {
                return;
            }
            displayedFamilies.add(family);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = family;
            checkbox.name = family;

            const label = document.createElement('label');
            label.htmlFor = family;
            label.style.display = 'inline';
            label.style.marginLeft = '10px';
            label.appendChild(document.createTextNode(family));

            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.appendChild(label);
            container.appendChild(checkbox);

            const familyMessages = filteredMessages.filter(message => message.family === family);
            const isChecked = familyMessages.every(message => message.see === 'yes' || message.see === undefined);
            checkbox.checked = isChecked;

            // 更新没有 see 标签的消息
            familyMessages.forEach(message => {
                if (message.see === undefined) {
                    message.see = isChecked ? 'yes' : 'no';
                }
            });

            checkbox.addEventListener('change', (event) => {
                const isChecked = event.target.checked;
                familyMessages.forEach(message => {
                    message.see = isChecked ? 'yes' : 'no';
                });
                fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
                //ipcRenderer.send('update-plugins');
            });

            settingsUi.appendChild(container);
        });

        // 更新文件以确保所有没有 see 标签且没有 timestamp 的消息都有 see 标签
        //fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
    } else {
        console.error('messages.json 文件不存在');
    }
}
function watchFileChanges() {
    fs.watch(messagesPath, (eventType, filename) => {
        if (filename && eventType === 'change') {
            console.log('Plugins文件变化检测到:', filename);
            createFamilyCheckboxes(); // 重新加载消息
        }
    });
}
// 文档加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    LanguageUp();
    createFamilyCheckboxes();
    watchFileChanges();
});