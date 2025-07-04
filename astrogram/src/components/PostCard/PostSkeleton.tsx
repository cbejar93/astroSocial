// components/Post/PostSkeleton.tsx
const PostSkeleton: React.FC = () => {
    return (
      <div className="bg-gray-800 rounded-2xl p-4 mb-4 animate-pulse">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-24 bg-gray-700 rounded"></div>
          <div className="h-4 w-12 bg-gray-700 rounded"></div>
        </div>
  
        {/* Image Placeholder */}
        <div className="w-full h-48 bg-gray-700 rounded mb-3"></div>
  
        {/* Caption Placeholder */}
        <div className="h-4 w-3/4 bg-gray-700 rounded mb-4"></div>
  
        {/* Interaction Buttons */}
        <div className="flex gap-4">
          <div className="w-12 h-6 bg-gray-700 rounded"></div>
          <div className="w-12 h-6 bg-gray-700 rounded"></div>
          <div className="w-12 h-6 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  };
  
  export default PostSkeleton;
  