# Kurisu
[简体中文](https://github.com/MCDFsteve/Kurisu/README_zhCN.md)   [English](https://github.com/MCDFsteve/Kurisu/README.md)   [日本語](https://github.com/MCDFsteve/Kurisu/README_jp.md)
## A Program for Converting File Formats by Verbal Description
### Literally, just by talking.
For example, you drag or upload an mp4 file, and then you simply describe what you want to do in the input box.
Things like "convert to webm", "keep only the content between 10 seconds and 20 seconds of the video", "extract the audio file", or "reverse the video".
Then just click the buttons and wait for the progress bar to complete.
It uses the integration of ChatGPT and FFmpeg.
Please give it a try.
### This software supports the following languages: Simplified Chinese, Traditional Chinese, Japanese, Korean, English, and Russian.

### ChatGPT uses GPT-4, which is provided for free. If you would like to sponsor, you can go to https://store.steampowered.com/app/3034460/ to purchase the Steam version of this software, where you can enjoy the Workshop feature, community, and automatic updates.

FFmpeg is from https://ffmpeg.org/ using the precompiled binary executable files from the official website.

If you want to compile the project yourself or modify it, please refer to the <code>package.json</code> file for the required libraries and run <code>npm install</code> after pulling the project.

### macOS users, please note that directly running the program will prompt that it is damaged. Please enter the following in the terminal: sudo xattr -dr com.apple.quarantine [path to the app] (you can drag and drop from Finder), then enter your password and you should be able to open it normally.
<img width="800" alt="image" src="https://github.com/user-attachments/assets/7005dd5e-6c91-4b5b-96ff-19378b13190e">

