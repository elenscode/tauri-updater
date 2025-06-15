import React, { useCallback } from "react";
import type { ImageGridProps } from "../types/image";
import { useImageGridActions } from "../hooks/useImageGridActions";
import { useImageDataStore } from "../store/useImageDataStore";
import ImageGridHeader from "./ImageGridHeader";
import VirtualizedImageGrid from "./VirtualizedImageGrid";
import ImageGridLoading from "./ImageGridLoading";

const ImageGrid: React.FC<ImageGridProps> = React.memo(() => {
  // Store에서 상태와 액션 가져오기
  const {
    filteredImages,
    selectedImages,
    selectedOption,
    columns,
    toggleImageSelection,
    clearImageSelection,
    setSelectedOption,
    setColumns,
  } = useImageDataStore();

  const { handleCreatePattern, clearCache, getCachedImageCount } =
    useImageGridActions();

  // 이미지 선택 토글 (store 액션 사용)
  const handleToggleImageSelection = useCallback(
    (imageId: string) => {
      toggleImageSelection(imageId);
    },
    [toggleImageSelection]
  );

  // 전체 선택/해제 (store 액션 사용)
  const handleClearSelection = useCallback(() => {
    clearImageSelection();
  }, [clearImageSelection]);

  // 패턴 생성 핸들러
  const handlePatternCreate = useCallback(() => {
    handleCreatePattern(selectedImages, selectedOption);
  }, [handleCreatePattern, selectedImages, selectedOption]);

  if (filteredImages.length === 0) {
    return <ImageGridLoading />;
  }

  return (
    <div className="p-4">
      {" "}
      <ImageGridHeader
        actualImageCount={filteredImages.length}
        selectedImages={selectedImages}
        selectedOption={selectedOption}
        columns={columns}
        getCachedImageCount={getCachedImageCount}
        onClearCache={clearCache}
        onClearSelection={handleClearSelection}
        onCreatePattern={handlePatternCreate}
        onColumnsChange={setColumns}
        onOptionChange={setSelectedOption}
      />
      <VirtualizedImageGrid
        images={filteredImages}
        actualImageCount={filteredImages.length}
        columns={columns}
        selectedOption={selectedOption}
        selectedImages={selectedImages}
        onToggleImageSelection={handleToggleImageSelection}
      />
    </div>
  );
});

ImageGrid.displayName = "ImageGrid";

export default ImageGrid;
