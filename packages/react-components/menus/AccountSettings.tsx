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
    return (
        <div className="flex w-80 flex-col gap-3 bg-green-950 p-4 text-amber-50">
            <h1 className="text-center text-xl font-extrabold tracking-wide text-green-400">Settings</h1>

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
                            className={muteButtonClass}
                            onClick={() => {}}
                        >
                            🔊
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            defaultValue={80}
                            aria-label="Music volume"
                            className={sliderClass}
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
                            onClick={() => {}}
                        >
                            🔊
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            defaultValue={80}
                            aria-label="Sound effects volume"
                            className={sliderClass}
                        />
                    </div>
                </div>

                {/* Auto-enable on launch */}
                <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-amber-50">Enable Junglify on launch</span>
                    <span className="relative inline-block h-6 w-11 shrink-0">
                        <input type="checkbox" className="peer sr-only" />
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