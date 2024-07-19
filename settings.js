const path = require('path');
const fs = require('fs');
const os = require('os');
const { ipcRenderer } = require('electron');
let SYSlanguage;
let kurisucachePath;
let TimeText;
let OriginText;
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
const currentOutputPathDisplay = document.getElementById('currentOutputPath');
ipcRenderer.on('language-update', (event) => {
    LanguageUp();
});
function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    const TitleLang = document.getElementById('title');
    const TitleLang2 = document.getElementById('title2');
    const outputLang = document.getElementById('outputLang');
    const nameLang = document.getElementById('nameLang');
    const timeLang = document.getElementById('timeLang');
    const originLang = document.getElementById('originLang');
    const langLang = document.getElementById('langLang');
    const nowLang = document.getElementById('nowLang');
    const nowFile = document.getElementById('nowFile');
    const changeOutputDir = document.getElementById('changeOutputDir');
    const resetToDefault = document.getElementById('resetToDefault');
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    console.log('SYSlanguage by Core:', SYSlanguage);
    if (SYSlanguage === 'en') {
        TitleLang.textContent = 'Settings';
        TitleLang2.textContent = 'Output File Location';
        outputLang.firstChild.nodeValue = 'Current Output Directory:';
        changeOutputDir.textContent = 'Change Output Folder';
        resetToDefault.textContent = 'Reset to Default Folder';
        nameLang.textContent = 'File Naming Rules';
        timeLang.textContent = 'Current Time';
        originLang.textContent = 'Keep Original Name';
        langLang.textContent = 'Language';
        nowLang.firstChild.nodeValue = 'Current Language: ';
        nowFile.firstChild.nodeValue = 'Current File Naming: ';
        TimeText = 'Current Time';
        OriginText = 'Keep Original Name';
    } else if (SYSlanguage === 'zh_cn') {
        TitleLang.textContent = '设置';
        TitleLang2.textContent = '输出文件位置';
        outputLang.firstChild.nodeValue = '当前输出目录:';
        changeOutputDir.textContent = '更换输出文件夹';
        resetToDefault.textContent = '恢复默认文件夹';
        nameLang.textContent = '文件命名规则';
        timeLang.textContent = '当前时间';
        originLang.textContent = '保持原名';
        langLang.textContent = '语言';
        nowLang.firstChild.nodeValue = '当前语言: ';
        nowFile.firstChild.nodeValue = '当前文件命名: ';
        TimeText = '当前时间';
        OriginText = '保持原名';

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
document.addEventListener('DOMContentLoaded', () => {
    LanguageUp();
    ipcRenderer.send('request-current-output-path');
});
document.getElementById('resetToDefault').addEventListener('click', () => {
    ipcRenderer.send('reset-output-directory-to-default');
});
document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('request-settings');
});
// 从主进程接收当前输出路径并显示
ipcRenderer.on('current-output-path', (event, path) => {
    currentOutputPathDisplay.textContent = path;
});

// 当用户点击更换输出目录按钮时
document.getElementById('changeOutputDir').addEventListener('click', () => {
    ipcRenderer.send('open-output-directory-dialog');
});

// 从主进程接收更新的输出路径并更新显示
ipcRenderer.on('output-path-updated', (event, newPath) => {
    currentOutputPathDisplay.textContent = newPath;
});
ipcRenderer.on('settings-data', (event, settings) => {
    document.getElementById('namingRule').value = settings.namingRule;
    updateCurrentNamingRuleDisplay(settings.namingRule);
    document.getElementById('langRule').value = settings.langRule;
    updateCurrentLangRuleDisplay(settings.langRule);
});

document.getElementById('namingRule').addEventListener('change', (event) => {
    const selectedOption = event.target.value;
    ipcRenderer.send('update-naming-rule', selectedOption);
    updateCurrentNamingRuleDisplay(selectedOption);
});
document.getElementById('langRule').addEventListener('change', (event) => {
    const selectedOption = event.target.value;
    ipcRenderer.send('update-lang-rule', selectedOption);
    updateCurrentLangRuleDisplay(selectedOption);
});
function updateCurrentNamingRuleDisplay(namingRule) {
    const namingRuleDisplay = document.getElementById('currentNamingRule');
    namingRuleDisplay.textContent = namingRule === 'timestamp' ? `${TimeText}` : `${OriginText}`;
}
function updateCurrentLangRuleDisplay(langRule) {
    const langRuleDisplay = document.getElementById('currentLangRule');
    langRuleDisplay.textContent = langRule === 'zh_cn' ? '简体中文' : 'English';
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
        ipcRenderer.send('close-settings-window');
    });
    fullscreenButton.classList.add('fullscreen-button-other');
    fullscreenButton.style.display = 'block';
    fullscreenButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'none';
        restoreButton.style.display = 'block';
        ipcRenderer.send('fullscreen-settings-window');
    });
    restoreButton.classList.add('restore-button-other');
    restoreButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'block';
        restoreButton.style.display = 'none';
        ipcRenderer.send('restore-settings-window');
    });
    miniButton.classList.add('minimize-button-other');
    miniButton.style.display = 'block';
    miniButton.addEventListener('click', () => {
        console.log('nipa');
        ipcRenderer.send('minimize-settings-window');
    });
}