import reactLogo from "./assets/react.svg";
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from "react";

function LearnMoreSection() {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    const fetchVersion = async () => {
      const version = await getVersion();
      setAppVersion(version);
    };
    fetchVersion();
  }, []);

  return (
    <div className="row">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" rel="noreferrer">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <p>
        Recommended IDE setup:{" "}
        <a href="https://code.visualstudio.com/" target="_blank" rel="noreferrer">
          VS Code
        </a>{" "}
        +{" "}
        <a href="https://github.com/tauri-apps/tauri-vscode" target="_blank" rel="noreferrer">
          Tauri
        </a>{" "}
        +{" "}
        <a href="https://github.com/rust-lang/rust-analyzer" target="_blank" rel="noreferrer">
          rust-analyzer
        </a>
        .
      </p>
      <p>Current app version: {appVersion}</p>
    </div>
  );
}

export default LearnMoreSection;
