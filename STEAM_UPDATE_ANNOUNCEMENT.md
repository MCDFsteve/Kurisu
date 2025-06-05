# Kurisu v1.3.0 - Steam Workshop Integration Complete
## 创意工坊完全集成更新 | Steam Workshop Full Integration Update | スチームワークショップ完全統合アップデート

---

## 核心更新 | Core Updates | コアアップデート

### 中文 Chinese

#### 创意工坊上传功能全面实现
Kurisu v1.3.0 现已完全实现Steam创意工坊上传功能！用户可以直接通过应用界面编辑、配置和上传创意工坊项目。

#### 主要新功能
- **一键进入创意工坊编辑界面** - 从主界面直接访问创意工坊功能
- **可视化编辑器** - 无需手动编写JSON，通过图形界面配置项目
- **多命令管理系统** - 支持创建、编辑和管理多个FFmpeg命令
- **实时预览功能** - 即时查看配置效果
- **多语言支持** - 支持中文、英文、日文等多种语言配置

#### 详细使用指南

##### 1. 创意工坊项目配置
- **项目ID**: 输入唯一的数字ID（如：1001, 1002等）
- **项目名称**: 为您的创意工坊项目命名
- **项目系列**: 指定项目所属的系列或分类
- **项目描述**: 详细描述项目功能和用途
- **使用说明**: 提供用户使用指导

##### 2. FFmpeg命令配置
- **命令名称**: 为每个FFmpeg命令指定一个易识别的名称
- **命令描述**: 简要说明该命令的用途
- **FFmpeg命令**: 输入完整的FFmpeg处理命令

##### 3. 路径变量说明
- **输入文件路径变量**: `${filePath}` - 用户选择的输入文件路径
- **输出文件路径变量**: `${outputPath}` - 系统生成的输出文件路径
- **命令示例**: `ffmpeg -i ${filePath} -y -c:v libx264 -crf 23 ${outputPath}${.mp4}`

##### 4. 上传流程
1. 配置完成后点击"选择预览图片"上传项目封面
2. 点击"上传到创意工坊"开始上传过程
3. 系统会自动处理并发布到Steam创意工坊

---

### English

#### Complete Steam Workshop Upload Implementation
Kurisu v1.3.0 now features full Steam Workshop upload functionality! Users can edit, configure, and upload workshop items directly through the application interface.

#### Key New Features
- **Direct Workshop Access** - Access workshop functionality directly from main interface
- **Visual Editor** - Configure projects through graphical interface without manual JSON editing
- **Multi-Command Management** - Create, edit, and manage multiple FFmpeg commands
- **Real-time Preview** - Instantly preview configuration effects
- **Multi-language Support** - Support for Chinese, English, Japanese and other languages

#### Detailed Usage Guide

##### 1. Workshop Project Configuration
- **Project ID**: Enter a unique numeric ID (e.g., 1001, 1002, etc.)
- **Project Name**: Name your workshop project
- **Project Family**: Specify the series or category of the project
- **Project Description**: Detailed description of project functionality and purpose
- **Usage Instructions**: Provide user guidance

##### 2. FFmpeg Command Configuration
- **Command Name**: Assign an easily recognizable name for each FFmpeg command
- **Command Description**: Brief explanation of the command's purpose
- **FFmpeg Command**: Enter the complete FFmpeg processing command

##### 3. Path Variables Explanation
- **Input File Path Variable**: `${filePath}` - User-selected input file path
- **Output File Path Variable**: `${outputPath}` - System-generated output file path
- **Command Example**: `ffmpeg -i ${filePath} -y -c:v libx264 -crf 23 ${outputPath}${.mp4}`

##### 4. Upload Process
1. After configuration, click "Choose Preview Image" to upload project cover
2. Click "Upload to Workshop" to start the upload process
3. System will automatically process and publish to Steam Workshop

---

### 日本語 Japanese

#### Steamワークショップアップロード機能の完全実装
Kurisu v1.3.0では、Steamワークショップアップロード機能が完全に実装されました！ユーザーはアプリケーションインターフェースから直接ワークショップアイテムを編集、設定、アップロードできます。

