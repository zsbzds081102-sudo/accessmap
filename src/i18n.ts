import type { AccessPin, BarrierType, PinStatus } from './types'
import { placeVerdict } from './types'

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
    productLine: 'Qitaihe No.1 High School, mapped for wheelchair access. Check each entrance before class.',
    routeLine: 'Mapped places: main gate, teaching building, labs, library, cafeteria, gym.',
    schoolAction: 'For the school',
    exportCta: "This week's repair priorities",
    exportCtaHint: 'Copy a short list for the facilities office or class teacher.',
    exportDialogLabel: 'Repair priorities',
    exportIntro: 'Ranked from the student reports on this device. Send it in WeChat, email, or print it.',
    exportOpen: (count: number) => `${count} open`,
    exportCopy: 'Copy list',
    exportCopied: 'Copied',
    exportCsv: 'Download CSV',
    exportPrint: 'Print',
    exportClose: 'Close',
    exportEmpty: 'No open barriers. Every mapped place is passable right now.',
    exportBlocks: 'Blocks',
    exportNote: 'Student note',
    exportAlready: 'Already passable',
    exportPin: 'Pin',
    exportFooter: 'Generated locally from student reports. Demo data, not an official facilities record.',
    exportNoAccount: 'No account. No server. Data stays on this device.',
    allClear: 'Nothing is blocked.',
    gateRamp: 'Main-gate ramp',
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
    nearPlace: (title: string, distance: string) => `${distance} from ${title}`,
    locDenied: 'Location permission was denied.',
    locUnsupported: 'This browser cannot read your location.',
    near: (title: string, verdict: string, detail: string) =>
      `Near ${title}. ${verdict}. ${detail}`,
    far: (distance: string, title: string, detail: string) =>
      `You are ${distance} from campus. Fix ${title} first. ${detail}`,
    markFixed: 'Mark fixed',
    reopen: 'Report again',
    reset: 'Restore the six campus places',
    saveError: 'This browser could not save the photo. Try a smaller one.',
    photoAlt: 'Photo',
    photoPreview: 'Photo preview',
    legend: 'ST stairs · NR no ramp · EL elevator · OK passable',
    audienceLabel: 'Who is looking',
    statusLabel: 'Filter by access',
    typeLabel: 'Filter by type',
    walk1: 'The main gate has stairs and no ramp. A wheelchair cannot enter the school here.',
    walk2: 'The main teaching building already has an elevator. Class is reachable.',
    walk3: 'So this week, build one ramp at the main gate. The lab, library, and gym come after.',
    formTitle: 'Report this place',
    formWhere: 'Location',
    formName: 'Place name',
    formNamePh: 'East entrance stairs',
    formType: 'What is wrong',
    formNote: 'Note for the next person',
    formNotePh: 'Stairs only. A wheelchair cannot go up. Use the ground floor.',
    formPhoto: 'Photo, optional',
    cancel: 'Cancel',
    save: 'Save',
    verdict: {
      elevator: 'Elevator out',
      blocked: 'Blocked',
      enter: 'Passable',
      repaired: 'Fixed',
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
    productLine: '七台河市第一中学无障碍地图。上课前，先看每个入口能不能进。',
    routeLine: '已标注：正门、主教学楼、实验楼、图书馆、食堂、体育馆。',
    schoolAction: '给学校',
    exportCta: '本周修缮优先级',
    exportCtaHint: '复制一份给后勤或班主任。',
    exportDialogLabel: '修缮优先级',
    exportIntro: '按这台设备上的学生上报排序。可以直接发微信、邮件，或打印。',
    exportOpen: (count: number) => `${count} 处未解决`,
    exportCopy: '复制清单',
    exportCopied: '已复制',
    exportCsv: '下载 CSV',
    exportPrint: '打印',
    exportClose: '关闭',
    exportEmpty: '现在没有未解决的障碍，地图上的地点都可以进入。',
    exportBlocks: '影响',
    exportNote: '学生说明',
    exportAlready: '已经可以通行',
    exportPin: '坐标',
    exportFooter: '由学生上报在本机生成。演示数据，不是学校正式工单。',
    exportNoAccount: '无需账号，不上传服务器，数据只在本机。',
    allClear: '现在没有未解决的障碍。',
    gateRamp: '正门坡道',
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
    nearPlace: (title: string, distance: string) => `离${title}${distance}`,
    locDenied: '没有获得定位权限。',
    locUnsupported: '这个浏览器读不了位置。',
    near: (title: string, verdict: string, detail: string) =>
      `靠近${title}。${verdict}。${detail}`,
    far: (distance: string, title: string, detail: string) =>
      `你离校园大约${distance}。本周先修${title}。${detail}`,
    markFixed: '标成已经修好',
    reopen: '又遇到问题了',
    reset: '恢复校园最初的 6 个地点',
    saveError: '这个浏览器存不下了。照片请换小一点的。',
    photoAlt: '的照片',
    photoPreview: '照片预览',
    legend: '阶 台阶 · 坡 无坡道 · 梯 电梯故障 · 通 可通行',
    audienceLabel: '给谁看',
    statusLabel: '按能不能进筛选',
    typeLabel: '按障碍类型筛选',
    walk1: '正门有台阶、没有坡道。坐轮椅的同学从这里进不了学校。',
    walk2: '主教学楼已经有电梯。课可以上。',
    walk3: '所以本周只做一件事：给正门加坡道。实验楼、图书馆、体育馆排在后面。',
    formTitle: '上报这一处',
    formWhere: '位置',
    formName: '地点名称',
    formNamePh: '例如：实验楼东门台阶',
    formType: '是什么问题',
    formNote: '给下一个人的说明',
    formNotePh: '只有台阶，轮椅上不去，请走一楼。',
    formPhoto: '照片（可以不传）',
    cancel: '取消',
    save: '保存',
    verdict: {
      elevator: '电梯用不了',
      blocked: '现在进不去',
      enter: '可以进入',
      repaired: '已经修好',
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

export function displayPin(pin: AccessPin, lang: Lang): { title: string; note: string; affects?: string } {
  return seedCopy[pin.id]?.[lang] ?? { title: pin.title, note: pin.note, affects: pin.affects }
}

export function verdictLabel(pin: AccessPin, lang: Lang): string {
  return t(lang).verdict[placeVerdict(pin).key]
}

export function pinGlyph(pin: AccessPin, lang: Lang): string {
  const verdict = placeVerdict(pin)
  if (verdict.ok) return lang === 'zh' ? '通' : 'OK'
  if (pin.type === 'stairs') return lang === 'zh' ? '阶' : 'ST'
  if (pin.type === 'no_ramp') return lang === 'zh' ? '坡' : 'NR'
  if (pin.type === 'elevator_broken') return lang === 'zh' ? '梯' : 'EL'
  return lang === 'zh' ? '阻' : 'NO'
}
