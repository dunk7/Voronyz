declare module 'three';
declare module 'three/examples/jsm/loaders/STLLoader' {
  import { Loader, BufferGeometry } from 'three';
  export class STLLoader extends Loader {
    load(
      url: string,
      onLoad: (geometry: BufferGeometry) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): void;
    parse(data: ArrayBuffer | string): BufferGeometry;
  }
}

