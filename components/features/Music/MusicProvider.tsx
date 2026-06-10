import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { 视觉设置结构, MusicTrack } from '../../../types';
import { 读取设置, 保存设置, 读取图片资源 } from '../../../services/dbService';
import { 设置键 } from '../../../utils/settingsSchema';
import { 默认背景音乐曲库 } from '../../../data/defaultMusicTracks';
import { 释放并记录ObjectURL } from '../../../utils/objectUrlLifecycle';

interface MusicContextType {
    tracks: MusicTrack[];
    addTrack: (track: MusicTrack) => Promise<void>;
    removeTrack: (id: string) => Promise<void>;
    playTrack: (id: string) => void;
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    setPlayMode: (mode: 'list-loop' | 'single-loop' | 'random') => void;
    toggleMusicFeature: (enabled: boolean) => void;
    
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    currentTrackId: string | undefined;
    currentLyric: string;
    
    enabled: boolean;
    volume: number;
    playMode: 'list-loop' | 'single-loop' | 'random';
}

const 默认音乐上下文: MusicContextType = {
    tracks: [],
    addTrack: async () => {},
    removeTrack: async () => {},
    playTrack: () => {},
    togglePlay: () => {},
    nextTrack: () => {},
    prevTrack: () => {},
    seek: () => {},
    setVolume: () => {},
    setPlayMode: () => {},
    toggleMusicFeature: () => {},
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentTrackId: undefined,
    currentLyric: '',
    enabled: false,
    volume: 50,
    playMode: 'list-loop'
};

const MusicContext = createContext<MusicContextType>(默认音乐上下文);

const 释放音乐封面ObjectURL = (track?: MusicTrack | null) => {
    const coverUrl = track?.封面URL;
    if (typeof coverUrl !== 'string' || !coverUrl.startsWith('blob:')) return;
    释放并记录ObjectURL(coverUrl, {
        source: 'MusicProvider.removeTrack',
        kind: 'music-cover',
        detail: {
            trackId: track?.id,
            trackName: track?.名称
        }
    });
};

export const useMusic = () => {
    return useContext(MusicContext);
};

