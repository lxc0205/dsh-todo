# 工作日程（dsh-todo）

一个用于 DeepSeek Harness（DSH）的左侧栏周视图日程插件。

## 功能

- 左侧栏「工作日程」入口，点击进入周视图面板
- 周一为一周起始，可切换上一周 / 本周 / 下一周
- 每日任务：新增、勾选完成、删除
- 过去日期不可新增，已有记录可删除
- 未完成任务会在新的一天自动复制一份到次日（原记录保留）
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

任务数据保存在浏览器 `localStorage`（键：`dsh.weekly-planner.tasks.v2`）。仓库中的 `tasks.json` 是空示例文件，插件不预置任何任务，也不会把浏览器数据写回该文件。

## 目录结构

- `package.json` — DSH bundle 清单与客户端入口声明
- `index.js` — Host 半端
- `client.js` — Client 半端（React 渲染与交互）
- `cordis.patch.yml` — Cordis 插件注册 patch
- `locale/` — 中英文文案
- `docs/` — 详情预览图
- `icon.svg` — 插件图标
- `tasks.json` — 空的任务数据示例文件

## 许可证

MIT
