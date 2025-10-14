/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "three/examples/jsm/loaders/OBJLoader" {
  import { Loader } from "three";
  export class OBJLoader extends Loader {
    load(
      url: string,
      onLoad: (object: any) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}

declare module "three/examples/jsm/loaders/FBXLoader" {
  import { Loader } from "three";
  export class FBXLoader extends Loader {
    load(
      url: string,
      onLoad: (object: any) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}

declare module "three/examples/jsm/loaders/STLLoader" {
  import { Loader } from "three";
  export class STLLoader extends Loader {
    load(
      url: string,
      onLoad: (geometry: any) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}