export const MusicProvider: React.FC<{ 
    children: React.ReactNode;
    visualConfig: 视觉设置结构 | undefined;
    onSaveVisual: (config: 视觉设置结构) => void;
}> = ({ children, visualConfig, onSaveVisual }) => {
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [localMusicConfig, setLocalMusicConfig] = useState<Partial<视觉设置结构>>({});
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentLyric, setCurrentLyric] = useState("");
    
    const parsedLyrics = useRef<{ time: number; text: string }[]>([]);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setLocalMusicConfig({
            启用背景音乐: visualConfig?.启用背景音乐 === true,
            全局音量: visualConfig?.全局音量 ?? 50,
            音频播放模式: visualConfig?.音频播放模式 || 'list-loop',
            当前播放曲目ID: visualConfig?.当前播放曲目ID
        });
    }, [
        visualConfig?.启用背景音乐,
        visualConfig?.全局音量,
        visualConfig?.音频播放模式,
        visualConfig?.当前播放曲目ID
    ]);

    const enabled = localMusicConfig.启用背景音乐 === true;
    const volume = localMusicConfig.全局音量 ?? 50;
    const playMode = localMusicConfig.音频播放模式 || 'list-loop';
    const currentTrackId = localMusicConfig.当前播放曲目ID;
    const playableTracks = tracks.length > 0 ? tracks : 默认背景音乐曲库;

    const 保存音乐视觉设置 = (patch: Partial<视觉设置结构>) => {
        const nextConfig = {
            时间显示格式: visualConfig?.时间显示格式 || '跟随题材',
            渲染层数: visualConfig?.渲染层数 ?? 30,
            ...visualConfig,
            ...localMusicConfig,
            ...patch
        };
        setLocalMusicConfig({
            启用背景音乐: nextConfig.启用背景音乐 === true,
            全局音量: nextConfig.全局音量 ?? 50,
            音频播放模式: nextConfig.音频播放模式 || 'list-loop',
            当前播放曲目ID: nextConfig.当前播放曲目ID
        });
        onSaveVisual(nextConfig);
    };

    // Load initial tracks
    useEffect(() => {
        const loadTracks = async () => {
            try {
                const savedTracks = await 读取设置(设置键.音乐曲库);
                if (savedTracks && Array.isArray(savedTracks)) {
                    setTracks(savedTracks);
                }
            } catch (err) {
                console.error("加载音乐列表失败", err);
            }
        };
        loadTracks();
    }, []);

    // Create and cleanup audio element
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = "auto";
        }
        
        const audio = audioRef.current;
        
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            if (playMode === 'single-loop') {
                audio.currentTime = 0;
                audio.play().catch(console.error);
            } else {
                handleNext(true); // Auto next
            }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [playMode]);

    // Sync volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    // Handle track switching & Lyric parsing
    useEffect(() => {
        const loadAndPlayTrack = async () => {
            const audio = audioRef.current;
            if (!audio || !enabled || !currentTrackId) {
                if (audio && !enabled) audio.pause();
                return;
            }
            
            const targetTrack = playableTracks.find(t => t.id === currentTrackId);
            if (!targetTrack) return;
            
            // Parse Lyrics
            if (targetTrack.歌词) {
                const lines = targetTrack.歌词.split('\n');
                const lyricMap = lines.map(line => {
                    const match = line.match(/\[(\d+):(\d+\.?\d*)\](.*)/);
                    if (match) {
                        const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
                        return { time, text: match[3].trim() };
                    }
                    return null;
                }).filter((l): l is { time: number; text: string } => l !== null);
                parsedLyrics.current = lyricMap.sort((a, b) => a.time - b.time);
            } else {
                parsedLyrics.current = [];
            }
            setCurrentLyric("");

            try {
                let src = targetTrack.URL;
                if (src.startsWith('REF:')) {
                    src = await 读取图片资源(src); 
                }
                
                if (audio.src !== src) {
                    audio.src = src;
                    audio.load();
                }
                
                if (enabled) {
                    audio.play().catch(e => {
                        console.log("Play interrupted", e);
                        setIsPlaying(false);
                    });
                }
            } catch (err) {
                console.error("播放曲目失败", err);
            }
        };

        loadAndPlayTrack();
    }, [currentTrackId, playableTracks, enabled]);

    // Update current lyric based on time
    useEffect(() => {
        if (!parsedLyrics.current.length) {
            if (currentLyric) setCurrentLyric("");
            return;
        }

        const activeLine = [...parsedLyrics.current]
            .reverse()
            .find(line => currentTime >= line.time);
            
        if (activeLine && activeLine.text !== currentLyric) {
            setCurrentLyric(activeLine.text);
        } else if (!activeLine && currentLyric) {
            setCurrentLyric("");
        }
    }, [currentTime, currentLyric]);

    const handleNext = useCallback((isAuto = false) => {
        if (!playableTracks.length) return;
        const currentIndex = playableTracks.findIndex(t => t.id === currentTrackId);
        
        let nextIndex = 0;
        if (playMode === 'random') {
            nextIndex = Math.floor(Math.random() * playableTracks.length);
        } else {
            nextIndex = currentIndex >= 0 ? (currentIndex + 1) % playableTracks.length : 0;
        }
        
        playTrack(playableTracks[nextIndex].id);
    }, [playableTracks, currentTrackId, playMode, visualConfig]);

    const handlePrev = useCallback(() => {
        if (!playableTracks.length) return;
        const currentIndex = playableTracks.findIndex(t => t.id === currentTrackId);
        let prevIndex = currentIndex > 0 ? currentIndex - 1 : playableTracks.length - 1;
        playTrack(playableTracks[prevIndex].id);
    }, [playableTracks, currentTrackId, visualConfig]);

    const addTrack = async (track: MusicTrack) => {
        const updatedTracks = [...tracks, track];
        setTracks(updatedTracks);
        await 保存设置(设置键.音乐曲库, updatedTracks);
        
        if (!currentTrackId && updatedTracks.length === 1) {
            playTrack(track.id);
        }
    };

    const removeTrack = async (id: string) => {
        if (id.startsWith('default_')) return;
        const removedTrack = tracks.find(t => t.id === id);
        const updatedTracks = tracks.filter(t => t.id !== id);
        setTracks(updatedTracks);
        await 保存设置(设置键.音乐曲库, updatedTracks);
        释放音乐封面ObjectURL(removedTrack);
        
        if (currentTrackId === id) {
            handleNext();
            if (updatedTracks.length === 0) {
                audioRef.current?.pause();
                playTrack(''); 
            }
        }
    };

    const playTrack = (id: string) => {
        保存音乐视觉设置({
            当前播放曲目ID: id
        });
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (!currentTrackId && playableTracks[0]) {
            playTrack(playableTracks[0].id);
            return;
        }
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
    };

    const seek = (time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
        }
    };

    const setVolume = (vol: number) => {
        保存音乐视觉设置({
            全局音量: vol
        });
    };

    const setPlayMode = (mode: 'list-loop' | 'single-loop' | 'random') => {
        保存音乐视觉设置({
            音频播放模式: mode
        });
    };
    
    const toggleMusicFeature = (isEnabled: boolean) => {
        保存音乐视觉设置({
            启用背景音乐: isEnabled,
            当前播放曲目ID: isEnabled && !currentTrackId && playableTracks[0]
                ? playableTracks[0].id
                : currentTrackId
        });
    };

    return (
        <MusicContext.Provider value={{
            tracks: playableTracks,
            addTrack,
            removeTrack,
            playTrack,
            togglePlay,
            nextTrack: handleNext,
            prevTrack: handlePrev,
            seek,
            setVolume,
            setPlayMode,
            toggleMusicFeature,
            isPlaying,
            currentTime,
            duration,
            currentTrackId,
            currentLyric,
            enabled,
            volume,
            playMode
        }}>
            {children}
        </MusicContext.Provider>
    );
};
