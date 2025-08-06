import { Link } from "react-router-dom";
import { lounges } from "../data/lounges";

const LoungesPage: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Object.entries(lounges).map(([id, lounge]) => (
        <Link
          key={id}
          to={`/lounge/${id}`}
          className="bg-neutral-800 rounded-lg overflow-hidden hover:bg-neutral-700 transition-colors"
        >
          <div className="w-full h-32 overflow-hidden">
            <img
              src={lounge.banner}
              alt={`${lounge.name} banner`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 flex items-center gap-4">
            <img
              src={lounge.icon}
              alt={`${lounge.name} icon`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <span className="text-lg font-semibold">{lounge.name}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default LoungesPage;
