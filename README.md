# Tauri Image Generator & Data Visualizer

## Description

This project is a cross-platform desktop application built using Tauri (Rust backend) and React (TypeScript frontend). It is designed to fetch numerical data points, generate images based on this data, and display these images within the user interface. The application can source data either from a local API endpoint or by using pre-defined sample data.

Alongside image visualization, it features an AG Grid component to display tabular data. The application also includes an auto-update mechanism to ensure users can easily access the latest version.

## Features

-   **Data-Driven Image Generation:** Creates images dynamically from sets of (x, y, value) data points.
-   **Flexible Data Sourcing:** Fetches data from a local API endpoint (`http://localhost:3000/generator`) or utilizes built-in sample data for demonstration and testing.
-   **Integrated Image Display:** Shows the generated images directly within the application's UI.
-   **Tabular Data Visualization:** Employs AG Grid to present data in a sortable and filterable table.
-   **Cross-Platform Compatibility:** Built with Tauri, enabling it to run on Windows, macOS, and Linux.
-   **Auto-Update Functionality:** Automatically checks for and installs application updates.

## Tech Stack

-   **Frontend:**
    -   React
    -   TypeScript
    -   Vite
    -   AG Grid
    -   DaisyUI
    -   Tailwind CSS
-   **Backend:**
    -   Rust
    -   Tauri
-   **Image Processing:**
    -   Rust `image` crate
-   **API Communication:**
    -   `reqwest` (Rust HTTP Client)

## Prerequisites

Before you begin, ensure you have the following installed:

-   Node.js (which includes npm) and pnpm (recommended, or yarn)
    -   *pnpm can be installed with `npm install -g pnpm`*
-   Rust and Cargo (Rust's package manager and build tool)
    -   *Installation instructions: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)*
-   Tauri CLI
    -   Install using Cargo: `cargo install tauri-cli`

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    *(Replace `<repository-url>` and `<repository-directory>` with the actual URL and directory name)*

2.  **Install frontend dependencies:**
    ```bash
    pnpm install
    ```
    *(If you prefer npm or yarn, use `npm install` or `yarn install` respectively)*

3.  **Install Rust dependencies and build the application:**
    Running `cargo build` in the `src-tauri` directory, or a `cargo tauri dev/build` command will fetch Rust dependencies and build the application.
    ```bash
    cd src-tauri
    cargo build
    cd ..
    ```
    *(Alternatively, `cargo tauri build` will handle both frontend and backend build steps after frontend dependencies are installed.)*

## Usage

### Development Mode

To run the application in development mode with hot-reloading:

1.  **Ensure the frontend development server is running (if not automatically started by Tauri):**
    In the project root directory:
    ```bash
    pnpm dev
    ```
    *(Or `npm run dev` / `yarn dev`)*

2.  **Start the Tauri application:**
    In a separate terminal (or the same if the above is not needed), from the project root directory:
    ```bash
    cargo tauri dev
    ```

### Production Build

To build the application for production:

1.  **Build the application:**
    In the project root directory:
    ```bash
    cargo tauri build
    ```
2.  The bundled application installer (e.g., MSI for Windows, .dmg for macOS, .deb/.AppImage for Linux) will be located in `src-tauri/target/release/bundle/`.

## Project Structure

A simplified overview of the key directories and files:

```
.
├── public/                 # Static assets for the frontend
├── src/                    # React frontend code
│   ├── App.tsx             # Main application React component
│   ├── components/         # Reusable React components (e.g., ImageGrid_fixed.tsx)
│   └── main.tsx            # Frontend entry point
├── src-tauri/              # Rust backend and Tauri configuration
│   ├── Cargo.toml          # Rust dependencies and package information
│   ├── src/                # Rust source code
│   │   ├── image_generator.rs # Core logic for image generation
│   │   └── main.rs         # Rust application entry point (lib.rs for library part)
│   └── tauri.conf.json     # Tauri application configuration
├── package.json            # Frontend dependencies and scripts
├── README.md               # This file
└── vite.config.ts          # Vite configuration
```

## License

This project does not currently have a `LICENSE` file. It is recommended to add one, for example, the MIT License.
