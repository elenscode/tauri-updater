import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePatternStore } from "../store/usePatternStore";
import { IMAGE_GRID_MESSAGES } from "../constants/imageGrid";

export const useImageGridActions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generatePatternFromImages, threshold } = usePatternStore();
  const handleCreatePattern = useCallback(
    async (
      selectedImages: Set<string>,
      selectedOption: { value: number | string; label: string }[]
    ) => {
      if (selectedImages.size === 0) return;

      try {
        const selectedImageIds = Array.from(selectedImages);
        const isBinaryMode = selectedOption.length > 0;

        if (isBinaryMode) {
          const binaryOptions = {
            selectedValues: selectedOption.map((opt) => Number(opt.value)),
            isBinary: true,
          };
          console.log(
            IMAGE_GRID_MESSAGES.PATTERN_CREATE_BINARY,
            selectedImageIds,
            binaryOptions
          );
          await generatePatternFromImages(
            selectedImageIds,
            threshold,
            binaryOptions
          );
        } else {
          console.log(
            IMAGE_GRID_MESSAGES.PATTERN_CREATE_NORMAL,
            selectedImageIds
          );
          await generatePatternFromImages(selectedImageIds, threshold);
        }

        navigate("/draw");
      } catch (error) {
        console.error("패턴 생성 중 오류 발생:", error);
        alert(IMAGE_GRID_MESSAGES.PATTERN_ERROR);
      }
    },
    [navigate, generatePatternFromImages, threshold]
  );
  const handleAnalyzeSimilarity = useCallback(
    async (
      selectedImages: Set<string>,
      selectedOption: { value: number | string; label: string }[]
    ) => {
      if (selectedImages.size === 0) return;

      try {
        const selectedImageIds = Array.from(selectedImages);
        const isBinaryMode = selectedOption.length > 0;

        if (isBinaryMode) {
          const binaryOptions = {
            selectedValues: selectedOption.map((opt) => Number(opt.value)),
            isBinary: true,
          };
          console.log(
            IMAGE_GRID_MESSAGES.SIMILARITY_ANALYZE_BINARY,
            selectedImageIds,
            binaryOptions
          );
          await generatePatternFromImages(
            selectedImageIds,
            threshold,
            binaryOptions
          );
        } else {
          console.log(
            IMAGE_GRID_MESSAGES.SIMILARITY_ANALYZE_NORMAL,
            selectedImageIds
          );
          await generatePatternFromImages(selectedImageIds, threshold);
        }
      } catch (error) {
        console.error("패턴 생성 중 오류 발생:", error);
        alert(IMAGE_GRID_MESSAGES.PATTERN_ERROR);
      }
    },
    [generatePatternFromImages, threshold]
  );

  const clearCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["image"] });
    queryClient.removeQueries({ queryKey: ["image"] });
  }, [queryClient]);
  const handleBinarizeImages = useCallback(
    async (
      selectedOption: { value: number | string; label: string }[],
      clearCacheCallback: () => void,
      onComplete: () => void
    ) => {
      if (selectedOption.length === 0) return;

      try {
        // 이진화 모드로 전환 시 캐시 전체 초기화
        clearCacheCallback();

        // 이진화 처리 완료 콜백 실행
        onComplete();

        console.log(
          IMAGE_GRID_MESSAGES.BINARIZE_START,
          selectedOption.map((opt) => opt.value)
        );
      } catch (error) {
        console.error("이진화 처리 중 오류 발생:", error);
        alert(IMAGE_GRID_MESSAGES.BINARIZE_ERROR);
      }
    },
    []
  );

  const getCachedImageCount = useCallback(() => {
    return queryClient.getQueryCache().findAll({ queryKey: ["image"] }).length;
  }, [queryClient]);

  return {
    handleCreatePattern,
    handleAnalyzeSimilarity,
    clearCache,
    handleBinarizeImages,
    getCachedImageCount,
  };
};
