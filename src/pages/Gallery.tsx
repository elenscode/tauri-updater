import { Suspense } from "react";
import ImageGrid from "../components/ImageGrid";
// import SimilarityTable from "../components/SimilarityTable";
// import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

function Gallery() {
  return (
    <Suspense
      fallback={
        <div className="loading loading-spinner loading-lg flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <div className="w-full bg-base-100 flex flex-col">
        <div className="flex flex-1 p-4 gap-4">
          {/* 메인 이미지 그리드 */}
          <div className="w-full transition-all duration-300">
            <ImageGrid />
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default Gallery;
