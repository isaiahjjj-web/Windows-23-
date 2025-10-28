import React, { useState, useEffect, useRef } from "react";
import Calculator from "../apps/Calculator";
import Notes from "../apps/Notes";
import Settings from "../apps/Settings";
import FileSystemExplorer from "../apps/Explorer";
import PublicExplorer from "../components/Explorer";
import PublicEditor from "../components/PublicEditor";
import WebsIDE from "../apps/Webs"; // ✅ New IDE app
import Search from "./Search";
import AppWindow from "./AppWindow";
import localforage from "localforage";

// Correct path for click sound
import clickSoundFile from "../assets/sounds/click.wav";

// Built-in apps with icons
const builtInApps = [
  { name: "Calculator", icon: "🧮", component: <Calculator /> },
  { name: "Notes", icon: "📝", component: <Notes /> },
  { name: "Settings", icon: "⚙️", component: <Settings /> },
  { name: "Filesystem Explorer", icon: "🗄️", component: <FileSystemExplorer /> },
  { name: "Public Explorer", icon: "🗂️", component: <PublicExplorer /> },
  { name: "Public Editor", icon: "🖌️", component: <PublicEditor /> },
  { name: "Webs IDE", icon: "💻", component: <WebsIDE /> }, // ✅ Added
];

export default function Desktop({ wallpaper }) {
  const [openApps, setOpenApps] = useState([]);
  const [customApps, setCustomApps] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const clickSound = useRef(new Audio(clickSoundFile));

  useEffect(() => {
    localforage.getItem("customApps").then((apps) => {
      if (apps) setCustomApps(apps);
    });
  }, []);

  const appsList = [...builtInApps, ...customApps];

  const openApp = (app) => {
    clickSound.current.currentTime = 0;
    clickSound.current.play().catch(() => {});

    if (!openApps.some((a) => a.name === app.name)) {
      setOpenApps([...openApps, app]);
    }
  };

  const closeApp = (appName) => {
    setOpenApps(openApps.filter((a) => a.name !== appName));
  };

  return (
    <div
      className="desktop"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* App Icons */}
      <div
        className="desktop-icons-container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1rem",
        }}
      >
        {appsList.map((app) => (
          <div
            key={app.name}
            className="desktop-icon"
            onClick={() => openApp(app)}
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "6vw", maxFontSize: "32px" }}>{app.icon}</span>
            <div style={{ fontSize: "3vw", maxFontSize: "14px" }}>{app.name}</div>
          </div>
        ))}
      </div>

      {/* Open Apps */}
      {openApps.map((app, index) => (
        <AppWindow
          key={app.name}
          title={app.name}
          zIndex={index + 1}
          onClose={() => closeApp(app.name)}
          maxWidth="95vw"
          maxHeight="90vh"
          minWidth="300px"
          minHeight="200px"
        >
          {app.component}
        </AppWindow>
      ))}

      {/* Search App */}
      {searchOpen && (
        <AppWindow
          title="Search"
          zIndex={openApps.length + 1}
          onClose={() => setSearchOpen(false)}
          maxWidth="90vw"
          maxHeight="80vh"
        >
          <Search />
        </AppWindow>
      )}
    </div>
  );
}
