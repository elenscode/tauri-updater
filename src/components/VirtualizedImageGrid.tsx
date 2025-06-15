import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ImageData } from "../types/image";
import ImageCardWithQuery from "./ImageCardWithQuery";
import {
  IMAGE_GRID_CONFIG,
  IMAGE_GRID_STYLES,
  SCROLLBAR_STYLES,
} from "../constants/imageGrid";

interface VirtualizedImageGridProps {
  images: ImageData[];
  actualImageCount: number;
  columns: number;
  selectedOption: { value: number | string; label: string }[];
  selectedImages: Set<string>;
  onToggleImageSelection: (imageId: string) => void;
}

const VirtualizedImageGrid: React.FC<VirtualizedImageGridProps> = ({
  images,
  actualImageCount,
  columns,
  selectedOption,
  selectedImages,
  onToggleImageSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isBinaryMode = selectedOption.length > 0;

  const ITEM_HEIGHT = IMAGE_GRID_CONFIG.ITEM_HEIGHT;
  const GAP = IMAGE_GRID_CONFIG.GAP;
  const OVERSCAN = IMAGE_GRID_CONFIG.OVERSCAN;

  const rowCount = Math.ceil(actualImageCount / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ITEM_HEIGHT + GAP,
    overscan: OVERSCAN,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      className={IMAGE_GRID_STYLES.SCROLL_CONTAINER}
      style={SCROLLBAR_STYLES}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const rowImages: ImageData[] = [];
          for (let col = 0; col < columns; col++) {
            const imageIndex = virtualRow.index * columns + col;
            if (imageIndex < actualImageCount) {
              rowImages.push(images[imageIndex]);
            }
          }

          if (rowImages.length === 0) {
            return null;
          }

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${GAP}px`,
                paddingBottom: `${GAP}px`,
              }}
            >
              {rowImages.map((imageData) => (
                <ImageCardWithQuery
                  key={imageData.id}
                  imageData={imageData}
                  images={images}
                  isBinaryMode={isBinaryMode}
                  selectedOption={selectedOption}
                  isSelected={selectedImages.has(imageData.id)}
                  onToggleSelection={() => onToggleImageSelection(imageData.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedImageGrid;
