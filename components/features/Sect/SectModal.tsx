
import React, { useEffect, useMemo, useState } from 'react';
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
            hall: '组织总览',
            exchange: '资源库',
            library: '资料库',
            members: '成员名录',
            rankPath: '岗位晋升',
            contribution: '组织信用',
            organizationPower: '组织能力',
            memberCount: '成员',
            capabilitySuffix: '',
            rules: '守则',
            principle: '组织准则',
            exchangeHint: '信用额度足够即可申领。申领消耗当前信用，不影响晋升所需的累计信用。',
            spendHint: '晋升只看累计生成过的信用，资源库申领只消耗当前可用信用。',
            rankLadder: 现代晋升梯队,
            rankMap: {} as Record<string, string>
        };
    }
    if (!isApocalypse) {
        return {
            hall: '宗门大殿',
            exchange: '聚宝阁',
            library: '藏经阁',
            members: '同门名录',
            rankPath: '晋升之路',
            contribution: '贡献点',
            organizationPower: '门派实力',
            memberCount: '弟子',
            capabilitySuffix: '',
            rules: '戒律',
            principle: '宗门宗旨',
            exchangeHint: '贡献点足够即可兑换。兑换消耗当前贡献，不影响晋升所需的累计贡献。',
            spendHint: '晋升只看累计生成过的贡献点，聚宝阁兑换只消耗当前可用贡献。',
            rankLadder: 古风晋升梯队,
            rankMap: {} as Record<string, string>
        };
    }
    return {
        hall: '据点总览',
        exchange: '物资库',
        library: '资料库',
        members: '成员名录',
        rankPath: '分工晋升',
        contribution: '贡献点',
        organizationPower: '据点能力',
        memberCount: '成员',
        capabilitySuffix: '能力值',
        rules: '守则',
        principle: '据点准则',
        exchangeHint: '营地贡献足够即可领取物资。领取消耗当前贡献，不影响分工晋升所需的累计贡献。',
        spendHint: '晋升只看累计贡献，物资库领取只消耗当前可用贡献。',
        rankLadder: 末日晋升梯队,
        rankMap: 末日旧职位映射
    };
};

