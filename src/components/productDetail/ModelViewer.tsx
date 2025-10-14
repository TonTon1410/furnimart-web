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

  // Dùng useGLTF cho file .glb / .gltf
  const gltf = useGLTF(url || "", true);

  useEffect(() => {
    if (!url || !format) return;

    const ext = format.toLowerCase();
    if (ext === "obj") {
      new OBJLoader().load(url, setObject);
    } else if (ext === "fbx") {
      new FBXLoader().load(url, setObject);
    } else if (ext === "stl") {
      new STLLoader().load(url, setGeometry);
    }
  }, [url, format]);

  return useMemo(() => {
    const ext = format?.toLowerCase();
    if (!url || !format) return null;

    if (ext === "glb" || ext === "gltf") return gltf.scene;
    if (ext === "obj" || ext === "fbx") return object;
    if (ext === "stl" && geometry) {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: "gray" })
      );
      return mesh;
    }
    return null;
  }, [url, format, gltf, object, geometry]);
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
        <Suspense fallback={<span>Đang tải mô hình...</span>}>
          {model ? (
            <primitive object={model} scale={1} />
          ) : (
            <span className="text-gray-500">Đang tải mô hình...</span>
          )}
          <OrbitControls enableZoom={true} />
          <Environment preset="warehouse" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ModelViewer;
