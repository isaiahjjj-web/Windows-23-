// src/components/CodeEditorIDE.jsx
import { useState, useEffect } from "react";
import { initSupabase } from "../lib/supabaseClient";
import * as esbuild from "esbuild-wasm";
import MonacoEditor from "@monaco-editor/react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const FILE = "file";

function DraggableFile({ path, fileName, moveFile, selectedFile, setSelectedFile, deleteFile }) {
  const [, drag] = useDrag(() => ({
    type: FILE,
    item: { path },
  }));

  const [, drop] = useDrop({
    accept: FILE,
    drop: (item) => {
      moveFile(item.path, path.split("/")[0]);
    },
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
        "App.jsx": "import React from 'react';\nexport default () => <h1>Hello</h1>;",
        "index.jsx": "import ReactDOM from 'react-dom';\nimport App from './App';\nReactDOM.render(<App />, document.getElementById('root'));"
      },
      public: {
        "index.html": "<div id='root'></div>"
      }
    }
  });

  const [selectedFile, setSelectedFile] = useState("src/App.jsx");
  const [outputCode, setOutputCode] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [esbuildReady, setEsbuildReady] = useState(false);

  useEffect(() => {
    const initializeEsbuild = async () => {
      await esbuild.initialize({ wasmURL: "/esbuild.wasm" });
      setEsbuildReady(true);
    };
    initializeEsbuild().catch(console.error);
  }, []);

  const getFileContent = (path) => {
    const parts = path.split("/");
    let current = project.files;
    for (let i = 0; i < parts.length; i++) current = current[parts[i]];
    return current;
  };

  const updateFileContent = (path, content) => {
    const parts = path.split("/");
    setProject((prev) => {
      const newFiles = { ...prev.files };
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
      current[parts[parts.length - 1]] = content;
      return { ...prev, files: newFiles };
    });
  };

  const createFile = (folder, name) => {
    setProject((prev) => {
      const newFiles = { ...prev.files };
      if (!newFiles[folder]) newFiles[folder] = {};
      newFiles[folder][name] = "";
      return { ...prev, files: newFiles };
    });
  };

  const deleteFile = (path) => {
    const parts = path.split("/");
    setProject((prev) => {
      const newFiles = { ...prev.files };
      let current = newFiles;
      for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
      delete current[parts[parts.length - 1]];
      return { ...prev, files: newFiles };
    });
    if (selectedFile === path) setSelectedFile("");
  };

  const moveFile = (fromPath, toFolder) => {
    const parts = fromPath.split("/");
    const fileName = parts.pop();
    const fileContent = getFileContent(fromPath);

    setProject((prev) => {
      const newFiles = { ...prev.files };
      let current = newFiles;
      for (let i = 0; i < parts.length; i++) current = current[parts[i]];
      delete current[fileName];

      if (!newFiles[toFolder]) newFiles[toFolder] = {};
      newFiles[toFolder][fileName] = fileContent;
      return { ...prev, files: newFiles };
    });
    setSelectedFile(`${toFolder}/${fileName}`);
  };

  const runProject = async () => {
    if (!esbuildReady) {
      alert("Editor is still initializing, please wait...");
      return;
    }

    setLoading(true);
    setErrors([]);
    try {
      let combinedCode = "";
      const traverseFiles = (folder) => {
        for (const key in folder) {
          if (typeof folder[key] === "string" && key.endsWith(".jsx")) combinedCode += folder[key] + "\n";
          else if (typeof folder[key] === "object") traverseFiles(folder[key]);
        }
      };
      traverseFiles(project.files);

      const result = await esbuild.transform(combinedCode, { loader: "jsx", target: "es2017" });
      setOutputCode(result.code);
      const blob = new Blob([`<div id="root"></div><script>${result.code}</script>`], { type: "text/html" });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setErrors([err.message]);
      console.error(err);
    } finally {
      setLoading(false);
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
    else alert("Project saved!");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* File Tree */}
        <div style={{ width: "220px", borderRight: "1px solid #555", padding: "10px" }}>
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
                <button onClick={() => createFile(folder, "newFile.jsx")} style={{ fontSize: "10px", marginTop: "5px" }}>➕ Add File</button>
              </div>
            </div>
          ))}
          <button onClick={saveProject} style={{ marginTop: "10px" }}>💾 Save Project</button>
          <button onClick={runProject} style={{ marginTop: "10px" }} disabled={loading || !esbuildReady}>
            {loading ? "Building..." : !esbuildReady ? "Initializing..." : "▶ Run"}
          </button>
          {errors.length > 0 && <div style={{ color: "red", marginTop: "10px" }}>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>}
        </div>

        {/* Editor + Preview */}
        <div style={{ flex: 1 }}>
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
