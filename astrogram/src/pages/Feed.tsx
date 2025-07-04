import PostCard from "../components/PostCard/PostCard";

const dummyPosts = [
  {
    id: 1,
    username: "astro_nerd",
    imageUrl: "https://www.mccormick.northwestern.edu/images/news/2023/07/what-does-a-twinkling-star-sound-like-take-a-listen-social.jpg",
    caption: "The Orion Nebula at 3AM 🌌",
  },
  {
    id: 2,
    username: "galaxyhunter",
    imageUrl: "https://www.mccormick.northwestern.edu/images/news/2023/07/what-does-a-twinkling-star-sound-like-take-a-listen-social.jpg",
    caption: "Milky Way from Chile 🔭",
  },
  {
    id: 3,
    username: "galaxyhunter",
    imageUrl: "https://www.mccormick.northwestern.edu/images/news/2023/07/what-does-a-twinkling-star-sound-like-take-a-listen-social.jpg",
    caption: "Milky Way from Chile 🔭",
  },
  {
    id: 4,
    username: "galaxyhunter",
    imageUrl: "https://www.mccormick.northwestern.edu/images/news/2023/07/what-does-a-twinkling-star-sound-like-take-a-listen-social.jpg",
    caption: "Milky Way from Chile 🔭",
  },
];

const Feed: React.FC = () => {
  return (
    <div className="w-full py-8 flex justify-center">
  <div className="w-full max-w-3xl px-0 sm:px-4">
  <div className="w-full max-w-3xl space-y-0 sm:space-y-4">


      {dummyPosts.map((post) => (
        <PostCard
          key={post.id}
          username={post.username}
          imageUrl={post.imageUrl}
          caption={post.caption}
        />
      ))}
    </div>
  </div>
</div>
  );
};

export default Feed;


