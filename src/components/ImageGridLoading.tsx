import React from "react";
import { IMAGE_GRID_STYLES, IMAGE_GRID_MESSAGES } from "../constants/imageGrid";

interface ImageGridLoadingProps {
  message?: string;
}

const ImageGridLoading: React.FC<ImageGridLoadingProps> = ({
  message = IMAGE_GRID_MESSAGES.LOADING,
}) => {
  return (
    <div className={IMAGE_GRID_STYLES.LOADING_CONTAINER}>
      <div className={IMAGE_GRID_STYLES.LOADING_CONTENT}>
        <div className={IMAGE_GRID_STYLES.LOADING_SPINNER}></div>
        <p className={IMAGE_GRID_STYLES.LOADING_TEXT}>{message}</p>
      </div>
    </div>
  );
};

export default ImageGridLoading;
