import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  ColDef,
  colorSchemeDarkBlue,
  themeMaterial,
  ICellRendererParams,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { AgGridReact } from "ag-grid-react";
import { ImageData } from "../types/image";
import { useImageDataStore } from "../store/useImageDataStore";
import { useTheme } from "../hooks/useTheme";
import { useImageData } from "./ImageCardWithQuery";

ModuleRegistry.registerModules([AllCommunityModule]);

// Mock API for similarity calculation
const calculateSimilarity = async (imageId: string): Promise<number> => {
  // 실제 유사도 계산을 시뮬레이션 (1-3초 랜덤 지연)
  const delay = Math.random() * 2000 + 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // imageId 기반으로 시드를 생성하여 일관된 유사도 값 생성
  const seed = imageId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = ((seed * 9301 + 49297) % 233280) / 233280; // 간단한 시드 기반 랜덤

  // 0.5 ~ 1.0 사이의 유사도 값 생성
  return random * 0.5 + 0.5;
};

// 유사도 계산 훅 (enabled 파라미터로 수동 제어)
const useSimilarityCalculation = (
  imageId: string,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ["similarity", imageId],
    queryFn: () => calculateSimilarity(imageId),
    staleTime: Infinity, // 한번 계산하면 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분
    enabled: enabled && !!imageId,
    retry: 2,
  });
};

// 유사도 셀 렌더러 컴포넌트
const SimilarityCellRenderer: React.FC<
  ICellRendererParams<ImageData> & { calculationStarted: boolean }
> = ({ data, calculationStarted }) => {
  // 계산이 시작되었고 이미지 ID가 있을 때만 쿼리 활성화
  const shouldCalculate = calculationStarted && !!data?.id;

  const {
    data: calculatedSimilarity,
    isLoading,
    error,
  } = useSimilarityCalculation(data?.id || "", shouldCalculate);

  // 계산이 시작되지 않은 경우
  if (!calculationStarted) {
    // 기존 similarity 값이 있다면 표시
    if (data?.similarity !== undefined) {
      const percentage =
        typeof data.similarity === "number"
          ? (data.similarity * 100).toFixed(1)
          : data.similarity;
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-600">{percentage}%</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400 text-sm">대기중</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">계산 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-red-500">오류</span>
      </div>
    );
  }

  if (calculatedSimilarity !== undefined) {
    const percentage = (calculatedSimilarity * 100).toFixed(1);
    const colorClass =
      calculatedSimilarity >= 0.8
        ? "text-green-600"
        : calculatedSimilarity >= 0.6
        ? "text-yellow-600"
        : "text-red-600";

    return (
      <div className="flex items-center justify-center h-full">
        <span className={`font-medium ${colorClass}`}>{percentage}%</span>
      </div>
    );
  }

  // 기존 similarity 값이 있다면 표시
  if (data?.similarity !== undefined) {
    const percentage =
      typeof data.similarity === "number"
        ? (data.similarity * 100).toFixed(1)
        : data.similarity;
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-600">{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-gray-400">-</span>
    </div>
  );
};

// Wafer 이미지 셀 렌더러 컴포넌트
const WaferImageCellRenderer: React.FC<ICellRendererParams<ImageData>> = ({
  data,
}) => {
  const images = useImageDataStore((state) => state.images);

  const { data: imageUrl, isLoading } = useImageData(
    data?.id || "",
    images,
    undefined, // binary 옵션 없이 일반 데이터로 렌더링
    !!data?.id
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No Image
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-1">
      <img
        src={imageUrl}
        alt={`Wafer ${data?.waferid}`}
        className="max-w-full max-h-full object-contain rounded"
        onError={(e) => {
          e.currentTarget.src = "https://via.placeholder.com/64x64?text=Error";
        }}
      />
    </div>
  );
};

