// src/components/productDetail/ModelViewer.tsx
import React, { Suspense, useEffect, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

interface ModelViewerProps {
  modelUrl?: string;
  format?: string;
}

/**
 * Custom hook: tải mô hình 3D với đúng loader
 */
function useModelLoader(url?: string, format?: string) {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  // Tự động phát hiện định dạng từ URL
  const detectedFormat = useMemo(() => {
    if (!url) return "";
    const urlLower = url.toLowerCase();
    if (urlLower.includes(".glb")) return "glb";
    if (urlLower.includes(".gltf")) return "gltf";
    if (urlLower.includes(".obj")) return "obj";
    if (urlLower.includes(".fbx")) return "fbx";
    if (urlLower.includes(".stl")) return "stl";
    return format?.toLowerCase() || "";
  }, [url, format]);

  // Dùng useGLTF cho file .glb / .gltf
  const shouldUseGLTF = detectedFormat === "glb" || detectedFormat === "gltf";
  const gltf = useGLTF(shouldUseGLTF && url ? url : "", shouldUseGLTF);

  useEffect(() => {
    if (!url || !detectedFormat) return;

    // Reset state khi URL thay đổi
    setObject(null);
    setGeometry(null);

    if (detectedFormat === "obj") {
      new OBJLoader().load(url, setObject, undefined, (error) =>
        console.error("Error loading OBJ:", error)
      );
    } else if (detectedFormat === "fbx") {
      new FBXLoader().load(url, setObject, undefined, (error) =>
        console.error("Error loading FBX:", error)
      );
    } else if (detectedFormat === "stl") {
      new STLLoader().load(url, setGeometry, undefined, (error) =>
        console.error("Error loading STL:", error)
      );
    }
  }, [url, detectedFormat]);

  return useMemo(() => {
    if (!url) return null;

    if (detectedFormat === "glb" || detectedFormat === "gltf") {
      return shouldUseGLTF && gltf?.scene ? gltf.scene : null;
    }
    if (detectedFormat === "obj" || detectedFormat === "fbx") return object;
    if (detectedFormat === "stl" && geometry) {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: "gray" })
      );
      return mesh;
    }
    return null;
  }, [url, detectedFormat, gltf, object, geometry, shouldUseGLTF]);
}

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl, format = "" }) => {
  if (!modelUrl) {
    return <p className="text-center text-gray-500">Không có mô hình 3D.</p>;
  }

  // ✅ Nếu là Sketchfab → nhúng iframe
  if (modelUrl.includes("sketchfab.com/models")) {
    const sketchfabUrl = modelUrl.includes("embed")
      ? modelUrl
      : `${modelUrl}/embed`;

    return (
      <div className="w-full h-[500px]">
        <iframe
          title="Sketchfab 3D Viewer"
          width="100%"
          height="100%"
          src={sketchfabUrl}
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; xr-spatial-tracking"
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
        />
      </div>
    );
  }

  // 🧱 Nếu là file .glb / .obj / .fbx / .stl → render bằng Three.js
  const model = useModelLoader(modelUrl, format);

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <Suspense fallback={null}>
          {model && <primitive object={model} scale={1} />}
          <OrbitControls enableZoom={true} />
          <Environment preset="warehouse" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ModelViewer;
