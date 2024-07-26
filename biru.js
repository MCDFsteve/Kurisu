const { ipcRenderer } = require('electron');
const { shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
let SYSlanguage;
let kurisucachePath;
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
// 获取所有需要在系统默认浏览器中打开的超链接
const externalLinks = document.querySelectorAll('.externalLink');
// 覆盖console.log
const originalLog = console.log;
console.log = function (...args) {
    ipcRenderer.send('console-log', args);
    originalLog.apply(console, args);
};
// 为每个超链接添加点击事件处理程序
externalLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // 阻止默认行为

        const href = link.getAttribute('href');
        shell.openExternal(href); // 在系统默认浏览器中打开链接
    });
});
ipcRenderer.on('language-update', (event) => {
    LanguageUp();
});
function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    const UpLog = document.getElementById('uplog');
    const Log108 = document.getElementById('log108');
    const Log109 = document.getElementById('log109');
    const Log1010 = document.getElementById('log1010');
    const Log1011 = document.getElementById('log1011');
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    console.log('SYSlanguage by Biru:', SYSlanguage);
    if (SYSlanguage === 'en') {
        UpLog.textContent = 'Changelog';
        Log108.innerHTML = `·You can now drag the top section to move it.<br>·A new CUDA acceleration option has been added in the settings. Using an NVIDIA graphics card can improve the processing speed of some files.<br>·Optimized the task termination effect.`;
        Log109.innerHTML = `·Updated support for Traditional Chinese, Russian, and Korean.<br>·Added undo and redo functionality.`;
        Log1010.innerHTML = `·Fixed the precise collision of the top right button.`;
        Log1011.innerHTML = `·Initial integration of the Workshop for sharing presets.`;
    } else if (SYSlanguage === 'zh_cn') {
        UpLog.textContent = '更新日志';
        Log108.innerHTML = `·现在上方可以按住拖动了。<br>·现在设置里新增了 CUDA加速 选项，NVIDIA显卡使用可以提高一些文件的处理速度。<br>·优化了 终止任务 的效果。`;
        Log109.innerHTML = `·更新了 繁体中文 俄语 韩语支持。<br>·增加了撤回和重做功能。`;
        Log1010.innerHTML = `·修复了右上角按键的准确碰撞。`;
        Log1011.innerHTML = `·初步接入了创意工坊用于共享预设。`;
    } else if (SYSlanguage === 'zh_tw') {
        UpLog.textContent = '更新日誌';
        Log108.innerHTML = `·現在上方可以按住拖動了。<br>·現在設定里新增了 CUDA加速 選項，NVIDIA顯卡使用可以提高一些文件的處理速度。<br>·優化了 終止任務 的效果。`;
        Log109.innerHTML = `·更新了 繁體中文 俄語 韓語支持。<br>·增加了撤回和重做功能。`;
        Log1010.innerHTML = `·修復了右上角按鍵的準確碰撞。`;
        Log1011.innerHTML = `·初步接入了創意工坊用於共享預設。`;
    } else if (SYSlanguage === 'jp') {
        UpLog.textContent = '更新履歴';
        Log108.innerHTML = `·上部をドラッグして移動できるようになりました。<br>·設定にCUDA加速オプションが追加されました。NVIDIAグラフィックカードを使用することで、いくつかのファイル処理速度が向上します。<br>·タスクの終了効果を最適化しました。`;
        Log109.innerHTML = `·繁体中文、ロシア語、韓国語のサポートを更新しました。<br>·撤回とやり直し機能が追加されました。`;
        Log1010.innerHTML = `·右上のボタンの正確な衝突を修正しました。`;
        Log1011.innerHTML = `·プリセット共有のためのワークショップの初期統合。`;
    } else if (SYSlanguage === 'ru') {
        UpLog.textContent = 'История изменений';
        Log108.innerHTML = `·Теперь верхнюю часть можно перетаскивать.<br>·В настройки добавлена новая опция ускорения CUDA. Использование видеокарты NVIDIA может улучшить скорость обработки некоторых файлов.<br>·Оптимизирован эффект завершения задачи.`;
        Log109.innerHTML = `·Обновлена поддержка традиционного китайского, русского и корейского языков.<br>·Добавлены функции отмены и повтора.`;
        Log1010.innerHTML = `·Исправлена точная коллизия кнопки в правом верхнем углу.`;
        Log1011.innerHTML = `·Начальная интеграция Мастерской для обмена предустановками.`;
    } else if (SYSlanguage === 'ko') {
        UpLog.textContent = '변경 로그';
        Log108.innerHTML = `·상단 섹션을 드래그하여 이동할 수 있습니다.<br>·설정에 새로운 CUDA 가속 옵션이 추가되었습니다. NVIDIA 그래픽 카드를 사용하면 일부 파일의 처리 속도가 향상될 수 있습니다.<br>·작업 종료 효과가 최적화되었습니다.`;
        Log109.innerHTML = `·번체 중국어, 러시아어 및 한국어 지원이 업데이트되었습니다.<br>·실행 취소 및 다시 실행 기능이 추가되었습니다.`;
        Log1010.innerHTML = `·오른쪽 상단 버튼의 정확한 충돌이 수정되었습니다.`;
        Log1011.innerHTML = `·프리셋 공유를 위한 워크숍의 초기 통합.`;
    }
}
function isMacOS() {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}
document.addEventListener('DOMContentLoaded', () => {
    LanguageUp();
});
if (isMacOS()) {
    document.body.style.backgroundColor = "transparent";
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
                #biruui {
            background-color: initial !important;
        }
        @media (prefers-color-scheme: dark) {
            #biruui {
            background-color: initial !important;
        }
    }
      `;
    document.head.appendChild(styleSheet);
}
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
        ipcRenderer.send('close-biru-window');
    });
    fullscreenButton.classList.add('fullscreen-button-other');
    fullscreenButton.style.display = 'block';
    fullscreenButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'none';
        restoreButton.style.display = 'block';
        ipcRenderer.send('fullscreen-biru-window');
    });
    restoreButton.classList.add('restore-button-other');
    restoreButton.addEventListener('click', () => {
        console.log('nipa');
        fullscreenButton.style.display = 'block';
        restoreButton.style.display = 'none';
        ipcRenderer.send('restore-biru-window');
    });
    miniButton.classList.add('minimize-button-other');
    miniButton.style.display = 'block';
    miniButton.addEventListener('click', () => {
        console.log('nipa');
        ipcRenderer.send('minimize-biru-window');
    });
}