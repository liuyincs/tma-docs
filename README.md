# 🏷️ Tag My Audio（TMA）

🎧 Tag My Audio 是一款面向 NAS / 家庭服务器 / 远程主机的自部署音频标签管理工具和音乐服务器。

## 📌 仓库用途

⚠️ 本仓库 **不包含任何应用代码**。

主要用于：

- 🐞 Bug 报告
- 💡 功能建议
- 💬 使用相关讨论
- 📢 版本相关说明与公告
- 📖 文档网站源码（Docusaurus）

如在使用过程中遇到问题或有改进建议，请通过 [Issue](https://github.com/liuyincs/tma-docs/issues/new/choose) 反馈。

---

## 🎼 功能概览

Tag My Audio 把服务端部署在音乐文件所在的机器上，你在浏览器里直接整理服务器上的音乐文件，不必先拷回本地。

TMA **不提供任何音乐内容**，只处理你自己已有的音频文件。

## ✨ 特点

- 🏷️ 标签工作台：浏览、检索、编辑标签与封面
- 🗂️ 批量整理：按标签重命名、按文件名写标签、批量移动 / 删除、回收站
- 🎵 歌词（LRC）、格式转换、ReplayGain
- ▶️ 曲库浏览与 Web 内置播放器，支持 HTTP Range 取流与转码
- 🔎 元数据刮削（MusicBrainz 等）
- 👥 多用户、角色权限与操作审计

## 🔗 与其他媒体服务器搭配

TMA 可以单独作为曲库服务，也可以作为 Navidrome、Jellyfin、Emby 等媒体系统旁边的标签整理工具。

## 📱 平台支持

- Web（主客户端，由服务端一并托管）
- 服务端：Docker 或直接运行

桌面端和移动端暂未提供。

## 🚧 项目状态说明

- 当前处于 **邀请测试** 阶段
- 功能与界面可能随版本更新发生变化
- 具体支持能力以实际发布版本为准

---

## 🛠️ 文档站开发

文档站基于 [Docusaurus](https://docusaurus.io/)，默认语言为英文，另有简体中文（`i18n/zh-Hans`）。

```bash
pnpm install
pnpm dev                                  # 本地预览（英文）
pnpm docusaurus start --locale zh-Hans    # 本地预览（中文）
pnpm build                                # 构建到 build/
```

修改页面或文档时，请同步补充中文翻译（见 `AGENTS.md`）。
