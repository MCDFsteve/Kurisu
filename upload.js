var dragDropArea = document.getElementById('dragDropArea');
function updateFileName() {
    var input = document.getElementById('fileInput');
    var fileLabel = document.getElementById('fileLabel');
    if (input.files.length > 0) {
        dragDropArea.style.border = '1px solid white';
        var filePaths = Array.from(input.files).map(file => file.name); 
        var filePathsString = filePaths.join(', ');
        fileLabel.textContent = filePathsString; // 显示所有选中文件的路径
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
        var file = files[0];
        document.getElementById('fileInput').files = files; // 设置文件到 input
        updateFileName(); // 更新显示的文件名
    }
});