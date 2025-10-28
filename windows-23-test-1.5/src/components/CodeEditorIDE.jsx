// src/components/CodeEditorIDE.jsx
import { useState } from "react";
import { initSupabase } from "../lib/supabaseClient";
import * as Babel from "@babel/standalone";
import MonacoEditor from "@monaco-editor/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const FILE = "file";

function DraggableFile({ path, fileName, moveFile, selectedFile, setSelectedFile, deleteFile }) {
  const [, drag] = useDrag(() => ({ type: FILE, item: { path } }));
  const [, drop] = useDrop({
    accept: FILE,
    drop: (item) => moveFile(item.path, path.split("/")[0]),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        cursor: "pointer",
        fontWeight: selectedFile === path ? "bold" : "normal",
      }}
      onClick={() => setSelectedFile(path)}
    >
      {fileName}{" "}
      <button onClick={() => deleteFile(path)} style={{ fontSize: "10px" }}>❌</button>
      <button onClick={() => moveFile(path, path.startsWith("src") ? "public" : "src")} style={{ fontSize: "10px" }}>➡</button>
    </div>
  );
}

export default function CodeEditorIDE({ user }) {
  const [project, setProject] = useState({
    project_name: "MyApp",
    license: "",
    files: {
      src: {
        "App.jsx": "import React from 'react';\nexport default function App() { return <h1>Hello World!</h1>; }",
        "index.jsx": "import ReactDOM from 'react-dom';\nimport App from './App';\nReactDOM.render(<App />, document.getElementById('root'));"
      },
      public: { "index.html": "<div id='root'></div>" }
    }
  });

  const [selectedFile, setSelectedFile] = useState("src/App.jsx");
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState([]);

  const getFileContent = (path) => {
    const parts = path.split("/");
    let current = project.files;
    for (let part of parts) current = current[part];
    return current;
  };

  const updateFileContent = (path, content) => {
    const parts = path.split("/");
    setProject((prev) => {
      const newFiles = structuredClone(prev.files);
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
      current[parts.at(-1)] = content;
      return { ...prev, files: newFiles };
    });
  };

  const createFile = (folder, name) => {
    setProject((prev) => {
      const newFiles = structuredClone(prev.files);
      newFiles[folder][name] = "";
      return { ...prev, files: newFiles };
    });
  };

  const deleteFile = (path) => {
    const parts = path.split("/");
    setProject((prev) => {
      const newFiles = structuredClone(prev.files);
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
      delete current[parts.at(-1)];
      return { ...prev, files: newFiles };
    });
    if (selectedFile === path) setSelectedFile("");
  };

  const moveFile = (fromPath, toFolder) => {
    const parts = fromPath.split("/");
    const fileName = parts.pop();
    const fileContent = getFileContent(fromPath);
    setProject((prev) => {
      const newFiles = structuredClone(prev.files);
      let srcFolder = newFiles[parts[0]];
      delete srcFolder[fileName];
      if (!newFiles[toFolder]) newFiles[toFolder] = {};
      newFiles[toFolder][fileName] = fileContent;
      return { ...prev, files: newFiles };
    });
    setSelectedFile(`${toFolder}/${fileName}`);
  };

  const runProject = () => {
    try {
      setErrors([]);
      let combinedCode = "";
      const traverse = (folder) => {
        for (const key in folder) {
          if (typeof folder[key] === "string" && key.endsWith(".jsx")) {
            combinedCode += folder[key] + "\n";
          } else if (typeof folder[key] === "object") traverse(folder[key]);
        }
      };
      traverse(project.files);

      const transpiled = Babel.transform(combinedCode, {
        presets: ["react", "env"],
      }).code;

      const html = `
        <html>
          <head><meta charset="UTF-8" /></head>
          <body>
            <div id="root"></div>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script>${transpiled}</script>
          </body>
        </html>
      `;
      const blob = new Blob([html], { type: "text/html" });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setErrors([err.message]);
    }
  };

  const saveProject = async () => {
    if (!project.license) {
      alert("Please add a license before saving!");
      return;
    }

    const supabase = await initSupabase();
    const { error } = await supabase
      .from("user_projects")
      .upsert([{ owner_id: user.id, project_name: project.project_name, license: project.license, files: project.files }]);

    if (error) console.error(error);
    else alert("✅ Project saved!");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* File Tree */}
        <div style={{ width: "220px", borderRight: "1px solid #555", padding: "10px", overflowY: "auto" }}>
          <input
            placeholder="License"
            value={project.license}
            onChange={(e) => setProject({ ...project, license: e.target.value })}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          {Object.keys(project.files).map((folder) => (
            <div key={folder}>
              <strong>{folder}</strong>
              <div style={{ marginLeft: "10px" }}>
                {Object.keys(project.files[folder]).map((file) => (
                  <DraggableFile
                    key={file}
                    path={`${folder}/${file}`}
                    fileName={file}
                    moveFile={moveFile}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    deleteFile={deleteFile}
                  />
                ))}
                <button
                  onClick={() => createFile(folder, "newFile.jsx")}
                  style={{ fontSize: "10px", marginTop: "5px" }}
                >
                  ➕ Add File
                </button>
              </div>
            </div>
          ))}
          <button onClick={saveProject} style={{ marginTop: "10px" }}>💾 Save Project</button>
          <button onClick={runProject} style={{ marginTop: "10px" }}>▶ Run</button>
          {errors.length > 0 && (
            <div style={{ color: "red", marginTop: "10px" }}>
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>

        {/* Editor + Preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {selectedFile && (
            <MonacoEditor
              height="50%"
              language="javascript"
              theme="vs-dark"
              value={getFileContent(selectedFile)}
              onChange={(value) => updateFileContent(selectedFile, value)}
            />
          )}
          <iframe
            title="preview"
            sandbox="allow-scripts"
            src={previewUrl}
            style={{ width: "100%", height: "50%", border: "none" }}
          />
        </div>
      </div>
    </DndProvider>
  );
}
