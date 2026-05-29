import React, { useMemo, useState } from 'react';
import { 详细门派结构, 职位等级排序 } from '../../../models/sect';

interface Props {
    sectData: 详细门派结构;
    onClose: () => void;
    onOpenNpc?: (npc: any) => void;
    onLearnBook?: (book: any) => void;
    learnedBookIds?: string[];
}

type Tab = 'hall' | 'exchange' | 'library' | 'members';
type RankStep = { rank: string; lvl: number; required: number; discount: number; perks: string[] };

const 古风晋升梯队: RankStep[] = [
    { rank: '杂役弟子', lvl: 1, required: 0, discount: 0, perks: ['基础任务', '入门补给'] },
    { rank: '外门弟子', lvl: 2, required: 100, discount: 0.05, perks: ['藏经阁入门典籍', '聚宝阁九五折'] },
    { rank: '内门弟子', lvl: 3, required: 350, discount: 0.1, perks: ['进阶典籍', '聚宝阁九折'] },
    { rank: '真传弟子', lvl: 4, required: 900, discount: 0.15, perks: ['真传典籍优先', '聚宝阁八五折'] },
    { rank: '执事', lvl: 5, required: 1600, discount: 0.18, perks: ['执事任务', '聚宝阁八二折'] },
    { rank: '长老', lvl: 6, required: 3200, discount: 0.22, perks: ['高阶典籍调阅', '聚宝阁七八折'] },
    { rank: '副掌门', lvl: 7, required: 6500, discount: 0.26, perks: ['门派要务', '聚宝阁七四折'] },
    { rank: '掌门', lvl: 8, required: 12000, discount: 0.3, perks: ['全阁调阅', '聚宝阁七折'] }
];

const 末日晋升梯队: RankStep[] = [
    { rank: '营地成员', lvl: 1, required: 0, discount: 0, perks: ['基础配给', '公共训练'] },
    { rank: '营地骨干', lvl: 2, required: 150, discount: 0.06, perks: ['分工权限', '物资库九四折'] },
    { rank: '营地管理人员', lvl: 3, required: 600, discount: 0.12, perks: ['行动排班', '训练资料优先'] },
    { rank: '营地核心管理', lvl: 4, required: 1600, discount: 0.18, perks: ['库存调阅', '路线权限'] },
    { rank: '营地统治者', lvl: 5, required: 4200, discount: 0.25, perks: ['据点决策', '全库调配'] }
];

const 末日旧职位映射: Record<string, string> = {
    外勤成员: '营地骨干',
    搜救队员: '营地骨干',
    安全骨干: '营地管理人员',
    指挥骨干: '营地管理人员',
    副负责人: '营地核心管理',
    负责人: '营地统治者'
};

const 现代晋升梯队: RankStep[] = [
    { rank: '成员', lvl: 1, required: 0, discount: 0, perks: ['基础事务', '公共资料'] },
    { rank: '外勤成员', lvl: 2, required: 100, discount: 0.05, perks: ['外勤事项', '资源库九五折'] },
    { rank: '专业骨干', lvl: 3, required: 350, discount: 0.1, perks: ['专项资料', '资源库九折'] },
    { rank: '项目骨干', lvl: 4, required: 900, discount: 0.15, perks: ['项目权限', '培训优先'] },
    { rank: '协调负责人', lvl: 5, required: 1600, discount: 0.18, perks: ['资源协调', '预算建议'] },
    { rank: '负责人', lvl: 6, required: 3200, discount: 0.22, perks: ['关键决策', '资源调配'] }
];

const 获取组织显示文案 = (sectData: 详细门派结构) => {
    const text = JSON.stringify(sectData || {});
    const isApocalypse = /末日|丧尸|营地|避难|安全点|据点|车队|搜救|医疗维修|后勤|巡逻|物资|燃油|口粮|弹药|尸群/u.test(text);
    const isModern = !isApocalypse && /现代|都市|公司|项目组|事务所|社区中心|门店|合作团队|合同|客户|技术成员|行政联系人|培训|手机|电脑/u.test(text);
    if (isModern) {
        return {
            tabs: { hall: '组织', exchange: '资源', library: '资料', members: '成员' },
            organizationPower: '组织能力',
            memberCount: '成员',
            principle: '组织准则',
            rules: '守则',
            rankPath: '岗位晋升',
            contribution: '组织信用',
            capabilitySuffix: '',
            exchangeName: '资源库',
            rankLadder: 现代晋升梯队,
            rankMap: {} as Record<string, string>
        };
    }
    if (!isApocalypse) {
        return {
            tabs: { hall: '宗门', exchange: '兑换', library: '藏经', members: '同门' },
            organizationPower: '门派实力',
            memberCount: '弟子',
            principle: '宗门宗旨',
            rules: '戒律',
            rankPath: '晋升之路',
            contribution: '贡献点',
            capabilitySuffix: '',
            exchangeName: '聚宝阁',
            rankLadder: 古风晋升梯队,
            rankMap: {} as Record<string, string>
        };
    }
    return {
        tabs: { hall: '据点', exchange: '物资', library: '资料', members: '成员' },
        organizationPower: '据点能力',
        memberCount: '成员',
        principle: '据点准则',
        rules: '守则',
        rankPath: '分工晋升',
        contribution: '贡献点',
        capabilitySuffix: '能力值',
        exchangeName: '物资库',
        rankLadder: 末日晋升梯队,
        rankMap: 末日旧职位映射
    };
};

