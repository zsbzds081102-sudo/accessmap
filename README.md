# AccessMap

校园无障碍地图与障碍上报 — Neighborhood Hacks 2026 演示项目。  
演示校园：**七台河市第一中学**。

**AI-assisted / 本项目由 AI 辅助完成。**

## Problem / 问题

轮椅使用者、受伤同学和推婴儿车的家长，常被校园台阶与缺坡道挡住。AccessMap 把障碍钉在地图上，方便同学上报、学校优先修缮。

## Live demo

（部署后把公网链接写在这里。）

## 本地预览 / Run locally

```bash
npm install && npm run dev
```

然后打开终端里 Vite 打印的地址（通常是 http://localhost:5173）。

生产构建：

```bash
npm run build && npm run preview
```

上报记录只存在当前浏览器的 `localStorage`。想回到最初的 6 个校园钉点，用侧栏 **Restore campus seed**，或清除该站点本地存储。

## MVP 功能

- Leaflet 地图（高德底图）+ 校园种子钉点
- 点击地图新增障碍（stairs / no ramp / elevator broken / other）+ 说明 + 可选照片
- 列表、Open ↔ Fixed 切换
- 按 **状态**（Open / Fixed）与 **类型** 筛选
- 侧栏障碍统计（open vs fixed，按类型）
- `localStorage` 持久化

## 演示种子钉点

| 地点 | 含义 |
| --- | --- |
| 正门 / 门卫 | **障碍**：有台阶，无坡道 |
| 主教学楼 | **已畅通**：7 层，有电梯 |
| 实验楼 | **障碍**：4 层，无电梯 |
| 图书馆 | **障碍**：3 层，无电梯 |
| 食堂 | **已畅通**：3 层，有电梯 |
| 体育馆 / 操场入口 | **障碍**：3 层，无电梯 |

绿色钉点 = Fixed / 已畅通；彩色钉点 = Open / 待解决障碍。

## Stack

Vite + React + TypeScript + Leaflet / react-leaflet。底图为高德地图；钉点坐标与底图同一套，落在金沙街道校园范围内。