const SectModal: React.FC<Props> = ({ sectData, onClose, onOpenNpc, onLearnBook, learnedBookIds = [] }) => {
    const [activeTab, setActiveTab] = useState<Tab>('hall');
    const 文案 = useMemo(() => 获取组织显示文案(sectData), [sectData]);
    const 显示职位 = (rank?: string) => 文案.rankMap[String(rank || '').trim()] || rank || '无';
    const 未加入门派 = !sectData
        || ['none', '无', '无门无派', '未加入', '散人'].includes(String(sectData.ID || '').trim())
        || ['none', '无', '无门无派', '未加入', '散人'].includes(String(sectData.名称 || '').trim())
        || ['none', '无', '无门无派', '未加入', '散人'].includes(String(sectData.玩家职位 || '').trim());
    const tabs = useMemo(() => (
        未加入门派
            ? [{ id: 'hall' as Tab, label: 文案.hall }]
            : [
                { id: 'hall' as Tab, label: 文案.hall },
                { id: 'exchange' as Tab, label: 文案.exchange },
                { id: 'library' as Tab, label: 文案.library },
                { id: 'members' as Tab, label: 文案.members },
            ]
    ), [未加入门派, 文案]);

    useEffect(() => {
        if (未加入门派 && activeTab !== 'hall') {
            setActiveTab('hall');
        }
    }, [activeTab, 未加入门派]);

    const 累计贡献 = Math.max(sectData.玩家贡献 || 0, sectData.累计贡献 || 0);
    const 当前职位名称 = 显示职位(sectData.玩家职位);
    const 当前职位步骤 = 文案.rankLadder.find((item) => item.rank === 当前职位名称)
        || [...文案.rankLadder].reverse().find((item) => 累计贡献 >= item.required)
        || 文案.rankLadder[0];
    const 当前折扣 = 当前职位步骤?.discount || 0;
    const 当前折扣文本 = 当前折扣 > 0 ? `${Math.round((1 - 当前折扣) * 100)}折` : '无折扣';
    const 计算折后贡献 = (price: number) => Math.max(1, Math.ceil(price * (1 - 当前折扣)));
    const 取职位等级 = (rank?: string) => {
        const normalizedRank = 显示职位(rank);
        return 文案.rankLadder.find((item) => item.rank === normalizedRank)?.lvl ?? 职位等级排序[rank || ''] ?? 0;
    };
    const 职位可达 = (requiredRank?: string) => 取职位等级(sectData.玩家职位) >= 取职位等级(requiredRank || 文案.rankLadder[0]?.rank);
    const 战力分布 = sectData.战力分布 && typeof sectData.战力分布 === 'object' ? sectData.战力分布 : {};
    const 月俸规则 = sectData.月俸规则;

    return (
        <div className="sect-modal-body fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] hidden md:flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-ink-black/95 border border-wuxia-gold/30 w-full max-w-6xl h-[700px] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden rounded-2xl">
                
                {/* --- Header --- */}
                <div className="h-20 shrink-0 border-b border-gray-800/50 bg-black/40 flex items-center justify-between px-8 relative z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-wuxia-gold/10 border border-wuxia-gold/50 rounded-full flex items-center justify-center text-2xl font-serif font-bold text-wuxia-gold shadow-[0_0_15px_rgba(230,200,110,0.2)]">
                            {sectData.名称[0]}
                        </div>
                        <div>
                            <h3 className="text-wuxia-gold font-serif font-bold text-2xl tracking-[0.2em]">{sectData.名称}</h3>
                            <div className="flex gap-4 text-xs text-gray-500 font-mono mt-1">
                                <span>资金: <span className="text-gray-300">{sectData.门派资金}</span></span>
                                <span>物资: <span className="text-gray-300">{sectData.门派物资}</span></span>
                                <span>建设: <span className="text-gray-300">{sectData.建设度}</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-widest">身份</div>
                            <div className="text-wuxia-cyan font-bold font-serif text-lg">{显示职位(sectData.玩家职位)}</div>
                        </div>
                        <div className="text-right border-l border-gray-700 pl-6">
                            <div className="text-xs text-gray-500 uppercase tracking-widest">{文案.contribution}</div>
                            <div className="text-wuxia-gold font-bold font-mono text-xl">{sectData.玩家贡献}</div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-gray-700 text-gray-400 hover:text-wuxia-red hover:border-wuxia-red transition-all ml-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Sidebar Navigation */}
                    <div className="w-64 bg-black/20 border-r border-gray-800/50 flex flex-col py-6 gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`px-8 py-4 text-left font-serif font-bold tracking-widest transition-all text-sm ${
                                    activeTab === tab.id 
                                    ? 'text-wuxia-gold bg-wuxia-gold/5 border-l-4 border-wuxia-gold' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-4 border-transparent'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-ink-wash/5 relative overflow-y-auto custom-scrollbar p-8">
                        
                        {/* --- HALL (Overview) --- */}
                        {activeTab === 'hall' && (
                            <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
                                {未加入门派 ? (
                                    <div className="bg-black/30 border border-gray-700 p-8 rounded-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 text-[120px] font-serif leading-none pointer-events-none">散</div>
                                        <h4 className="text-wuxia-gold font-bold text-lg mb-4 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-wuxia-gold"></span>
                                            尚未加入组织
                                        </h4>
                                        <p className="text-gray-300 font-serif leading-loose text-lg indent-8">
                                            当前仍是自由行动者，暂无晋升、贡献、{文案.library}、{文案.exchange}和{文案.members}。加入组织后，这里才会显示对应事务。
                                        </p>
                                    </div>
                                ) : (
                                <>
                                <div className="bg-black/30 border border-gray-700 p-8 rounded-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-[120px] font-serif leading-none pointer-events-none">宗</div>
                                    <h4 className="text-wuxia-gold font-bold text-lg mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-wuxia-gold"></span>
                                        {文案.principle}
                                    </h4>
                                    <p className="text-gray-300 font-serif leading-loose text-lg indent-8">
                                        “{sectData.简介}”
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-4">
                                        {sectData.门规.map((rule, i) => (
                                            <span key={i} className="text-xs bg-red-950/30 text-red-300 border border-red-900/50 px-3 py-1 rounded">
                                                {文案.rules}{i+1}: {rule}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                     <div className="bg-black/30 border border-gray-700 p-6 rounded-lg">
                                        <h4 className="text-gray-100 font-bold text-sm uppercase tracking-widest mb-4">{文案.rankPath}</h4>
                                        <div className="space-y-4 relative">
                                            {文案.rankLadder.map(({ rank, lvl, required, perks }) => {
                                                const currentLvl = 当前职位步骤?.lvl || 0;
                                                const isCurrent = rank === 当前职位名称;
                                                const isPassed = lvl < currentLvl;
                                                const contributionReady = 累计贡献 >= required;

                                                if (lvl > currentLvl + 2 || lvl < currentLvl - 1) return null;

                                                return (
                                                    <div key={rank} className={`flex items-center gap-4 ${isCurrent ? 'opacity-100' : contributionReady ? 'opacity-85' : 'opacity-60'}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border ${
                                                            isCurrent ? 'bg-wuxia-gold text-black border-wuxia-gold' : 
                                                            isPassed ? 'bg-gray-700 text-gray-100 border-gray-600' : contributionReady ? 'border-emerald-400 text-emerald-100' : 'border-gray-600 text-gray-200'
                                                        }`}>
                                                            {lvl}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className={`font-bold ${isCurrent ? 'text-wuxia-gold' : 'text-gray-100'}`}>{显示职位(rank)}</div>
                                                            <div className="mt-1 text-xs text-gray-200">累计贡献 {累计贡献} / {required}</div>
                                                            <div className="mt-1 text-[11px] text-gray-400">
                                                                {perks.join(' · ') || '暂无特权'}
                                                            </div>
                                                        </div>
                                                        {isCurrent && <span className="text-xs text-wuxia-gold border border-wuxia-gold px-2 rounded">当前</span>}
                                                        {!isCurrent && contributionReady && <span className="text-xs text-emerald-200 border border-emerald-400/50 px-2 rounded">贡献达标</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                     </div>
                                     <div className="bg-black/30 border border-gray-700 p-6 rounded-lg">
                                          <h4 className="text-gray-100 font-bold text-sm uppercase tracking-widest mb-4">{文案.contribution}总览</h4>
                                         <div className="grid grid-cols-2 gap-3 text-sm">
                                             <div className="rounded border border-wuxia-gold/20 bg-wuxia-gold/5 p-4">
                                                 <div className="text-gray-200">可用贡献</div>
                                                 <div className="mt-2 text-2xl font-mono font-bold text-wuxia-gold">{sectData.玩家贡献}</div>
                                             </div>
                                             <div className="rounded border border-emerald-400/20 bg-emerald-950/20 p-4">
                                                 <div className="text-gray-200">累计贡献</div>
                                                 <div className="mt-2 text-2xl font-mono font-bold text-emerald-200">{累计贡献}</div>
                                             </div>
                                         </div>
                                          <p className="mt-4 text-sm leading-6 text-gray-200">{文案.spendHint}</p>
                                          <div className="mt-4 rounded border border-wuxia-gold/20 bg-black/25 p-3">
                                             <div className="text-xs tracking-widest text-wuxia-gold/70">当前身份特权</div>
                                             <div className="mt-2 text-sm text-gray-100">{显示职位(sectData.玩家职位)} · {文案.exchange}{当前折扣文本}</div>
                                             <div className="mt-2 flex flex-wrap gap-2">
                                                 {(当前职位步骤?.perks || ['基础事务']).map(item => (
                                                     <span key={item} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-xs text-gray-200">{文案.rankMap[item] || item}</span>
                                                 ))}
                                              </div>
                                          </div>
                                      </div>
                                      <div className="bg-black/30 border border-gray-700 p-6 rounded-lg md:col-span-2">
                                          <h4 className="text-gray-100 font-bold text-sm uppercase tracking-widest mb-4">{文案.organizationPower}</h4>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                              <div className="rounded border border-cyan-400/20 bg-cyan-950/15 p-3">
                                                  <div className="text-gray-300">等级</div>
                                                  <div className="mt-1 font-serif text-cyan-100">{sectData.门派等级 || '待评定'}</div>
                                              </div>
                                              <div className="rounded border border-white/10 bg-black/25 p-3">
                                                  <div className="text-gray-300">规模</div>
                                                  <div className="mt-1 text-gray-100">{sectData.门派规模 || '待记录'}</div>
                                              </div>
                                              <div className="rounded border border-white/10 bg-black/25 p-3">
                                                  <div className="text-gray-300">{文案.memberCount}</div>
                                                  <div className="mt-1 font-mono text-gray-100">{sectData.弟子总数 || 0}</div>
                                              </div>
                                              <div className="rounded border border-wuxia-gold/20 bg-wuxia-gold/5 p-3">
                                                  <div className="text-gray-300">财富</div>
                                                  <div className="mt-1 text-wuxia-gold">{sectData.财富评级 || '待评估'}</div>
                                              </div>
                                          </div>
                                          <div className="mt-4 flex flex-wrap gap-2">
                                              {Object.entries(战力分布).map(([key, value]) => (
                                                  <span key={key} className="rounded border border-white/10 bg-black/30 px-2 py-1 text-xs text-gray-200">{key} {Number(value || 0)}{文案.capabilitySuffix ? ` ${文案.capabilitySuffix}` : ``}</span>
                                              ))}
                                          </div>
                                          {月俸规则 && (
                                              <div className="mt-4 rounded border border-emerald-400/20 bg-emerald-950/15 p-3 text-sm text-emerald-100">
                                                  月俸：基础 {月俸规则.基础俸禄}，贡献系数 {月俸规则.贡献系数}，规模系数 {月俸规则.规模系数}。{月俸规则.发放说明}
                                              </div>
                                          )}
                                      </div>
                                 </div>
                                </>
                                )}
                            </div>
                        )}

                        {/* --- EXCHANGE --- */}
                        {activeTab === 'exchange' && (
                             <div className="space-y-5 animate-slide-in">
                                 <div className="rounded-lg border border-wuxia-gold/20 bg-wuxia-gold/5 p-4">
                                     <div className="text-lg font-bold text-wuxia-gold">{文案.exchange}</div>
                                     <p className="mt-2 text-sm leading-6 text-gray-300">{文案.exchangeHint}</p>
                                 </div>
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                     {sectData.兑换列表.map(good => {
                                         const discountedPrice = 计算折后贡献(good.兑换价格);
                                         const canExchange = 职位可达(good.要求职位) && sectData.玩家贡献 >= discountedPrice && good.库存 > 0;
                                         return (
                                             <div key={good.id} className="bg-black/40 border border-gray-700 p-4 rounded-lg flex flex-col gap-3 group hover:border-wuxia-gold/50 transition-colors">
                                                 <div className="flex justify-between items-start">
                                                     <div className="font-bold text-gray-100">{good.物品名称}</div>
                                                     <span className="text-xs bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded">{good.类型}</span>
                                                 </div>
                                                 <div className="text-sm text-gray-200">
                                                     要求: <span className="text-gray-100">{显示职位(good.要求职位)}</span>
                                                 </div>
                                                 <div className="mt-auto pt-2 border-t border-gray-800 flex justify-between items-center">
                                                     <div className="text-wuxia-gold font-mono font-bold">
                                                         {discountedPrice} 贡献
                                                         {discountedPrice !== good.兑换价格 && (
                                                             <span className="ml-2 text-xs text-gray-400 line-through">{good.兑换价格}</span>
                                                         )}
                                                     </div>
                                                     <div className="text-xs text-gray-200">库存: {good.库存}</div>
                                                 </div>
                                                 {当前折扣 > 0 && <div className="text-[11px] text-emerald-300">身份折扣：{当前折扣文本}</div>}
                                                 <button className={`rounded px-3 py-2 text-sm font-bold transition-colors ${canExchange ? 'border border-wuxia-gold bg-wuxia-gold/15 text-wuxia-gold hover:bg-wuxia-gold hover:text-black' : 'border border-gray-700 bg-gray-900 text-gray-300 cursor-not-allowed'}`}>
                                                     {canExchange ? '可兑换' : !职位可达(good.要求职位) ? '身份不足' : '贡献不足'}
                                                 </button>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                        )}

                        {/* --- LIBRARY --- */}
                        {activeTab === 'library' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-in">
                                 {(sectData.藏经阁列表 || []).map(book => {
                                     const canRead = 职位可达(book.要求职位) && 累计贡献 >= book.要求累计贡献;
                                     const alreadyLearned = learnedBookIds.includes(book.id);
                                     const canLearn = canRead && !alreadyLearned;
                                     return (
                                         <div key={book.id} className="bg-black/40 border border-gray-700 p-5 rounded-lg transition-colors hover:border-wuxia-gold/50">
                                             <div className="flex items-start justify-between gap-4">
                                                 <div>
                                                     <div className="text-lg font-bold text-gray-100">{book.名称}</div>
                                                     <div className="mt-2 flex gap-2 text-xs">
                                                         <span className="rounded border border-wuxia-gold/30 px-2 py-0.5 text-wuxia-gold">{book.类型}</span>
                                                         <span className="rounded border border-white/15 px-2 py-0.5 text-gray-200">{book.品阶}</span>
                                                     </div>
                                                 </div>
                                                  <span className={`rounded border px-2 py-1 text-xs ${alreadyLearned ? 'border-gray-600 text-gray-300' : canRead ? 'border-emerald-400/50 text-emerald-200' : 'border-gray-700 text-gray-300'}`}>
                                                      {alreadyLearned ? '已学习' : canRead ? '可学' : !职位可达(book.要求职位) ? '身份未足' : '贡献未足'}
                                                  </span>
                                             </div>
                                             <p className="mt-4 text-sm leading-6 text-gray-300">{book.简介}</p>
                                              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-300">
                                                  <div className="rounded border border-white/10 bg-black/20 px-3 py-2">职位 {显示职位(book.要求职位)}</div>
                                                  <div className="rounded border border-white/10 bg-black/20 px-3 py-2">累计贡献 {book.要求累计贡献}</div>
                                              </div>
                                               <button
                                                   type="button"
                                                   disabled={!canLearn}
                                                   onClick={() => onLearnBook?.(book)}
                                                   className={`mt-4 w-full rounded px-3 py-2 text-sm font-bold transition-colors ${canLearn ? 'border border-wuxia-gold bg-wuxia-gold/15 text-wuxia-gold hover:bg-wuxia-gold hover:text-black' : 'border border-gray-700 bg-gray-900 text-gray-400 cursor-not-allowed'}`}
                                               >
                                                  {alreadyLearned ? '已学习' : '学习'}
                                              </button>
                                          </div>
                                      );
                                 })}
                             </div>
                        )}

                        {/* --- MEMBERS --- */}
                        {activeTab === 'members' && (
                            <div className="space-y-4 animate-slide-in">
                                {sectData.重要成员.map(mem => (
                                    <button
                                        key={mem.id}
                                        type="button"
                                        onClick={() => onOpenNpc?.(mem)}
                                        className="w-full text-left bg-black/40 border border-gray-700 p-4 rounded-lg flex flex-col gap-3 relative overflow-hidden group hover:bg-black/60 hover:border-wuxia-gold/40 transition-colors"
                                    >
                                        <div className="flex items-start gap-4 z-10">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border shrink-0 ${mem.性别 === '女' ? 'border-pink-900 bg-pink-900/10 text-pink-500' : 'border-blue-900 bg-blue-900/10 text-blue-500'}`}>
                                                {mem.姓名[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-gray-200 font-bold text-lg">{mem.姓名}</span>
                                                    <span className="text-xs text-wuxia-gold font-bold bg-wuxia-gold/10 px-2 py-0.5 rounded border border-wuxia-gold/20">{mem.身份}</span>
                                                </div>
                                                <div className="text-xs text-gray-300 flex gap-3 mb-2">
                                                    <span>{mem.性别}</span>
                                                    <span>{mem.年龄}岁</span>
                                                    <span className="text-wuxia-cyan">{mem.境界}</span>
                                                </div>
                                                <p className="text-sm text-gray-200 font-serif border-t border-gray-800/50 pt-2">
                                                    “{mem.简介}”
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectModal;
