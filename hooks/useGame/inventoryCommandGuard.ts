import { normalizeStateCommandKey } from '../../utils/stateHelpers';

const inventoryRemovalTriggerRegex = /(清空背包|全部丢弃|全都丢弃|尽数丢弃|丢弃|扔掉|遗弃|卖出|售卖|出售|卖给|卖了|卖掉|上架|典当|赠予|交给|交出|消耗|耗尽|用掉|用完|服用|吃下|喝下|炼化|损坏|毁坏|破碎|烧毁|遗失|失落|掉落|被夺|夺走|抢走|没收|搜走|放下|移除背包|从背包移除)/;
const negatedInventoryRemovalRegex = /(并未|未曾|未|没有|并没有|不曾|无意|并无|未进行|没有进行|没有发生|并未发生)[^。！？\n]{0,12}(清空背包|全部丢弃|全都丢弃|尽数丢弃|丢弃|扔掉|遗弃|卖出|售卖|出售|卖给|卖了|卖掉|上架|典当|赠予|交给|交出|消耗|耗尽|用掉|用完|服用|吃下|喝下|炼化|损坏|毁坏|破碎|烧毁|遗失|失落|掉落|被夺|夺走|抢走|没收|搜走|放下|移除背包|从背包移除)/;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isObject = (value: unknown): value is Record<string, any> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const readItems = (character: any): any[] => (
    Array.isArray(character?.物品列表) ? character.物品列表 : []
);

const isUsableInventoryList = (value: unknown): value is any[] => (
    Array.isArray(value) && value.length > 0
);

export const hasInventoryRemovalTrigger = (command: any, factText = ''): boolean => {
    const commandText = [
        command?.key,
        typeof command?.value === 'string' ? command.value : '',
        typeof command?.reason === 'string' ? command.reason : '',
        typeof command?.原因 === 'string' ? command.原因 : '',
        typeof command?.说明 === 'string' ? command.说明 : '',
        factText
    ].filter(Boolean).join('\n');
    return inventoryRemovalTriggerRegex.test(commandText) && !negatedInventoryRemovalRegex.test(commandText);
};

export const preserveInventoryOnUnsafeRoleReplace = (nextCharacter: any, currentCharacter: any): any => {
    const currentItems = readItems(currentCharacter);
    if (currentItems.length === 0 || !isObject(nextCharacter)) return nextCharacter;
    if (!isUsableInventoryList(nextCharacter.物品列表)) {
        return { ...nextCharacter, 物品列表: clone(currentItems) };
    }
    return nextCharacter;
};

export const sanitizeInventoryCommand = (
    command: any,
    currentCharacter: any,
    factText = ''
): any | null => {
    const normalizedKey = normalizeStateCommandKey(typeof command?.key === 'string' ? command.key : '');
    if (!normalizedKey.startsWith('gameState.角色')) return command;

    const currentItems = readItems(currentCharacter);
    if (currentItems.length === 0 || hasInventoryRemovalTrigger(command, factText)) return command;

    const action = (command?.action || 'set') as string;
    if (normalizedKey === 'gameState.角色') {
        if (action === 'delete') return null;
        if (isObject(command?.value)) {
            const valueHasInventory = Object.prototype.hasOwnProperty.call(command.value, '物品列表');
            if (!valueHasInventory || !isUsableInventoryList(command.value.物品列表)) {
                return { ...command, value: { ...command.value, 物品列表: clone(currentItems) } };
            }
        }
        return command;
    }

    const inventoryPrefix = 'gameState.角色.物品列表';
    if (normalizedKey === inventoryPrefix || normalizedKey.startsWith(`${inventoryPrefix}.`) || normalizedKey.startsWith(`${inventoryPrefix}[`)) {
        if (action === 'delete') return null;
        if (action === 'set' && !isUsableInventoryList(command?.value)) return null;
    }

    return command;
};
