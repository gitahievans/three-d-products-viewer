import * as THREE from 'three';
import { products } from './product-data.js';
import { initializeScene } from './scene-setup.js';
import { createBasicControls } from './orbit-controls.js';
import { createSliderStructure, setupControls as setupSliderControls, setupGUI } from './ui-manager.js';

let currentIndex = 0;
const scenes = [];
const renderers = [];
const cameras = [];
const controls = [];
let gui = null;
let isInitialized = false;

// Configuration
const config = {
    lighting: {
        ambientIntensity: 0.4,
        directionalIntensity: 1.0,
        directionalPosition: { x: 5, y: 5, z: 5 }
    },
    camera: {
        fov: 50,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 0, z: 5 }
    },
    background: {
        color: 0x222222
    }
};

/**
 * Initialize the application
 */
async function init() {
    try {
        createSliderStructure(products, goToSlide);
        await initializeScenes();
        setupSliderControls(goToSlide, () => currentIndex);
        gui = setupGUI(config, updateLighting, updateBackground, updateCamera);
        setupEventListeners();
        startRenderLoop();
        hideLoadingScreen();
        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize Product Viewer:', error);
        showError('Failed to load 3D models. Please refresh the page.');
    }
}

/**
 * Initialize Three.js scenes for each product
 */
async function initializeScenes() {
    for (let i = 0; i < products.length; i++) {
        const container = document.getElementById(`viewer-${i}`);
        const product = products[i];
        // initializeScene is now async, so we need to await its result
        const { scene, camera, renderer } = await initializeScene(product, container, config);
        scenes.push(scene);
        cameras.push(camera);
        renderers.push(renderer);

        const basicControls = createBasicControls(camera, renderer.domElement);
        controls.push(basicControls);
    }
}

/**
 * Update lighting in all scenes
 */
function updateLighting() {
    scenes.forEach(scene => {
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = config.lighting.ambientIntensity;
            } else if (child instanceof THREE.DirectionalLight) {
                child.intensity = config.lighting.directionalIntensity;
            }
        });
    });
}

/**
 * Update background in all scenes
 */
function updateBackground() {
    scenes.forEach(scene => {
        scene.background.setHex(config.background.color);
    });
}

/**
 * Update camera settings
 */
function updateCamera() {
    cameras.forEach(camera => {
        camera.fov = config.camera.fov;
        camera.updateProjectionMatrix();
    });
}

/**
 * Setup window resize listener
 */
function setupEventListeners() {
    window.addEventListener('resize', handleResize);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSlide(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentIndex + 1);
        }
    });
}

/**
 * Handle window resize
 */
function handleResize() {
    renderers.forEach((renderer, index) => {
        const container = document.getElementById(`viewer-${index}`);
        if (container) { // Check if container exists
            const camera = cameras[index];

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}

/**
 * Navigate to specific slide
 */
function goToSlide(index) {
    const maxIndex = products.length - 1;

    if (index < 0) {
        currentIndex = maxIndex;
    } else if (index > maxIndex) {
        currentIndex = 0;
    } else {
        currentIndex = index;
    }

    // Update slider position
    const sliderContainer = document.getElementById('sliderContainer');
    const translateX = -currentIndex * 100;
    sliderContainer.style.transform = `translateX(${translateX}%)`;

    // Update navigation dots
    document.querySelectorAll('.nav-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
    });
}

/**
 * Update controls for current scene
 */
function updateSceneControls() {
    controls.forEach((control, index) => {
        if (index !== currentIndex) return;

        // Smooth interpolation
        control.rotationX += (control.targetRotationX - control.rotationX) * 0.1;
        control.rotationY += (control.targetRotationY - control.rotationY) * 0.1;
        control.distance += (control.targetDistance - control.distance) * 0.1;

        // Update camera position
        const camera = control.camera;
        camera.position.x = Math.sin(control.rotationY) * Math.cos(control.rotationX) * control.distance;
        camera.position.y = Math.sin(control.rotationX) * control.distance;
        camera.position.z = Math.cos(control.rotationY) * Math.cos(control.rotationX) * control.distance;
        camera.lookAt(0, 0, 0);
    });
}

/**
 * Main render loop
 */
function startRenderLoop() {
    const animate = () => {
        requestAnimationFrame(animate);

        if (!isInitialized) return;

        updateSceneControls();

        // Render all scenes
        renderers.forEach((renderer, index) => {
            // Only render the active scene for performance, or if you want all visible for some effect
            // For this setup, it's better to render only the current one if they are not all visible.
            // However, the original code rendered all. For now, keeping that logic.
            // If performance becomes an issue, consider rendering only scenes[currentIndex].
            renderer.render(scenes[index], cameras[index]);
        });
    };

    animate();
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

/**
 * Show error message
 */
function showError(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.innerHTML = `
        <div style="text-align: center;">
            <h2>⚠️ Error</h2>
            <p>${message}</p>
        </div>
    `;
    // Ensure it's visible if hidden
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('hidden');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);