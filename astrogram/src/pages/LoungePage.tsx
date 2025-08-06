import { Link, useParams } from "react-router-dom";
import lounges from "../data/lounges";

const LoungePage: React.FC = () => {
  const { loungeId } = useParams<{ loungeId: string }>();
  const lounge = loungeId ? lounges[loungeId] : undefined;

  if (!lounge) {
    return <div className="py-6">Lounge not found.</div>;
  }

  return (
    <div className="py-6">
      <div className="relative mb-12">
        <div className="w-full h-40 overflow-hidden">
          <img
            src={lounge.banner}
            alt={`${lounge.name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
        <img
          src={lounge.icon}
          alt={`${lounge.name} icon`}
          className="w-24 h-24 rounded-full object-cover absolute left-4 bottom-0 translate-y-1/2 border-4 border-neutral-900"
        />
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{lounge.name}</h1>
        <Link
          to={`/lounge/${loungeId}/post`}
          className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Post
        </Link>
      </div>
      <div>Feed coming soon...</div>
    </div>
  );
};

export default LoungePage;
