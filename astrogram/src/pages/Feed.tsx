import PostCard from "../components/PostCard/PostCard";

const dummyPosts = [
  {
    id: 1,
    username: "astro_nerd",
    imageUrl: "https://images-assets.nasa.gov/image/PIA04921/PIA04921~orig.jpg",
    caption: "The Orion Nebula at 3AM 🌌",
    timestamp: "2025-07-03T03:00:00Z",
  },
  {
    id: 2,
    username: "galaxyhunter",
    imageUrl: "https://images-assets.nasa.gov/image/PIA12235/PIA12235~orig.jpg",
    caption: "Milky Way glowing above the Atacama Desert 🔭",
    timestamp: "2025-07-02T23:15:00Z",
  },
  {
    id: 3,
    username: "cosmicdreamer",
    imageUrl: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001478/GSFC_20171208_Archive_e001478~orig.jpg",
    caption: "Edge of the galaxy — deep space haze ✨",
    timestamp: "2025-07-01T18:42:00Z",
  },
  {
    id: 4,
    username: "nebula_chaser",
    imageUrl: "https://images-assets.nasa.gov/image/PIA09178/PIA09178~orig.jpg",
    caption: "Carina Nebula looking unreal tonight 💫",
    timestamp: "2025-06-30T22:00:00Z",
  },
  {
    id: 5,
    username: "starlord",
    imageUrl: "https://images-assets.nasa.gov/image/PIA19806/PIA19806~orig.jpg",
    caption: "A peek into the Pillars of Creation 🌀",
    timestamp: "2025-06-28T20:10:00Z",
  },
  {
    id: 6,
    username: "darkmatter",
    imageUrl: "https://images-assets.nasa.gov/image/PIA21087/PIA21087~orig.jpg",
    caption: "Caught a distant supernova remnant 🌠",
    timestamp: "2025-06-25T11:30:00Z",
  },
];

const Feed: React.FC = () => {
  return (
    <div className="w-full py-8 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4">
        <div className="w-full max-w-3xl space-y-0 sm:space-y-4">


          {dummyPosts
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Feed;


