# AccessMap 赛后迭代

核查日期为 2026-11-12（北京时间）。代码基线为 `63fe959`，沿用 `post-contest/storage-and-status-consistency`。开始时暂存区及已跟踪文件均无差异，历史中的无障碍巡检提交为 `ecb40c0`。本次在本地工作区修改。

## 官方评分与奖项

Devpost 的 Judging Criteria 确认为社区相关性 25%、影响潜力 20%、技术实现 20%、创意 15%、表达清晰度 10%、无障碍 10%。规则第 6、7 节定义了前三名、两个类别奖及十强证书。最终公告指向作品展廊，奖项按各作品页明确列出的标签核对。展廊的通用 Winner 标记也可能包含十强证书，未逐项确认的额外赞助奖归属留空。[Devpost 评分](https://neighborhood-hacks-2026.devpost.com/#judging-criteria) · [官方规则](https://neighborhoodhacks.org/rules/) · [最终公告](https://neighborhood-hacks-2026.devpost.com/updates/46055-and-the-winner-is) · [官方展廊](https://neighborhood-hacks-2026.devpost.com/project-gallery)

| 官方规则列出的奖项 | 作品页 |
| --- | --- |
| 冠军 | [Is it an e-bike?](https://devpost.com/software/is-it-an-e-bike) |
| 第二名 | [Virtual Lab VR](https://devpost.com/software/virtual-lab-vr) |
| 第三名 | [Anchor](https://devpost.com/software/anchor-6tgqay) |
| Most Unique Solution | [Heartline](https://devpost.com/software/heartline-n83r1m) |
| Best Technical Execution | [Sunstruck 103º](https://devpost.com/software/sunstruck-103) |

AccessMap 未出现在十强公告中。个人评分及评委反馈未取得，无法据此归因。本次网页读取工具未能打开 AccessMap 原 Devpost 作品和线上演示，比较中的 AccessMap 指本地赛后版本。[十强公告](https://neighborhood-hacks-2026.devpost.com/updates) · [AccessMap 作品](https://devpost.com/software/accessmap-zx4wbu) · [原演示地址](https://zsbzds081102-sudo.github.io/accessmap/)

## 六维比较

选 Heartline 是因为同样用地图回答能否到达，并输出社区行动建议。选冠军是因为同样把地点上的约束转成出行前可核对的判断。以下比较对应截至核查日可读的公开材料和本地测试。Heartline 查阅了提交、仓库、AED 数据统计脚本和公开演示的页面文本。冠军查阅了提交和它引用的市政与学区来源，演示页面未能读取，未独立核验源码和运行测试。两者视频均未分析。[Heartline 提交](https://devpost.com/software/heartline-n83r1m) · [Heartline 代码](https://github.com/Edtwo/Neighborhood-Hacks) · [Heartline 统计脚本](https://github.com/Edtwo/Neighborhood-Hacks/blob/main/scripts/count_aeds.mjs) · [Heartline 演示](https://edtwo.github.io/Neighborhood-Hacks/) · [冠军提交](https://devpost.com/software/is-it-an-e-bike) · [学区资料](https://www.sduhsd.net/Parents--Students/Student-Resources/Bike-Safety/index.html) · [市政来源](https://docs.sandiego.gov/municode/MuniCodeChapter08/Ch08Art04Division00.pdf)

| 维度 | AccessMap 本地赛后版 | Heartline | Is it an e-bike? |
| --- | --- | --- | --- |
| 社区相关性 25% | 校门和教学楼的场景具体。六个手工演示点的观察日期、现场来源和受影响者验证仍待采集。 | 提交给出 Allen 社区、带日期的 OSM 快照及作者陈述的实地观察。公开脚本能追溯统计口径。 | 提交把圣迭戈家庭的选车和上学骑行问题连接到市政及学区资料。公开链接支持其本地背景。 |
| 影响潜力 20% | 校园清单可转交。导出带记录编号，接收、处理、复核均需真实回执。 | 公开代码说明把覆盖缺口变成可打印的配置建议。模型覆盖率和实际救援成效无法直接比较。 | 提交描述出行前检查和可打印二维码。家庭使用量、风险下降和规则长期维护成效未核验。 |
| 技术实现 20% | 本地测试验证错误处理、状态、排序、导出、坐标边界和键盘路径。位置采用离线近似，存储限当前浏览器。 | 仓库和脚本可审阅，README 描述缓存、快照和单元测试入口。本轮未执行对方测试或验证模型准确性。 | 提交描述确定性规则、有效日期和测试结果。代码、测试计数及端到端运行结果未独立复核，技术质量无法横比。 |
| 创意 15% | 同一记录服务学生出行和后勤排优先级。 | 公开材料展示按时间计算 AED 可获得性，并给出配置地点建议。 | 提交把单车、骑行者、路线和辖区叠加到一次判断中。无法由公开材料给三种方案作原创性排名。 |
| 表达清晰度 10% | 演示随当前状态更新，导出注明来源和缺失字段。 | 提交从夜间取不到 AED 切入，给出有日期的例子及缺失数据边界。 | 提交区分禁止与无法确认，说明来源及有效日期。只比较文本和输出设计，视频呈现留空。 |
| 无障碍 10% | 已测双语、列表报点、键盘地图选点和对话框焦点。真实辅助技术与目标用户试用未做。 | 仓库陈述双语、免登录和离线引导。未运行辅助技术检查。 | 提交陈述英西双语、移动端和免账号使用。未核验键盘、读屏和实际完成率。 |

比较推断：AccessMap 最直接的差距是难以追溯每条观察并确认是否有人处理。赛后版让上报者可填写观察日期与来源，导出显示记录编号、演示点或本机上报、证据缺失和坐标系。现有演示点和旧数据缺失的日期、来源保持空缺。CSV 的自由文本字段会转义常见公式开头。

## 复现与验收

从项目根目录运行 `npm test` 和 `npm run build`。用 `npm run dev` 在单独的测试浏览器配置中打开本地页面。勿在有真实上报数据的配置里注入存储故障。

1. **保存和重试**。从地点列表选择正门，输入名称、说明和照片。在 Chrome 控制台对 `accessmap-pins-v2` 注入下面的故障，点保存。配额错误时表单、类型和照片应留在原位；页面应只显示错误。把错误名换为 `SecurityError` 可复现禁用写入。恢复原函数后重试并刷新，应只出现一条报告。
2. **标为通行及再次受阻**。在学校视图对测试报告依次执行两个操作。通行后旧说明标为此前观察，语音文案使用当前状态，CSV 待修行移除，打印将其列在记录为通行处。再次受阻后，待修列表、CSV 和打印恢复该记录及排序。把原本通行的主教学楼标为受阻时，当前原因应显示待补充。
3. **模拟定位**。在测试环境返回 WGS84 `45.86527, 131.03593`，精度半径 8 米。实时定位应将该位置放到正门附近。使用当前位置上报应保存约 `45.86756, 131.04380`，并带 `GCJ-02`。把精度半径改为 180 米应提示无法可靠判断附近地点。停止定位后迟到回调应被忽略。旧上报坐标来源显示未知，保留原值并从距离判断中排除。转换使用基于矩形范围的离线近似，边界地区与校内现场精度仍需验证。[W3C Geolocation](https://www.w3.org/TR/geolocation/) · [高德坐标转换说明](https://lbs.amap.com/api/webservice/guide/api/convert) · [离线转换参考](https://github.com/googollee/eviltransform)
4. **键盘和证据**。用方向键切换语言并检查页面语言。Tab 到地图钉，按空格选择；打开优先级对话框，焦点进入复制按钮，Tab 循环，Esc 返回触发按钮。上报时填写一个测试观察日期与来源，刷新后确认详情及导出都保留这两个字段和稳定的记录编号。演示点日期与来源显示未记录。

```js
const originalSetItem = Storage.prototype.setItem
Storage.prototype.setItem = function (key, value) {
  if (key === 'accessmap-pins-v2') throw new DOMException('Test', 'QuotaExceededError')
  return originalSetItem.call(this, key, value)
}
// 测试故障后在同一控制台执行这一行以恢复
// Storage.prototype.setItem = originalSetItem
```

本次自动化使用 Chrome 加载生产构建，注入浏览器定位和存储错误，捕获系统语音调用文本和打印入口内容，读取实际下载的 CSV。设备 GPS、线上地图瓦片、听感、读屏及真实打印机未验收。

## 最小现场待办

先对正门和主教学楼各做一次带日期的走测，记录具体入口、轮椅可达范围、定位半径及地图偏差。有当事人自愿参与时，验证无需地图能否完成一次上报，并记录完成情况和遇到的障碍。首批只跟进一条实际报告，用导出记录编号关联以下记录。空白代表尚无证据。

| 记录编号 | 观察日期、来源和地点 | 接收日期、接收角色及回执编号 | 处理日期、处理动作及凭据 | 复核日期、复核方法及结果 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