const MobileSect: React.FC<Props> = ({ sectData, onClose, onOpenNpc, onLearnBook, learnedBookIds = [] }) => {
    const [activeTab, setActiveTab] = useState<Tab>('hall');
    const 文案 = useMemo(() => 获取组织显示文案(sectData), [sectData]);
    const 显示职位 = (rank?: string) => 文案.rankMap[String(rank || '').trim()] || rank || '无';
    const 累计贡献 = Math.max(sectData.玩家贡献 || 0, sectData.累计贡献 || 0);
    const 当前职位名称 = 显示职位(sectData.玩家职位);
    const 当前职位步骤 = 文案.rankLadder.find((item) => item.rank === 当前职位名称)
        || [...文案.rankLadder].reverse().find((item) => 累计贡献 >= item.required)
        || 文案.rankLadder[0];
    const 当前折扣 = 当前职位步骤?.discount || 0;
    const 计算折后贡献 = (price: number) => Math.max(1, Math.ceil(price * (1 - 当前折扣)));
    const 取职位等级 = (rank?: string) => {
        const normalizedRank = 显示职位(rank);
        return 文案.rankLadder.find((item) => item.rank === normalizedRank)?.lvl ?? 职位等级排序[rank || ''] ?? 0;
    };
    const 职位可达 = (requiredRank?: string) => 取职位等级(sectData.玩家职位) >= 取职位等级(requiredRank || 文案.rankLadder[0]?.rank);
    const 战力分布 = sectData.战力分布 && typeof sectData.战力分布 === 'object' ? sectData.战力分布 : {};

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3 md:hidden animate-fadeIn">
            <div className="bg-ink-black/95 border border-wuxia-gold/30 w-full max-w-[620px] h-[86vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-2xl">
                <div className="h-12 shrink-0 border-b border-gray-800/60 bg-black/40 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-wuxia-gold/10 border border-wuxia-gold/50 rounded-full flex items-center justify-center text-base font-serif font-bold text-wuxia-gold">
                            {sectData.名称[0]}
                        </div>
                        <div>
                            <div className="text-wuxia-gold font-serif font-bold text-base">{sectData.名称}</div>
                            <div className="text-[9px] text-gray-500 font-mono">{显示职位(sectData.玩家职位)}</div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-gray-700 text-gray-400 hover:text-wuxia-red hover:border-wuxia-red transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="border-b border-gray-800/60 bg-black/30 px-3 py-2 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {[
                            { id: 'hall', label: 文案.tabs.hall },
                            { id: 'exchange', label: 文案.tabs.exchange },
                            { id: 'library', label: 文案.tabs.library },
                            { id: 'members', label: 文案.tabs.members },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`px-3 py-1.5 text-[11px] rounded-full border transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-wuxia-gold bg-wuxia-gold/10 text-wuxia-gold'
                                        : 'border-gray-800 text-gray-400 bg-black/20'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-ink-wash/5">
                    {activeTab === 'hall' && (
                        <>
                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                <div className="flex justify-between text-[11px] text-gray-400">
                                    <span>资金 <span className="text-gray-200">{sectData.门派资金}</span></span>
                                    <span>物资 <span className="text-gray-200">{sectData.门派物资}</span></span>
                                    <span>建设 <span className="text-gray-200">{sectData.建设度}</span></span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="text-[10px] text-gray-500">{文案.contribution}</div>
                                    <div className="text-wuxia-gold font-mono font-bold">{sectData.玩家贡献}</div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {(当前职位步骤?.perks || []).map(item => (
                                        <span key={item} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-gray-300">{item}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] text-wuxia-gold/70 tracking-[0.3em] mb-3">{文案.organizationPower}</div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded border border-cyan-400/20 bg-cyan-950/15 p-2 text-cyan-100">等级：{sectData.门派等级 || '待评定'}</div>
                                    <div className="rounded border border-white/10 bg-black/25 p-2 text-gray-200">规模：{sectData.门派规模 || '待记录'}</div>
                                    <div className="rounded border border-white/10 bg-black/25 p-2 text-gray-200">{文案.memberCount}：{sectData.弟子总数 || 0}</div>
                                    <div className="rounded border border-wuxia-gold/20 bg-wuxia-gold/5 p-2 text-wuxia-gold">财富：{sectData.财富评级 || '待评估'}</div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {Object.entries(战力分布).map(([key, value]) => (
                                        <span key={key} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-gray-300">{key} {Number(value || 0)}{文案.capabilitySuffix ? ` ${文案.capabilitySuffix}` : ''}</span>
                                    ))}
                                </div>
                                {sectData.月俸规则 && (
                                    <div className="mt-3 rounded border border-emerald-400/20 bg-emerald-950/15 p-2 text-[10px] leading-5 text-emerald-100">
                                        月俸：基础 {sectData.月俸规则.基础俸禄}，贡献系数 {sectData.月俸规则.贡献系数}，规模系数 {sectData.月俸规则.规模系数}。
                                    </div>
                                )}
                            </div>

                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] text-wuxia-gold/70 tracking-[0.3em] mb-2">{文案.principle}</div>
                                <p className="text-sm text-gray-300 font-serif leading-relaxed">“{sectData.简介}”</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {sectData.门规.map((rule, i) => (
                                        <span key={i} className="text-[10px] bg-red-950/30 text-red-300 border border-red-900/50 px-2 py-1 rounded">
                                            {文案.rules}{i + 1}: {rule}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] text-wuxia-gold/70 tracking-[0.3em] mb-2">{文案.rankPath}</div>
                                <div className="space-y-2">
                                    {文案.rankLadder
                                        .map(({ rank, lvl }) => {
                                            const currentLvl = 当前职位步骤?.lvl || 0;
                                            if (lvl > currentLvl + 2 || lvl < currentLvl - 1) return null;
                                            const isCurrent = rank === 当前职位名称;
                                            const isPassed = lvl < currentLvl;
                                            return (
                                                <div key={rank} className="flex items-center gap-3 text-[11px]">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] border ${
                                                        isCurrent ? 'bg-wuxia-gold text-black border-wuxia-gold' :
                                                        isPassed ? 'bg-gray-700 text-gray-400 border-gray-600' : 'border-gray-600 text-gray-500'
                                                    }`}>
                                                        {lvl}
                                                    </div>
                                                    <span className={isCurrent ? 'text-wuxia-gold' : 'text-gray-400'}>{显示职位(rank)}</span>
                                                    {isCurrent && <span className="text-[9px] text-wuxia-gold border border-wuxia-gold px-2 rounded">当前</span>}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'exchange' && (
                        <div className="grid grid-cols-2 gap-3">
                            {sectData.兑换列表.map(good => {
                                const discountedPrice = 计算折后贡献(good.兑换价格);
                                return (
                                    <div key={good.id} className="bg-black/40 border border-gray-800 rounded-xl p-3 space-y-2">
                                        <div className="text-sm text-gray-200 font-bold">{good.物品名称}</div>
                                        <div className="text-[10px] text-gray-500">要求 {显示职位(good.要求职位)}</div>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-wuxia-gold font-mono">{discountedPrice} 贡献</span>
                                            <span className="text-gray-500">库存 {good.库存}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'library' && (
                        <div className="space-y-3">
                            {(sectData.藏经阁列表 || []).map(book => {
                                const canRead = 职位可达(book.要求职位) && 累计贡献 >= book.要求累计贡献;
                                const alreadyLearned = learnedBookIds.includes(book.id);
                                const canLearn = canRead && !alreadyLearned;
                                return (
                                    <div key={book.id} className="bg-black/40 border border-gray-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm text-gray-200 font-bold">{book.名称}</div>
                                                <div className="text-[10px] text-gray-500 mt-1">{book.类型} · {book.品阶}</div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${alreadyLearned ? 'border-gray-600 text-gray-300' : canRead ? 'border-emerald-400/40 text-emerald-200' : 'border-gray-700 text-gray-400'}`}>
                                                {alreadyLearned ? '已学习' : canRead ? '可学' : '未达标'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-5">{book.简介}</p>
                                        <button
                                            type="button"
                                            disabled={!canLearn}
                                            onClick={() => onLearnBook?.(book)}
                                            className={`w-full rounded px-3 py-2 text-[11px] font-bold ${canLearn ? 'border border-wuxia-gold bg-wuxia-gold/15 text-wuxia-gold' : 'border border-gray-700 bg-gray-900 text-gray-400'}`}
                                        >
                                            {alreadyLearned ? '已学习' : '学习'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="space-y-3">
                            {sectData.重要成员.map(mem => (
                                <button key={mem.id} type="button" onClick={() => onOpenNpc?.(mem)} className="w-full text-left bg-black/40 border border-gray-800 rounded-xl p-4 flex items-start gap-3 hover:border-wuxia-gold/40">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border shrink-0 ${
                                        mem.性别 === '女' ? 'border-pink-900 bg-pink-900/10 text-pink-500' : 'border-blue-900 bg-blue-900/10 text-blue-500'
                                    }`}>
                                        {mem.姓名[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-200 font-bold">{mem.姓名}</span>
                                            <span className="text-[9px] text-wuxia-gold bg-wuxia-gold/10 px-2 py-0.5 rounded border border-wuxia-gold/20">{mem.身份}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">{mem.性别} · {mem.年龄}岁 · {mem.境界}</div>
                                        <p className="text-[11px] text-gray-400 mt-2">“{mem.简介}”</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileSect;
