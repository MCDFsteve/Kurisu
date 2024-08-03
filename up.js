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
    }
    else if (SYSlanguage === 'jp') {
        TitleLang.textContent = 'プリセット管理';
    }
    else if (SYSlanguage === 'zh_tw') {
        TitleLang.textContent = '上传預設';
    }
    else if (SYSlanguage === 'ru') {
        TitleLang.textContent = 'Управление предустановками';
    }
    else if (SYSlanguage === 'ko') {
        TitleLang.textContent = '프리셋 관리';
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    const itemsContainer = document.getElementById('subscribed-items');

    try {
        const subscribedItems = await ipcRenderer.invoke('get-subscribed-items');
        /*const subscribedItems =  [
            {
              id: '3296497109',
              title: '图片转换预设  Image Conversion Preset  画像変換プリセット',
              description: '包含一些基础的图片格式的转换的预设文本,png,jpg,avif,gif,webp\n' +
                '\n' +
                'Preset text that includes conversions for basic image formats such as png, jpg, avif, gif, and webp\n' +
                '\n' +
                '基本的な画像フォーマット（png、jpg、avif、gif、webp）の変換を含むプリセットテキスト\n' +
                '\n' +
                '\n' +
                '关于创意工坊功能：目前还在开发中，等我认为足够轻松使用的时候，会开放上传创意工坊的部分。\n' +
                '\n' +
                'Regarding the Workshop feature: It is currently under development. Once I feel it is easy enough to use, I will open up the part for uploading to the Workshop.\n' +
                '\n' +
                'クリエイティブワークショップ機能について：現在開発中です。使いやすいと感じた時点で、ワークショップへのアップロード部分を公開する予定です。',
              previewUrl: 'https://steamuserimages-a.akamaihd.net/ugc/2477626982782073559/9486B2C6422BC69816A5FCFA8CEFD4AC6EC53C55/'
            },
            {
              id: '3297763616',
              title: '形状调整预设  Shape Adjustment Preset  形状調整プリセット',
              description: '包含了一些调整形状的预设，可以对图片或者视频使用，例如拉伸成各种常见分辨率，裁剪画布，旋转镜像画布等\n' +
                '\n' +
                'Includes some presets for adjusting shapes, which can be used for images or videos. For example, stretching to various common resolutions, cropping the canvas, rotating and mirroring the canvas, etc.\n' +
                '\n' +
                'いくつかの形状を調整するプリセットが含まれており、画像や動画に使用できます。例えば、さまざまな一般的な解像度に引き伸ばしたり、キャンバスをトリミングしたり、キャンバスを回転およびミラーリングしたりできます。\n',
              previewUrl: 'https://steamuserimages-a.akamaihd.net/ugc/2477626982787800585/7A6AC93238BC8B6A0B1ACD31D6391CAB30E34E28/'
            }
          ];*/

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
            uped.textContent = "已发布预设  ";
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
        });
    } catch (error) {
        console.error("Error displaying subscribed items:", error);
    }
});