import { WiMoonrise, WiMoonset } from 'react-icons/wi';



interface MoonPhaseCardProps {
  phase: string; // e.g. "Waxing Crescent", "Full Moon", etc.
  illumination: number; // e.g. 0.62 = 62%
  moonrise: string;         // "HH:MM:SS"
  moonset: string;         // "HH:MM:SS"
  className:string;
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

const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({ phase, illumination, moonrise,
  moonset, className }) => {
  const emoji = phaseIcons[phase] ?? "🌙";
  const fmt = (t: string) => t.slice(0, 5); // drop seconds
  const illum =  phaseToIlluminationPercent(illumination);
  console.log(illumination);

  return (
    <div className={`
      ${className ?? ''} 
      bg-white dark:bg-gray-800 text-black dark:text-white 
      rounded-2xl shadow-md p-4 border border-gray-300 dark:border-gray-700 
      text-center flex flex-col justify-between
    `}>
      <div className="flex flex-col items-center text-center">
        {/* Phase Icon */}
        <div className="text-5xl mb-2">{emoji}</div>
        {/* Phase Name */}
        <p className="text-sm font-semibold mb-1">{phase}</p>
        {/* Illumination */}
        <p className="text-sm text-gray-400 mb-4">
          Illumination: {illum}%
        </p>

        {/* Moonrise & Moonset */}
        <div className="flex justify-center space-x-4 text-gray-500">
          <div className="flex items-center gap-1">
            <WiMoonrise size={50} className="w-7 h-7" />

            <span className="text-sm">{fmt(moonrise)}</span>
          </div>
          <div className="flex items-center gap-1">
            <WiMoonset className="w-7 h-7" />

            <span className="text-sm">{fmt(moonset)}</span>
          </div>

        </div>
      </div>
    </div>
  );

};

export default MoonPhaseCard;

function phaseToIlluminationPercent(rawPercent: number): number {
  // clamp to [0,100]
  const p = Math.max(0, Math.min(100, rawPercent));

  // triangle wave: rises from 0→100 as p goes 0→50, then falls 100→0 as p goes 50→100
  return p <= 50
    ? p * 2           //  e.g. at p=25 → 50% illum
    : (100 - p) * 2;  //  e.g. at p=75 → 50% illum
}