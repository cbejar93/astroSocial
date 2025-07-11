import { Moon, MoonStar } from 'lucide-react';


interface MoonPhaseCardProps {
    phase: string; // e.g. "Waxing Crescent", "Full Moon", etc.
    illumination: number; // e.g. 0.62 = 62%
    moonrise: string;         // "HH:MM:SS"
    moonset:  string;         // "HH:MM:SS"
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

const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({ phase, illumination,  moonrise,
    moonset, }) => {
    const emoji = phaseIcons[phase] ?? "🌙";
    const fmt = (t: string) => t.slice(0,5); // drop seconds

    return (
        <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md p-4 border border-gray-300 dark:border-gray-700 w-full">
          <div className="flex flex-col items-center text-center">
            {/* Phase Icon */}
            <div className="text-5xl mb-2">{emoji}</div>
            {/* Phase Name */}
            <p className="text-sm font-semibold mb-1">{phase}</p>
            {/* Illumination */}
            <p className="text-sm text-gray-400 mb-4">
              Illumination: {Math.round(illumination)}%
            </p>
    
            {/* Moonrise & Moonset */}
            <div className="flex justify-center space-x-8 text-gray-500">
              <div className="flex items-center gap-1">
                <Moon className="w-5 h-5" />
                <span className="text-sm">{fmt(moonrise)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MoonStar className="w-5 h-5" />
                <span className="text-sm">{fmt(moonset)}</span>
              </div>
            </div>
          </div>
        </div>
      );


    // return (
    //     <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-md p-4 border border-gray-300 dark:border-gray-700 w-full">
    //         <div className="flex flex-col items-center text-center">
    //             <div className="text-5xl mb-2">{emoji}</div>
    //             <p className="text-sm font-semibold mb-1">{phase}</p>
    //             <p className="text-sm text-gray-400">
    //                 Illumination: {Math.round(illumination * 100)}%
    //             </p>
    //         </div>
    //     </div>
    // );
};

export default MoonPhaseCard;