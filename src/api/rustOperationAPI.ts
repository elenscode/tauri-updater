import { invoke } from '@tauri-apps/api/core';

export interface SimilarityResult {
    image_id: string;
    similarity: number;
}

export interface CacheStatus {
    count: number;
    image_ids: string[];
}

/**
 * Initialize the similarity dataset cache in Rust backend
 */
export async function initializeSimilarityDataset(): Promise<string> {
    try {
        return await invoke<string>('initialize_similarity_dataset');
    } catch (error) {
        console.error('Failed to initialize similarity dataset:', error);
        throw error;
    }
}

/**
 * Cache image features in Rust backend
 */
export async function cacheImageFeatures(
    imageId: string,
    points: Array<[number, number, number]>
): Promise<string> {
    try {
        return await invoke<string>('cache_image_features', {
            imageId,
            points
        });
    } catch (error) {
        console.error(`Failed to cache features for image ${imageId}:`, error);
        throw error;
    }
}

/**
 * Calculate similarities between selected images and all cached images
 */
export async function calculateImageSimilarities(
    selectedImageIds: string[]
): Promise<SimilarityResult[]> {
    try {
        return await invoke<SimilarityResult[]>('calculate_image_similarities', {
            selectedImageIds
        });
    } catch (error) {
        console.error('Failed to calculate similarities:', error);
        throw error;
    }
}

/**
 * Get current cache status
 */
export async function getSimilarityCacheStatus(): Promise<CacheStatus> {
    try {
        const [count, imageIds] = await invoke<[number, string[]]>('get_similarity_cache_status');
        return { count, image_ids: imageIds };
    } catch (error) {
        console.error('Failed to get cache status:', error);
        throw error;
    }
}

/**
 * Get cached image URL from Rust backend
 */
export async function getCachedImageUrl(imageId: string): Promise<string | null> {
    try {
        return await invoke<string | null>('get_cached_image_url', { imageId });
    } catch (error) {
        console.error(`Failed to get cached image URL for ${imageId}:`, error);
        throw error;
    }
}

/**
 * Cache image URL in Rust backend
 */
export async function cacheImageUrl(imageId: string, url: string): Promise<string> {
    try {
        return await invoke<string>('cache_image_url', { imageId, url });
    } catch (error) {
        console.error(`Failed to cache image URL for ${imageId}:`, error);
        throw error;
    }
}

/**
 * Clear image cache in Rust backend
 */
export async function clearImageCache(): Promise<string> {
    try {
        return await invoke<string>('clear_image_cache');
    } catch (error) {
        console.error('Failed to clear image cache:', error);
        throw error;
    }
}

/**
 * Get image cache status from Rust backend
 */
export async function getImageCacheStatus(): Promise<CacheStatus> {
    try {
        const [count, imageIds] = await invoke<[number, string[]]>('get_image_cache_status');
        return { count, image_ids: imageIds };
    } catch (error) {
        console.error('Failed to get image cache status:', error);
        throw error;
    }
}

/**
 * Get cached points data for an image from Rust backend
 */
export async function getCachedPoints(imageId: string): Promise<Array<[number, number, number]> | null> {
    try {
        const points = await invoke<Array<[number, number, number]> | null>('get_cached_points', { imageId });
        return points;
    } catch (error) {
        console.error(`Failed to get cached points for ${imageId}:`, error);
        throw error;
    }
}

/**
 * Check if image features are cached in Rust backend
 */
export async function hasCachedFeatures(imageId: string): Promise<boolean> {
    try {
        return await invoke<boolean>('has_cached_features', { imageId });
    } catch (error) {
        console.error(`Failed to check cached features for ${imageId}:`, error);
        throw error;
    }
}