const SimDataGrid = React.memo(() => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  // DataGrid에 필요한 상태만 선택적으로 구독
  const searchResults = useImageDataStore((state) => state.searchResults);
  const selectedGridItems = useImageDataStore(
    (state) => state.selectedGridItems
  );
  const setSelectedGridItems = useImageDataStore(
    (state) => state.setSelectedGridItems
  );
  const setSearchResults = useImageDataStore((state) => state.setSearchResults);
  // 유사도 계산 상태 관리
  const [isCalculatingAll, setIsCalculatingAll] = useState(false);
  const [calculationStarted, setCalculationStarted] = useState(false);
  const [similarityProgress, setSimilarityProgress] = useState<{
    completed: number;
    total: number;
    calculating: Set<string>;
  }>({ completed: 0, total: 0, calculating: new Set() });

  // QueryClient에서 실제 완료된 계산 상태 확인
  const checkCompletedCalculations = useCallback(() => {
    if (searchResults.length === 0) {
      setSimilarityProgress({ completed: 0, total: 0, calculating: new Set() });
      return;
    }

    const total = searchResults.length;
    let completed = 0;
    const calculating = new Set<string>();

    searchResults.forEach((item) => {
      const queryKey = ["similarity", item.id];
      const queryState = queryClient.getQueryState(queryKey);

      if (queryState?.status === "success") {
        completed++;
      } else if (queryState?.status === "pending") {
        calculating.add(item.id);
      } else if (item.similarity !== undefined) {
        // 기존에 similarity 값이 있는 경우
        completed++;
      }
    });

    setSimilarityProgress({ completed, total, calculating });
  }, [searchResults, queryClient]);

  // 진행률 업데이트를 위한 effect
  useEffect(() => {
    checkCompletedCalculations();

    // 일정 간격으로 진행률 체크 (계산 중일 때만)
    if (isCalculatingAll || similarityProgress.calculating.size > 0) {
      const interval = setInterval(checkCompletedCalculations, 500);
      return () => clearInterval(interval);
    }
  }, [
    searchResults,
    isCalculatingAll,
    checkCompletedCalculations,
    similarityProgress.calculating.size,
  ]);
  // 전체 유사도 계산 시작
  const startSimilarityCalculation = useCallback(async () => {
    setIsCalculatingAll(true);
    setCalculationStarted(true); // 계산 시작 표시

    try {
      // 모든 이미지에 대해 유사도 계산 쿼리를 프리페치
      const promises = searchResults.map(async (item) => {
        const queryKey = ["similarity", item.id];

        // 이미 계산된 경우 스킵
        const existingData = queryClient.getQueryData(queryKey);
        if (existingData) return existingData;

        // 유사도 계산 실행
        return queryClient.fetchQuery({
          queryKey,
          queryFn: () => calculateSimilarity(item.id),
          staleTime: Infinity,
        });
      });

      // 모든 계산 완료 대기
      const results = await Promise.all(promises);
      // 계산 결과를 searchResults에 반영
      const updatedResults = searchResults.map((item, index) => ({
        ...item,
        similarity: results[index] as number,
      }));

      setSearchResults(updatedResults);
    } catch (error) {
      console.error("유사도 계산 중 오류 발생:", error);
    } finally {
      setIsCalculatingAll(false);
    }
  }, [searchResults, queryClient, setSearchResults]);

  // Custom Theme: Defines the grid's theme.
  const customTheme = useMemo(() => {
    return theme === "dark"
      ? themeMaterial.withPart(colorSchemeDarkBlue)
      : themeMaterial;
  }, [theme]);
  // Column Definitions: Defines & controls grid columns.
  const colDefs = useMemo<ColDef<ImageData>[]>(
    () => [
      {
        field: "waferImage",
        headerName: "Wafer 이미지",
        width: 120,
        cellRenderer: WaferImageCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: "ag-cell-center",
      },
      {
        field: "lotid",
        headerName: "Lot ID",
        width: 100,
        cellStyle: {
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
        },
      },
      {
        field: "waferid",
        headerName: "Wafer ID",
        width: 100,
        cellClass: "ag-cell-center",
      },
      {
        field: "endtime",
        headerName: "종료 시간",
        width: 150,
        valueFormatter: (params) => {
          const date = new Date(params.value);
          return date.toLocaleString(); // ISO 8601 형식의 날짜 문자열을 로컬 시간으로 변환
        },
        cellClass: "ag-cell-center",
      },
      {
        field: "similarity",
        headerName: "유사도",
        width: 120,
        cellRenderer: SimilarityCellRenderer,
        cellRendererParams: {
          calculationStarted: calculationStarted,
        },
        sortable: true,
        filter: false,
      },
    ],
    [calculationStarted]
  );
  const defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: true,
    cellClass: "ag-cell-center",
  };

  // 행 높이 설정 (이미지 표시를 위해)
  const rowHeight = 150;

  // 선택 변경 핸들러
  const onSelectionChanged = useCallback(
    (event: any) => {
      const selectedRows = event.api.getSelectedRows();
      const selectedIds = new Set<string>(
        selectedRows.map((row: ImageData) => row.id)
      );
      setSelectedGridItems(selectedIds);
    },
    [setSelectedGridItems]
  );

  // 그리드 준비 완료 시 초기 선택 상태 설정
  const onGridReady = useCallback(
    (params: any) => {
      // 선택된 항목이 있다면 그리드에 반영
      if (selectedGridItems.size > 0) {
        params.api.forEachNode((node: any) => {
          if (selectedGridItems.has(node.data.id)) {
            node.setSelected(true);
          }
        });
      }
    },
    [selectedGridItems]
  );

  // Container: Defines the grid's theme & dimensions.
  return (
    <div className="w-full h-full flex flex-col">
      {/* 유사도 계산 컨트롤 및 진행률 표시 */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
        {/* 상단: 버튼과 상태 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={startSimilarityCalculation}
              disabled={isCalculatingAll || searchResults.length === 0}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isCalculatingAll || searchResults.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isCalculatingAll ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  계산 중...
                </div>
              ) : (
                "유사도 계산"
              )}
            </button>

            {searchResults.length > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                총 {searchResults.length}개 이미지
              </span>
            )}
          </div>

          {similarityProgress.total > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {similarityProgress.completed} / {similarityProgress.total} 완료
            </span>
          )}
        </div>

        {/* 진행률 바 (계산 중이거나 진행률이 있을 때만 표시) */}
        {(isCalculatingAll || similarityProgress.total > 0) && (
          <div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    similarityProgress.total > 0
                      ? (similarityProgress.completed /
                          similarityProgress.total) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {similarityProgress.total > 0
                  ? `${(
                      (similarityProgress.completed /
                        similarityProgress.total) *
                      100
                    ).toFixed(1)}% 완료`
                  : "0% 완료"}
              </div>
              {similarityProgress.calculating.size > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {similarityProgress.calculating.size}개 계산 중
                </div>
              )}
            </div>
          </div>
        )}
      </div>{" "}
      {/* AG Grid */}
      <div className="flex-1">
        <style>{`
          .ag-cell-center {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .ag-cell-center .ag-cell-wrapper {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
        <AgGridReact
          rowData={searchResults}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          rowHeight={rowHeight}
          rowSelection={{
            mode: "multiRow",
          }}
          theme={customTheme}
          onSelectionChanged={onSelectionChanged}
          onGridReady={onGridReady}
          className="w-full h-full"
        />
      </div>
    </div>
  );
});

SimDataGrid.displayName = "SimDataGrid";
export default SimDataGrid;
