export const internalTools = {
  traval: {
    href: "/traval",
    createdAt: "2026-11-19T23:17:25+08:00",
    zh: { name: "Traval", description: "点亮去过的国家，记录在中国各地居住、工作、上学和旅行的经历。" },
    en: { name: "Traval", description: "Mark the countries you’ve visited and the places you’ve lived, worked, studied and travelled in China." },
  },
  questions: {
    href: "/ask",
    createdAt: "2026-11-04T01:44:02+08:00",
    zh: { name: "安静提问", description: "写下问题，把手机递给对方，安静地聊一聊。历史记录保存在当前设备。" },
    en: { name: "Quiet questions", description: "Write a question and pass your phone for a quiet conversation. Your history stays on this device." },
  },
} as const;

export type InternalTool = keyof typeof internalTools;
