interface MoonPhaseCardProps {
    phase: string; // e.g. "Waxing Crescent", "Full Moon", etc.
    illumination: number; // e.g. 0.62 = 62%
}

const phaseIcons: Record<string, string> = {
    "New Moon": "🌑",
    "Waxing Crescent": "🌒",
    "First Quarter": "🌓",
    "Waxing Gibbous": "🌔",
    "Full Moon": "🌕",
    "Waning Gibbous": "🌖",
    "Last Quarter": "🌗",
    "Waning Crescent": "🌘",
};

const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({ phase, illumination }) => {
    const emoji = phaseIcons[phase] ?? "🌙";

    return (
        <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md p-4 border border-gray-300 dark:border-gray-700 w-full">
            <div className="flex flex-col items-center text-center">
                <div className="text-5xl mb-2">{emoji}</div>
                <p className="text-sm font-semibold mb-1">{phase}</p>
                <p className="text-sm text-gray-400">
                    Illumination: {Math.round(illumination * 100)}%
                </p>
            </div>
        </div>
    );
};

export default MoonPhaseCard;