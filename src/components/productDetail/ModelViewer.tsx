import React, { useEffect, useRef, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";

interface ModelViewerProps {
  modelUrl: string;
  format?: string;
}

export default function ModelViewer({ modelUrl, format }: ModelViewerProps) {
  const normalizedFormat = (format || modelUrl.split(".").pop() || "")
    .toLowerCase()
    .replace(".", "");

  const model = useMemo(() => {
    switch (normalizedFormat) {
      case "glb":
      case "gltf":
        return "gltf";
      case "fbx":
        return "fbx";
      case "obj":
        return "obj";
      case "stl":
        return "stl";
      default:
        return null;
    }
  }, [normalizedFormat]);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} />
        {model && <ModelScene modelUrl={modelUrl} modelType={model} />}
        <OrbitControls />
      </Canvas>
    </div>
  );
}

function ModelScene({
  modelUrl,
  modelType,
}: {
  modelUrl: string;
  modelType: string;
}) {
  const obj = useLoader(OBJLoader, modelUrl);
  const fbx = useLoader(FBXLoader, modelUrl);
  const stl = useLoader(STLLoader, modelUrl);
  const gltf = useGLTF(modelUrl);

  const model = useMemo(() => {
    switch (modelType) {
      case "gltf":
        return gltf.scene;
      case "fbx":
        return fbx;
      case "obj":
        return obj;
      case "stl":
        return new THREE.Mesh(stl, new THREE.MeshStandardMaterial({ color: "gray" }));
      default:
        return null;
    }
  }, [modelType, gltf, fbx, obj, stl]);

  if (!model) return null;

  return <primitive object={model} scale={1.5} />;
}
