/**
 * 沙箱 iframe 卡片组件
 *
 * 将酒馆预设 JS 交互正则脚本的 HTML 产出在沙箱 iframe 中安全渲染，
 * 通过 postMessage 桥接协议将 iframe 内的交互行为映射到 React App API。
 *
 * 安全保证：
 * - sandbox="allow-scripts" 不带 allow-same-origin
 * - iframe 内 JS 无法访问主页 DOM/Storage/Network
 * - 只转发预定义白名单内的桥接动作
 * - 主题变量动态注入/同步
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import type { 酒馆沙箱动作 } from '../../../models/system';
import {
    生成沙箱HTML文档,
    是否沙箱动作,
    构建当前主题快照,
    type 主题快照,
} from '../../../utils/tavernSandboxBridge';

// ─── Props ───

export interface SandboxedCardProps {
    /** 正则替换后的 HTML 产出（可能含 <script>） */
    htmlContent: string;
    /** 桥接动作回调 */
    onAction: (action: 酒馆沙箱动作) => void;
    /** 当前主题快照（可选，不传则自动从 DOM 读取） */
    themeSnapshot?: 主题快照;
    /** 额外 CSS 类名 */
    className?: string;
    /** 最大高度限制（px），超出后内部滚动 */
    maxHeight?: number;
}

// ─── Component ───

export const SandboxedCard: React.FC<SandboxedCardProps> = ({
    htmlContent,
    onAction,
    themeSnapshot: externalTheme,
    className = '',
    maxHeight,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState<number>(60);
    const [isReady, setIsReady] = useState(false);

    // 主题快照：优先用外部传入，否则自动构建
    const theme = useMemo(() => externalTheme || 构建当前主题快照(), [externalTheme]);

    // 生成沙箱 HTML 文档
    const sandboxedHtml = useMemo(
        () => 生成沙箱HTML文档(htmlContent, theme),
        [htmlContent, theme]
    );

    // ─── 消息监听 ───

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            // 只处理来自当前 iframe 的消息
            const iframe = iframeRef.current;
            if (!iframe) return;

            // 校验消息源（sandbox 模式下 iframe.origin 可能为 'null'）
            if (event.source !== iframe.contentWindow) return;

            const data = event.data;
            if (!是否沙箱动作(data)) return;

            switch (data.action) {
                case 'inject_text':
                case 'send_text':
                    if (typeof data.value === 'string' && data.value.trim()) {
                        onAction({
                            type: 'tavern_sandbox',
                            action: data.action,
                            value: data.value.trim(),
                        });
                    }
                    break;

                case 'resize':
                    if (typeof data.height === 'number' && data.height > 0) {
                        setIframeHeight(Math.min(data.height, maxHeight || 2000));
                    }
                    break;

                case 'get_theme':
                    // iframe 请求主题变量，发回当前主题快照
                    try {
                        iframe.contentWindow?.postMessage({
                            type: 'tavern_sandbox_response',
                            action: 'theme_update',
                            theme: {
                                textColor: theme.textColor,
                                fontFamily: theme.fontFamily,
                                fontSize: theme.fontSize,
                                isLight: theme.isLight,
                                variables: theme.variables,
                            },
                        }, '*');
                    } catch {
                        // iframe 可能已卸载
                    }
                    break;

                case 'ready':
                    setIsReady(true);
                    // 初始主题同步
                    try {
                        iframe.contentWindow?.postMessage({
                            type: 'tavern_sandbox_response',
                            action: 'theme_update',
                            theme: {
                                textColor: theme.textColor,
                                fontFamily: theme.fontFamily,
                                fontSize: theme.fontSize,
                                isLight: theme.isLight,
                                variables: theme.variables,
                            },
                        }, '*');
                    } catch {
                        // iframe 可能已卸载
                    }
                    break;
            }
        },
        [onAction, theme, maxHeight]
    );

    // 注册全局消息监听
    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    // ─── 主题变更推送 ───

    // 当外部主题快照变化时，推送给 iframe
    useEffect(() => {
        if (!isReady || !iframeRef.current?.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage({
                type: 'tavern_sandbox_response',
                action: 'theme_update',
                theme: {
                    textColor: theme.textColor,
                    fontFamily: theme.fontFamily,
                    fontSize: theme.fontSize,
                    isLight: theme.isLight,
                    variables: theme.variables,
                },
            }, '*');
        } catch {
            // iframe 可能已卸载
        }
    }, [theme, isReady]);

    // ─── 高度自适应兜底 ───

    const iframeHeightRef = useRef(iframeHeight);
    useEffect(() => { iframeHeightRef.current = iframeHeight; }, [iframeHeight]);

    useEffect(() => {
        if (!isReady || !iframeRef.current) return;
        const iframe = iframeRef.current;

        const measureHeight = () => {
            try {
                const doc = iframe.contentDocument;
                if (doc?.body) {
                    const h = doc.body.scrollHeight;
                    if (h > 0 && h !== iframeHeightRef.current) {
                        setIframeHeight(Math.min(h, maxHeight || 2000));
                    }
                }
            } catch {
                // 跨域限制（sandbox 不带 allow-same-origin）下不可访问
            }
        };

        const timer = setTimeout(measureHeight, 200);
        const interval = setInterval(measureHeight, 2000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [isReady, maxHeight]);

    // ─── 渲染 ───

    return (
        <div className={`tavern-sandboxed-card relative w-full rounded-lg overflow-hidden ${className}`}>
            <iframe
                ref={iframeRef}
                srcDoc={sandboxedHtml}
                sandbox="allow-scripts"
                title="酒馆预设交互卡片"
                style={{
                    width: '100%',
                    height: `${iframeHeight}px`,
                    border: 'none',
                    display: 'block',
                    background: 'transparent',
                    overflow: maxHeight && iframeHeight >= maxHeight ? 'hidden' : undefined,
                }}
                loading="lazy"
            />
            {/* 超出最大高度时的遮罩提示 */}
            {maxHeight && iframeHeight >= maxHeight && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex items-end justify-center pb-1"
                    onClick={() => setIframeHeight(maxHeight * 3)}
                >
                    <span className="text-[10px] text-gray-300/80 cursor-pointer">
                        ▼ 展开完整内容
                    </span>
                </div>
            )}
        </div>
    );
};

export default SandboxedCard;
