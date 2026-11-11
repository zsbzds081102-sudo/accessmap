import type { AccessPin, BarrierType, PinStatus } from './types'
import { placeVerdict } from './types'
import { SEED_PINS } from './seed'

export type Lang = 'en' | 'zh'

const LANG_KEY = 'accessmap-lang'

export function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // Private mode: the language still applies for this visit.
  }
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  document.title =
    lang === 'zh'
      ? 'AccessMap · 七台河市第一中学'
      : 'AccessMap · Qitaihe No.1 High School'
}

const copy = {
  en: {
    postContest: 'Neighborhood Hacks 2026 · Post-contest iteration',
    campus: 'Qitaihe No.1 High School',
    blockedCount: 'blocked',
    openCount: 'passable',
    student: 'Student',
    school: 'School',
    thisWeek: 'Fix this week',
    selectedPlace: 'Selected place',
    demo: 'Demo',
    walk: 'Play 20 seconds',
    next: 'Next',
    replay: 'Play again',
    speaking: 'Speaking',
    voice: 'Voice',
    voiceOn: 'Turn voice on',
    voiceOff: 'Turn voice off',
    languageLabel: 'Language',
    placesLabel: 'Campus places',
    mapLabel: 'Campus map of Qitaihe No.1 High School. The same places are listed in the sidebar.',
    skipToMain: 'Skip to the map and report',
    productLine: 'Demo records for wheelchair access at Qitaihe No.1 High School.',
    routeLine: 'Mapped places: main gate, teaching building, labs, library, cafeteria, gym.',
    schoolAction: 'For the school',
    exportCta: "This week's repair priorities",
    exportCtaHint: 'Copy a short list for the facilities office or class teacher.',
    exportDialogLabel: 'Repair priorities',
    exportIntro: 'Ranked from the demo places and reports on this device. Copy, download, or print the list to share it.',
    exportOpen: (count: number) => `${count} open`,
    exportCopy: 'Copy list',
    exportCopied: 'Copied',
    exportCsv: 'Download CSV',
    exportPrint: 'Print',
    exportClose: 'Close',
    exportEmpty: 'No open barriers. Every mapped place is passable right now.',
    exportBlocks: 'Blocks',
    exportNote: 'Student note',
    exportAlready: 'Recorded as passable',
    exportPin: 'Pin',
    exportFooter: 'Includes demo places and local reports. Verify conditions with the school before acting.',
    exportNoAccount: 'No account. No server. Data stays on this device.',
    allClear: 'Nothing is blocked.',
    all: 'All',
    cannotEnter: 'Blocked',
    canEnter: 'Passable',
    allTypes: 'All types',
    empty: 'Nothing matches this filter.',
    report: 'Report a barrier',
    cancelReport: 'Cancel report',
    hintIdle: 'Look first. Turn on reporting before you drop a pin.',
    hintReporting: 'Click the map where the barrier is.',
    hintPlace: 'Click the map to move the pin.',
    pickPlace: 'Report a place without the map',
    orTapMap: 'Or tap the map where the barrier is.',
    useMyLocation: 'Use my location',
    myLocation: 'My location',
    nearMeTitle: 'Barrier near me',
    nearestBarrier: 'Nearest barrier',
    undo: 'Undo',
    toastMarkedFixed: 'Marked passable.',
    toastReportedAgain: 'Reported again.',
    toastReported: 'Report saved on this device. Open “For the school” to export it.',
    toastRestored: 'Campus places restored.',
    resetConfirm: 'This deletes your reports and restores the six demo places.',
    resetConfirmTitle: 'Confirm reset',
    confirmReset: 'Restore six places',
    locUnavailable: 'Location is not available right now. Try again.',
    locate: 'Live location',
    stopLocate: 'Stop location',
    away: (distance: string) => `${distance} from campus`,
    locAccuracy: (radius: string) => `Estimated location accuracy radius: ${radius}.`,
    locImprecise: (radius: string) => `Estimated location accuracy radius: ${radius}. Too imprecise to identify a nearby place.`,
    locReportAccuracy: (radius: string) => `Estimated location accuracy radius: ${radius}. Check the pin and click the map to move it if needed.`,
    unknownCoords: 'Coordinate source unknown. Check the pin on the map.',
    exportCopyError: 'Could not copy. Try downloading CSV or printing.',
    locDenied: 'Location permission was denied.',
    locUnsupported: 'This browser cannot read your location.',
    near: (title: string, verdict: string, detail: string) =>
      `Near ${title}. ${verdict}. ${detail}`,
    markFixed: 'Mark passable',
    reopen: 'Report again',
    reset: 'Restore the six campus places',
    saveQuota: 'Browser storage is full. If the report has a photo, remove it or choose a smaller one, then try again.',
    saveUnavailable: 'AccessMap could not read or write browser storage. Check that this site can use local storage, then try again.',
    removePhoto: 'Remove photo',
    photoLoading: 'Preparing photo…',
    photoError: 'Could not read the photo. Choose another one or remove it.',
    previousNote: 'Earlier observation',
    passableLocal: 'This device records the place as passable. Confirm conditions before travelling.',
    blockedLocal: 'This device records an access problem. The cause has yet to be recorded.',
    blockedLocalImpact: 'Access has been flagged as blocked.',
    photoAlt: 'Photo',
    photoPreview: 'Photo preview',
    legend: 'ST stairs · NR no ramp · EL elevator · OK passable',
    audienceLabel: 'Who is looking',
    statusLabel: 'Filter by access',
    typeLabel: 'Filter by type',
    formTitle: 'Report this place',
    formWhere: 'Location',
    formName: 'Place name',
    formNamePh: 'East entrance stairs',
    formType: 'What is wrong',
    formNote: 'Note for the next person',
    formNotePh: 'Stairs only. A wheelchair cannot go up. Use the ground floor.',
    formPhoto: 'Photo, optional',
    observedOn: 'Observation date',
    observationSource: 'Evidence source',
    optional: 'optional',
    sourcePlaceholder: 'For example, direct observation or a public notice URL',
    demoEvidence: 'Manual demo point',
    localEvidence: 'Local report',
    missingEvidence: 'Unrecorded',
    recordId: 'Record ID',
    cancel: 'Cancel',
    save: 'Save',
    verdict: {
      elevator: 'Elevator out',
      blocked: 'Blocked',
      enter: 'Passable',
      repaired: 'Marked passable',
    },
    type: {
      stairs: 'Stairs',
      no_ramp: 'No ramp',
      elevator_broken: 'Elevator broken',
      other: 'Other',
    } as Record<BarrierType, string>,
    status: {
      open: 'Open issue',
      fixed: 'Passable',
    } as Record<PinStatus, string>,
  },
  zh: {
    postContest: 'Neighborhood Hacks 2026 · 赛后迭代',
    campus: '七台河市第一中学',
    blockedCount: '进不去',
    openCount: '能进入',
    student: '同学上课',
    school: '学校来修',
    thisWeek: '本周先修',
    selectedPlace: '选中的地点',
    demo: '演示',
    walk: '用 20 秒看完',
    next: '下一个',
    replay: '再看一遍',
    speaking: '正在播报',
    voice: '语音',
    voiceOn: '打开语音',
    voiceOff: '关闭语音',
    languageLabel: '语言',
    placesLabel: '校园地点',
    mapLabel: '七台河市第一中学校园地图。同样的地点也列在侧栏里。',
    skipToMain: '跳到地图和上报',
    productLine: '七台河市第一中学轮椅通行演示记录。',
    routeLine: '已标注：正门、主教学楼、实验楼、图书馆、食堂、体育馆。',
    schoolAction: '给学校',
    exportCta: '本周修缮优先级',
    exportCtaHint: '复制一份给后勤或班主任。',
    exportDialogLabel: '修缮优先级',
    exportIntro: '按本机的演示地点与上报记录排序。可复制、下载或打印清单后转交。',
    exportOpen: (count: number) => `${count} 处未解决`,
    exportCopy: '复制清单',
    exportCopied: '已复制',
    exportCsv: '下载 CSV',
    exportPrint: '打印',
    exportClose: '关闭',
    exportEmpty: '现在没有未解决的障碍，地图上的地点都可以进入。',
    exportBlocks: '影响',
    exportNote: '学生说明',
    exportAlready: '记录为可以通行',
    exportPin: '坐标',
    exportFooter: '包含演示地点与本机上报。处理前请与学校核实。',
    exportNoAccount: '无需账号，不上传服务器，数据只在本机。',
    allClear: '现在没有未解决的障碍。',
    all: '全部',
    cannotEnter: '进不去',
    canEnter: '能进入',
    allTypes: '全部类型',
    empty: '这个筛选下没有地点。',
    report: '我要上报障碍',
    cancelReport: '取消上报',
    hintIdle: '先看能不能进。要标新障碍，再点上报。',
    hintReporting: '请点地图上障碍所在的位置。',
    hintPlace: '点地图可以把这个点换个位置。',
    pickPlace: '不用点地图也能上报',
    orTapMap: '也可以直接点地图上障碍的位置。',
    useMyLocation: '用我的位置',
    myLocation: '我的位置',
    nearMeTitle: '我附近的障碍',
    nearestBarrier: '离你最近的障碍',
    undo: '撤销',
    toastMarkedFixed: '已标为可以通行。',
    toastReportedAgain: '已重新标为有问题。',
    toastReported: '上报已保存在这台设备。切到「学校来修」可以导出给后勤。',
    toastRestored: '已恢复校园最初的 6 个地点。',
    resetConfirm: '这会删除你上报的记录，恢复最初的 6 个地点。',
    resetConfirmTitle: '确认恢复',
    confirmReset: '确定恢复',
    locUnavailable: '现在拿不到位置，请再试一次。',
    locate: '实时定位',
    stopLocate: '停止定位',
    away: (distance: string) => `离校园${distance}`,
    locAccuracy: (radius: string) => `定位估计精度半径：${radius}。`,
    locImprecise: (radius: string) => `定位估计精度半径：${radius}，无法可靠判断附近地点。`,
    locReportAccuracy: (radius: string) => `定位估计精度半径：${radius}。请检查钉点，需要时点击地图调整。`,
    unknownCoords: '坐标来源不明，请在地图上核对位置。',
    exportCopyError: '无法复制。可下载 CSV 或打印。',
    locDenied: '没有获得定位权限。',
    locUnsupported: '这个浏览器读不了位置。',
    near: (title: string, verdict: string, detail: string) =>
      `靠近${title}。${verdict}。${detail}`,
    markFixed: '标为可以通行',
    reopen: '又遇到问题了',
    reset: '恢复校园最初的 6 个地点',
    saveQuota: '浏览器存储空间已满。如果上报附有照片，请移除照片或换小图后重试。',
    saveUnavailable: '无法读取或写入浏览器存储。请检查此站点是否可以使用本地存储，再重试。',
    removePhoto: '移除照片',
    photoLoading: '正在处理照片…',
    photoError: '无法读取照片，请换一张或移除照片。',
    previousNote: '此前观察',
    passableLocal: '本机记录标为可以通行。出行前请确认现场情况。',
    blockedLocal: '本机记录标为受阻，原因待补充。',
    blockedLocalImpact: '已记录通行受阻。',
    photoAlt: '的照片',
    photoPreview: '照片预览',
    legend: '阶 台阶 · 坡 无坡道 · 梯 电梯故障 · 通 可通行',
    audienceLabel: '给谁看',
    statusLabel: '按能不能进筛选',
    typeLabel: '按障碍类型筛选',
    formTitle: '上报这一处',
    formWhere: '位置',
    formName: '地点名称',
    formNamePh: '例如：实验楼东门台阶',
    formType: '是什么问题',
    formNote: '给下一个人的说明',
    formNotePh: '只有台阶，轮椅上不去，请走一楼。',
    formPhoto: '照片（可以不传）',
    observedOn: '观察日期',
    observationSource: '证据来源',
    optional: '选填',
    sourcePlaceholder: '例如亲眼观察或公开公告链接',
    demoEvidence: '手工演示点',
    localEvidence: '本机上报',
    missingEvidence: '未记录',
    recordId: '记录编号',
    cancel: '取消',
    save: '保存',
    verdict: {
      elevator: '电梯用不了',
      blocked: '现在进不去',
      enter: '可以进入',
      repaired: '已标为可以通行',
    },
    type: {
      stairs: '台阶',
      no_ramp: '没有坡道',
      elevator_broken: '电梯故障',
      other: '其他',
    } as Record<BarrierType, string>,
    status: {
      open: '还没解决',
      fixed: '可以通行',
    } as Record<PinStatus, string>,
  },
}

