import { type Language } from "@/lib/ism-data";

export function getHomeCopy(lang: Language, totalIndexedEntries: number) {
  if (lang === "en") {
    return {
      title: "Ismism Encyclopedia",
      subtitle: "Philosophical Coordinate Navigator",
      introTitle: "Overview",
      introText:
        "You can start from top-level overview entries (such as 1, 2), then drill down via layered coordinate selection. The index supports depth 1 to 4.",
      whatIs: "What is Ismism?",
      start: "Start Layered Navigation",
      latest: "Continue Last Entry",
      readingRecords: "Reading Records",
      readProgress: "Read Progress",
      noReadYet: "No entries marked as read yet",
      indexed: `${totalIndexedEntries} indexed entries`,
      language: "Language",
      matrixTitle: "4x4 Entry Grid",
      matrixHelp: "Fixed dimensions: Field + Teleology; grid axes: Ontology (rows) x Epistemology (cols)",
      noEntry: "No entry",
      field: "Field",
      ontology: "Ontology",
      epistemology: "Epistemology",
      teleology: "Teleology",
      resetOrigin: "Reset Origin",
      viewXY: "XY",
      viewXZ: "XZ",
      viewYZ: "YZ",
      rotateHint: "Drag cube to rotate, click a tile to open entry.",
      availableField: "Available Field values",
      teleologyCard: "i-Dimension Teleology (Click to Enter)",
    };
  }

  return {
    title: "主义主义百科",
    subtitle: "哲学坐标导航系统",
    introTitle: "总体介绍",
    introText:
      "你可以先阅读总纲条目（如 1、2），再进入分层坐标选择。现在系统支持 1 级到 4 级全部条目。",
    whatIs: "什么是主义主义？",
    start: "进入分层导航",
    latest: "继续上次条目",
    readingRecords: "阅读记录",
    readProgress: "阅读进度",
    noReadYet: "还没有已阅读词条",
    indexed: `已索引 ${totalIndexedEntries} 个主义`,
    language: "语言",
    matrixTitle: "4x4 网格词条面板",
    matrixHelp: "当前固定：场域论 + 目的论；网格坐标：本体论(行) x 认识论(列)",
    noEntry: "未收录",
    field: "场域论",
    ontology: "本体论",
    epistemology: "认识论",
    teleology: "目的论",
    resetOrigin: "坐标原点复位",
    viewXY: "XY 面",
    viewXZ: "XZ 面",
    viewYZ: "YZ 面",
    rotateHint: "拖拽魔方可旋转，点击格子进入词条。",
    availableField: "场域论可用值",
    teleologyCard: "i 维度目的论（点击进入）",
  };
}

export function getStepSelectorCopy(lang: Language, step: number) {
  if (lang === "en") {
    return {
      title: "Layered Coordinate Selection",
      progress: `Step ${step} / 4`,
      chosen: "Current coordinate",
      next: step === 4 ? "Continue to entry" : "Continue",
      back: "Back",
      home: "Home",
      openCurrent: "Open current-level entry",
      openAtStep: "Open entry at this level",
    };
  }

  return {
    title: "分层坐标选择",
    progress: `第 ${step} / 4 步`,
    chosen: "当前坐标",
    next: step === 4 ? "继续进入条目" : "继续下一步",
    back: "上一步",
    home: "返回主页",
    openCurrent: "打开当前层级条目",
    openAtStep: "在该层级打开条目",
  };
}

export function getEntryCopy(lang: Language) {
  if (lang === "en") {
    return {
      breadcrumbs: "Breadcrumbs",
      search: "Omni-Search",
      searchPlaceholder: "Search title or code, e.g. 1-1 or 1-2-1-4",
      nearby: "Nearby Isms",
      markRead: "Mark as read",
      markedRead: "Marked as read",
      selector: "Coordinate Selector",
      changeCoordinate: "Change coordinate",
      home: "Home",
    };
  }

  return {
    breadcrumbs: "面包屑路径",
    search: "全局搜索",
    searchPlaceholder: "按标题或坐标搜索，例如 1-1 或 1-2-1-4",
    nearby: "附近主义",
    markRead: "标记已阅读",
    markedRead: "已阅读",
    selector: "坐标选择器",
    changeCoordinate: "修改坐标",
    home: "主页",
  };
}
