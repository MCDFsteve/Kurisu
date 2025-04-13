import os
import subprocess
import sys

def start_game():
    # 获取当前工作目录
    current_dir = os.getcwd()
    game_path = os.path.join(current_dir, 'Kurisu.app', 'Contents', 'MacOS', 'Kurisu')

    # 检查文件是否有执行权限
    if not os.access(game_path, os.X_OK):
        print(f"{game_path} doesn't have execute permissions, attempting to set permissions...")

        try:
            subprocess.check_call(['chmod', '+x', game_path])
            print("Execute permissions granted.")
        except subprocess.CalledProcessError as e:
            print(f"Failed to set execute permissions: {e}")
            sys.exit(1)
    
    # 根据架构选择运行方式
    arch = os.uname().machine
    if arch == 'arm64':
        print("Detected Apple M series (ARM64), ensuring no Rosetta 2 is used.")
        subprocess.run(['arch', '-arm64', game_path])
    else:
        print("Detected Intel architecture, running the game.")
        subprocess.run([game_path])

if __name__ == '__main__':
    start_game()