type Copy = (typeof copy)['en']

export function t(lang: Lang): Copy {
  return copy[lang]
}

const seedCopy: Record<string, Record<Lang, { title: string; note: string; affects: string }>> = {
  'seed-1': {
    en: {
      title: 'Main gate',
      note: 'Stairs at the guard post, and no ramp. A wheelchair cannot come through this door.',
      affects: 'Everyone enters and leaves through this gate.',
    },
    zh: {
      title: '正门 / 门卫',
      note: '正门有台阶，没有坡道。坐轮椅进不了这道门，需要别人帮忙抬。',
      affects: '全校进出都要经过这道门。',
    },
  },
  'seed-2': {
    en: {
      title: 'Main teaching building',
      note: 'Seven floors, with an elevator. Classes are reachable. If the elevator stops, mark this blocked.',
      affects: 'Already usable. Do not fix this first.',
    },
    zh: {
      title: '主教学楼',
      note: '7 层，楼里有电梯。坐轮椅可以进楼上课。电梯如果停了，把这里改成还没解决。',
      affects: '已经能上课，本周不用先修。',
    },
  },
  'seed-3': {
    en: {
      title: 'Lab building',
      note: 'Four floors, no elevator. A wheelchair stays on the ground floor.',
      affects: 'Lab class above the ground floor is unreachable.',
    },
    zh: {
      title: '实验楼',
      note: '4 层，没有电梯。坐轮椅只能留在一楼，上不了上面的实验室。',
      affects: '实验课上不了二楼以上。',
    },
  },
  'seed-4': {
    en: {
      title: 'Library',
      note: 'Three floors, no elevator. The reading rooms are upstairs.',
      affects: 'The books are upstairs.',
    },
    zh: {
      title: '图书馆',
      note: '3 层，没有电梯。坐轮椅只能在一楼，上不了上面的阅览室。',
      affects: '阅览室在楼上，书拿不到。',
    },
  },
  'seed-5': {
    en: {
      title: 'Cafeteria',
      note: 'Three floors, with an elevator. Meals are reachable.',
      affects: 'Already usable. Do not fix this first.',
    },
    zh: {
      title: '食堂',
      note: '3 层，楼里有电梯。坐轮椅可以进去吃饭。',
      affects: '已经能吃饭，本周不用先修。',
    },
  },
  'seed-6': {
    en: {
      title: 'Gym entrance',
      note: 'Three floors at the entrance, no elevator. Indoor courts are unreachable.',
      affects: 'The gym floors are unreachable.',
    },
    zh: {
      title: '体育馆 / 操场入口',
      note: '入口一带 3 层，没有电梯。坐轮椅上不了楼里的场地。',
      affects: '体育馆楼层进不去。',
    },
  },
}

