import { useParams } from "react-router-dom";
import Feed from "./Feed";

interface LoungeInfo {
  name: string;
  banner: string;
  icon: string;
}

const lounges: Record<string, LoungeInfo> = {
  astro: {
    name: "Astro Lounge",
    banner: "https://picsum.photos/seed/astro-banner/1200/300",
    icon: "https://picsum.photos/seed/astro-icon/200",
  },
  lunisolar: {
    name: "LuniSolar",
    banner: "https://picsum.photos/seed/lunisolar-banner/1200/300",
    icon: "https://picsum.photos/seed/lunisolar-icon/200",
  },
  planetary: {
    name: "Planetary",
    banner: "https://picsum.photos/seed/planetary-banner/1200/300",
    icon: "https://picsum.photos/seed/planetary-icon/200",
  },
  dso: {
    name: "DSO",
    banner: "https://picsum.photos/seed/dso-banner/1200/300",
    icon: "https://picsum.photos/seed/dso-icon/200",
  },
  equipmet: {
    name: "Equipmet",
    banner: "https://picsum.photos/seed/equipmet-banner/1200/300",
    icon: "https://picsum.photos/seed/equipmet-icon/200",
  },
  astroadjacent: {
    name: "AstroAdjacent",
    banner: "https://picsum.photos/seed/astroadjacent-banner/1200/300",
    icon: "https://picsum.photos/seed/astroadjacent-icon/200",
  },
  askastro: {
    name: "AskAstro",
    banner: "https://picsum.photos/seed/askastro-banner/1200/300",
    icon: "https://picsum.photos/seed/askastro-icon/200",
  },
};

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
      <Feed />
    </div>
  );
};

export default LoungePage;
