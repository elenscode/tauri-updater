import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { ImageData } from "../types/image";
import { generateImageDataUrlFromPoints } from "../utils/imageUtils";
import SkeletonCard from "./SkeletonCard";
import { fetchPointData } from "../api/imageGenerator";
import { IMAGE_GRID_CONFIG, createImageQueryKey } from "../constants/imageGrid";

// 이미지 데이터를 가져오는 함수
const fetchImageData = async (
  imageId: string,
  images: ImageData[],
  binaryOptions?: { selectedValues: number[]; isBinary: boolean }
): Promise<string> => {
  const imageData = images.find((img) => img.id === imageId);
  if (imageData && imageData.url && !binaryOptions?.isBinary) {
    return imageData.url;
  }

  const points = await fetchPointData(imageId);
  return await generateImageDataUrlFromPoints(
    points,
    undefined,
    undefined,
    binaryOptions
  );
};

// 이미지 로딩을 위한 커스텀 훅 (export하여 다른 컴포넌트에서도 사용 가능)
export const useImageData = (
  imageId: string,
  images: ImageData[],
  binaryOptions?: { selectedValues: number[]; isBinary: boolean },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: createImageQueryKey(imageId, binaryOptions),
    queryFn: () => fetchImageData(imageId, images, binaryOptions),
    staleTime: IMAGE_GRID_CONFIG.QUERY_STALE_TIME,
    gcTime: IMAGE_GRID_CONFIG.QUERY_GC_TIME,
    enabled: enabled && !!imageId,
  });
};

// 이미지 카드 컴포넌트 (TanStack Query 사용)
interface ImageCardWithQueryProps {
  imageData: ImageData;
  images: ImageData[];
  isBinaryMode: boolean;
  selectedOption: { value: number | string; label: string }[];
  isSelected: boolean;
  onToggleSelection: () => void;
}

const ImageCardWithQuery: React.FC<ImageCardWithQueryProps> = ({
  imageData,
  images,
  isBinaryMode,
  selectedOption,
  isSelected,
  onToggleSelection,
}) => {
  const binaryOptions = isBinaryMode
    ? {
        selectedValues: selectedOption.map((opt) => Number(opt.value)),
        isBinary: true,
      }
    : undefined;

  const { data: cachedUrl, isLoading } = useImageData(
    imageData.id,
    images,
    binaryOptions
  );

  return (
    <SkeletonCard
      imageData={imageData}
      isLoading={isLoading}
      cachedUrl={cachedUrl}
      isSelected={isSelected}
      onToggleSelection={onToggleSelection}
    />
  );
};

export default ImageCardWithQuery;