#### 主要な新機能
- **ワークショップ直接アクセス** - メインインターフェースからワークショップ機能に直接アクセス
- **ビジュアルエディター** - 手動でJSONを編集することなく、グラフィカルインターフェースでプロジェクトを設定
- **マルチコマンド管理** - 複数のFFmpegコマンドの作成、編集、管理
- **リアルタイムプレビュー** - 設定効果を即座にプレビュー
- **多言語サポート** - 中国語、英語、日本語などの複数言語をサポート

#### 詳細使用ガイド

##### 1. ワークショッププロジェクト設定
- **プロジェクトID**: 一意の数値ID（例：1001、1002など）を入力
- **プロジェクト名**: ワークショッププロジェクトに名前を付ける
- **プロジェクトファミリー**: プロジェクトのシリーズまたはカテゴリを指定
- **プロジェクト説明**: プロジェクトの機能と用途の詳細な説明
- **使用説明**: ユーザーガイダンスを提供

##### 2. FFmpegコマンド設定
- **コマンド名**: 各FFmpegコマンドに識別しやすい名前を割り当て
- **コマンド説明**: コマンドの目的の簡潔な説明
- **FFmpegコマンド**: 完全なFFmpeg処理コマンドを入力

##### 3. パス変数の説明
- **入力ファイルパス変数**: `${filePath}` - ユーザーが選択した入力ファイルパス
- **出力ファイルパス変数**: `${outputPath}` - システムが生成した出力ファイルパス
- **コマンド例**: `ffmpeg -i ${filePath} -y -c:v libx264 -crf 23 ${outputPath}${.mp4}`

##### 4. アップロードプロセス
1. 設定完了後、「プレビュー画像を選択」をクリックしてプロジェクトカバーをアップロード
2. 「ワークショップにアップロード」をクリックしてアップロードプロセスを開始
3. システムが自動的に処理してSteamワークショップに公開

---

## Steam Integration Features | Steam集成功能 | Steam統合機能

### 中文
- **Steam状态检测** - 自动检测Steam运行状态
- **工坊协议确认** - 自动处理Steam工坊使用协议
- **项目管理** - 支持创建新项目和更新现有项目
- **多平台支持** - 支持Windows、macOS和Linux平台

### English
- **Steam Status Detection** - Automatically detect Steam running status
- **Workshop Agreement Handling** - Automatically handle Steam Workshop usage agreement
- **Project Management** - Support creating new projects and updating existing ones
- **Multi-platform Support** - Support for Windows, macOS, and Linux platforms

### 日本語
- **Steam状態検出** - Steamの実行状態を自動検出
- **ワークショップ契約処理** - Steamワークショップ使用契約を自動処理
- **プロジェクト管理** - 新規プロジェクトの作成と既存プロジェクトの更新をサポート
- **マルチプラットフォームサポート** - Windows、macOS、Linuxプラットフォームをサポート

---

## Technical Requirements | 技术要求 | 技術要件

### 中文
- **Steam客户端** - 需要Steam客户端正常运行
- **网络连接** - 上传过程需要稳定的网络连接
- **文件权限** - 确保应用有足够的文件访问权限

### English
- **Steam Client** - Requires Steam client to be running normally
- **Network Connection** - Stable network connection required for upload process
- **File Permissions** - Ensure application has sufficient file access permissions

### 日本語
- **Steamクライアント** - Steamクライアントが正常に動作している必要があります
- **ネットワーク接続** - アップロードプロセスには安定したネットワーク接続が必要
- **ファイル権限** - アプリケーションに十分なファイルアクセス権限があることを確認

---

## Get Started | 开始使用 | 使用開始

### 中文
现在就更新到Kurisu v1.3.0，体验完整的Steam创意工坊集成功能！

### English  
Update to Kurisu v1.3.0 now and experience the complete Steam Workshop integration!

### 日本語
今すぐKurisu v1.3.0にアップデートして、完全なSteamワークショップ統合をお楽しみください！

---

*Created with ❤️ by DFsteve | 由DFsteve用心制作 | DFsteveが心を込めて作成* 