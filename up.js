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
    const itemsContainer = document.getElementById('subscribed-items');

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