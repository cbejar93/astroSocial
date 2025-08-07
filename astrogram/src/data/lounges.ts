export interface LoungeInfo {
  name: string;
  banner: string;
  icon: string;
  threads: number;
  views: number;
  lastPostAt: string;
}

export const lounges: Record<string, LoungeInfo> = {
  astro: {
    name: "Astro Lounge",
    banner: "https://picsum.photos/seed/astro-banner/1200/300",
    icon: "https://picsum.photos/seed/astro-icon/200",
    threads: 42,
    views: 1234,
    lastPostAt: "2025-07-01T12:00:00Z",
  },
  lunisolar: {
    name: "LuniSolar",
    banner: "https://picsum.photos/seed/lunisolar-banner/1200/300",
    icon: "https://picsum.photos/seed/lunisolar-icon/200",
    threads: 37,
    views: 980,
    lastPostAt: "2025-07-02T09:30:00Z",
  },
  planetary: {
    name: "Planetary",
    banner: "https://picsum.photos/seed/planetary-banner/1200/300",
    icon: "https://picsum.photos/seed/planetary-icon/200",
    threads: 58,
    views: 1500,
    lastPostAt: "2025-07-03T15:45:00Z",
  },
  dso: {
    name: "DSO",
    banner: "https://picsum.photos/seed/dso-banner/1200/300",
    icon: "https://picsum.photos/seed/dso-icon/200",
    threads: 22,
    views: 760,
    lastPostAt: "2025-06-30T18:20:00Z",
  },
  equipment: {
    name: "Equipment",
    banner: "https://picsum.photos/seed/equipment-banner/1200/300",
    icon: "https://picsum.photos/seed/equipment-icon/200",
    threads: 16,
    views: 540,
    lastPostAt: "2025-07-01T08:10:00Z",
  },
  astroadjacent: {
    name: "AstroAdjacent",
    banner: "https://picsum.photos/seed/astroadjacent-banner/1200/300",
    icon: "https://picsum.photos/seed/astroadjacent-icon/200",
    threads: 29,
    views: 1120,
    lastPostAt: "2025-07-02T20:15:00Z",
  },
  askastro: {
    name: "AskAstro",
    banner: "https://picsum.photos/seed/askastro-banner/1200/300",
    icon: "https://picsum.photos/seed/askastro-icon/200",
    threads: 11,
    views: 430,
    lastPostAt: "2025-06-29T14:05:00Z",
  },
};

export default lounges;
