const JSON_HEADERS = {
    'Content-Type': 'application/json'
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_OWNER = 'ypq123456789';
const DEFAULT_REPO = 'MoRanJiangHu';
const DEFAULT_BASE_BRANCH = 'main';
const MAX_BODY_BYTES = 650_000;
const MAX_TEXT_LENGTH = 180_000;

type Env = {
    FANDOM_PRESET_GITHUB_TOKEN?: string;
    FANDOM_PRESET_REPO_OWNER?: string;
    FANDOM_PRESET_REPO_NAME?: string;
    FANDOM_PRESET_BASE_BRANCH?: string;
};

const jsonResponse = (payload: unknown, status = 200): Response => (
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...CORS_HEADERS
        }
    })
);

export async function onRequestOptions(): Promise<Response> {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

const readText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const limitText = (value: unknown, maxLength = MAX_TEXT_LENGTH): string => {
    const text = readText(value);
    return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const slugify = (value: string): string => {
    const ascii = value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72);
    if (ascii) return ascii;
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
    }
    return `fandom-${Math.abs(hash).toString(36)}`;
};

const safeJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const toBase64 = (value: string): string => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    return btoa(binary);
};

const githubFetch = async (token: string, path: string, init?: RequestInit): Promise<Response> => (
    fetch(`${GITHUB_API_BASE}${path}`, {
        ...init,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'MoRanJiangHu-Fandom-Preset-Submitter',
            ...(init?.headers || {})
        }
    })
);

const readGitHubJson = async (response: Response): Promise<any> => {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return { message: text.slice(0, 240) };
    }
};

const assertGitHubOk = async (response: Response, action: string): Promise<any> => {
    const payload = await readGitHubJson(response);
    if (!response.ok) {
        throw new Error(`${action}失败：${response.status} ${payload?.message || ''}`.trim());
    }
    return payload;
};

const getFile = async (token: string, owner: string, repo: string, path: string, ref: string): Promise<{ sha: string; content: string } | null> => {
    const response = await githubFetch(token, `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(ref)}`);
    if (response.status === 404) return null;
    const payload = await assertGitHubOk(response, `读取 ${path}`);
    const encoded = readText(payload?.content).replace(/\s+/g, '');
    let content = '';
    if (encoded) {
        try {
            content = atob(encoded);
        } catch {
            content = '';
        }
    }
    return { sha: readText(payload?.sha), content };
};

