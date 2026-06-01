export type 云端游玩存储模式值 = 'tg' | 'object' | 'local';

export const 云端游玩会话存储键 = 'moranjianghu.cloudPlay.session.v1';
export const 云端游玩对象存储模式键 = 'moranjianghu.cloudPlay.objectStorageMode.v1';

const 读取本地存储 = (key: string): string => {
    if (typeof localStorage === 'undefined') return '';
    try {
        return localStorage.getItem(key) || '';
    } catch {
        return '';
    }
};

const 写入本地存储 = (key: string, value: string): void => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // 存储模式只是本地运行状态，写入失败时不阻断主流程。
    }
};

const 删除本地存储 = (key: string): void => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
};

export const 读取云端游玩原始存储模式 = (): string => 读取本地存储(云端游玩对象存储模式键);

export const 写入云端游玩存储模式 = (mode: 云端游玩存储模式值): void => {
    写入本地存储(云端游玩对象存储模式键, mode);
};

export const 清除云端游玩存储模式 = (): void => {
    删除本地存储(云端游玩对象存储模式键);
};

export const 当前为对象存储云端游玩模式 = (): boolean => 读取云端游玩原始存储模式() === 'object';
