const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// 使用绝对路径，确保解析正确
const gamePath = path.resolve(__dirname, 'Kurisu.app', 'Contents', 'MacOS', 'Kurisu');

// 检查文件是否有执行权限
fs.access(gamePath, fs.constants.X_OK, (err) => {
    if (err) {
        console.log(`${gamePath} doesn't have execute permissions, attempting to set permissions...`);

        // 尝试设置执行权限
        exec(`chmod +x "${gamePath}"`, (chmodErr) => {
            if (chmodErr) {
                console.error(`Failed to set execute permissions: ${chmodErr.message}`);
                return;
            }
            console.log('Execute permissions granted. Now starting the application.');

            // 设置权限成功后继续运行游戏
            startGame();
        });
    } else {
        console.log(`${gamePath} has execute permissions, starting the game...`);
        startGame();
    }
});

// 函数：启动游戏
function startGame() {
    const arch = os.arch();

    if (arch === 'arm64') {
        console.log('Detected Apple M series (ARM64), ensuring no Rosetta 2 is used.');

        // 强制以 ARM 模式运行，不使用 Rosetta 2
        exec(`arch -arm64 "${gamePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error starting ARM version: ${error.message}`);
                return;
            }
            console.log(stdout);
        });

    } else if (arch === 'x64') {
        console.log('Detected Intel architecture (x86_64), running Intel version.');

        // 直接运行 x64 版本的二进制文件
        exec(`"${gamePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error starting x64 version: ${error.message}`);
                return;
            }
            console.log(stdout);
        });

    } else {
        console.log(`Unknown architecture: ${arch}`);
    }
}