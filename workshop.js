const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

class WorkshopManager {
    constructor() {
        this.currentJsonData = null;
        this.savePath = '';
        this.previewImagePath = '';
        this.currentColorClass = 1; // 默认橙色
        this.currentLanguage = 'zh_cn'; // 默认中文
        
        // 添加多命令管理相关属性
        this.commandList = []; // 存储所有命令
        this.currentEditingCommandIndex = -1; // 当前编辑的命令索引
        this.isEditingCommand = false; // 是否正在编辑命令
        
        // 添加多语言支持
        this.SYSlanguage = 'zh_cn';
        
        this.initializeEventListeners();
        this.initializePreview();
        this.initializeVisualEditor();
        this.initializeCommandManager(); // 初始化命令管理器
        this.initializeLanguage(); // 初始化多语言支持
        this.checkSteamStatus(); // 初始化时检查Steam状态
    }

    initializeEventListeners() {
        // 添加语言更新事件监听器
        ipcRenderer.on('language-update', () => {
            console.log('Workshop received language-update event');
            this.initializeLanguage();
        });

        // JSON编辑相关
        document.getElementById('validateJson').addEventListener('click', () => this.validateJson());
        document.getElementById('formatJson').addEventListener('click', () => this.formatJson());
        document.getElementById('loadTemplate').addEventListener('click', () => this.loadTemplate());

        // 可视化编辑器相关
        document.getElementById('updateFromVisual').addEventListener('click', () => this.updateJsonFromVisual());
        document.getElementById('toggleJsonCode').addEventListener('click', () => this.toggleJsonCode());
        document.getElementById('syncFromJson').addEventListener('click', () => this.syncVisualFromJson());

        // 文件保存相关
        document.getElementById('chooseSavePath').addEventListener('click', () => this.chooseSavePath());
        document.getElementById('saveFile').addEventListener('click', () => this.saveFile());
        document.getElementById('loadFile').addEventListener('click', () => this.loadFile());

        // Steam工坊相关
        document.getElementById('choosePreviewImage').addEventListener('click', () => this.choosePreviewImage());
        document.getElementById('uploadToWorkshop').addEventListener('click', () => this.uploadToWorkshop());
        document.getElementById('previewWorkshop').addEventListener('click', () => this.previewWorkshop());

        // 实时预览更新
        document.getElementById('fileName').addEventListener('input', () => this.updatePreview());
        document.getElementById('workshopTitleInput').addEventListener('input', () => this.updatePreview());
        document.getElementById('workshopItemId').addEventListener('input', () => this.updatePreview());
        
        // 可视化编辑器实时更新
        const visualInputs = ['visualId', 'visualName', 'visualFamily', 'visualAbout', 'visualSee'];
        visualInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updatePreview());
            }
        });

        // 多语言输入实时更新
        const languageInputs = ['messageZhCn', 'tipsZhCn', 'messageEn', 'tipsEn', 'messageJp', 'tipsJp', 
                               'messageZhTw', 'tipsZhTw', 'messageRu', 'tipsRu', 'messageKo', 'tipsKo'];
        languageInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updatePreview());
            }
        });

        // 添加检查Steam状态按钮
        this.addSteamStatusIndicator();
        
        // 多命令管理相关事件监听器
        document.getElementById('addNewCommand').addEventListener('click', () => this.addNewCommand());
        document.getElementById('saveCurrentCommand').addEventListener('click', () => this.saveCurrentCommand());
        document.getElementById('cancelEditCommand').addEventListener('click', () => this.cancelEditCommand());
        document.getElementById('deleteCurrentCommand').addEventListener('click', () => this.deleteCurrentCommand());
        
        // 命令模板按钮事件监听器
        const templateButtons = document.querySelectorAll('.template-btn');
        templateButtons.forEach(btn => {
            btn.addEventListener('click', () => this.applyCommandTemplate(btn.dataset.template));
        });
    }

    initializeVisualEditor() {
        // 初始化配色选择器
        this.initializeColorPicker();
        
        // 初始化语言切换
        this.initializeLanguageTabs();
        
        // 初始化ID输入事件监听
        document.getElementById('visualId').addEventListener('input', (e) => {
            this.updateColorFromId(e.target.value);
        });

        // 初始化时根据默认ID设置配色
        this.updateColorFromId(1001);
    }

    initializeColorPicker() {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach((option, index) => {
            option.addEventListener('click', () => {
                // 移除所有选中状态
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                // 添加选中状态
                option.classList.add('selected');
                
                // 更新当前配色
                this.currentColorClass = parseInt(option.dataset.color);
                
                // 更新预览
                this.updateColorPreview();
                this.updatePreview();
            });
        });
    }

    initializeLanguageTabs() {
        const langTabs = document.querySelectorAll('.lang-tab');
        const langContents = document.querySelectorAll('.lang-content');

        langTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetLang = tab.dataset.lang;
                
                // 移除所有激活状态
                langTabs.forEach(t => t.classList.remove('active'));
                langContents.forEach(c => c.classList.remove('active'));
                
                // 激活当前选择的语言
                tab.classList.add('active');
                document.querySelector(`[data-lang="${targetLang}"].lang-content`).classList.add('active');
                
                this.currentLanguage = targetLang;
            });
        });
    }

    updateColorFromId(id) {
        if (!id) return;
        
        // 根据ID末位数字自动选择配色
        const colorIndex = parseInt(id) % 10;
        this.currentColorClass = colorIndex;
        
        // 更新配色选择器的选中状态
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        
        const selectedOption = document.querySelector(`[data-color="${colorIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // 更新预览
        this.updateColorPreview();
    }

    updateColorPreview() {
        const previewBox = document.getElementById('previewColorBox');
        if (previewBox) {
            // 移除所有配色类
            for (let i = 0; i <= 9; i++) {
                previewBox.classList.remove(`class-${i}`);
            }
            // 添加当前配色类
            previewBox.classList.add(`class-${this.currentColorClass}`);
        }
    }

    toggleJsonCode() {
        const jsonContainer = document.getElementById('jsonCodeContainer');
        const toggleButton = document.getElementById('toggleJsonCode');
        
        if (jsonContainer.style.display === 'none') {
            jsonContainer.style.display = 'block';
            toggleButton.textContent = '隐藏JSON代码';
        } else {
            jsonContainer.style.display = 'none';
            toggleButton.textContent = '显示JSON代码';
        }
    }

    updateJsonFromVisual() {
        // 根据命令数量决定JSON格式
        if (this.commandList.length === 0) {
            // 没有命令时，生成单个对象格式
            const jsonData = {
                id: parseInt(document.getElementById('visualId').value) || 1001,
                name: document.getElementById('visualName').value || '',
                family: document.getElementById('visualFamily').value || 'workshop',
                about: document.getElementById('visualAbout').value || '',
                see: document.getElementById('visualSee').value || 'yes',
                command: '',
                
                // 中文
                message: document.getElementById('messageZhCn').value || '',
                tips: document.getElementById('tipsZhCn').value || '',
                
                // 英文
                message_en: document.getElementById('messageEn').value || '',
                tips_en: document.getElementById('tipsEn').value || '',
                
                // 日文
                message_jp: document.getElementById('messageJp').value || '',
                tips_jp: document.getElementById('tipsJp').value || '',
                
                // 繁体中文
                message_zh_tw: document.getElementById('messageZhTw').value || '',
                tips_zh_tw: document.getElementById('tipsZhTw').value || '',
                
                // 俄文
                message_ru: document.getElementById('messageRu').value || '',
                tips_ru: document.getElementById('tipsRu').value || '',
                
                // 韩文
                message_ko: document.getElementById('messageKo').value || '',
                tips_ko: document.getElementById('tipsKo').value || ''
            };
            
            document.getElementById('jsonEditor').value = JSON.stringify(jsonData, null, 2);
        } else if (this.commandList.length === 1) {
            // 单条命令时，生成单个对象格式
            const command = this.commandList[0];
            const jsonData = {
                id: parseInt(document.getElementById('visualId').value) || 1001,
                name: document.getElementById('visualName').value || '',
                family: document.getElementById('visualFamily').value || 'workshop',
                about: document.getElementById('visualAbout').value || '',
                see: document.getElementById('visualSee').value || 'yes',
                command: command.command,
                
                // 中文
                message: document.getElementById('messageZhCn').value || command.name,
                tips: document.getElementById('tipsZhCn').value || command.description,
                
                // 英文
                message_en: document.getElementById('messageEn').value || command.name,
                tips_en: document.getElementById('tipsEn').value || command.description,
                
                // 日文
                message_jp: document.getElementById('messageJp').value || command.name,
                tips_jp: document.getElementById('tipsJp').value || command.description,
                
                // 繁体中文
                message_zh_tw: document.getElementById('messageZhTw').value || command.name,
                tips_zh_tw: document.getElementById('tipsZhTw').value || command.description,
                
                // 俄文
                message_ru: document.getElementById('messageRu').value || command.name,
                tips_ru: document.getElementById('tipsRu').value || command.description,
                
                // 韩文
                message_ko: document.getElementById('messageKo').value || command.name,
                tips_ko: document.getElementById('tipsKo').value || command.description
            };
            
            document.getElementById('jsonEditor').value = JSON.stringify(jsonData, null, 2);
        } else {
            // 多条命令时，生成数组格式
            const baseId = parseInt(document.getElementById('visualId').value) || 1001;
            const baseName = document.getElementById('visualName').value || '';
            const family = document.getElementById('visualFamily').value || 'workshop';
            const about = document.getElementById('visualAbout').value || '';
            const see = document.getElementById('visualSee').value || 'yes';
            
            const jsonArray = this.commandList.map((command, index) => {
                return {
                    id: baseId + index,
                    name: baseName ? `${baseName} - ${command.name}` : command.name,
                    family: family,
                    about: about || command.description,
                    see: see,
                    command: command.command,
                    
                    // 中文
                    message: document.getElementById('messageZhCn').value || command.name,
                    tips: document.getElementById('tipsZhCn').value || command.description,
                    
                    // 英文  
                    message_en: document.getElementById('messageEn').value || command.name,
                    tips_en: document.getElementById('tipsEn').value || command.description,
                    
                    // 日文
                    message_jp: document.getElementById('messageJp').value || command.name,
                    tips_jp: document.getElementById('tipsJp').value || command.description,
                    
                    // 繁体中文
                    message_zh_tw: document.getElementById('messageZhTw').value || command.name,
                    tips_zh_tw: document.getElementById('tipsZhTw').value || command.description,
                    
                    // 俄文
                    message_ru: document.getElementById('messageRu').value || command.name,
                    tips_ru: document.getElementById('tipsRu').value || command.description,
                    
                    // 韩文
                    message_ko: document.getElementById('messageKo').value || command.name,
                    tips_ko: document.getElementById('tipsKo').value || command.description
                };
            });
            
            document.getElementById('jsonEditor').value = JSON.stringify(jsonArray, null, 2);
        }
        
        // 验证JSON
        this.validateJson();
        
        this.showStatus('已从可视化界面更新JSON', 'success');
    }

    syncVisualFromJson() {
        try {
            const jsonText = document.getElementById('jsonEditor').value;
            const jsonData = JSON.parse(jsonText);
            
            // 检查是否为数组格式（多命令）
            if (Array.isArray(jsonData)) {
                if (jsonData.length === 0) {
                    this.showStatus('JSON数组为空', 'error');
                    return;
                }
                
                // 使用第一个对象的基本信息
                const firstItem = jsonData[0];
                document.getElementById('visualId').value = firstItem.id || 1001;
                document.getElementById('visualName').value = firstItem.name ? firstItem.name.split(' - ')[0] : '';
                document.getElementById('visualFamily').value = firstItem.family || 'workshop';
                document.getElementById('visualAbout').value = firstItem.about || '';
                document.getElementById('visualSee').value = firstItem.see || 'yes';
                
                // 更新多语言消息（使用第一个对象的信息）
                document.getElementById('messageZhCn').value = firstItem.message || '';
                document.getElementById('tipsZhCn').value = firstItem.tips || '';
                document.getElementById('messageEn').value = firstItem.message_en || '';
                document.getElementById('tipsEn').value = firstItem.tips_en || '';
                document.getElementById('messageJp').value = firstItem.message_jp || '';
                document.getElementById('tipsJp').value = firstItem.tips_jp || '';
                document.getElementById('messageZhTw').value = firstItem.message_zh_tw || '';
                document.getElementById('tipsZhTw').value = firstItem.tips_zh_tw || '';
                document.getElementById('messageRu').value = firstItem.message_ru || '';
                document.getElementById('tipsRu').value = firstItem.tips_ru || '';
                document.getElementById('messageKo').value = firstItem.message_ko || '';
                document.getElementById('tipsKo').value = firstItem.tips_ko || '';
                
                // 提取所有命令到命令列表
                this.commandList = jsonData.map(item => {
                    // 提取命令名称（去掉基础名称前缀）
                    let commandName = item.name || `命令${item.id}`;
                    const baseName = document.getElementById('visualName').value;
                    if (baseName && commandName.startsWith(`${baseName} - `)) {
                        commandName = commandName.substring(`${baseName} - `.length);
                    }
                    
                    return {
                        name: commandName,
                        command: item.command || '',
                        description: item.tips || item.about || '无描述'
                    };
                });
                
                // 重新渲染命令列表
                this.renderCommandList();
                
                this.showStatus(`已从JSON数组同步${jsonData.length}条命令到可视化界面`, 'success');
            } else {
                // 单个对象格式
                document.getElementById('visualId').value = jsonData.id || 1001;
                document.getElementById('visualName').value = jsonData.name || '';
                document.getElementById('visualFamily').value = jsonData.family || 'workshop';
                document.getElementById('visualAbout').value = jsonData.about || '';
                document.getElementById('visualSee').value = jsonData.see || 'yes';
                
                // 更新多语言消息
                document.getElementById('messageZhCn').value = jsonData.message || '';
                document.getElementById('tipsZhCn').value = jsonData.tips || '';
                document.getElementById('messageEn').value = jsonData.message_en || '';
                document.getElementById('tipsEn').value = jsonData.tips_en || '';
                document.getElementById('messageJp').value = jsonData.message_jp || '';
                document.getElementById('tipsJp').value = jsonData.tips_jp || '';
                document.getElementById('messageZhTw').value = jsonData.message_zh_tw || '';
                document.getElementById('tipsZhTw').value = jsonData.tips_zh_tw || '';
                document.getElementById('messageRu').value = jsonData.message_ru || '';
                document.getElementById('tipsRu').value = jsonData.tips_ru || '';
                document.getElementById('messageKo').value = jsonData.message_ko || '';
                document.getElementById('tipsKo').value = jsonData.tips_ko || '';
                
                // 如果有命令，添加到命令列表
                if (jsonData.command && jsonData.command.trim()) {
                    this.commandList = [{
                        name: jsonData.name || '单条命令',
                        command: jsonData.command,
                        description: jsonData.tips || jsonData.about || '从JSON导入的命令'
                    }];
                } else {
                    this.commandList = [];
                }
                
                // 重新渲染命令列表
                this.renderCommandList();
                
                this.showStatus('已从JSON对象同步到可视化界面', 'success');
            }
            
            // 根据ID更新配色
            this.updateColorFromId(document.getElementById('visualId').value);
            
            // 更新预览
            this.updatePreview();
            
        } catch (error) {
            this.showStatus(`同步失败: ${error.message}`, 'error');
        }
    }

    addSteamStatusIndicator() {
        // 在Steam创意工坊标题后添加状态指示器
        const workshopTitle = document.getElementById('workshopTitle');
        const statusIndicator = document.createElement('span');
        statusIndicator.id = 'steamStatus';
        statusIndicator.style.cssText = `
            margin-left: 10px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: normal;
            cursor: pointer;
        `;
        statusIndicator.textContent = '检查中...';
        statusIndicator.onclick = () => this.checkSteamStatus();
        workshopTitle.appendChild(statusIndicator);
    }

    async checkSteamStatus() {
        const statusIndicator = document.getElementById('steamStatus');
        if (!statusIndicator) return;

        statusIndicator.textContent = '检查中...';
        statusIndicator.style.background = '#666';
        statusIndicator.style.color = '#fff';

        try {
            const steamStatus = await ipcRenderer.invoke('check-steam-status');
            
            if (steamStatus.isRunning && steamStatus.hasWorkshopAPI) {
                statusIndicator.textContent = 'Steam已连接';
                statusIndicator.style.background = '#28a745';
                statusIndicator.style.color = '#fff';
                statusIndicator.title = '点击重新检查Steam状态';
            } else if (steamStatus.isRunning) {
                statusIndicator.textContent = 'Steam运行中（API未就绪）';
                statusIndicator.style.background = '#ffc107';
                statusIndicator.style.color = '#000';
                statusIndicator.title = '点击重新检查Steam状态';
            } else {
                statusIndicator.textContent = 'Steam未运行';
                statusIndicator.style.background = '#dc3545';
                statusIndicator.style.color = '#fff';
                statusIndicator.title = '点击重新检查Steam状态';
            }
        } catch (error) {
            statusIndicator.textContent = 'Steam状态未知';
            statusIndicator.style.background = '#6c757d';
            statusIndicator.style.color = '#fff';
            statusIndicator.title = '点击重新检查Steam状态';
            console.error('检查Steam状态失败:', error);
        }
    }

    initializePreview() {
        this.updatePreview();
        this.updateColorPreview();
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        // 移除所有类型的类
        statusElement.classList.remove('success', 'error', 'info');
        
        // 添加对应类型的类
        statusElement.classList.add(type);
        
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }

    validateJson() {
        const jsonText = document.getElementById('jsonEditor').value;
        try {
            const parsed = JSON.parse(jsonText);
            this.currentJsonData = parsed;
            this.showStatus('JSON格式有效！', 'success');
            document.getElementById('previewJsonValid').textContent = '有效';
            document.getElementById('previewJsonValid').style.color = '#28a745';
            return true;
        } catch (error) {
            this.showStatus(`JSON格式错误: ${error.message}`, 'error');
            document.getElementById('previewJsonValid').textContent = '无效';
            document.getElementById('previewJsonValid').style.color = '#dc3545';
            return false;
        }
    }

    formatJson() {
        const jsonText = document.getElementById('jsonEditor').value;
        try {
            const parsed = JSON.parse(jsonText);
            const formatted = JSON.stringify(parsed, null, 2);
            document.getElementById('jsonEditor').value = formatted;
            this.showStatus('JSON格式化完成！', 'success');
        } catch (error) {
            this.showStatus(`无法格式化: ${error.message}`, 'error');
        }
    }

    loadTemplate() {
        const templates = {
            single_ffmpeg: {
                "id": 1001,
                "name": "基础FFmpeg配置",
                "family": "workshop",
                "about": "创意工坊基础配置模板",
                "message": "转换为h264编码的mp4视频",
                "see": "yes",
                "tips": "将视频转换为标准h264编码的mp4格式，兼容性最好",
                "message_jp": "h264エンコードのmp4ビデオに変換する",
                "tips_jp": "ビデオを標準的なh264エンコードのmp4形式に変換し、互換性が最も良い",
                "command": "ffmpeg -i ${filePath} -y -c:v libx264 ${outputPath}${.mp4}",
                "message_en": "Convert to H264 encoded MP4 video",
                "tips_en": "Convert video to standard H264 encoded MP4 format with best compatibility",
                "message_zh_tw": "轉換為h264編碼的mp4視頻",
                "tips_zh_tw": "將視頻轉換為標準h264編碼的mp4格式，兼容性最好",
                "message_ru": "Конвертировать в MP4 видео с кодировкой H264",
                "tips_ru": "Преобразование видео в стандартный формат MP4 с кодировкой H264 и лучшей совместимостью",
                "message_ko": "H264 인코딩 MP4 비디오로 변환",
                "tips_ko": "최고의 호환성을 갖춘 표준 H264 인코딩 MP4 형식으로 비디오를 변환합니다"
            },
            multiple_configs: [
                {
                    "id": 1010,
                    "name": "视频转换配置包",
                    "file": "workshop_video.json",
                    "about": "包含多种视频转换的预设",
                    "message": "转换为h264编码的mp4",
                    "tips": "将视频转换为标准h264编码的mp4格式，兼容性最佳",
                    "command": "ffmpeg -i ${filePath} -y -c:v libx264 ${outputPath}${.mp4}",
                    "message_jp": "h264エンコードのmp4に変換する",
                    "tips_jp": "ビデオを標準的なh264エンコードのmp4形式に変換し、互換性が最高",
                    "message_en": "Convert to H264 encoded MP4",
                    "tips_en": "Convert video to standard H264 encoded MP4 format with best compatibility",
                    "message_zh_tw": "轉換為h264編碼的mp4",
                    "tips_zh_tw": "將視頻轉換為標準h264編碼的mp4格式，兼容性最佳",
                    "message_ru": "Конвертировать в MP4 с кодировкой H264",
                    "tips_ru": "Преобразование видео в стандартный формат MP4 с кодировкой H264 и лучшей совместимостью",
                    "message_ko": "H264 인코딩 MP4로 변환",
                    "tips_ko": "최고의 호환성을 갖춘 표준 H264 인코딩 MP4 형식으로 비디오를 변환합니다"
                },
                {
                    "id": 1011,
                    "name": "视频转GIF预设",
                    "file": "workshop_video.json",
                    "about": "将视频转换为动态GIF格式",
                    "message": "转成动态gif",
                    "tips": "把你的视频导出为动态gif图片，适合分享和展示",
                    "command": "ffmpeg -i ${filePath} ${outputPath}${.gif}",
                    "message_jp": "動的gifに変換する",
                    "tips_jp": "選んだビデオを動的gif画像としてエクスポートし、共有や表示に適している",
                    "message_en": "Convert to animated GIF",
                    "tips_en": "Export your video as an animated GIF image, suitable for sharing and display",
                    "message_zh_tw": "轉成動態gif",
                    "tips_zh_tw": "把你的視頻導出為動態gif圖片，適合分享和展示",
                    "message_ru": "Конвертировать в анимированный GIF",
                    "tips_ru": "Экспортируйте ваше видео в виде анимированного GIF изображения, подходящего для обмена и отображения",
                    "message_ko": "애니메이션 GIF로 변환",
                    "tips_ko": "비디오를 애니메이션 GIF 이미지로 내보내어 공유 및 표시에 적합합니다"
                },
                {
                    "id": 1012,
                    "name": "提取音频预设",
                    "file": "workshop_video.json",
                    "about": "从视频中提取音频并转换为MP3",
                    "message": "将视频内的音频提取出来",
                    "tips": "把视频内部的声音单独提取出来保存为音频文件",
                    "command": "ffmpeg -i ${filePath} -y -vn ${outputPath}${.mp3}",
                    "message_jp": "ビデオ内の音声を抽出する",
                    "tips_jp": "ビデオ内の音声を単独で抽出し、音声ファイルとして保存する",
                    "message_en": "Extract audio from video",
                    "tips_en": "Extract the sound from the video and save it as an audio file",
                    "message_zh_tw": "將視頻內的音頻提取出來",
                    "tips_zh_tw": "把視頻內部的聲音單獨提取出來保存為音頻文件",
                    "message_ru": "Извлечь аудио из видео",
                    "tips_ru": "Извлеките звук из видео и сохраните его как аудиофайл",
                    "message_ko": "비디오에서 오디오 추출",
                    "tips_ko": "비디오에서 소리를 추출하여 오디오 파일로 저장하십시오"
                }
            ],
            game_config: {
                "id": 1004,
                "name": "游戏配置模板",
                "family": "workshop",
                "about": "游戏配置专用模板",
                "gameSettings": {
                    "graphics": {
                        "resolution": "1920x1080",
                        "fullscreen": true,
                        "vsync": true,
                        "quality": "high",
                        "antiAliasing": "MSAA 4x"
                    },
                    "audio": {
                        "masterVolume": 80,
                        "sfxVolume": 70,
                        "musicVolume": 60,
                        "voiceVolume": 85,
                        "sampleRate": "44100Hz"
                    },
                    "controls": {
                        "mouseSensitivity": 50,
                        "invertY": false,
                        "keyBindings": {
                            "forward": "W",
                            "backward": "S",
                            "left": "A",
                            "right": "D",
                            "jump": "Space",
                            "crouch": "Ctrl"
                        }
                    },
                    "gameplay": {
                        "difficulty": "normal",
                        "autoSave": true,
                        "showFPS": false,
                        "showMinimap": true
                    }
                }
            },
            app_config: {
                "id": 1006,
                "name": "应用程序配置",
                "family": "workshop",
                "about": "通用应用程序配置模板",
                "appSettings": {
                    "general": {
                        "appName": "我的应用",
                        "version": "1.0.0",
                        "language": "zh_cn",
                        "theme": "dark",
                        "autoUpdate": true
                    },
                    "performance": {
                        "enableGPUAcceleration": true,
                        "maxMemoryUsage": "4GB",
                        "enableMultiThreading": true,
                        "cacheSize": "1GB"
                    },
                    "ui": {
                        "fontSize": 14,
                        "showToolbar": true,
                        "showStatusBar": true,
                        "windowSize": {
                            "width": 1200,
                            "height": 800
                        }
                    },
                    "advanced": {
                        "debugMode": false,
                        "logLevel": "info",
                        "enableTelemetry": false,
                        "customPlugins": []
                    }
                }
            }
        };

        // 创建一个选择对话框让用户选择模板
        const templateNames = Object.keys(templates);
        const templateOptions = templateNames.map((key, index) => {
            const template = templates[key];
            let description = '无描述';
            
            if (Array.isArray(template)) {
                description = `包含 ${template.length} 个配置项的数组`;
            } else if (template.about) {
                description = template.about;
            } else if (template.name) {
                description = template.name;
            }
            
            return `${index + 1}. ${key} - ${description}`;
        }).join('\n');
        
        const choice = prompt(`请选择要加载的模板:\n\n${templateOptions}\n\n请输入数字 (1-${templateNames.length}):`);
        const selectedIndex = parseInt(choice) - 1;
        
        if (selectedIndex >= 0 && selectedIndex < templateNames.length) {
            const selectedTemplate = templateNames[selectedIndex];
            const templateData = templates[selectedTemplate];
            
            // 如果是数组，选择第一个元素
            const actualTemplate = Array.isArray(templateData) ? templateData[0] : templateData;
            
            // 更新JSON编辑器
            document.getElementById('jsonEditor').value = JSON.stringify(actualTemplate, null, 2);
            
            // 同步到可视化界面
            this.syncVisualFromJson();
            
            let templateName = selectedTemplate;
            if (Array.isArray(templateData)) {
                templateName = `${selectedTemplate} (${templateData.length}个配置项)`;
            } else if (actualTemplate.name) {
                templateName = actualTemplate.name;
            }
            
            this.showStatus(`已加载模板: ${templateName}`, 'success');
        } else if (choice !== null) {
            // 如果用户输入了无效值，默认加载第一个模板
            const defaultTemplate = templateNames[0];
            const templateData = templates[defaultTemplate];
            const actualTemplate = Array.isArray(templateData) ? templateData[0] : templateData;
            
            document.getElementById('jsonEditor').value = JSON.stringify(actualTemplate, null, 2);
            this.syncVisualFromJson();
            this.showStatus(`已加载默认模板: ${defaultTemplate}`, 'success');
        }
    }

    async chooseSavePath() {
        try {
            // 生成UUID作为默认文件名
            const crypto = require('crypto');
            const uuid = crypto.randomUUID();
            
            const result = await ipcRenderer.invoke('show-save-dialog', {
                title: '选择保存位置',
                defaultPath: `${uuid}.json`,
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                this.savePath = path.dirname(result.filePath);
                document.getElementById('savePath').textContent = this.savePath;
                // 提取不带扩展名的文件名
                const baseName = path.basename(result.filePath, '.json');
                document.getElementById('fileName').value = baseName;
                this.updatePreview();
                this.showStatus('保存位置已选择', 'success');
            }
        } catch (error) {
            this.showStatus(`选择保存位置失败: ${error.message}`, 'error');
        }
    }

    async saveFile() {
        let fileName = document.getElementById('fileName').value;
        
        // 如果文件名为空，生成UUID
        if (!fileName) {
            const crypto = require('crypto');
            fileName = crypto.randomUUID();
            document.getElementById('fileName').value = fileName;
            console.log('上传时自动生成UUID文件名:', fileName);
        }

        if (!this.savePath) {
            this.showStatus('请先选择保存位置', 'error');
            return;
        }

        if (!this.validateJson()) {
            return;
        }

        try {
            const filePath = path.join(this.savePath, `${fileName}.json`);
            const jsonText = document.getElementById('jsonEditor').value;
            
            console.log('使用文件名:', fileName);
            console.log('完整文件路径:', filePath);
            
            fs.writeFileSync(filePath, jsonText, 'utf8');
            this.showStatus(`文件已保存到: ${filePath}`, 'success');
        } catch (error) {
            this.showStatus(`保存文件失败: ${error.message}`, 'error');
        }
    }

    async loadFile() {
        try {
            const result = await ipcRenderer.invoke('show-open-dialog', {
                title: '选择JSON文件',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                const content = fs.readFileSync(filePath, 'utf8');
                
                document.getElementById('jsonEditor').value = content;
                this.savePath = path.dirname(filePath);
                document.getElementById('savePath').textContent = this.savePath;
                document.getElementById('fileName').value = path.basename(filePath, '.json');
                
                this.validateJson();
                this.syncVisualFromJson();
                this.updatePreview();
                this.showStatus('文件加载成功', 'success');
            }
        } catch (error) {
            this.showStatus(`加载文件失败: ${error.message}`, 'error');
        }
    }

    async choosePreviewImage() {
        try {
            const result = await ipcRenderer.invoke('show-open-dialog', {
                title: '选择预览图',
                filters: [
                    { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                this.previewImagePath = result.filePaths[0];
                document.getElementById('previewImagePath').textContent = this.previewImagePath;
                
                const previewImg = document.getElementById('previewImageDisplay');
                previewImg.src = `file://${this.previewImagePath}`;
                previewImg.style.display = 'block';
                
                this.showStatus('预览图已选择', 'success');
            }
        } catch (error) {
            this.showStatus(`选择预览图失败: ${error.message}`, 'error');
        }
    }

    async uploadToWorkshop() {
        console.log('上传按钮被点击');
        
        // 先从可视化界面更新JSON，确保数据是最新的
        this.updateJsonFromVisual();
        
        // 调试：检查DOM元素是否存在
        const itemIdElement = document.getElementById('workshopItemId');
        const titleElement = document.getElementById('workshopTitleInput');
        const descElement = document.getElementById('workshopDescription');
        const tagsElement = document.getElementById('workshopTags');
        const visibilityElement = document.getElementById('workshopVisibility');
        
        console.log('DOM元素检查:', {
            itemIdElement: !!itemIdElement,
            titleElement: !!titleElement,
            descElement: !!descElement,
            tagsElement: !!tagsElement,
            visibilityElement: !!visibilityElement
        });
        
        const workshopItemId = itemIdElement ? itemIdElement.value.trim() : '';
        let title = titleElement ? titleElement.value : '';
        let description = descElement ? descElement.value : '';
        const tags = tagsElement ? tagsElement.value : '';
        const visibility = visibilityElement ? visibilityElement.value : '0';
        
        // 检查是否为更新操作
        const isUpdate = workshopItemId && workshopItemId.length > 0;
        console.log('操作类型:', isUpdate ? '更新现有物品' : '创建新物品');
        if (isUpdate) {
            console.log('更新物品ID:', workshopItemId);
        }
        
        // 如果工坊标题为空，尝试使用可视化界面中的名称
        if (!title) {
            const visualName = document.getElementById('visualName');
            if (visualName && visualName.value) {
                title = visualName.value;
                titleElement.value = title; // 同步到工坊标题字段
                console.log('使用可视化界面中的名称作为标题:', title);
            }
        }
        
        // 如果描述为空，尝试使用可视化界面中的关于信息
        if (!description) {
            const visualAbout = document.getElementById('visualAbout');
            if (visualAbout && visualAbout.value) {
                description = visualAbout.value;
                descElement.value = description; // 同步到工坊描述字段
                console.log('使用可视化界面中的关于信息作为描述:', description);
            }
        }

        // 如果还是为空，使用默认值
        if (!title) {
            const currentDate = new Date().toLocaleDateString('zh-CN');
            title = isUpdate ? `Kurisu配置更新 ${currentDate}` : `Kurisu配置 ${currentDate}`;
            titleElement.value = title;
            console.log('使用默认标题:', title);
        }
        
        if (!description) {
            description = isUpdate 
                ? '通过Kurisu创意工坊功能更新的FFmpeg配置文件。' 
                : '通过Kurisu创意工坊功能上传的FFmpeg配置文件，可在Steam中编辑详细信息。';
            descElement.value = description;
            console.log('使用默认描述:', description);
        }

        console.log('收集到的数据:', { workshopItemId, title, description, tags, visibility });

        console.log('开始验证JSON...');
        if (!this.validateJson()) {
            console.log('JSON验证失败，上传停止');
            return;
        }
        console.log('JSON验证通过');

        // 首先保存文件
        console.log('检查保存路径:', this.savePath);
        if (!this.savePath) {
            // 设置默认保存路径为share文件夹
            try {
                const userDataPath = await ipcRenderer.invoke('get-user-data-path');
                const defaultPath = path.join(userDataPath, 'kurisu', 'messages', 'share');
                
                // 确保目录存在
                if (!fs.existsSync(defaultPath)) {
                    fs.mkdirSync(defaultPath, { recursive: true });
                }
                
                this.savePath = defaultPath;
                document.getElementById('savePath').textContent = this.savePath;
                console.log('使用默认保存路径:', this.savePath);
                this.showStatus('已自动设置保存位置到share目录', 'info');
            } catch (error) {
                console.error('获取用户数据路径失败:', error);
                this.showStatus('设置默认保存路径失败', 'error');
                return;
            }
        }
        console.log('保存路径检查通过');

        try {
            let fileName = document.getElementById('fileName').value;
            
            // 如果文件名为空，生成UUID
            if (!fileName) {
                const crypto = require('crypto');
                fileName = crypto.randomUUID();
                document.getElementById('fileName').value = fileName;
                console.log('上传时自动生成UUID文件名:', fileName);
            }
            
            const filePath = path.join(this.savePath, `${fileName}.json`);
            const jsonText = document.getElementById('jsonEditor').value;
            
            fs.writeFileSync(filePath, jsonText, 'utf8');

            // 准备上传数据
            const uploadData = {
                title: title,
                description: description,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
                visibility: parseInt(visibility),
                contentPath: this.savePath,
                previewImage: this.previewImagePath || null,
                jsonFile: filePath,
                // 添加更新相关字段
                isUpdate: isUpdate,
                workshopItemId: workshopItemId || null
            };

            console.log('准备上传的数据:', uploadData);
            this.showStatus(isUpdate ? '正在更新Steam创意工坊物品...' : '正在上传到Steam创意工坊...', 'info');
            
            // 发送上传请求到主进程
            const result = await ipcRenderer.invoke('upload-to-workshop', uploadData);
            
            if (result.success) {
                const successMessage = isUpdate 
                    ? `更新成功！工坊ID: ${result.publishedFileId}` 
                    : `上传成功！工坊ID: ${result.publishedFileId}`;
                this.showStatus(successMessage, 'success');
                
                // 如果是创建新物品，将返回的ID填入到工坊ID字段中
                if (!isUpdate && result.publishedFileId) {
                    itemIdElement.value = result.publishedFileId;
                    console.log('新创建的物品ID已填入字段:', result.publishedFileId);
                }
                
                // 可选：打开Steam工坊页面
                const workshopUrl = `https://steamcommunity.com/sharedfiles/filedetails/?id=${result.publishedFileId}`;
                const confirmMessage = isUpdate 
                    ? '更新成功！是否在浏览器中打开工坊页面？\n\n提示：你可以在Steam客户端中编辑更多详细信息。'
                    : '上传成功！是否在浏览器中打开工坊页面？\n\n提示：你可以在Steam客户端中编辑标题、描述等详细信息。';
                    
                if (confirm(confirmMessage)) {
                    require('electron').shell.openExternal(workshopUrl);
                }
            } else {
                // 根据错误类型显示不同的提示
                if (result.error.includes('Steam未运行')) {
                    this.showSteamNotRunningDialog();
                } else if (result.error.includes('Steam客户端未初始化')) {
                    this.showSteamInitErrorDialog();
                } else if (result.error.includes('需要在 Steam 客户端中接受创意工坊协议')) {
                    this.showWorkshopAgreementDialog();
                } else {
                    const errorMessage = isUpdate ? `更新失败: ${result.error}` : `上传失败: ${result.error}`;
                    this.showStatus(errorMessage, 'error');
                }
            }
        } catch (error) {
            console.error('操作过程中发生错误:', error);
            const errorMessage = isUpdate ? `更新失败: ${error.message}` : `上传失败: ${error.message}`;
            this.showStatus(errorMessage, 'error');
        }
    }

    showSteamNotRunningDialog() {
        const confirmed = confirm(`Steam未运行！

创意工坊功能需要Steam客户端运行才能使用。

请按照以下步骤操作：
1. 启动Steam客户端
2. 确保已登录Steam账户
3. 重新尝试上传

是否现在重新尝试上传？`);
        
        if (confirmed) {
            // 延迟几秒后重新尝试
            setTimeout(() => {
                this.uploadToWorkshop();
            }, 2000);
        }
    }

    showSteamInitErrorDialog() {
        alert(`Steam初始化失败！

可能的原因：
1. Steam客户端未完全启动
2. Steam API权限问题
3. 网络连接问题

建议解决方法：
1. 重启Steam客户端
2. 确保网络连接正常
3. 重启Kurisu应用`);
    }

    showWorkshopAgreementDialog() {
        const confirmed = confirm(`Steam创意工坊协议未接受！

请按照以下步骤操作：
1. 打开Steam客户端
2. 在Steam中访问任意创意工坊页面
3. 接受创意工坊协议
4. 重新尝试上传

是否现在打开Steam创意工坊页面？`);
        
        if (confirmed) {
            require('electron').shell.openExternal('https://steamcommunity.com/workshop/');
        }
    }

    previewWorkshop() {
        const workshopItemId = document.getElementById('workshopItemId').value;
        const title = document.getElementById('workshopTitleInput').value;
        const description = document.getElementById('workshopDescription').value;
        const tags = document.getElementById('workshopTags').value;
        const visibility = document.getElementById('workshopVisibility').value;

        const isUpdate = workshopItemId && workshopItemId.trim().length > 0;
        
        let previewText = `预览信息:\n\n`;
        previewText += `操作类型: ${isUpdate ? '更新现有物品' : '创建新物品'}\n`;
        if (isUpdate) {
            previewText += `工坊物品ID: ${workshopItemId}\n`;
        }
        previewText += `标题: ${title || '未设置'}\n`;
        previewText += `描述: ${description || '未设置'}\n`;
        previewText += `标签: ${tags || '未设置'}\n`;
        previewText += `可见性: ${visibility === '0' ? '公开' : visibility === '1' ? '仅好友可见' : '私人'}\n`;
        previewText += `预览图: ${this.previewImagePath || '未设置'}\n`;
        previewText += `JSON文件: ${this.validateJson() ? '有效' : '无效'}\n`;
        previewText += `配色主题: class-${this.currentColorClass}\n`;

        alert(previewText);
    }

    updatePreview() {
        const currentFileName = document.getElementById('fileName').value;
        const fileName = currentFileName || '将自动生成UUID';
        const title = document.getElementById('workshopTitleInput').value || 
                     document.getElementById('visualName').value || '未设置';
        const workshopItemId = document.getElementById('workshopItemId').value;
        const isUpdate = workshopItemId && workshopItemId.trim().length > 0;
        
        document.getElementById('previewFileName').textContent = fileName + '.json';
        document.getElementById('previewSavePath').textContent = this.savePath || '将自动设置';
        document.getElementById('previewTitleText').textContent = title;
        document.getElementById('previewOperationType').textContent = isUpdate ? '更新现有物品' : '创建新物品';
        
        // 更新配色预览
        this.updateColorPreview();
    }

    // 添加多命令管理功能方法
    initializeCommandManager() {
        // 初始化默认命令
        this.commandList = [
            {
                name: "H264转换",
                command: "ffmpeg -i ${filePath} -y -c:v libx264 ${outputPath}${.mp4}",
                description: "将视频转换为标准H264编码的MP4格式"
            }
        ];
        this.renderCommandList();
    }
    
    renderCommandList() {
        const commandListElement = document.getElementById('commandList');
        
        if (this.commandList.length === 0) {
            commandListElement.innerHTML = '<div class="empty-command-list">还没有添加任何命令，点击上方"添加新命令"按钮开始创建</div>';
            return;
        }
        
        commandListElement.innerHTML = '';
        this.commandList.forEach((command, index) => {
            const commandItem = document.createElement('div');
            commandItem.className = 'command-item';
            commandItem.innerHTML = `
                <div class="command-item-header">
                    <div class="command-item-name">${command.name}</div>
                    <div class="command-item-actions">
                        <button class="command-item-btn edit" onclick="window.workshopManager.editCommand(${index})">编辑</button>
                        <button class="command-item-btn delete" onclick="window.workshopManager.removeCommand(${index})">删除</button>
                    </div>
                </div>
                <div class="command-item-description">${command.description}</div>
                <div class="command-item-command">${command.command}</div>
            `;
            commandListElement.appendChild(commandItem);
        });
    }
    
    addNewCommand() {
        this.isEditingCommand = true;
        this.currentEditingCommandIndex = -1;
        
        // 显示编辑器
        const editor = document.getElementById('currentCommandEditor');
        editor.style.display = 'block';
        
        // 设置标题和按钮状态
        document.getElementById('currentCommandTitle').textContent = '添加新命令';
        document.getElementById('deleteCurrentCommand').style.display = 'none';
        
        // 清空表单
        document.getElementById('currentCommandName').value = '';
        document.getElementById('currentCommandText').value = '';
        document.getElementById('currentCommandDescription').value = '';
        
        // 聚焦到名称输入框
        document.getElementById('currentCommandName').focus();
    }
    
    editCommand(index) {
        if (index < 0 || index >= this.commandList.length) return;
        
        this.isEditingCommand = true;
        this.currentEditingCommandIndex = index;
        const command = this.commandList[index];
        
        // 显示编辑器
        const editor = document.getElementById('currentCommandEditor');
        editor.style.display = 'block';
        
        // 设置标题和按钮状态
        document.getElementById('currentCommandTitle').textContent = '编辑命令';
        document.getElementById('deleteCurrentCommand').style.display = 'inline-block';
        
        // 填充表单
        document.getElementById('currentCommandName').value = command.name;
        document.getElementById('currentCommandText').value = command.command;
        document.getElementById('currentCommandDescription').value = command.description;
        
        // 聚焦到名称输入框
        document.getElementById('currentCommandName').focus();
    }
    
    saveCurrentCommand() {
        const name = document.getElementById('currentCommandName').value.trim();
        const command = document.getElementById('currentCommandText').value.trim();
        const description = document.getElementById('currentCommandDescription').value.trim();
        
        // 验证输入
        if (!name) {
            this.showStatus('请输入命令名称', 'error');
            return;
        }
        
        if (!command) {
            this.showStatus('请输入FFmpeg命令', 'error');
            return;
        }
        
        const commandData = {
            name: name,
            command: command,
            description: description || '无描述'
        };
        
        if (this.currentEditingCommandIndex === -1) {
            // 添加新命令
            this.commandList.push(commandData);
            this.showStatus('新命令已添加', 'success');
        } else {
            // 更新现有命令
            this.commandList[this.currentEditingCommandIndex] = commandData;
            this.showStatus('命令已更新', 'success');
        }
        
        // 重新渲染列表
        this.renderCommandList();
        
        // 隐藏编辑器
        this.cancelEditCommand();
        
        // 更新JSON和预览
        this.updateJsonFromVisual();
        this.updatePreview();
    }
    
    cancelEditCommand() {
        this.isEditingCommand = false;
        this.currentEditingCommandIndex = -1;
        
        // 隐藏编辑器
        document.getElementById('currentCommandEditor').style.display = 'none';
        
        // 清空表单
        document.getElementById('currentCommandName').value = '';
        document.getElementById('currentCommandText').value = '';
        document.getElementById('currentCommandDescription').value = '';
    }
    
    deleteCurrentCommand() {
        if (this.currentEditingCommandIndex === -1) return;
        
        if (confirm('确定要删除这个命令吗？')) {
            this.commandList.splice(this.currentEditingCommandIndex, 1);
            this.renderCommandList();
            this.cancelEditCommand();
            this.showStatus('命令已删除', 'success');
            
            // 更新JSON和预览
            this.updateJsonFromVisual();
            this.updatePreview();
        }
    }
    
    removeCommand(index) {
        if (index < 0 || index >= this.commandList.length) return;
        
        if (confirm(`确定要删除命令"${this.commandList[index].name}"吗？`)) {
            this.commandList.splice(index, 1);
            this.renderCommandList();
            this.showStatus('命令已删除', 'success');
            
            // 更新JSON和预览
            this.updateJsonFromVisual();
            this.updatePreview();
        }
    }
    
    applyCommandTemplate(templateType) {
        const templates = {
            h264: {
                name: "H264转换",
                command: "ffmpeg -i ${filePath} -y -c:v libx264 -crf 23 ${outputPath}${.mp4}",
                description: "将视频转换为高质量H264编码的MP4格式，CRF=23保持良好的质量和文件大小平衡"
            },
            compress: {
                name: "视频压缩",
                command: "ffmpeg -i ${filePath} -y -c:v libx264 -crf 28 -preset medium ${outputPath}${.mp4}",
                description: "压缩视频文件大小，使用CRF=28获得较小的文件体积"
            },
            audio_extract: {
                name: "提取音频",
                command: "ffmpeg -i ${filePath} -y -vn -c:a libmp3lame ${outputPath}${.mp3}",
                description: "从视频中提取音频并保存为MP3格式"
            },
            gif_convert: {
                name: "转换GIF",
                command: "ffmpeg -i ${filePath} -y -vf \"fps=10,scale=480:-1:flags=lanczos\" ${outputPath}${.gif}",
                description: "将视频转换为GIF动图，10fps帧率，宽度480px"
            },
            trim: {
                name: "视频剪切",
                command: "ffmpeg -i ${filePath} -y -ss 00:00:00 -t 00:01:00 -c copy ${outputPath}${.mp4}",
                description: "剪切视频片段，从开始时间00:00:00剪切1分钟长度（需要手动修改时间参数）"
            },
            scale: {
                name: "调整分辨率",
                command: "ffmpeg -i ${filePath} -y -vf scale=1280:720 -c:a copy ${outputPath}${.mp4}",
                description: "将视频分辨率调整为1280x720，保持音频不变"
            }
        };
        
        const template = templates[templateType];
        if (!template) {
            this.showStatus('未知的模板类型', 'error');
            return;
        }
        
        // 如果正在编辑命令，将模板应用到编辑器
        if (this.isEditingCommand) {
            document.getElementById('currentCommandName').value = template.name;
            document.getElementById('currentCommandText').value = template.command;
            document.getElementById('currentCommandDescription').value = template.description;
            this.showStatus(`已应用${template.name}模板到编辑器`, 'success');
        } else {
            // 直接添加模板到命令列表
            this.commandList.push({
                name: template.name,
                command: template.command,
                description: template.description
            });
            this.renderCommandList();
            this.showStatus(`已添加${template.name}命令`, 'success');
            
            // 更新JSON和预览
            this.updateJsonFromVisual();
            this.updatePreview();
        }
    }

    // 初始化多语言支持
    initializeLanguage() {
        console.log('Workshop: Initializing language system...');
        // 读取配置文件获取当前语言设置
        const { ipcRenderer } = require('electron');
        
        ipcRenderer.invoke('get-user-data-path').then(userDataPath => {
            const configPath = path.join(userDataPath, 'kurisu', 'kirusu-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.SYSlanguage = config.langRule || 'zh_cn';
                console.log(`Workshop: Language loaded from config: ${this.SYSlanguage}`);
                this.updateLanguage();
            } else {
                console.log('Workshop: Config file not found, using default language: zh_cn');
                this.SYSlanguage = 'zh_cn';
                this.updateLanguage();
            }
        }).catch(error => {
            console.error('Workshop: Error loading language config:', error);
            this.SYSlanguage = 'zh_cn';
            this.updateLanguage();
        });
    }

    // 更新界面语言
    updateLanguage() {
        console.log(`Workshop: Updating language to: ${this.SYSlanguage}`);
        
        // 更新主要HTML元素
        this.updateMainElements();
        
        // 定义所有支持的语言文本
        const texts = {
            'zh_cn': {
                'addNewCommand': '+ 添加新命令',
                'saveCurrentCommand': '保存命令',
                'cancelEditCommand': '取消',
                'deleteCurrentCommand': '删除命令',
                'updateFromVisual': '更新JSON',
                'loadTemplate': '加载模板',
                'toggleJsonCode': '显示/隐藏JSON代码',
                'validateJson': '验证JSON',
                'formatJson': '格式化',
                'syncFromJson': '从JSON同步到可视化界面',
                'chooseSavePath': '选择位置',
                'saveFile': '保存文件',
                'loadFile': '加载文件',
                'choosePreviewImage': '选择图片',
                'uploadToWorkshop': '上传到创意工坊',
                'previewWorkshop': '预览',
                'mergeVdfFiles': '合并VDF文件',
                'previewMergedVdf': '预览合并结果',
                'clearVdfFiles': '清空所有',
                'h264': 'H264转换',
                'compress': '视频压缩',
                'audio_extract': '提取音频',
                'gif_convert': '转换GIF',
                'trim': '视频剪切',
                'scale': '调整分辨率',
                '选择文件': '选择文件',
                '移除': '移除'
            },
            'en': {
                'addNewCommand': '+ Add New Command',
                'saveCurrentCommand': 'Save Command',
                'cancelEditCommand': 'Cancel',
                'deleteCurrentCommand': 'Delete Command',
                'updateFromVisual': 'Update JSON',
                'loadTemplate': 'Load Template',
                'toggleJsonCode': 'Show/Hide JSON Code',
                'validateJson': 'Validate JSON',
                'formatJson': 'Format',
                'syncFromJson': 'Sync from JSON to Visual Interface',
                'chooseSavePath': 'Choose Location',
                'saveFile': 'Save File',
                'loadFile': 'Load File',
                'choosePreviewImage': 'Choose Image',
                'uploadToWorkshop': 'Upload to Workshop',
                'previewWorkshop': 'Preview',
                'mergeVdfFiles': 'Merge VDF Files',
                'previewMergedVdf': 'Preview Merge Result',
                'clearVdfFiles': 'Clear All',
                'h264': 'H264 Convert',
                'compress': 'Video Compress',
                'audio_extract': 'Extract Audio',
                'gif_convert': 'Convert GIF',
                'trim': 'Video Trim',
                'scale': 'Resize',
                'Choose File': 'Choose File',
                'Remove': 'Remove'
            },
            'jp': {
                'addNewCommand': '+ 新しいコマンドを追加',
                'saveCurrentCommand': 'コマンドを保存',
                'cancelEditCommand': 'キャンセル',
                'deleteCurrentCommand': 'コマンドを削除',
                'updateFromVisual': 'JSONを更新',
                'loadTemplate': 'テンプレートを読み込み',
                'toggleJsonCode': 'JSONコードを表示/非表示',
                'validateJson': 'JSONを検証',
                'formatJson': 'フォーマット',
                'syncFromJson': 'JSONからビジュアルインターフェースに同期',
                'chooseSavePath': '場所を選択',
                'saveFile': 'ファイルを保存',
                'loadFile': 'ファイルを読み込み',
                'choosePreviewImage': '画像を選択',
                'uploadToWorkshop': 'ワークショップにアップロード',
                'previewWorkshop': 'プレビュー',
                'mergeVdfFiles': 'VDFファイルをマージ',
                'previewMergedVdf': 'マージ結果をプレビュー',
                'clearVdfFiles': 'すべてクリア',
                'h264': 'H264変換',
                'compress': 'ビデオ圧縮',
                'audio_extract': '音声抽出',
                'gif_convert': 'GIF変換',
                'trim': 'ビデオトリム',
                'scale': 'リサイズ',
                'ファイルを選択': 'ファイルを選択',
                '削除': '削除'
            },
            'zh_tw': {
                'addNewCommand': '+ 新增新指令',
                'saveCurrentCommand': '儲存指令',
                'cancelEditCommand': '取消',
                'deleteCurrentCommand': '刪除指令',
                'updateFromVisual': '更新JSON',
                'loadTemplate': '載入範本',
                'toggleJsonCode': '顯示/隱藏JSON代碼',
                'validateJson': '驗證JSON',
                'formatJson': '格式化',
                'syncFromJson': '從JSON同步到視覺化介面',
                'chooseSavePath': '選擇位置',
                'saveFile': '儲存檔案',
                'loadFile': '載入檔案',
                'choosePreviewImage': '選擇圖片',
                'uploadToWorkshop': '上傳到創意工坊',
                'previewWorkshop': '預覽',
                'mergeVdfFiles': '合併VDF檔案',
                'previewMergedVdf': '預覽合併結果',
                'clearVdfFiles': '清空所有',
                'h264': 'H264轉換',
                'compress': '影片壓縮',
                'audio_extract': '提取音訊',
                'gif_convert': '轉換GIF',
                'trim': '影片剪切',
                'scale': '調整解析度',
                '選擇檔案': '選擇檔案',
                '移除': '移除'
            },
            'ru': {
                'addNewCommand': '+ Добавить новую команду',
                'saveCurrentCommand': 'Сохранить команду',
                'cancelEditCommand': 'Отмена',
                'deleteCurrentCommand': 'Удалить команду',
                'updateFromVisual': 'Обновить JSON',
                'loadTemplate': 'Загрузить шаблон',
                'toggleJsonCode': 'Показать/скрыть JSON код',
                'validateJson': 'Проверить JSON',
                'formatJson': 'Форматировать',
                'syncFromJson': 'Синхронизировать из JSON в визуальный интерфейс',
                'chooseSavePath': 'Выбрать расположение',
                'saveFile': 'Сохранить файл',
                'loadFile': 'Загрузить файл',
                'choosePreviewImage': 'Выбрать изображение',
                'uploadToWorkshop': 'Загрузить в мастерскую',
                'previewWorkshop': 'Предварительный просмотр',
                'mergeVdfFiles': 'Объединить VDF файлы',
                'previewMergedVdf': 'Предварительный просмотр результата объединения',
                'clearVdfFiles': 'Очистить все',
                'h264': 'H264 преобразование',
                'compress': 'Сжатие видео',
                'audio_extract': 'Извлечь аудио',
                'gif_convert': 'Конвертировать GIF',
                'trim': 'Обрезать видео',
                'scale': 'Изменить размер',
                'Выбрать файл': 'Выбрать файл',
                'Удалить': 'Удалить'
            },
            'ko': {
                'addNewCommand': '+ 새 명령 추가',
                'saveCurrentCommand': '명령 저장',
                'cancelEditCommand': '취소',
                'deleteCurrentCommand': '명령 삭제',
                'updateFromVisual': 'JSON 업데이트',
                'loadTemplate': '템플릿 로드',
                'toggleJsonCode': 'JSON 코드 표시/숨기기',
                'validateJson': 'JSON 검증',
                'formatJson': '포맷',
                'syncFromJson': 'JSON에서 시각적 인터페이스로 동기화',
                'chooseSavePath': '위치 선택',
                'saveFile': '파일 저장',
                'loadFile': '파일 로드',
                'choosePreviewImage': '이미지 선택',
                'uploadToWorkshop': '워크샵에 업로드',
                'previewWorkshop': '미리보기',
                'mergeVdfFiles': 'VDF 파일 병합',
                'previewMergedVdf': '병합 결과 미리보기',
                'clearVdfFiles': '모두 지우기',
                'h264': 'H264 변환',
                'compress': '비디오 압축',
                'audio_extract': '오디오 추출',
                'gif_convert': 'GIF 변환',
                'trim': '비디오 트림',
                'scale': '크기 조정',
                '파일 선택': '파일 선택',
                '제거': '제거'
            }
        };
        
        // 更新所有有data-text属性的按钮
        document.querySelectorAll('[data-text]').forEach(button => {
            const key = button.id || button.dataset.template || button.dataset.text;
            if (texts[this.SYSlanguage] && texts[this.SYSlanguage][key]) {
                button.textContent = texts[this.SYSlanguage][key];
            }
        });
        
        // 更新placeholder文本
        this.updatePlaceholders();
        
        // 更新VDF按钮文本
        this.updateVdfButtons();
        
        // 更新VDF文件标签
        this.updateVdfLabels();
    }

    // 更新主要HTML元素
    updateMainElements() {
        const elements = {
            'zh_cn': {
                'pageTitle': '创意工坊',
                'title': '创意工坊',
                'jsonTitle': '参数配置',
                'basicInfoTitle': '基本信息',
                'idLabel': 'ID:',
                'nameLabel': '名称:',
                'categoryLabel': '类别:',
                'aboutLabel': '关于:',
                'visibilityLabel': '可见性:',
                'workshopOption': '创意工坊',
                'defaultOption': '默认',
                'customOption': '自定义',
                'yesOption': '是',
                'noOption': '否',
                'themeColorTitle': '主题配色',
                'colorHint': '选择的配色将自动根据ID末位数字应用',
                'redColor': '红',
                'orangeColor': '橙',
                'yellowColor': '黄',
                'greenColor': '绿',
                'blueColor': '蓝',
                'indigoColor': '靛',
                'purpleColor': '紫',
                'pinkColor': '粉',
                'cyanColor': '青',
                'pomegranateColor': '石榴红',
                'multiLangTitle': '多语言消息',
                'ffmpegConfigTitle': 'FFmpeg命令配置',
                'commandListTitle': '命令列表',
                'commandTemplatesTitle': '常用命令模板',
                'commandNameLabel': '命令名称:',
                'ffmpegCommandLabel': 'FFmpeg命令:',
                'commandDescLabel': '命令说明:',
                'currentCommandTitle': '编辑命令',
                'jsonCodeTitle': 'JSON代码',
                'advancedUserHint': '(高级用户)',
                'fileTitle': '文件保存设置',
                'saveLocationText': '保存位置: <span id="savePath">未选择保存位置</span>',
                'fileNameText': '文件名:',
                'workshopTitle': 'Steam创意工坊上传',
                'workshopIdText': '创意工坊ID <span style="color: #666; font-size: 12px;" id="workshopIdHint">(可选，用于更新现有物品)</span>:',
                'titleText': '标题:',
                'descriptionText': '简介:',
                'previewImageText': '预览图: <span id="previewImagePath">未选择预览图</span>',
                'vdfManagementTitle': 'VDF文件管理 <span style="color: #888; font-size: 12px;" id="vdfOptionalHint">(可选)</span>',
                'vdfDescription': '如果您有多个VDF配置文件，可以选择它们进行合并，简化上传流程',
                'tagsText': '标签:',
                'visibilityText': '可见性:',
                'publicOption': '公开',
                'friendsOnlyOption': '仅好友可见',
                'privateOption': '私人',
                'previewTitle': '预览',
                'operationTypeLabel': '操作类型:',
                'fileNameLabel2': '文件名:',
                'savePathLabel': '保存路径:',
                'workshopTitleLabel': '创意工坊标题:',
                'jsonValidityLabel': 'JSON有效性:',
                'colorPreviewLabel': '配色预览:',
                'sampleButtonText': '示例按钮样式'
            },
            'en': {
                'pageTitle': 'Workshop',
                'title': 'Workshop',
                'jsonTitle': 'Parameter Configuration',
                'basicInfoTitle': 'Basic Information',
                'idLabel': 'ID:',
                'nameLabel': 'Name:',
                'categoryLabel': 'Category:',
                'aboutLabel': 'About:',
                'visibilityLabel': 'Visibility:',
                'workshopOption': 'Workshop',
                'defaultOption': 'Default',
                'customOption': 'Custom',
                'yesOption': 'Yes',
                'noOption': 'No',
                'themeColorTitle': 'Theme Colors',
                'colorHint': 'The selected color will be automatically applied based on the last digit of the ID',
                'redColor': 'Red',
                'orangeColor': 'Orange',
                'yellowColor': 'Yellow',
                'greenColor': 'Green',
                'blueColor': 'Blue',
                'indigoColor': 'Indigo',
                'purpleColor': 'Purple',
                'pinkColor': 'Pink',
                'cyanColor': 'Cyan',
                'pomegranateColor': 'Pomegranate',
                'multiLangTitle': 'Multi-language Messages',
                'ffmpegConfigTitle': 'FFmpeg Command Configuration',
                'commandListTitle': 'Command List',
                'commandTemplatesTitle': 'Common Command Templates',
                'commandNameLabel': 'Command Name:',
                'ffmpegCommandLabel': 'FFmpeg Command:',
                'commandDescLabel': 'Command Description:',
                'currentCommandTitle': 'Edit Command',
                'jsonCodeTitle': 'JSON Code',
                'advancedUserHint': '(Advanced Users)',
                'fileTitle': 'File Save Settings',
                'saveLocationText': 'Save Location: <span id="savePath">No save location selected</span>',
                'fileNameText': 'File Name:',
                'workshopTitle': 'Steam Workshop Upload',
                'workshopIdText': 'Workshop ID <span style="color: #666; font-size: 12px;" id="workshopIdHint">(Optional, for updating existing items)</span>:',
                'titleText': 'Title:',
                'descriptionText': 'Description:',
                'previewImageText': 'Preview Image: <span id="previewImagePath">No preview image selected</span>',
                'vdfManagementTitle': 'VDF File Management <span style="color: #888; font-size: 12px;" id="vdfOptionalHint">(Optional)</span>',
                'vdfDescription': 'If you have multiple VDF configuration files, you can select them for merging to simplify the upload process',
                'tagsText': 'Tags:',
                'visibilityText': 'Visibility:',
                'publicOption': 'Public',
                'friendsOnlyOption': 'Friends Only',
                'privateOption': 'Private',
                'previewTitle': 'Preview',
                'operationTypeLabel': 'Operation Type:',
                'fileNameLabel2': 'File Name:',
                'savePathLabel': 'Save Path:',
                'workshopTitleLabel': 'Workshop Title:',
                'jsonValidityLabel': 'JSON Validity:',
                'colorPreviewLabel': 'Color Preview:',
                'sampleButtonText': 'Sample Button Style'
            },
            'jp': {
                'pageTitle': 'ワークショップ',
                'title': 'ワークショップ',
                'jsonTitle': 'パラメータ設定',
                'basicInfoTitle': '基本情報',
                'idLabel': 'ID:',
                'nameLabel': '名前:',
                'categoryLabel': 'カテゴリ:',
                'aboutLabel': '説明:',
                'visibilityLabel': '表示:',
                'workshopOption': 'ワークショップ',
                'defaultOption': 'デフォルト',
                'customOption': 'カスタム',
                'yesOption': 'はい',
                'noOption': 'いいえ',
                'themeColorTitle': 'テーマカラー',
                'colorHint': '選択した配色はIDの末尾数字に基づいて自動的に適用されます',
                'redColor': '赤',
                'orangeColor': 'オレンジ',
                'yellowColor': '黄',
                'greenColor': '緑',
                'blueColor': '青',
                'indigoColor': '藍',
                'purpleColor': '紫',
                'pinkColor': 'ピンク',
                'cyanColor': 'シアン',
                'pomegranateColor': 'ザクロ色',
                'multiLangTitle': '多言語メッセージ',
                'ffmpegConfigTitle': 'FFmpegコマンド設定',
                'commandListTitle': 'コマンドリスト',
                'commandTemplatesTitle': '一般的なコマンドテンプレート',
                'commandNameLabel': 'コマンド名:',
                'ffmpegCommandLabel': 'FFmpegコマンド:',
                'commandDescLabel': 'コマンド説明:',
                'currentCommandTitle': 'コマンドを編集',
                'jsonCodeTitle': 'JSONコード',
                'advancedUserHint': '(上級ユーザー)',
                'fileTitle': 'ファイル保存設定',
                'saveLocationText': '保存場所: <span id="savePath">保存場所が選択されていません</span>',
                'fileNameText': 'ファイル名:',
                'workshopTitle': 'Steamワークショップアップロード',
                'workshopIdText': 'ワークショップID <span style="color: #666; font-size: 12px;" id="workshopIdHint">(オプション、既存アイテムの更新用)</span>:',
                'titleText': 'タイトル:',
                'descriptionText': '説明:',
                'previewImageText': 'プレビュー画像: <span id="previewImagePath">プレビュー画像が選択されていません</span>',
                'vdfManagementTitle': 'VDFファイル管理 <span style="color: #888; font-size: 12px;" id="vdfOptionalHint">(オプション)</span>',
                'vdfDescription': '複数のVDF設定ファイルがある場合、それらを選択してマージし、アップロードプロセスを簡素化できます',
                'tagsText': 'タグ:',
                'visibilityText': '表示:',
                'publicOption': '公開',
                'friendsOnlyOption': 'フレンドのみ',
                'privateOption': 'プライベート',
                'previewTitle': 'プレビュー',
                'operationTypeLabel': '操作タイプ:',
                'fileNameLabel2': 'ファイル名:',
                'savePathLabel': '保存パス:',
                'workshopTitleLabel': 'ワークショップタイトル:',
                'jsonValidityLabel': 'JSON有効性:',
                'colorPreviewLabel': 'カラープレビュー:',
                'sampleButtonText': 'サンプルボタンスタイル'
            },
            'zh_tw': {
                'pageTitle': '創意工坊',
                'title': '創意工坊',
                'jsonTitle': '參數配置',
                'basicInfoTitle': '基本資訊',
                'idLabel': 'ID:',
                'nameLabel': '名稱:',
                'categoryLabel': '類別:',
                'aboutLabel': '關於:',
                'visibilityLabel': '可見性:',
                'workshopOption': '創意工坊',
                'defaultOption': '預設',
                'customOption': '自訂',
                'yesOption': '是',
                'noOption': '否',
                'themeColorTitle': '主題配色',
                'colorHint': '選擇的配色將自動根據ID末位數字應用',
                'redColor': '紅',
                'orangeColor': '橙',
                'yellowColor': '黃',
                'greenColor': '綠',
                'blueColor': '藍',
                'indigoColor': '靛',
                'purpleColor': '紫',
                'pinkColor': '粉',
                'cyanColor': '青',
                'pomegranateColor': '石榴紅',
                'multiLangTitle': '多語言訊息',
                'ffmpegConfigTitle': 'FFmpeg指令配置',
                'commandListTitle': '指令列表',
                'commandTemplatesTitle': '常用指令範本',
                'commandNameLabel': '指令名稱:',
                'ffmpegCommandLabel': 'FFmpeg指令:',
                'commandDescLabel': '指令說明:',
                'currentCommandTitle': '編輯指令',
                'jsonCodeTitle': 'JSON代碼',
                'advancedUserHint': '(進階使用者)',
                'fileTitle': '檔案儲存設定',
                'saveLocationText': '儲存位置: <span id="savePath">未選擇儲存位置</span>',
                'fileNameText': '檔案名稱:',
                'workshopTitle': 'Steam創意工坊上傳',
                'workshopIdText': '創意工坊ID <span style="color: #666; font-size: 12px;" id="workshopIdHint">(可選，用於更新現有物品)</span>:',
                'titleText': '標題:',
                'descriptionText': '簡介:',
                'previewImageText': '預覽圖: <span id="previewImagePath">未選擇預覽圖</span>',
                'vdfManagementTitle': 'VDF檔案管理 <span style="color: #888; font-size: 12px;" id="vdfOptionalHint">(可選)</span>',
                'vdfDescription': '如果您有多個VDF配置檔案，可以選擇它們進行合併，簡化上傳流程',
                'tagsText': '標籤:',
                'visibilityText': '可見性:',
                'publicOption': '公開',
                'friendsOnlyOption': '僅好友可見',
                'privateOption': '私人',
                'previewTitle': '預覽',
                'operationTypeLabel': '操作類型:',
                'fileNameLabel2': '檔案名稱:',
                'savePathLabel': '儲存路徑:',
                'workshopTitleLabel': '創意工坊標題:',
                'jsonValidityLabel': 'JSON有效性:',
                'colorPreviewLabel': '配色預覽:',
                'sampleButtonText': '示例按鈕樣式'
            },
            'ru': {
                'pageTitle': 'Мастерская',
                'title': 'Мастерская',
                'jsonTitle': 'Настройка параметров',
                'basicInfoTitle': 'Основная информация',
                'idLabel': 'ID:',
                'nameLabel': 'Имя:',
                'categoryLabel': 'Категория:',
                'aboutLabel': 'О программе:',
                'visibilityLabel': 'Видимость:',
                'workshopOption': 'Мастерская',
                'defaultOption': 'По умолчанию',
                'customOption': 'Пользовательский',
                'yesOption': 'Да',
                'noOption': 'Нет',
                'themeColorTitle': 'Цветовая тема',
                'colorHint': 'Выбранная цветовая схема будет автоматически применена на основе последней цифры ID',
                'redColor': 'Красный',
                'orangeColor': 'Оранжевый',
                'yellowColor': 'Жёлтый',
                'greenColor': 'Зелёный',
                'blueColor': 'Синий',
                'indigoColor': 'Индиго',
                'purpleColor': 'Фиолетовый',
                'pinkColor': 'Розовый',
                'cyanColor': 'Голубой',
                'pomegranateColor': 'Гранатовый',
                'multiLangTitle': 'Многоязычные сообщения',
                'ffmpegConfigTitle': 'Настройка команд FFmpeg',
                'commandListTitle': 'Список команд',
                'commandTemplatesTitle': 'Общие шаблоны команд',
                'commandNameLabel': 'Имя команды:',
                'ffmpegCommandLabel': 'Команда FFmpeg:',
                'commandDescLabel': 'Описание команды:',
                'currentCommandTitle': 'Редактировать команду',
                'jsonCodeTitle': 'JSON код',
                'advancedUserHint': '(Продвинутые пользователи)',
                'fileTitle': 'Настройки сохранения файла',
                'saveLocationText': 'Место сохранения: <span id="savePath">Место сохранения не выбрано</span>',
                'fileNameText': 'Имя файла:',
                'workshopTitle': 'Загрузка в Steam мастерскую',
                'workshopIdText': 'ID мастерской <span style="color: #666; font-size: 12px;" id="workshopIdHint">(Опционально, для обновления существующих элементов)</span>:',
                'titleText': 'Заголовок:',
                'descriptionText': 'Описание:',
                'previewImageText': 'Изображение предварительного просмотра: <span id="previewImagePath">Изображение предварительного просмотра не выбрано</span>',
                'vdfManagementTitle': 'Управление VDF файлами <span style="color: #888; font-size: 12px;" id="vdfOptionalHint">(Опционально)</span>',
                'vdfDescription': 'Если у вас есть несколько файлов конфигурации VDF, вы можете выбрать их для объединения, чтобы упростить процесс загрузки',
                'tagsText': 'Теги:',
                'visibilityText': 'Видимость:',
                'publicOption': 'Публичный',
                'friendsOnlyOption': 'Только друзья',
                'privateOption': 'Приватный',
                'previewTitle': 'Предварительный просмотр',
                'operationTypeLabel': 'Тип операции:',
                'fileNameLabel2': 'Имя файла:',
                'savePathLabel': 'Путь сохранения:',
                'workshopTitleLabel': 'Заголовок мастерской:',
                'jsonValidityLabel': 'Действительность JSON:',
                'colorPreviewLabel': 'Предварительный просмотр цвета:',
                'sampleButtonText': 'Пример стиля кнопки'
            },
            'ko': {
                'pageTitle': '워크샵',
                'title': '워크샵',
                'jsonTitle': '매개변수 구성',
                'basicInfoTitle': '기본 정보',
                'idLabel': 'ID:',
                'nameLabel': '이름:',
                'categoryLabel': '카테고리:',
                'aboutLabel': '정보:',
                'visibilityLabel': '가시성:',
                'workshopOption': '워크샵',
                'defaultOption': '기본값',
                'customOption': '사용자 정의',
                'yesOption': '예',
                'noOption': '아니오',
                'themeColorTitle': '테마 색상',
                'colorHint': '선택한 색상 구성표는 ID의 마지막 자릿수를 기반으로 자동으로 적용됩니다',
                'redColor': '빨간색',
                'orangeColor': '주황색',
                'yellowColor': '노란색',
                'greenColor': '녹색',
                'blueColor': '파란색',
                'indigoColor': '남색',
                'purpleColor': '보라색',
                'pinkColor': '분홍색',
                'cyanColor': '청록색',
                'pomegranateColor': '석류색',
                'multiLangTitle': '다국어 메시지',
                'ffmpegConfigTitle': 'FFmpeg 명령 구성',
                'commandListTitle': '명령 목록',
                'commandTemplatesTitle': '일반적인 명령 템플릿',
                'commandNameLabel': '명령 이름:',
                'ffmpegCommandLabel': 'FFmpeg 명령:',
                'commandDescLabel': '명령 설명:',
                'currentCommandTitle': '명령 편집',
                'jsonCodeTitle': 'JSON 코드',
                'advancedUserHint': '(고급 사용자)',
                'fileTitle': '파일 저장 설정',
                'saveLocationText': '저장 위치: <span id="savePath">저장 위치가 선택되지 않음</span>',
                'fileNameText': '파일 이름:',
                'workshopTitle': 'Steam 워크샵 업로드',
                'workshopIdText': '워크샵 ID <span style="color: #666; font-size: 12px;" id="workshopIdHint">(선택사항, 기존 항목 업데이트용)</span>:',
                'titleText': '제목:',
                'descriptionText': '설명:',
                'previewImageText': '미리보기 이미지: <span id="previewImagePath">미리보기 이미지가 선택되지 않음</span>',
                'vdfManagementTitle': 'VDF 파일 관리 <span style="color: #888; font-size: 12px;" id="vdfOptionalHint">(선택사항)</span>',
                'vdfDescription': '여러 VDF 구성 파일이 있는 경우 병합을 위해 선택하여 업로드 프로세스를 단순화할 수 있습니다',
                'tagsText': '태그:',
                'visibilityText': '가시성:',
                'publicOption': '공개',
                'friendsOnlyOption': '친구만',
                'privateOption': '비공개',
                'previewTitle': '미리보기',
                'operationTypeLabel': '작업 유형:',
                'fileNameLabel2': '파일 이름:',
                'savePathLabel': '저장 경로:',
                'workshopTitleLabel': '워크샵 제목:',
                'jsonValidityLabel': 'JSON 유효성:',
                'colorPreviewLabel': '색상 미리보기:',
                'sampleButtonText': '샘플 버튼 스타일'
            }
        };

        const currentTexts = elements[this.SYSlanguage] || elements['zh_cn'];
        
        // 更新所有文本元素
        Object.keys(currentTexts).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id.includes('Text') && currentTexts[id].includes('<span')) {
                    element.innerHTML = currentTexts[id];
                } else {
                    element.textContent = currentTexts[id];
                }
            }
        });
    }

    // 更新VDF文件标签
    updateVdfLabels() {
        if (this.SYSlanguage === 'en') {
            const vdfFile1Label = document.getElementById('vdfFile1Label');
            const vdfFile2Label = document.getElementById('vdfFile2Label');
            const vdfFile3Label = document.getElementById('vdfFile3Label');
            if (vdfFile1Label) vdfFile1Label.innerHTML = 'VDF File 1: <span class="vdf-path" id="vdfPath1">Not selected</span>';
            if (vdfFile2Label) vdfFile2Label.innerHTML = 'VDF File 2: <span class="vdf-path" id="vdfPath2">Not selected</span>';
            if (vdfFile3Label) vdfFile3Label.innerHTML = 'VDF File 3: <span class="vdf-path" id="vdfPath3">Not selected</span>';
        } else if (this.SYSlanguage === 'jp') {
            const vdfFile1Label = document.getElementById('vdfFile1Label');
            const vdfFile2Label = document.getElementById('vdfFile2Label');
            const vdfFile3Label = document.getElementById('vdfFile3Label');
            if (vdfFile1Label) vdfFile1Label.innerHTML = 'VDFファイル1: <span class="vdf-path" id="vdfPath1">選択されていません</span>';
            if (vdfFile2Label) vdfFile2Label.innerHTML = 'VDFファイル2: <span class="vdf-path" id="vdfPath2">選択されていません</span>';
            if (vdfFile3Label) vdfFile3Label.innerHTML = 'VDFファイル3: <span class="vdf-path" id="vdfPath3">選択されていません</span>';
        } else {
            const vdfFile1Label = document.getElementById('vdfFile1Label');
            const vdfFile2Label = document.getElementById('vdfFile2Label');
            const vdfFile3Label = document.getElementById('vdfFile3Label');
            if (vdfFile1Label) vdfFile1Label.innerHTML = 'VDF文件1: <span class="vdf-path" id="vdfPath1">未选择</span>';
            if (vdfFile2Label) vdfFile2Label.innerHTML = 'VDF文件2: <span class="vdf-path" id="vdfPath2">未选择</span>';
            if (vdfFile3Label) vdfFile3Label.innerHTML = 'VDF文件3: <span class="vdf-path" id="vdfPath3">未选择</span>';
        }
    }

    // 更新placeholder文本
    updatePlaceholders() {
        const placeholders = {
            'zh_cn': {
                'fileName': '留空自动生成UUID',
                'workshopItemId': '输入现有工坊物品ID进行更新，留空则创建新物品',
                'workshopTitleInput': '输入创意工坊物品标题',
                'workshopDescription': '输入创意工坊物品描述',
                'workshopTags': '输入标签，用逗号分隔',
                'visualId': '配置ID (例如: 1001)',
                'visualName': '配置名称',
                'visualAbout': '配置说明',
                'currentCommandName': '例如: H264转换',
                'currentCommandText': 'FFmpeg命令',
                'currentCommandDescription': '简短描述这个命令的作用'
            },
            'en': {
                'fileName': 'Leave blank to auto-generate UUID',
                'workshopItemId': 'Enter existing workshop item ID to update, leave blank to create new item',
                'workshopTitleInput': 'Enter workshop item title',
                'workshopDescription': 'Enter workshop item description',
                'workshopTags': 'Enter tags, separated by commas',
                'visualId': 'Configuration ID (e.g., 1001)',
                'visualName': 'Configuration name',
                'visualAbout': 'Configuration description',
                'currentCommandName': 'e.g., H264 Convert',
                'currentCommandText': 'FFmpeg command',
                'currentCommandDescription': 'Briefly describe what this command does'
            },
            'jp': {
                'fileName': '空白の場合、自動でUUIDを生成',
                'workshopItemId': '既存のワークショップアイテムIDを入力して更新、空白の場合は新しいアイテムを作成',
                'workshopTitleInput': 'ワークショップアイテムのタイトルを入力',
                'workshopDescription': 'ワークショップアイテムの説明を入力',
                'workshopTags': 'タグを入力、カンマで区切る',
                'visualId': '設定ID (例: 1001)',
                'visualName': '設定名',
                'visualAbout': '設定説明',
                'currentCommandName': '例: H264変換',
                'currentCommandText': 'FFmpegコマンド',
                'currentCommandDescription': 'このコマンドの機能を簡潔に説明'
            },
            'zh_tw': {
                'fileName': '留空自動生成UUID',
                'workshopItemId': '輸入現有工坊物品ID進行更新，留空則建立新物品',
                'workshopTitleInput': '輸入創意工坊物品標題',
                'workshopDescription': '輸入創意工坊物品描述',
                'workshopTags': '輸入標籤，用逗號分隔',
                'visualId': '配置ID (例如: 1001)',
                'visualName': '配置名稱',
                'visualAbout': '配置說明',
                'currentCommandName': '例如: H264轉換',
                'currentCommandText': 'FFmpeg命令',
                'currentCommandDescription': '簡短描述這個命令的作用'
            },
            'ru': {
                'fileName': 'Оставьте пустым для автогенерации UUID',
                'workshopItemId': 'Введите ID существующего элемента мастерской для обновления, оставьте пустым для создания нового',
                'workshopTitleInput': 'Введите название элемента мастерской',
                'workshopDescription': 'Введите описание элемента мастерской',
                'workshopTags': 'Введите теги через запятую',
                'visualId': 'ID конфигурации (например: 1001)',
                'visualName': 'Название конфигурации',
                'visualAbout': 'Описание конфигурации',
                'currentCommandName': 'например: H264 конвертация',
                'currentCommandText': 'Команда FFmpeg',
                'currentCommandDescription': 'Кратко опишите, что делает эта команда'
            },
            'ko': {
                'fileName': '빈 칸으로 두면 UUID 자동 생성',
                'workshopItemId': '기존 워크샵 항목 ID를 입력하여 업데이트, 빈 칸으로 두면 새 항목 생성',
                'workshopTitleInput': '워크샵 항목 제목 입력',
                'workshopDescription': '워크샵 항목 설명 입력',
                'workshopTags': '태그를 입력하고 쉼표로 구분',
                'visualId': '구성 ID (예: 1001)',
                'visualName': '구성 이름',
                'visualAbout': '구성 설명',
                'currentCommandName': '예: H264 변환',
                'currentCommandText': 'FFmpeg 명령',
                'currentCommandDescription': '이 명령이 수행하는 작업을 간략히 설명'
            }
        };

        const currentPlaceholders = placeholders[this.SYSlanguage] || placeholders['zh_cn'];
        
        Object.keys(currentPlaceholders).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.placeholder = currentPlaceholders[id];
            }
        });
    }

    // 更新VDF按钮文本
    updateVdfButtons() {
        const buttonTexts = {
            'zh_cn': {
                'choose': '选择文件',
                'remove': '移除'
            },
            'en': {
                'choose': 'Choose File',
                'remove': 'Remove'
            },
            'jp': {
                'choose': 'ファイルを選択',
                'remove': '削除'
            },
            'zh_tw': {
                'choose': '選擇檔案',
                'remove': '移除'
            },
            'ru': {
                'choose': 'Выбрать файл',
                'remove': 'Удалить'
            },
            'ko': {
                'choose': '파일 선택',
                'remove': '제거'
            }
        };

        const currentTexts = buttonTexts[this.SYSlanguage] || buttonTexts['zh_cn'];
        
        // 更新VDF选择文件按钮
        document.querySelectorAll('.choose-vdf-btn').forEach(button => {
            button.textContent = currentTexts.choose;
        });
        
        // 更新VDF移除按钮
        document.querySelectorAll('.remove-vdf-btn').forEach(button => {
            button.textContent = currentTexts.remove;
        });
    }
}

// 添加LanguageUp函数供button.js调用实现热更新
function LanguageUp() {
    console.log('Workshop: LanguageUp called');
    if (window.workshopManager) {
        window.workshopManager.initializeLanguage();
    } else {
        console.error('Workshop: workshopManager not found');
    }
}

// 创建全局WorkshopManager实例
window.workshopManager = new WorkshopManager();

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkshopManager;
} 