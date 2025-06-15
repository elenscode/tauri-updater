import React from "react";
import MultiSelect from "./MultiSelect";
import {
  IMAGE_GRID_CONFIG,
  IMAGE_GRID_STYLES,
  STATUS_BADGE_STYLES,
  BUTTON_STYLES,
  IMAGE_GRID_LABELS,
  generateBinOptions,
} from "../constants/imageGrid";

interface ImageGridHeaderProps {
  actualImageCount: number;
  selectedImages: Set<string>;
  selectedOption: { value: number | string; label: string }[];
  columns: number;
  getCachedImageCount: () => number;
  onClearCache: () => void;
  onClearSelection: () => void;
  onCreatePattern: () => void;
  onColumnsChange: (columns: number) => void;
  onOptionChange: (
    options: { value: number | string; label: string }[]
  ) => void;
}

const ImageGridHeader: React.FC<ImageGridHeaderProps> = ({
  actualImageCount,
  selectedImages,
  selectedOption,
  columns,
  getCachedImageCount,
  onClearCache,
  onClearSelection,
  onCreatePattern,
  onColumnsChange,
  onOptionChange,
}) => {
  const options = generateBinOptions();
  const isBinaryMode = selectedOption.length > 0;

  return (
    <div className={IMAGE_GRID_STYLES.HEADER_CONTAINER}>
      <div className={IMAGE_GRID_STYLES.HEADER_FLEX}>
        {/* 상태 표시 영역 */}
        <div className={IMAGE_GRID_STYLES.STATUS_CONTAINER}>
          <span
            className={`${IMAGE_GRID_STYLES.STATUS_BADGE} ${STATUS_BADGE_STYLES.IMAGE_COUNT}`}
          >
            {IMAGE_GRID_LABELS.IMAGE_COUNT} {actualImageCount}
            {IMAGE_GRID_LABELS.COUNT_UNIT}
          </span>
          <button
            className={BUTTON_STYLES.CACHE_CLEAR}
            onClick={onClearCache}
            disabled={getCachedImageCount() === 0}
            title={IMAGE_GRID_LABELS.CACHE_CLEAR_TOOLTIP}
          >
            {IMAGE_GRID_LABELS.CACHE_CLEAR}
          </button>
          <span
            className={`${IMAGE_GRID_STYLES.STATUS_BADGE} ${STATUS_BADGE_STYLES.SELECTED_COUNT}`}
          >
            {IMAGE_GRID_LABELS.SELECTED_COUNT} {selectedImages.size}
            {IMAGE_GRID_LABELS.COUNT_UNIT}
          </span>
          <button
            className={BUTTON_STYLES.SELECTION_CLEAR}
            onClick={onClearSelection}
            disabled={selectedImages.size === 0}
          >
            {IMAGE_GRID_LABELS.SELECTION_CLEAR}
          </button>
        </div>

        {/* BIN 선택 */}
        <MultiSelect
          value={selectedOption}
          options={options}
          onChange={onOptionChange}
          placeholder={IMAGE_GRID_LABELS.BIN_SELECT_PLACEHOLDER}
        />

        {/* 액션 버튼들 */}
        <div className={IMAGE_GRID_STYLES.BUTTON_CONTAINER}>
          <button
            onClick={onCreatePattern}
            disabled={
              selectedImages.size === 0 ||
              (isBinaryMode && selectedOption.length === 0)
            }
            className={BUTTON_STYLES.CREATE_PATTERN}
          >
            {IMAGE_GRID_LABELS.CREATE_PATTERN}
          </button>
        </div>

        {/* 컬럼 선택 */}
        <div className={IMAGE_GRID_STYLES.COLUMN_SELECT_CONTAINER}>
          <label
            htmlFor="columns-select"
            className={IMAGE_GRID_STYLES.COLUMN_SELECT_LABEL}
          >
            {IMAGE_GRID_LABELS.COLUMN_LABEL}
          </label>
          <select
            id="columns-select"
            value={columns}
            onChange={(e) => onColumnsChange(Number(e.target.value))}
            className={IMAGE_GRID_STYLES.COLUMN_SELECT}
          >
            {IMAGE_GRID_CONFIG.COLUMN_OPTIONS.map((num) => (
              <option key={num} value={num}>
                {num}
                {IMAGE_GRID_LABELS.COUNT_UNIT}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ImageGridHeader;
