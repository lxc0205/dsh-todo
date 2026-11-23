# 工作日程（dsh-todo）

一个用于 DeepSeek Harness（DSH）的左侧栏周视图日程插件。

## 功能

- 左侧栏「工作日程」入口，点击进入周视图面板
- 周一为一周起始，可切换上一周 / 本周 / 下一周
- 每日任务：新增、勾选完成、删除
- 过去日期不可新增，已有记录可删除
- 未完成任务会在日期切换时自动移到当天，原日期不再保留该条目
- 每个日期栏独立显示「已完成 / 未完成 / 总数」，底部有颜色图例
- 底部「打开json」按钮可在本地文件管理器中显示 `tasks.json`
- 中文 / 英文界面，使用 DSH 主题 token

## 安装

在 DSH 中安装本插件目录：

```js
plugin_manager install_bundle({ action: 'install_bundle', target: '/path/to/dsh-work-schedule' })
```

或把本目录放到 DSH 配置文件的插件目录后启用。

安装后刷新 Web GUI，即可在左侧栏看到「工作日程」。

## 数据存储

任务数据保存在浏览器 `localStorage`（键：`dsh.weekly-planner.tasks.v2`）。`tasks.json` 是随仓库提供的初始/迁移数据快照；插件首次运行时会用它作为种子数据，之后的修改保存在浏览器本地，不会自动写回 `tasks.json`。

## 目录结构

- `package.json` — DSH bundle 清单与客户端入口声明
- `index.js` — Host 半端
- `client.js` — Client 半端（React 渲染与交互）
- `cordis.patch.yml` — Cordis 插件注册 patch
- `locale/` — 中英文文案
- `docs/` — 详情预览图
- `icon.svg` — 插件图标
- `tasks.json` — 迁移后的任务数据快照

## 许可证

MIT
