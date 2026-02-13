"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - no types published for this path in three examples
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export default function V3() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  type Rotatable = { rotation: { y: number } };
  type PositionScale = { position: { set: (x: number, y: number, z: number) => void }, scale: { set: (x: number, y: number, z: number) => void } };
  type BufferGeometryLike = { computeVertexNormals: () => void };

  const meshRef = useRef<unknown | null>(null); // To reference the loaded mesh for rotation
  const groupRef = useRef<Rotatable | null>(null); // Parent group to rotate both meshes together
  const scaleRef = useRef<number | null>(null); // Shared scale factor for consistent sizing
  const platformRef = useRef<PositionScale | null>(null); // Platform under the model
  type RotatableWithChildren = Rotatable & { children: unknown[] };
  

  useEffect(() => {
    const mount = mountRef.current as HTMLDivElement | null;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const isSmallScreen = () => window.matchMedia('(max-width: 640px)').matches || mount.clientWidth <= 640;
    camera.fov = isSmallScreen() ? 60 : 50; // slightly wider FOV on mobile so the model fits better
    camera.updateProjectionMatrix();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x131923, 1); // slightly lighter background
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Environment map to enhance reflections/speculars
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    // Root group
    const rootGroup = new THREE.Group();
    groupRef.current = rootGroup;
    scene.add(rootGroup);

    // Lighting (cooler, moodier)
    const ambientLight = new THREE.AmbientLight(0x5a6cff, 0.08); // subtle cool ambient
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x9dbbff, 0x0b0d12, 0.22); // cool sky, darker ground
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.45);
    keyLight.position.set(1, 1.2, 0.8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x88aaff, 0.4); // cool rim
    rimLight.position.set(-1, 0.5, -0.6);
    scene.add(rimLight);

    // Spotlight focused on the shoe group
    const spotLight = new THREE.SpotLight(0xbfd3ff, 1.4, 0, Math.PI / 7, 0.35, 1.0);
    spotLight.position.set(2.5, 3.5, 2.0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(2048, 2048);
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 50;
    scene.add(spotLight);

    // Fill spotlight to lift shadows subtly from the opposite side
    const fillSpot = new THREE.SpotLight(0x9dbbff, 0.5, 0, Math.PI / 6, 0.5, 1.0);
    fillSpot.position.set(-2.2, 2.8, -1.8);
    fillSpot.castShadow = false;
    scene.add(fillSpot);

    // Bright spotlight for dramatic focus
    const brightSpot = new THREE.SpotLight(0xffffff, 2.4, 0, Math.PI / 10, 0.2, 1.4);
    brightSpot.position.set(2.5, 5.0, 2.5);
    brightSpot.castShadow = true;
    brightSpot.shadow.mapSize.set(2048, 2048);
    brightSpot.shadow.camera.near = 0.5;
    brightSpot.shadow.camera.far = 60;
    brightSpot.target.position.set(0, 0.5, 0);
    scene.add(brightSpot);
    scene.add(brightSpot.target);

    
    // Platform under the model (receives shadows)
    const PLATFORM_HEIGHT = 0.08;
    const platformGeom = new THREE.CylinderGeometry(1, 1, PLATFORM_HEIGHT, 64);
    const platformMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // clear crystal
      transparent: true,
      opacity: 1.0,
      transmission: 0.9, // clearer glass
      ior: 1.46,
      roughness: 0.03,
      metalness: 0.0,
      thickness: 0.25,
      clearcoat: 0.2,
      clearcoatRoughness: 0.05,
      specularIntensity: 0.8,
      specularColor: new THREE.Color(0xffffff),
      envMapIntensity: 1.0
    });
    const platform = new THREE.Mesh(platformGeom, platformMat);
    platform.receiveShadow = true;
    platform.castShadow = false;
    platformRef.current = platform;
    scene.add(platform);


    camera.position.set(0, 0, 5); // side view pre-load

    // Helper: fit camera to current group contents responsively
    const fitCameraToGroup = () => {
      if (!groupRef.current) return;
      const group = groupRef.current as unknown as RotatableWithChildren;
      if (group.children.length === 0) return;

      // Update FOV per current screen size
      camera.fov = isSmallScreen() ? 60 : 50;
      camera.aspect = (mount.clientWidth || 1) / (mount.clientHeight || 1);
      camera.updateProjectionMatrix();

      const box = new THREE.Box3().setFromObject(group);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Compute distance that fits both width and height
      const maxSize = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const fitHeightDistance = maxSize / (2 * Math.tan(fov / 2));
      const fitWidthDistance = fitHeightDistance / Math.max(camera.aspect, 0.0001);
      const padding = isSmallScreen() ? 1.35 : 1.15; // a bit more space on mobile
      const distance = padding * Math.max(fitHeightDistance, fitWidthDistance);

      // Keep an elevated, angled view while ensuring fit
      const direction = new THREE.Vector3(0.9, 0.35, 0.4).normalize();
      const cameraPos = direction.clone().multiplyScalar(distance).add(center);
      camera.position.copy(cameraPos);
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
      camera.lookAt(center);
    };

    // Load STL model (black)
    const loader = new STLLoader();
    loader.load('/products/v3-slides/v29.stl', (geometry: BufferGeometryLike) => {
      geometry.computeVertexNormals(); // For better lighting

      const material = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6, metalness: 0.02, envMapIntensity: 0.6 });
      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current = mesh; // Reference for animation
      rootGroup.add(mesh);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Fit model: scale to target size (preserve original pivot)
      const box = new THREE.Box3().setFromObject(mesh);
      const sizeVec = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
      const targetSize = 2; // world units
      if (maxDim > 0) {
        const scaleFactor = targetSize / maxDim;
        if (scaleRef.current == null) scaleRef.current = scaleFactor;
        mesh.scale.setScalar(scaleRef.current);
      }

      // Recompute box after scaling
      box.setFromObject(rootGroup);

      // Align object's local Z axis to vertical on screen (world Y)
      const zToY = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 1, 0)
      );
      mesh.quaternion.premultiply(zToY);

      // Position camera to fit entire group responsively
      fitCameraToGroup();
    }, undefined, (error: unknown) => {
      console.error('Error loading STL:', error);
      const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
      const fallbackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000, specular: 0x555555, shininess: 30 });
      const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
      meshRef.current = fallbackMesh;
      rootGroup.add(fallbackMesh);
    });

    // Load second STL model (white) with same transforms
    loader.load('/products/v3-slides/v29g.stl', (geometry: BufferGeometryLike) => {
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x666666, shininess: 40 });
      const mesh = new THREE.Mesh(geometry, material);
      rootGroup.add(mesh);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Use shared scale factor
      if (scaleRef.current != null) {
        mesh.scale.setScalar(scaleRef.current * 1.002); // slight offset to avoid z-fighting/overlap
      } else {
        const box = new THREE.Box3().setFromObject(mesh);
        const sizeVec = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);
        const targetSize = 2;
        if (maxDim > 0) {
          const scaleFactor = targetSize / maxDim;
          scaleRef.current = scaleFactor;
          mesh.scale.setScalar(scaleFactor * 1.002);
        }
      }

      // Align local Z to world Y
      const zToY = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 1, 0)
      );
      mesh.quaternion.premultiply(zToY);

      // After adding, refit camera to entire group responsively
      fitCameraToGroup();

      // Position the platform at the group's base
      const platform = platformRef.current;
      if (platform) {
        const groupBox = new THREE.Box3().setFromObject(rootGroup);
        const min = groupBox.min;
        const max = groupBox.max;
        const radius = Math.max(max.x - min.x, max.z - min.z) * 3;
        platform.position.set(0, min.y - PLATFORM_HEIGHT * 45.25, 0);
        platform.scale.set(radius, 1, radius);
      }
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.01; // Rotate both models together around vertical (screen up) axis
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const container = mountRef.current as HTMLDivElement | null;
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.fov = isSmallScreen() ? 60 : 50;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      // Refit after size/orientation change
      fitCameraToGroup();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      scene.environment = null;
      envRT.dispose();
      pmremGenerator.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100dvh',
        position: 'relative',
      }}
    />
  );
}
