import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const sectionClass =
    "rounded-xl border border-amber-900/50 bg-amber-950/40 p-3";
const headingClass =
    "mb-2 text-xs font-bold uppercase tracking-wide text-green-400";
const sliderClass = "w-full accent-green-500 hover:cursor-pointer";
const muteButtonClass =
    "shrink-0 rounded-md bg-green-900/40 px-2 py-1 text-base leading-none transition-colors hover:bg-green-900/70 hover:cursor-pointer";
const rowButtonClass =
    "flex w-full items-center justify-between rounded-md bg-green-900/40 px-3 py-2 text-sm font-medium text-amber-50 transition-colors hover:bg-green-900/70 hover:cursor-pointer";

export default function AccountSettings() {
    const [musicMuted, setMusicMuted] = useState(false);
    const [sfxMuted, setSfxMuted] = useState(false);
    const [musicLevel, setMusicLevel] = useState(80);
    const [sfxLevel, setSfxLevel] = useState(80);
    const [enableOnLaunch, setEnableOnLaunch] = useState(true);

    const navigate = useNavigate();

    return (
        <div className="flex w-80 flex-col gap-3 bg-green-950 p-4 text-amber-50">
            {/* Header */}
            <section className="relative flex items-center justify-center">
                <h1 className="text-center text-xl font-extrabold tracking-wide text-green-400">Settings</h1>
                <button
                    type="button"
                    aria-label="back"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-md p-1 
                        text-green-400 transition-colors hover:bg-green-900/40 
                        hover:text-green-300 hover:cursor-pointer"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" height="24" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" stroke-width={2} 
                        stroke-linecap="round" stroke-linejoin="round" 
                        aria-hidden="true"
                    >
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </button>
            </section>
            {/* Game Settings */}
            <section className={sectionClass}>
                <h2 className={headingClass}>Game Settings</h2>
                {/* Music volume */}
                <div className="mb-3">
                    <label className="mb-1 block text-xs font-semibold text-amber-100/80">Music</label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Mute music"
                            className={muteButtonClass + (musicMuted && ' rounded-lg border border-red-800/60')}
                            onClick={(e) => {
                                e.preventDefault();
                                setMusicMuted(!musicMuted);
                            }}
                        >
                            {
                                musicMuted ? '🔇' : musicLevel > 50 ? '🔊' : musicLevel > 0 ? '🔉' : '🔈'
                            }
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            defaultValue={musicLevel}
                            aria-label="Music volume"
                            className={sliderClass}
                            disabled={musicMuted}
                            onChange={(e) => {
                                e.preventDefault();
                                setMusicLevel(Number(e.target.value));
                            }}
                        />
                    </div>
                </div>
                {/* SFX volume */}
                <div className="mb-3">
                    <label className="mb-1 block text-xs font-semibold text-amber-100/80">Sound Effects</label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Mute sound effects"
                            className={muteButtonClass}
                            onClick={(e) => {
                                e.preventDefault();
                                setSfxMuted(!sfxMuted);
                            }}
                        >
                            {
                                sfxMuted ? '🔇' : sfxLevel > 50 ? '🔊' : sfxLevel > 0 ? '🔉' : '🔈'
                            }
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            defaultValue={sfxLevel}
                            aria-label="Sound effects volume"
                            className={sliderClass}
                            disabled={sfxMuted}
                            onChange={(e) => {
                                e.preventDefault();
                                setSfxLevel(Number(e.target.value));
                            }}
                        />
                    </div>
                </div>
                {/* Auto-enable on launch */}
                <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-amber-50">Enable Junglify on launch</span>
                    <span className="relative inline-block h-6 w-11 shrink-0">
                        <input type="checkbox" className="peer sr-only" onChange={(e) => {
                            e.preventDefault();
                            setEnableOnLaunch(e.target.checked);
                        }} 
                    />
                        <span className="block h-6 w-11 rounded-full bg-amber-900/60 transition-colors peer-checked:bg-green-600" />
                        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-amber-50 transition-transform peer-checked:translate-x-5" />
                    </span>
                </label>
            </section>
        {/* Profile Settings */}
            <section className={sectionClass}>
                <h2 className={headingClass}>Profile Settings</h2>
                <div className="flex flex-col gap-2">
                    <button type="button" className={rowButtonClass} onClick={() => {}}>
                        <span>Change Email</span>
                        <span className="text-amber-100/50">›</span>
                    </button>
                    <button type="button" className={rowButtonClass} onClick={() => {}}>
                        <span>Change Username</span>
                        <span className="text-amber-100/50">›</span>
                    </button>
                    <button type="button" className={rowButtonClass} onClick={() => {}}>
                        <span>Change Password</span>
                        <span className="text-amber-100/50">›</span>
                    </button>
                    <button
                        type="button"
                        className="mt-1 w-full rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-green-500 hover:curs
or-pointer"
                        onClick={() => {}}
                    >
                        Log Out
                    </button>
                    <button
                        type="button"
                        className="w-full rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-900/50 hover:cursor-pointer"
                        onClick={() => {}}
                    >
                        Delete Account
                    </button>
                </div>
            </section>
        </div>
    );
}