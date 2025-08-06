import { useParams } from "react-router-dom";
import lounges from "../data/lounges";

const LoungePage: React.FC = () => {
  const { loungeId } = useParams<{ loungeId: string }>();
  const lounge = loungeId ? lounges[loungeId] : undefined;

  if (!lounge) {
    return <div className="py-6">Lounge not found.</div>;
  }

  return (
    <div className="py-6">
      <div className="w-full h-40 overflow-hidden mb-4">
        <img
          src={lounge.banner}
          alt={`${lounge.name} banner`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex items-center gap-4 mb-6">
        <img
          src={lounge.icon}
          alt={`${lounge.name} icon`}
          className="w-20 h-20 rounded-full object-cover"
        />
        <h1 className="text-2xl font-bold">{lounge.name}</h1>
      </div>
      <div>Feed coming soon...</div>
    </div>
  );
};

export default LoungePage;
