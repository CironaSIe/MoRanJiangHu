export interface 战斗敌方信息 {
    名字: string;
    境界: string;
    简介: string;
    技能: string[];
    力量?: number;
    敏捷?: number;
    体质?: number;
    根骨?: number;
    悟性?: number;
    福源?: number;
    境界层级?: number;
    战斗力: number;
    防御力: number;
    当前血量: number;
    最大血量: number;
    当前精力: number;
    最大精力: number;
    当前内力: number;
    最大内力: number;
}

export interface 战斗状态结构 {
    是否战斗中: boolean;
    敌方: 战斗敌方信息[];
}
