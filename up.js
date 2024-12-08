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
const buttonName = 'up';
const styleName = '#settingsui';
const defaultImg = document.getElementById('default-img');
const defaultTitle = document.getElementById('default-title');
const defaultDescription = document.getElementById('default-description');
function LanguageUp() {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    SYSlanguage = config.langRule.trim().replace(/^'+|'+$/g, '');
    const TitleLang = document.getElementById('title');
    console.log('SYSlanguage by Plugins:', SYSlanguage);
    if (SYSlanguage === 'en') {
        TitleLang.textContent = 'Preset Management';
    } else if (SYSlanguage === 'zh_cn') {
        TitleLang.textContent = '上传预设';
    } else if (SYSlanguage === 'jp') {
        TitleLang.textContent = 'プリセット管理';
    } else if (SYSlanguage === 'zh_tw') {
        TitleLang.textContent = '上传預設';
    } else if (SYSlanguage === 'ru') {
        TitleLang.textContent = 'Управление предустановками';
    } else if (SYSlanguage === 'ko') {
        TitleLang.textContent = '프리셋 관리';
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    const fileButton = document.getElementById('file-button');
    const itemsContainer = document.getElementById('subscribed-items');
    const workshopId = document.getElementById('workshop-id');
    const titlePlaceholder = '点击此处修改标题';
    const descriptionPlaceholder = '点击此处修改内容';
    const workshopIdPlaceholder = '输入创意工坊id';
    let selectedFilePath = null;

    // 初始化占位符
    if (defaultTitle.textContent.trim() === '') {
        defaultTitle.textContent = titlePlaceholder;
    }
    if (defaultDescription.textContent.trim() === '') {
        defaultDescription.textContent = descriptionPlaceholder;
    }
    if (workshopId.textContent.trim() === '') {
        workshopId.textContent = workshopIdPlaceholder;
    }

    // 添加编辑功能
    function addEditableBehavior(element, placeholder) {
        element.addEventListener('click', (event) => {
            event.stopPropagation();
            if (element.textContent === placeholder) {
                element.textContent = ''; // 清空占位符文本
            }
            element.contentEditable = true;
            element.classList.add('editing');
            element.focus();

            element.addEventListener('blur', () => {
                element.contentEditable = false;
                element.classList.remove('editing');
                if (element.textContent.trim() === '') {
                    element.textContent = placeholder;
                    element.style.opacity = 0.5; // 如果内容为空，恢复透明度
                } else {
                    element.style.opacity = 1; // 保持不透明
                }
            }, { once: true });
        });

        // 默认状态下透明度为0.5
        if (element.textContent === placeholder) {
            element.style.opacity = 0.5;
        }
    }

    addEditableBehavior(defaultTitle, titlePlaceholder);
    addEditableBehavior(defaultDescription, descriptionPlaceholder);
    addEditableBehavior(workshopId, workshopIdPlaceholder);

    // 图片点击事件，用于上传图片
    defaultImg.addEventListener('click', async () => {
        const { filePaths } = await ipcRenderer.invoke('dialog:openFile', {
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
        });

        if (filePaths && filePaths.length > 0) {
            const selectedImagePath = filePaths[0];
            defaultImg.src = selectedImagePath;
            defaultImg.style.border = 'none';  // 去掉描边
        }
    });

    // 处理右下角按钮点击事件
    fileButton.addEventListener('click', async () => {
        if (fileButton.textContent === '文件') {
            const { filePaths } = await ipcRenderer.invoke('dialog:openFile', {
                properties: ['openFile'],
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
            });

            if (filePaths && filePaths.length > 0) {
                selectedFilePath = filePaths[0];

                // 读取并验证JSON文件
                const fileContent = fs.readFileSync(selectedFilePath, 'utf8');
                try {
                    const jsonData = JSON.parse(fileContent);
                    if (!jsonData[0].id) {
                        showErrorBubble('文件结构不正确');
                        return;
                    }
                    fileButton.textContent = '上传';  // 选中文件后将按钮文字改为"上传"
                } catch (e) {
                    showErrorBubble('文件结构不正确');
                }
            }
        } else if (fileButton.textContent === '上传') {
            let workshopIdNumber;
            let workshopTitle;
            let workshopDescription;
            const workshopImage = defaultImg.src;
            if (defaultTitle.textContent == "点击此处修改标题"){
                workshopTitle ="未设置标题";
            }else{
                workshopTitle = defaultTitle.textContent;
            }
            if (defaultDescription.textContent == "点击此处修改内容"){
                workshopDescription ="未设置介绍";
            }else{
                workshopDescription = defaultDescription.textContent;
            }
            // 检查是否为纯数字
            if (!/^\d+$/.test(workshopId.textContent)) {
                workshopIdNumber = 0; // 设置为 0
            } else {
                workshopIdNumber = workshopId.textContent;
            }
            ipcRenderer.send('workshop:upload', selectedFilePath, workshopIdNumber, workshopImage, workshopTitle, workshopDescription);
            fileButton.textContent = '文件';  // 上传完成后恢复按钮文字
            selectedFilePath = null;  // 重置文件路径
        }
    });

    function showErrorBubble(message) {
        const bubble = document.createElement('div');
        bubble.textContent = message;
        bubble.classList.add('error-bubble');

        // 将气泡添加到subscribed-items的容器中
        itemsContainer.appendChild(bubble);

        setTimeout(() => {
            bubble.style.opacity = '0';
            setTimeout(() => {
                itemsContainer.removeChild(bubble);
            }, 1000); // 等待1秒，确保动画完成
        }, 1000); // 显示1秒后开始消失
    }

    // 处理其他的订阅项目
    try {
        const subscribedItems = await ipcRenderer.invoke('get-subscribed-items');
        subscribedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');

            const img = document.createElement('img');
            img.src = item.previewUrl;
            img.alt = item.title;
            itemDiv.appendChild(img);

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('item-content');

            const title = document.createElement('h3');
            title.textContent = item.title;
            contentDiv.appendChild(title);

            const uped = document.createElement('h3');
            uped.textContent = "已发布预设";
            uped.style.fontSize = '10px';
            uped.style.position = 'absolute';
            uped.style.left = '-10px';
            uped.style.bottom = '0px';
            uped.style.backgroundColor = 'black';
            uped.style.color = 'white';
            itemDiv.appendChild(uped);

            const description = document.createElement('p');
            description.textContent = item.description;
            contentDiv.appendChild(description);

            itemDiv.appendChild(contentDiv);
            itemsContainer.appendChild(itemDiv);

            itemDiv.addEventListener('click', () => {
                const url = `https://steamcommunity.com/workshop/filedetails/?id=${item.id}`;
                ipcRenderer.send('open-url', url);
            });
        });
    } catch (error) {
        console.error("Error displaying subscribed items:", error);
    }
});