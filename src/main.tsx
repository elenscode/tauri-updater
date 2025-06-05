import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Draw from "./pages/Draw";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./hooks/useTheme";
import "./index.css";
import Gallery from "./pages/Gallery";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="draw" element={<Draw />} />
            <Route path="gallery" element={<Gallery />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
