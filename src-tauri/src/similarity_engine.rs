use ndarray::Array1;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilarityResult {
    pub image_id: String,
    pub similarity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatrixData {
    pub image_id: String,
    pub features: Vec<f64>,
}

// Global cache for storing image feature matrices
static FEATURE_CACHE: Mutex<Option<HashMap<String, Array1<f64>>>> = Mutex::new(None);

pub struct SimilarityEngine;

impl SimilarityEngine {
    /// Initialize the dataset cache (clear existing data)
    pub fn initialize_dataset() -> Result<(), String> {
        let mut cache = FEATURE_CACHE
            .lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;
        *cache = Some(HashMap::new());
        println!("Dataset cache initialized");
        Ok(())
    }

    /// Cache feature matrix for an image
    pub fn cache_features(image_id: String, points: Vec<(f32, f32, f32)>) -> Result<(), String> {
        let features = Self::extract_features_from_points(&points)?;

        let mut cache = FEATURE_CACHE
            .lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;
        if cache.is_none() {
            *cache = Some(HashMap::new());
        }

        if let Some(ref mut cache_map) = cache.as_mut() {
            cache_map.insert(image_id.clone(), features);
            println!("Cached features for image: {}", image_id);
        }

        Ok(())
    }

    /// Calculate cosine similarity between selected images and all cached images
    pub fn calculate_similarities(
        selected_image_ids: Vec<String>,
    ) -> Result<Vec<SimilarityResult>, String> {
        let cache = FEATURE_CACHE
            .lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;

        if selected_image_ids.is_empty() {
            return Err("No selected images provided".to_string());
        }

        let cache_map = cache.as_ref().ok_or("Cache not initialized")?;

        // Get features for selected images
        let mut selected_features = Vec::new();
        for id in &selected_image_ids {
            if let Some(features) = cache_map.get(id) {
                selected_features.push(features.clone());
            } else {
                return Err(format!("Features not found for selected image: {}", id));
            }
        }

        // Calculate average feature vector for selected images
        let avg_features = Self::calculate_average_features(&selected_features)?;

        // Calculate similarities with all cached images
        let mut results = Vec::new();
        for (image_id, features) in cache_map.iter() {
            if !selected_image_ids.contains(image_id) {
                let similarity = Self::cosine_similarity(&avg_features, features)?;
                results.push(SimilarityResult {
                    image_id: image_id.clone(),
                    similarity,
                });
            }
        }

        // Sort by similarity in descending order
        results.sort_by(|a, b| {
            b.similarity
                .partial_cmp(&a.similarity)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        Ok(results)
    }

    /// Extract features from point data
    fn extract_features_from_points(points: &[(f32, f32, f32)]) -> Result<Array1<f64>, String> {
        if points.is_empty() {
            return Err("No points provided".to_string());
        }

        // Create a simple feature vector based on point statistics
        let mut features = Vec::new();

        // Basic statistical features
        let x_values: Vec<f32> = points.iter().map(|(x, _, _)| *x).collect();
        let y_values: Vec<f32> = points.iter().map(|(_, y, _)| *y).collect();
        let value_values: Vec<f32> = points.iter().map(|(_, _, v)| *v).collect();

        // Mean values
        features.push(x_values.iter().sum::<f32>() as f64 / x_values.len() as f64);
        features.push(y_values.iter().sum::<f32>() as f64 / y_values.len() as f64);
        features.push(value_values.iter().sum::<f32>() as f64 / value_values.len() as f64);

        // Standard deviation
        let x_mean = features[0];
        let y_mean = features[1];
        let val_mean = features[2];

        let x_variance = x_values
            .iter()
            .map(|x| (*x as f64 - x_mean).powi(2))
            .sum::<f64>()
            / x_values.len() as f64;
        let y_variance = y_values
            .iter()
            .map(|y| (*y as f64 - y_mean).powi(2))
            .sum::<f64>()
            / y_values.len() as f64;
        let val_variance = value_values
            .iter()
            .map(|v| (*v as f64 - val_mean).powi(2))
            .sum::<f64>()
            / value_values.len() as f64;

        features.push(x_variance.sqrt());
        features.push(y_variance.sqrt());
        features.push(val_variance.sqrt());

        // Min/Max values
        features.push(
            *x_values
                .iter()
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap() as f64,
        );
        features.push(
            *x_values
                .iter()
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap() as f64,
        );
        features.push(
            *y_values
                .iter()
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap() as f64,
        );
        features.push(
            *y_values
                .iter()
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap() as f64,
        );
        features.push(
            *value_values
                .iter()
                .min_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap() as f64,
        );
        features.push(
            *value_values
                .iter()
                .max_by(|a, b| a.partial_cmp(b).unwrap())
                .unwrap() as f64,
        );

        // Point density features (number of points)
        features.push(points.len() as f64);

        // Create histogram-like features (divide space into grid and count points)
        let grid_size = 10;
        let x_min = *x_values
            .iter()
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap();
        let x_max = *x_values
            .iter()
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap();
        let y_min = *y_values
            .iter()
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap();
        let y_max = *y_values
            .iter()
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap();

        let x_step = if x_max > x_min {
            (x_max - x_min) / grid_size as f32
        } else {
            1.0
        };
        let y_step = if y_max > y_min {
            (y_max - y_min) / grid_size as f32
        } else {
            1.0
        };

        for i in 0..grid_size {
            for j in 0..grid_size {
                let x_start = x_min + i as f32 * x_step;
                let x_end = x_min + (i + 1) as f32 * x_step;
                let y_start = y_min + j as f32 * y_step;
                let y_end = y_min + (j + 1) as f32 * y_step;

                let count = points
                    .iter()
                    .filter(|(x, y, _)| *x >= x_start && *x < x_end && *y >= y_start && *y < y_end)
                    .count();

                features.push(count as f64);
            }
        }

        Ok(Array1::from(features))
    }

    /// Calculate average feature vector from multiple feature vectors
    fn calculate_average_features(features_list: &[Array1<f64>]) -> Result<Array1<f64>, String> {
        if features_list.is_empty() {
            return Err("No features provided".to_string());
        }

        let feature_size = features_list[0].len();
        let mut avg_features = Array1::zeros(feature_size);

        for features in features_list {
            if features.len() != feature_size {
                return Err("Feature vectors have different sizes".to_string());
            }
            avg_features = avg_features + features;
        }

        avg_features = avg_features / features_list.len() as f64;
        Ok(avg_features)
    }

    /// Calculate cosine similarity between two feature vectors
    fn cosine_similarity(a: &Array1<f64>, b: &Array1<f64>) -> Result<f64, String> {
        if a.len() != b.len() {
            return Err("Feature vectors must have the same length".to_string());
        }

        let dot_product = a.dot(b);
        let norm_a = (a.dot(a)).sqrt();
        let norm_b = (b.dot(b)).sqrt();

        if norm_a == 0.0 || norm_b == 0.0 {
            return Ok(0.0);
        }

        Ok(dot_product / (norm_a * norm_b))
    }
    /// Get current cache status
    pub fn get_cache_status() -> Result<(usize, Vec<String>), String> {
        let cache = FEATURE_CACHE
            .lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;

        if let Some(cache_map) = cache.as_ref() {
            let count = cache_map.len();
            let image_ids: Vec<String> = cache_map.keys().cloned().collect();
            Ok((count, image_ids))
        } else {
            Ok((0, Vec::new()))
        }
    }
}
