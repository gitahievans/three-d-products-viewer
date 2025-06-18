import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function setupLighting(scene, config) {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(
    0xffffff,
    config.lighting.ambientIntensity
  );
  scene.add(ambientLight);

  // Directional light
  const directionalLight = new THREE.DirectionalLight(
    0xffffff,
    config.lighting.directionalIntensity
  );
  directionalLight.position.set(
    config.lighting.directionalPosition.x,
    config.lighting.directionalPosition.y,
    config.lighting.directionalPosition.z
  );
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Environment lighting
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1d, 0.3);
  scene.add(hemisphereLight);
}

export function createCupModel(product) {
  const group = new THREE.Group();

  // Cup body (cylinder)
  const cupGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 32);
  const cupMaterial = createMaterial(product);
  const cup = new THREE.Mesh(cupGeometry, cupMaterial);
  cup.castShadow = true;
  cup.receiveShadow = true;
  group.add(cup);

  // Cup handle
  const handleGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI);
  const handleMaterial = cupMaterial.clone();
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0.9, 0.2, 0);
  handle.rotation.z = Math.PI / 2;
  handle.castShadow = true;
  group.add(handle);

  // Base plane for shadows
  const planeGeometry = new THREE.PlaneGeometry(5, 5);
  const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1; // Adjust this based on your model's height
  plane.receiveShadow = true;
  group.add(plane);

  return group;
}

export function createMaterial(product) {
  const materialProps = {
    color: product.color,
    roughness: product.roughness,
    metalness: product.metalness
  };

  if (product.transparent) {
    materialProps.transparent = true;
    materialProps.opacity = product.opacity;
  }

  return new THREE.MeshStandardMaterial(materialProps);
}

export async function loadGLTFModel(modelPath, productConfig) {
  const loader = new GLTFLoader();
  const group = new THREE.Group();

  try {
    const gltf = await loader.loadAsync(modelPath);
    const model = gltf.scene;

    // Basic adjustments - these might need to be specific to each model
    model.scale.set(1, 1, 1); // Adjust scale as needed
    model.position.set(0, -1, 0); // Adjust position to sit on the plane

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Optionally apply/override material from productConfig if needed
        // For example:
        // if (productConfig.color && child.material) {
        //   child.material.color.setHex(productConfig.color);
        // }
        // if (productConfig.metalness !== undefined && child.material.metalness !== undefined) {
        //   child.material.metalness = productConfig.metalness;
        // }
        // if (productConfig.roughness !== undefined && child.material.roughness !== undefined) {
        //   child.material.roughness = productConfig.roughness;
        // }
      }
    });
    group.add(model);

    // Base plane for shadows
    const planeGeometry = new THREE.PlaneGeometry(5, 5);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1; // Adjust this to be just below your model
    plane.receiveShadow = true;
    group.add(plane);

  } catch (error) {
    console.error(`Error loading GLTF model from ${modelPath}:`, error);
    // Fallback or error indication:
    // For now, return an empty group or throw error,
    // or return a placeholder like the cup model
    // To keep it simple, we'll re-throw, init function should catch this.
    throw error;
  }
  return group;
}


export async function initializeScene(product, container, config) {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.background.color);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    config.camera.fov,
    container.clientWidth / container.clientHeight,
    config.camera.near,
    config.camera.far
  );
  camera.position.set(
    config.camera.position.x,
    config.camera.position.y,
    config.camera.position.z
  );

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  container.appendChild(renderer.domElement);

  // Lighting
  setupLighting(scene, config);

  // Create 3D model
  let model;
  if (product.modelPath) {
    try {
      model = await loadGLTFModel(product.modelPath, product);
    } catch (error) {
      console.error(`Failed to load GLTF model for ${product.name}, falling back.`, error);
      // Fallback to procedural cup model if GLTF loading fails
      model = createCupModel(product);
    }
  } else {
    // Fallback to procedural cup model if no modelPath is specified
    console.warn(`No modelPath specified for ${product.name}, using procedural cup model.`);
    model = createCupModel(product);
  }
  scene.add(model);

  return { scene, camera, renderer };
}
