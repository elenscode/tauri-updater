// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod image_generator;

use image_generator::{ImageGenerator, ImageResult};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            generate_image_from_data,
            generate_custom_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
