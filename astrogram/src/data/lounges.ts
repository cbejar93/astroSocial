export interface LoungeInfo {
  name: string;
  banner: string;
  icon: string;
}

export const lounges: Record<string, LoungeInfo> = {
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

export default lounges;