const putFile = async (params: {
    token: string;
    owner: string;
    repo: string;
    path: string;
    branch: string;
    message: string;
    content: string;
    sha?: string;
}): Promise<void> => {
    const body: Record<string, unknown> = {
        message: params.message,
        content: toBase64(params.content),
        branch: params.branch
    };
    if (params.sha) body.sha = params.sha;
    const response = await githubFetch(params.token, `/repos/${params.owner}/${params.repo}/contents/${encodeURIComponent(params.path).replace(/%2F/g, '/')}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    await assertGitHubOk(response, `写入 ${params.path}`);
};

const buildPreset = (payload: any, slug: string) => {
    const workTitle = readText(payload?.workTitle);
    const worldName = readText(payload?.worldName) || workTitle;
    return {
        schema: 'moranjianghu-fandom-world-preset',
        version: 1,
        id: slug,
        title: workTitle,
        worldName,
        sourceType: readText(payload?.openingConfig?.同人融合?.来源类型) || '小说',
        fusionStrength: readText(payload?.openingConfig?.同人融合?.融合强度) || '',
        createdAt: new Date().toISOString(),
        contributedBy: 'community',
        reviewStatus: 'pending',
        worldConfig: {
            worldName,
            worldType: 'fan_fiction',
            manualWorldPrompt: limitText(payload?.worldPrompt),
            worldExtraRequirement: limitText(payload?.worldExtraRequirement, 40_000),
            manualRealmPrompt: limitText(payload?.realmPrompt, 80_000)
        },
        openingConfig: payload?.openingConfig || null,
        datasetSummary: payload?.datasetSummary || null,
        submitterNote: limitText(payload?.submitterNote, 1200)
    };
};

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
    try {
        const contentLength = Number(request.headers.get('Content-Length') || '0');
        if (contentLength > MAX_BODY_BYTES) {
            return jsonResponse({ ok: false, error: '提交内容过大，请删减世界观文本或分解摘要后再试。' }, 413);
        }

        const token = readText(env.FANDOM_PRESET_GITHUB_TOKEN);
        if (!token) {
            return jsonResponse({ ok: false, error: '服务器未配置 FANDOM_PRESET_GITHUB_TOKEN，暂时无法自动创建 PR。' }, 503);
        }

        const payload = await request.json().catch(() => null);
        const workTitle = readText(payload?.workTitle);
        if (!workTitle) {
            return jsonResponse({ ok: false, error: '缺少作品名。' }, 400);
        }
        if (!readText(payload?.worldPrompt) && !readText(payload?.worldExtraRequirement) && !payload?.datasetSummary) {
            return jsonResponse({ ok: false, error: '缺少可提交的世界观内容。' }, 400);
        }

        const owner = readText(env.FANDOM_PRESET_REPO_OWNER) || DEFAULT_OWNER;
        const repo = readText(env.FANDOM_PRESET_REPO_NAME) || DEFAULT_REPO;
        const baseBranch = readText(env.FANDOM_PRESET_BASE_BRANCH) || DEFAULT_BASE_BRANCH;
        const slug = slugify(workTitle);
        const branch = `codex/fandom-preset-${slug}-${Date.now().toString(36)}`;

        const refPayload = await assertGitHubOk(
            await githubFetch(token, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`),
            '读取基础分支'
        );
        const baseSha = readText(refPayload?.object?.sha);
        if (!baseSha) throw new Error('基础分支 SHA 为空。');

        await assertGitHubOk(
            await githubFetch(token, `/repos/${owner}/${repo}/git/refs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
            }),
            '创建投稿分支'
        );

        const presetPath = `public/fandom-world-presets/${slug}.json`;
        const indexPath = 'public/fandom-world-presets/index.json';
        const preset = buildPreset(payload, slug);
        const existingIndex = await getFile(token, owner, repo, indexPath, branch);
        let indexPayload: any = { version: 1, presets: [] };
        if (existingIndex?.content) {
            try {
                indexPayload = JSON.parse(existingIndex.content);
            } catch {
                indexPayload = { version: 1, presets: [] };
            }
        }
        const presets = Array.isArray(indexPayload.presets) ? indexPayload.presets : [];
        const nextPresets = [
            {
                id: slug,
                title: preset.title,
                worldName: preset.worldName,
                sourceType: preset.sourceType,
                path: `/${presetPath.replace(/^public\//, '')}`,
                contributedBy: 'community',
                reviewStatus: 'pending'
            },
            ...presets.filter((item: any) => readText(item?.id) !== slug)
        ];

        await putFile({
            token,
            owner,
            repo,
            path: presetPath,
            branch,
            message: `Add fandom world preset: ${workTitle}`,
            content: safeJson(preset)
        });
        await putFile({
            token,
            owner,
            repo,
            path: indexPath,
            branch,
            message: `Update fandom world preset index: ${workTitle}`,
            content: safeJson({ version: Math.max(1, Number(indexPayload.version) || 1), updatedAt: new Date().toISOString(), presets: nextPresets }),
            sha: existingIndex?.sha
        });

        const prPayload = await assertGitHubOk(
            await githubFetch(token, `/repos/${owner}/${repo}/pulls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `新增同人世界观预设：${workTitle}`,
                    head: branch,
                    base: baseBranch,
                    body: [
                        '用户通过游戏内“贡献为公共预设”提交。',
                        '',
                        `作品名：${workTitle}`,
                        `世界名：${readText(payload?.worldName) || workTitle}`,
                        '',
                        '说明：该 PR 只提交世界观预设、公开摘要和配置，不应包含用户本地完整小说原文。'
                    ].join('\n')
                })
            }),
            '创建 Pull Request'
        );

        return jsonResponse({
            ok: true,
            pullRequestUrl: readText(prPayload?.html_url),
            branch,
            message: '已创建公共预设投稿 PR。'
        });
    } catch (error: any) {
        return jsonResponse({ ok: false, error: error?.message || '提交失败。' }, 500);
    }
}