export function displayPin(pin: AccessPin, lang: Lang): {
  title: string
  note: string
  affects?: string
  previousNote?: string
} {
  const original = seedCopy[pin.id]?.[lang] ?? { title: pin.title, note: pin.note, affects: pin.affects }
  const seed = SEED_PINS.find((item) => item.id === pin.id)
  const text = t(lang)
  if (pin.status === 'fixed' && seed?.status !== 'fixed') {
    return { title: original.title, note: text.passableLocal, previousNote: original.note }
  }
  if (pin.status === 'open' && seed?.status === 'fixed') {
    return {
      title: original.title,
      note: text.blockedLocal,
      affects: text.blockedLocalImpact,
      previousNote: original.note,
    }
  }
  return original
}

export function verdictLabel(pin: AccessPin, lang: Lang): string {
  const verdict = placeVerdict(pin)
  const seed = SEED_PINS.find((item) => item.id === pin.id)
  return t(lang).verdict[verdict.ok && seed?.status !== 'fixed' ? 'repaired' : verdict.key]
}

export function pinGlyph(pin: AccessPin, lang: Lang): string {
  const verdict = placeVerdict(pin)
  if (verdict.ok) return lang === 'zh' ? '通' : 'OK'
  if (pin.type === 'stairs') return lang === 'zh' ? '阶' : 'ST'
  if (pin.type === 'no_ramp') return lang === 'zh' ? '坡' : 'NR'
  if (pin.type === 'elevator_broken') return lang === 'zh' ? '梯' : 'EL'
  return lang === 'zh' ? '阻' : 'NO'
}

export function observationEvidence(pin: AccessPin, lang: Lang) {
  const text = t(lang)
  return {
    kind: SEED_PINS.some((seed) => seed.id === pin.id) ? text.demoEvidence : text.localEvidence,
    date: pin.observedOn || text.missingEvidence,
    source: pin.observationSource || text.missingEvidence,
  }
}
