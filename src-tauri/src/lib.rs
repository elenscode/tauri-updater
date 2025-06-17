// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod image_generator;
mod similarity_engine;

use image_generator::{ImageGenerator, ImageResult};
use similarity_engine::{SimilarityEngine, SimilarityResult};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn generate_image_from_data(image_key: String) -> Result<ImageResult, String> {
    let generator = ImageGenerator::default();
    generator.generate_image_from_data(image_key).await
}

#[tauri::command]
async fn generate_custom_image(
    image_key: String,
    width: Option<u32>,
    height: Option<u32>,
) -> Result<ImageResult, String> {
    let generator = ImageGenerator::new(width.unwrap_or(150), height.unwrap_or(150));
    generator.generate_image_from_data(image_key).await
}

#[tauri::command]
async fn initialize_similarity_dataset() -> Result<String, String> {
    SimilarityEngine::initialize_dataset()?;
    Ok("Dataset initialized successfully".to_string())
}

#[tauri::command]
async fn cache_image_features(
    image_id: String,
    points: Vec<(f32, f32, f32)>,
) -> Result<String, String> {
    SimilarityEngine::cache_features(image_id.clone(), points)?;
    Ok(format!("Features cached for image: {}", image_id))
}

#[tauri::command]
async fn calculate_image_similarities(
    selected_image_ids: Vec<String>,
) -> Result<Vec<SimilarityResult>, String> {
    SimilarityEngine::calculate_similarities(selected_image_ids)
}

#[tauri::command]
async fn get_similarity_cache_status() -> Result<(usize, Vec<String>), String> {
    SimilarityEngine::get_cache_status()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            generate_image_from_data,
            generate_custom_image,
            initialize_similarity_dataset,
            cache_image_features,
            calculate_image_similarities,
            get_similarity_cache_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
