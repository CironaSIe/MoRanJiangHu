export type DiagnosticLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type DiagnosticLogEntry = {
    id: string;
    level: DiagnosticLogLevel;
    time: string;
    message: string;
    detail?: string;
};

type Listener = () => void;

const MAX_LOGS = 500;
const logs: DiagnosticLogEntry[] = [];
const listeners = new Set<Listener>();
let installed = false;

const stringifyValue = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value instanceof Error) {
        return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const emit = () => {
    listeners.forEach(listener => {
        try {
            listener();
        } catch {
            // Listener failures should never break the application log pipeline.
        }
    });
};

export const recordDiagnosticLog = (level: DiagnosticLogLevel, values: unknown[]) => {
    const rendered = values.map(stringifyValue).filter(Boolean);
    const message = rendered[0] || '(empty log)';
    const detail = rendered.length > 1 ? rendered.slice(1).join('\n') : undefined;
    logs.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        level,
        time: new Date().toISOString(),
        message,
        detail
    });
    if (logs.length > MAX_LOGS) {
        logs.length = MAX_LOGS;
    }
    emit();
};

export const getDiagnosticLogs = (): DiagnosticLogEntry[] => logs.slice();

export const clearDiagnosticLogs = () => {
    logs.length = 0;
    emit();
};

export const subscribeDiagnosticLogs = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const installDiagnosticLogCapture = () => {
    if (installed || typeof console === 'undefined') return;
    installed = true;

    (['log', 'info', 'warn', 'error', 'debug'] as DiagnosticLogLevel[]).forEach(level => {
        const original = console[level]?.bind(console);
        if (!original) return;
        console[level] = (...args: unknown[]) => {
            recordDiagnosticLog(level, args);
            original(...args);
        };
    });

    if (typeof window !== 'undefined') {
        window.addEventListener('error', event => {
            recordDiagnosticLog('error', [
                'window.error',
                {
                    message: event.message,
                    source: event.filename,
                    line: event.lineno,
                    column: event.colno,
                    error: event.error instanceof Error ? event.error.stack || event.error.message : event.error
                }
            ]);
        });
        window.addEventListener('unhandledrejection', event => {
            recordDiagnosticLog('error', ['unhandledrejection', event.reason]);
        });
    }
};

installDiagnosticLogCapture();
