var dragDropArea = document.getElementById('dragDropArea');
var lastSelectedFiles = null; // 保存上次选择的文件

function updateFileName() {
    var input = document.getElementById('fileInput');
    var fileLabel = document.getElementById('fileLabel');
    
    if (input.files.length > 0) {
        dragDropArea.style.border = '1px solid white';
        var filePaths = Array.from(input.files).map(file => file.name);
        var filePathsString = filePaths.join(', ');
        fileLabel.textContent = filePathsString; // 显示所有选中文件的路径
        lastSelectedFiles = input.files; // 保存最新选择的文件
    } else if (lastSelectedFiles) {
        dragDropArea.style.border = '1px solid white'; // 保持边框样式
        var filePaths = Array.from(lastSelectedFiles).map(file => file.name);
        var filePathsString = filePaths.join(', ');
        fileLabel.textContent = filePathsString; // 显示之前保存的文件名
    } else {
        dragDropArea.style.border = 'none';
        fileLabel.textContent = '点击/拖放上传文件'; // 如果没有文件，则显示默认文本
    }
}

dragDropArea.addEventListener('dragover', function (event) {
    event.preventDefault(); // 阻止默认行为
});

dragDropArea.addEventListener('drop', function (event) {
    event.preventDefault();
    var files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files; // 设置文件到 input
        updateFileName(); // 更新显示的文件名
    }
});

// 当用户未选择新文件时，阻止 input.files 被清空
document.getElementById('fileInput').addEventListener('change', function () {
    if (this.files.length === 0 && lastSelectedFiles) {
        this.files = lastSelectedFiles; // 恢复之前选择的文件
    }
    updateFileName();
});