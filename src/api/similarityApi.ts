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
