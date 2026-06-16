import { 获取图片展示地址, 获取图片资源文本地址 } from './imageAssets';

export const 提取人物头像图片记录 = (person: any): any | null => {
    const archive = person?.图片档案 && typeof person.图片档案 === 'object' ? person.图片档案 : {};
    const history = Array.isArray(archive?.生图历史) ? archive.生图历史 : [];
    const recent = archive?.最近生图结果 || person?.最近生图结果;
    const records = [...history, recent].filter(Boolean);
    const selectedAvatarId = typeof archive?.已选头像图片ID === 'string' ? archive.已选头像图片ID.trim() : '';
    const selected = selectedAvatarId ? records.find((item) => item?.id === selectedAvatarId) : null;
    return selected
        || records.find((item) => item?.构图 === '头像' && item?.状态 === 'success' && (item?.本地路径 || item?.图片URL || 获取图片展示地址(item)))
        || records.find((item) => item?.构图 === '立绘' && item?.状态 === 'success' && (item?.本地路径 || item?.图片URL || 获取图片展示地址(item)))
        || null;
};

export const 提取人物头像资源引用 = (person: any): string => {
    const avatar = 提取人物头像图片记录(person);
    return String(avatar?.本地路径 || avatar?.图片URL || person?.头像图片URL || '').trim();
};

export const 提取人物头像地址 = (person: any): string => {
    const avatar = 提取人物头像图片记录(person);
    return 获取图片展示地址(avatar) || 获取图片资源文本地址(person?.头像图片URL);
};
