const { ipcRenderer } = require('electron');
const { shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
let SYSlanguage;
const kurisucachePath = path.join(__dirname, 'kurisu.json');;
const fileJson = JSON.parse(fs.readFileSync(path.join(kurisucachePath), 'utf8'));
const downloadsPath = fileJson.downloadsPath;
const kurisuPath = path.join(downloadsPath, 'kurisu');
const configFilePath = path.join(kurisuPath, 'kirusu-config.json');
// 获取所有需要在系统默认浏览器中打开的超链接
const externalLinks = document.querySelectorAll('.externalLink');
const buttonName = 'biru';
const styleName = '#biruui';
window.onload=function(){
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', e => {
            const url = link.getAttribute('href');
            e.preventDefault();
            const { shell } = require('electron');
            shell.openExternal(url);
        });
    });
}
// 为每个超链接添加点击事件处理程序
externalLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // 阻止默认行为

        const href = link.getAttribute('href');
        shell.openExternal(href); // 在系统默认浏览器中打开链接
    });
});
function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    const GPL3 = document.getElementById('gpl3');
    const UpLog = document.getElementById('uplog');
    const Log108 = document.getElementById('log108');
    const Log109 = document.getElementById('log109');
    const Log1010 = document.getElementById('log1010');
    const Log1011 = document.getElementById('log1011');
    const Log1012 = document.getElementById('log1012');
    const Log1013 = document.getElementById('log1013'); // 新增这一行
    const Log1014 = document.getElementById('log1014');
    const Log110 = document.getElementById('log110');
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    console.log('SYSlanguage by Biru:', SYSlanguage);
    if (SYSlanguage === 'en') {
        UpLog.textContent = 'Changelog';
        GPL3.innerHTML = `This software uses <a href="http://ffmpeg.org">FFmpeg</a> code, licensed under the <a href="http://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a>. The <a href="https://www.github.com/mcdfsteve/kurisu" target="_blank">source code</a> can be downloaded.`; Log108.innerHTML = `·You can now drag the top section to move it.<br>·A new CUDA acceleration option has been added in the settings. Using an NVIDIA graphics card can improve the processing speed of some files.<br>·Optimized the task termination effect.`;
        Log109.innerHTML = `·Updated support for Traditional Chinese, Russian, and Korean.<br>·Added undo and redo functionality.`;
        Log1010.innerHTML = `·Fixed the precise collision of the top right button.`;
        Log1011.innerHTML = `·Initial integration of the Workshop for sharing presets.`;
        Log1012.innerHTML = `·Fixed some button positions in the top right corner to be more reasonable instead of lower.<br>·Built-in presets and manually added presets now have subtle visual differences, but presets downloaded from the Workshop will have colored tags.`;
        Log1013.innerHTML = `·Fixed various program bugs and errors.<br>·Optimized Workshop-related logic.`; // 新增这一行
        Log1014.innerHTML = `·Fixed an error when batch processing files using local presets.`; // 新增这一行
        Log110.innerHTML = `·Added a preset management interface that allows modular toggling of preset displays.`;
    } else if (SYSlanguage === 'zh_cn') {
        UpLog.textContent = '更新日志';
        GPL3.innerHTML = `本软件使用<a href="http://ffmpeg.org">FFmpeg</a>代码，根据<a href="http://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a>许可，其<a href="https://www.github.com/mcdfsteve/kurisu" target="_blank">源代码</a>可以下载。`
        Log108.innerHTML = `·现在上方可以按住拖动了。<br>·现在设置里新增了 CUDA加速 选项，NVIDIA显卡使用可以提高一些文件的处理速度。<br>·优化了 终止任务 的效果。`;
        Log109.innerHTML = `·更新了 繁体中文 俄语 韩语支持。<br>·增加了撤回和重做功能。`;
        Log1010.innerHTML = `·修复了右上角按键的准确碰撞。`;
        Log1011.innerHTML = `·初步接入了创意工坊用于共享预设。`;
        Log1012.innerHTML = `·修复了一些窗口右上角按键的位置，现在会更合理而不是靠下。<br>·现在内置预设和手动添加的预设会有细微视觉上区别了，但是通过创意工坊下载的预设则会有彩色标签。`;
        Log1013.innerHTML = `·修复了各种程序bug和错误。<br>·优化了创意工坊相关逻辑。`; // 新增这一行
        Log1014.innerHTML = `·修复了使用本地预设进行批量文件处理时的报错问题。`;
        Log110.innerHTML = `·新增了 预设管理 界面，可以模块化开关预设的显示。`;
    } else if (SYSlanguage === 'zh_tw') {
        UpLog.textContent = '更新日誌';
        GPL3.innerHTML = `本軟體使用<a href="http://ffmpeg.org">FFmpeg</a>代碼，根據<a href="http://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a>許可，其<a href="https://www.github.com/mcdfsteve/kurisu" target="_blank">源代碼</a>可以下載。`;
        Log108.innerHTML = `·現在上方可以按住拖動了。<br>·現在設定里新增了 CUDA加速 選項，NVIDIA顯卡使用可以提高一些文件的處理速度。<br>·優化了 終止任務 的效果。`;
        Log109.innerHTML = `·更新了 繁體中文 俄語 韓語支持。<br>·增加了撤回和重做功能。`;
        Log1010.innerHTML = `·修復了右上角按鍵的準確碰撞。`;
        Log1011.innerHTML = `·初步接入了創意工坊用於共享預設。`;
        Log1012.innerHTML = `·修復了一些窗口右上角按鍵的位置，現在會更合理而不是靠下。<br>·現在內置預設和手動添加的預設會有細微視覺上區別了，但是通過創意工坊下載的預設則會有彩色標籤。`;
        Log1013.innerHTML = `·修復了各種程序bug和錯誤。<br>·優化了創意工坊相關邏輯。`; // 新增这一行
        Log1014.innerHTML = `·修復了使用本地預設進行批量文件處理時的報錯問題。`;
        Log110.innerHTML = `·新增了 預設管理 界面，可以模組化開關預設的顯示。`;
    } else if (SYSlanguage === 'jp') {
        UpLog.textContent = '更新履歴';
        GPL3.innerHTML = `このソフトウェアは<a href="http://ffmpeg.org">FFmpeg</a>コードを使用しており、<a href="http://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a>の下でライセンスされています。<a href="https://www.github.com/mcdfsteve/kurisu" target="_blank">ソースコード</a>をダウンロードできます。`;
        Log108.innerHTML = `·上部をドラッグして移動できるようになりました。<br>·設定にCUDA加速オプションが追加されました。NVIDIAグラフィックカードを使用することで、いくつかのファイル処理速度が向上します。<br>·タスクの終了効果を最適化しました。`;
        Log109.innerHTML = `·繁体中文、ロシア語、韓国語のサポートを更新しました。<br>·撤回とやり直し機能が追加されました。`;
        Log1010.innerHTML = `·右上のボタンの正確な衝突を修正しました。`;
        Log1011.innerHTML = `·プリセット共有のためのワークショップの初期統合。`;
        Log1012.innerHTML = `·右上隅のボタンの位置が下ではなく、より合理的になりました。<br>·内蔵プリセットと手動追加されたプリセットには微妙な視覚的違いがありますが、ワークショップからダウンロードされたプリセットにはカラフルなタグが付きます。`;
        Log1013.innerHTML = `·さまざまなプログラムのバグとエラーを修正しました。<br>·ワークショップ関連のロジックを最適化しました。`; // 新增这一行
        Log1014.innerHTML = `·ローカルプリセットを使用してバッチファイルを処理する際のエラーを修正しました。`; 
        Log110.innerHTML = `·プリセット管理画面を追加しました。モジュール化されたプリセットの表示のオンオフが可能です。`;
    } else if (SYSlanguage === 'ru') {
        UpLog.textContent = 'История изменений';
        GPL3.innerHTML = `Это программное обеспечение использует код <a href="http://ffmpeg.org">FFmpeg</a>, лицензированный по <a href="http://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a>. Исходный <a href="https://www.github.com/mcdfsteve/kurisu" target="_blank">код</a> можно скачать.`;
        Log108.innerHTML = `·Теперь верхнюю часть можно перетаскивать.<br>·В настройки добавлена новая опция ускорения CUDA. Использование видеокарты NVIDIA может улучшить скорость обработки некоторых файлов.<br>·Оптимизирован эффект завершения задачи.`;
        Log109.innerHTML = `·Обновлена поддержка традиционного китайского, русского и корейского языков.<br>·Добавлены функции отмены и повтора.`;
        Log1010.innerHTML = `·Исправлена точная коллизия кнопки в правом верхнем углу.`;
        Log1011.innerHTML = `·Начальная интеграция Мастерской для обмена предустановками.`;
        Log1012.innerHTML = `·Исправлены некоторые положения кнопок в правом верхнем углу, чтобы они были более разумными, а не ниже.<br>·Встроенные пресеты и вручную добавленные пресеты теперь имеют незначительные визуальные различия, но пресеты, загруженные из Мастерской, будут иметь цветные теги.`;
        Log1013.innerHTML = `·Исправлены различные ошибки и баги программы.<br>·Оптимизирована логика, связанная с Мастерской.`; // 新增这一行
        Log1014.innerHTML = `·Исправлена ошибка при пакетной обработке файлов с использованием локальных пресетов.`;
        Log110.innerHTML = `·Добавлен интерфейс управления предустановками, который позволяет модульно включать и выключать отображение предустановок.`;
    } else if (SYSlanguage === 'ko') {
        UpLog.textContent = '변경 로그';
        GPL3.innerHTML = `이 소프트웨어는 <a href="http://ffmpeg.org">FFmpeg</a> 코드를 사용하며 <a href="http://www.gnu.org/licenses/gpl-3.0.html">GPLv3</a> 라이센스에 따라 라이센스됩니다. <a href="https://www.github.com/mcdfsteve/kurisu" target="_blank">소스 코드</a>를 다운로드할 수 있습니다.`;
        Log108.innerHTML = `·상단 섹션을 드래그하여 이동할 수 있습니다.<br>·설정에 새로운 CUDA 가속 옵션이 추가되었습니다. NVIDIA 그래픽 카드를 사용하면 일부 파일의 처리 속도가 향상될 수 있습니다.<br>·작업 종료 효과가 최적화되었습니다.`;
        Log109.innerHTML = `·번체 중국어, 러시아어 및 한국어 지원이 업데이트되었습니다.<br>·실행 취소 및 다시 실행 기능이 추가되었습니다.`;
        Log1010.innerHTML = `·오른쪽 상단 버튼의 정확한 충돌이 수정되었습니다.`;
        Log1011.innerHTML = `·프리셋 공유를 위한 워크숍의 초기 통합.`;
        Log1012.innerHTML = `·오른쪽 상단 버튼의 위치가 더 합리적으로 수정되었습니다.<br>·내장된 프리셋과 수동으로 추가된 프리셋에는 미세한 시각적 차이가 있지만, 워크숍에서 다운로드한 프리셋에는 컬러 태그가 있습니다.`;
        Log1013.innerHTML = `·다양한 프로그램 버그 및 오류가 수정되었습니다.<br>·워크숍 관련 로직이 최적화되었습니다.`; // 新增这一行
        Log1014.innerHTML = `·로컬 프리셋을 사용하여 일괄 파일을 처리할 때의 오류가 수정되었습니다.`;
        Log110.innerHTML = `·프리셋 관리 화면이 추가되었습니다. 모듈화된 프리셋 표시를 켜고 끌 수 있습니다.`;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    LanguageUp();
});