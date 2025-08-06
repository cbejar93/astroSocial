import { useParams } from "react-router-dom";
import Feed from "./Feed";
import { lounges } from "../data/lounges";

const LoungePage: React.FC = () => {
  const { loungeId } = useParams<{ loungeId: string }>();
  const id = loungeId ?? "astro";
  const lounge = lounges[id];

  if (!lounge) {
    return <div className="text-center mt-10">Lounge not found.</div>;
  }

  return (
    <div className="w-full">
      <div className="w-full h-40 sm:h-60 overflow-hidden">
        <img
          src={lounge.banner}
          alt={`${lounge.name} banner`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="-mt-12 mb-6 flex justify-center">
        <img
          src={lounge.icon}
          alt={`${lounge.name} icon`}
          className="w-24 h-24 rounded-full border-4 border-gray-900 object-cover"
        />
      </div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">{lounge.name}</h1>
        <p className="text-sm text-neutral-400 mt-1">
          {lounge.threads} Threads · {lounge.views} Views
        </p>
      </div>
      <Feed />
    </div>
  );
};

export default LoungePage;
