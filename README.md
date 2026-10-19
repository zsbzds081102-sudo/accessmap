# AccessMap

校园无障碍地图与障碍上报 — Neighborhood Hacks 2026 演示项目。  
演示校园：**七台河市第一中学**。

**AI-assisted / 本项目由 AI 辅助完成。**

**本项目也使用了 DeepSeek Harness（DeepSeek V4.1 Flash）辅助开发。** This project was also built with DeepSeek Harness (DeepSeek V4.1 Flash).

## Problem / 问题

轮椅使用者、受伤同学和推婴儿车的家长，常被校园台阶与缺坡道挡住。AccessMap 把障碍钉在地图上，方便同学上报、学校优先修缮。

## Live demo

- **GitHub Pages (stable):** https://zsbzds081102-sudo.github.io/accessmap/
- Temporary Vercel preview may expire; claim a permanent Vercel deploy with `vercel login` then `npx vercel --yes` from this folder.


## 本地预览 / Run locally

```bash
npm install && npm run dev
```

然后打开终端里 Vite 打印的地址（通常是 http://localhost:5173）。

生产构建：

```bash
npm run build && npm run preview
```

上报记录只存在当前浏览器的 `localStorage`。想回到最初的 6 个校园钉点，用侧栏 **恢复校园最初的 6 个地点**，或清除该站点本地存储。

## 评委 20 秒

默认英文，右上角可切到中文，也可以点 **Voice** 静音（字幕仍在）。语音只播当前这一种语言。点 **Live location** 后，人在校园附近会说出旁边的障碍；离得远会说出离校园多远，以及本周先修正门。点 **Play 20 seconds**，按 **Next** 走完三拍，第三拍会停在「学校来修」：

1. 正门有台阶、没有坡道，坐轮椅进不了学校。
2. 主教学楼已有电梯，课可以上。
3. 切到「学校来修」：本周只做正门坡道，实验楼、图书馆、体育馆排在后面。

## MVP 功能

- Leaflet 地图（高德底图）+ 校园种子钉点，首屏自动框住校园
- 同学上课：今天能不能进；学校来修：按影响排序的修缮顺序
- 先点「我要上报障碍」，再点地图新增（台阶 / 没有坡道 / 电梯故障 / 其他）+ 说明 + 可选照片
- 列表、还没解决 ↔ 可以通行
- 按状态和类型筛选
- `localStorage` 持久化
- 手机端底部固定操作条，主按钮不用滚动就能点到
- 上报不用先点地图：可从地点列表直接选，或用当前位置上报，地点名自动带出
- 改错状态可以撤销；「恢复校园最初的 6 个地点」会先确认，避免误删上报
- 打开定位后，列表显示每个地点离你多远，并标出「离你最近的障碍」
- 触屏地图钉 44px；定位失败会区分「没有权限」和「暂时拿不到位置」
- 语音开关；字幕有 `aria-live` 播报，地图钉可用 Tab + Enter 选择，筛选按钮带 `aria-pressed`
- 键盘路径：Skip link 直达主内容，`main` landmark，地图获得焦点时有 3px 焦点环，筛选边界对比度 3.4:1

## 演示种子钉点

| 顺序 | 地点 | 含义 |
| --- | --- | --- |
| 1 | 正门 / 门卫 | 有台阶，无坡道。全校进出都经过 |
| 2 | 实验楼 | 4 层，无电梯 |
| 3 | 图书馆 | 3 层，无电梯 |
| 4 | 体育馆 / 操场入口 | 3 层，无电梯 |
| 先不用修 | 主教学楼 | 7 层，有电梯 |
| 先不用修 | 食堂 | 3 层，有电梯 |

地图上「通」= 可以通行；「阶 / 坡 / 梯」= 还没解决。

## Stack

Vite + React + TypeScript + Leaflet / react-leaflet。底图为高德地图；钉点坐标与底图同一套，落在金沙街道校园范围内。
