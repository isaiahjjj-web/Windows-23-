import React, { useState } from "react";
import BootScreen from "./components/BootScreen";
import Desktop from "./components/Desktop";
import Cursor from "./components/Cursor";
import Search from "./components/Search";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import Explorer from "./components/Explorer";
import PublicEditor from "./components/PublicEditor";
import UpdateSubscribe from "./components/SubscribePrompt"; // ✅ import the subscription component
import "./index.css";

import wallpaper1 from "./assets/images/wallpaper1.jpg";
import wallpaper2 from "./assets/images/wallpaper2.jpg";
import wallpaper3 from "./assets/images/wallpaper3.jpg";

export default function App() {
  const [bootFinished, setBootFinished] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // "register" | "login" | null
  const [selectedWallpaper, setSelectedWallpaper] = useState(wallpaper1);

  const wallpapers = [wallpaper1, wallpaper2, wallpaper3];

  const handleLoginOrRegister = (loggedUser) => {
    setUser(loggedUser);
    setBootFinished(true);
  };

  // === 1️⃣ Login/Register choice screen ===
  if (!user && !activeForm) {
    return (
      <div className="auth-selection" style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Welcome to WebBro OS</h2>
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setActiveForm("register")}
            style={{ marginRight: "20px", padding: "10px 20px", fontSize: "16px" }}
          >
            Register
          </button>
          <button
            onClick={() => setActiveForm("login")}
            style={{ padding: "10px 20px", fontSize: "16px" }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // === 2️⃣ Wallpaper selection screen ===
  if (user && !bootFinished) {
    return (
      <div className="wallpaper-selection" style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Select Your Wallpaper</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
            gap: "20px",
          }}
        >
          {wallpapers.map((wp, index) => (
            <img
              key={index}
              src={wp}
              alt={`wallpaper-${index + 1}`}
              style={{
                width: "150px",
                height: "100px",
                objectFit: "cover",
                cursor: "pointer",
                border: selectedWallpaper === wp ? "3px solid #0078D7" : "2px solid #ccc",
                borderRadius: "6px",
              }}
              onClick={() => setSelectedWallpaper(wp)}
            />
          ))}
        </div>
        <button
          onClick={() => setBootFinished(true)}
          style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
        >
          Confirm
        </button>
      </div>
    );
  }

  // === 3️⃣ Booted Desktop with subscription prompt ===
  return (
    <>
      {!user && activeForm === "register" && (
        <RegisterForm onRegister={handleLoginOrRegister} />
      )}
      {!user && activeForm === "login" && (
        <LoginForm onLogin={handleLoginOrRegister} />
      )}

      {user && bootFinished && (
        <>
          <Desktop
            wallpaper={selectedWallpaper}
            onOpenExplorer={() => setExplorerOpen(true)}
            onOpenEditor={() => setEditorOpen(true)}
          />
          <Cursor />
          {searchOpen && <Search />}
          {explorerOpen && (
            <Explorer user={user} onClose={() => setExplorerOpen(false)} />
          )}
          {editorOpen && (
            <PublicEditor user={user} onClose={() => setEditorOpen(false)} />
          )}
          
          {/* ✅ Show the subscription component */}
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              zIndex: 999,
            }}
          >
            <UpdateSubscribe />
          </div>
        </>
      )}
    </>
  );
}
