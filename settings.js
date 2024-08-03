const path = require('path');
const fs = require('fs');
const os = require('os');
const { ipcRenderer } = require('electron');
let SYSlanguage;
let TimeText;
let OriginText;
// 初始化cuda_switch变量
let cuda_switch;
const kurisucachePath = path.join(__dirname, 'kurisu.json');
const fileJson = JSON.parse(fs.readFileSync(path.join(kurisucachePath), 'utf8'));
const downloadsPath = fileJson.downloadsPath;
const kurisuPath = path.join(downloadsPath, 'kurisu');
const configFilePath = path.join(kurisuPath, 'kirusu-config.json');
const currentOutputPathDisplay = document.getElementById('currentOutputPath');
const buttonName = 'settings';
const styleName = '#settingsui';
function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    const TitleLang = document.getElementById('title');
    const TitleLang2 = document.getElementById('title2');
    const outputLang = document.getElementById('outputLang');
    const OtherLang = document.getElementById('otherlang');
    const CudaText = document.getElementById('cudatext');
    const nameLang = document.getElementById('nameLang');
    const timeLang = document.getElementById('timeLang');
    const originLang = document.getElementById('originLang');
    const langLang = document.getElementById('langLang');
    const nowLang = document.getElementById('nowLang');
    const nowFile = document.getElementById('nowFile');
    const changeOutputDir = document.getElementById('changeOutputDir');
    const resetToDefault = document.getElementById('resetToDefault');
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    cuda_switch = config.cuda_switch;
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
        OtherLang.textContent = 'Other';
        CudaText.textContent = 'Enable CUDA acceleration (turn off if problems occur)';
    } else if (SYSlanguage === 'zh_cn') {
        TitleLang.textContent = '设置';
        TitleLang2.textContent = '输出文件位置';
        outputLang.firstChild.nodeValue = '当前输出目录:';
        changeOutputDir.textContent = '更换输出文件夹';
        resetToDefault.textContent = '恢复默认文件夹';
        nameLang.textContent = '文件命名规则';
        timeLang.textContent = '当前时间';
        originLang.textContent = '保持原名';
        langLang.textContent = '语言 Language';
        nowLang.firstChild.nodeValue = '当前语言: ';
        nowFile.firstChild.nodeValue = '当前文件命名: ';
        TimeText = '当前时间';
        OriginText = '保持原名';
        OtherLang.textContent = '其他';
        CudaText.textContent = '启用CUDA加速（出现问题请关掉）';
    }
    else if (SYSlanguage === 'jp') {
        TitleLang.textContent = '設定';
        TitleLang2.textContent = '出力ファイルの位置';
        outputLang.firstChild.nodeValue = '現在の出力ディレクトリ:';
        changeOutputDir.textContent = '出力フォルダを変更';
        resetToDefault.textContent = 'デフォルトフォルダにリセット';
        nameLang.textContent = 'ファイル命名ルール';
        timeLang.textContent = '現在の時間';
        originLang.textContent = '元の名前を保持';
        langLang.textContent = '言語';
        nowLang.firstChild.nodeValue = '現在の言語: ';
        nowFile.firstChild.nodeValue = '現在のファイル命名: ';
        TimeText = '現在の時間';
        OriginText = '元の名前を保持';
        OtherLang.textContent = 'その他';
        CudaText.textContent = 'CUDA加速を有効にする（問題が発生したらオフにしてください）';
    }
    else if (SYSlanguage === 'zh_tw') {
        TitleLang.textContent = '設定';
        TitleLang2.textContent = '輸出檔案的位置';
        outputLang.firstChild.nodeValue = '目前的輸出目錄:';
        changeOutputDir.textContent = '變更輸出資料夾';
        resetToDefault.textContent = '重設為預設資料夾';
        nameLang.textContent = '檔案命名規則';
        timeLang.textContent = '目前時間';
        originLang.textContent = '保持原始名稱';
        langLang.textContent = '語言';
        nowLang.firstChild.nodeValue = '目前語言: ';
        nowFile.firstChild.nodeValue = '目前檔案命名: ';
        TimeText = '目前時間';
        OriginText = '保持原始名稱';
        OtherLang.textContent = '其他';
        CudaText.textContent = '啟用 CUDA 加速（若發生問題請關閉）';
    }
    else if (SYSlanguage === 'ru') {
        TitleLang.textContent = 'Настройки';
        TitleLang2.textContent = 'Расположение выходного файла';
        outputLang.firstChild.nodeValue = 'Текущая выходная директория:';
        changeOutputDir.textContent = 'Изменить выходную папку';
        resetToDefault.textContent = 'Сбросить на папку по умолчанию';
        nameLang.textContent = 'Правила именования файлов';
        timeLang.textContent = 'Текущее время';
        originLang.textContent = 'Сохранить оригинальное имя';
        langLang.textContent = 'Язык';
        nowLang.firstChild.nodeValue = 'Текущий язык: ';
        nowFile.firstChild.nodeValue = 'Текущее именование файла: ';
        TimeText = 'Текущее время';
        OriginText = 'Сохранить оригинальное имя';
        OtherLang.textContent = 'Другие';
        CudaText.textContent = 'Включить ускорение CUDA (выключите, если возникнут проблемы)';
    }
    else if (SYSlanguage === 'ko') {
        TitleLang.textContent = '설정';
        TitleLang2.textContent = '출력 파일 위치';
        outputLang.firstChild.nodeValue = '현재 출력 디렉토리:';
        changeOutputDir.textContent = '출력 폴더 변경';
        resetToDefault.textContent = '기본 폴더로 재설정';
        nameLang.textContent = '파일 명명 규칙';
        timeLang.textContent = '현재 시간';
        originLang.textContent = '원래 이름 유지';
        langLang.textContent = '언어';
        nowLang.firstChild.nodeValue = '현재 언어: ';
        nowFile.firstChild.nodeValue = '현재 파일 명명: ';
        TimeText = '현재 시간';
        OriginText = '원래 이름 유지';
        OtherLang.textContent = '기타';
        CudaText.textContent = 'CUDA 가속 활성화 (문제가 발생하면 끄세요)';
    }
}

// 获取勾选框元素
const cudaSwitch = document.getElementById('cudaSwitch');

// 添加事件监听器，检测用户手动勾选操作
cudaSwitch.addEventListener('change', function () {
    cuda_switch = this.checked;
    console.log('CUDA Switch:', cuda_switch);
    ipcRenderer.send('update-cuda', cuda_switch);
});
// 当文档加载完成后，请求当前的输出路径
document.addEventListener('DOMContentLoaded', () => {
    LanguageUp();
    // 根据cuda_switch变量设置勾选框的状态
    cudaSwitch.checked = cuda_switch;
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
    if (langRule === 'zh_cn') {
        langRuleDisplay.textContent = '简体中文';
    } else if (langRule === 'en') {
        langRuleDisplay.textContent = 'English';
    } else if (langRule === 'jp') {
        langRuleDisplay.textContent = '日本語';
    }else if (langRule === 'zh_tw') {
        langRuleDisplay.textContent = '繁體中文';
    }else if (langRule === 'ru') {
        langRuleDisplay.textContent = 'Русский';
    }else if (langRule === 'ru') {
        langRuleDisplay.textContent = 'Русский';
    }
}