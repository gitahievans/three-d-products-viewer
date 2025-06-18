import * as THREE from 'three';
import { products } from './product-data.js';
import { initializeScene } from './scene-setup.js';
import { createBasicControls } from './orbit-controls.js';
import {
    createSliderStructure,
    setupControls as setupSliderControls,
    setupGUI,
    updateProductVisibility,
    populateCategoryFilter,
    updateNavigationDots // Import the new function
} from './ui-manager.js';

let currentIndex = 0; // Index within the VISIBLE products
let visibleProductOriginalIndices = []; // Stores original indices of currently visible products

const scenes = []; // Indexed by ORIGINAL product order
const renderers = []; // Indexed by ORIGINAL product order
const cameras = []; // Indexed by ORIGINAL product order
const controls = []; // Indexed by ORIGINAL product order
let gui = null;
let isInitialized = false;

const config = {
    lighting: { ambientIntensity: 0.4, directionalIntensity: 1.0, directionalPosition: { x: 5, y: 5, z: 5 }},
    camera: { fov: 50, near: 0.1, far: 1000, position: { x: 0, y: 0, z: 5 }},
    background: { color: 0xc09960 }
};

function applyFiltersAndSearch() {
    const searchBar = document.getElementById('searchBar');
    const categoryFilter = document.getElementById('categoryFilter');
    const noResultsMessage = document.getElementById('noResultsMessage');

    const searchTerm = searchBar ? searchBar.value.toLowerCase().trim() : "";
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";

    let tempFilteredProducts = products;

    if (selectedCategory !== "all") {
        tempFilteredProducts = tempFilteredProducts.filter(product => product.category === selectedCategory);
    }

    if (searchTerm !== "") {
        tempFilteredProducts = tempFilteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (selectedCategory === "all" && product.category.toLowerCase().includes(searchTerm))
        );
    }

    visibleProductOriginalIndices = tempFilteredProducts.map(product => products.indexOf(product));
    updateProductVisibility(visibleProductOriginalIndices);

    if (visibleProductOriginalIndices.length === 0) {
        noResultsMessage.classList.remove('hidden');
        // Hide slider container content if no results by making cards take no space
        // This is an alternative to hiding the whole slider - cards are already hidden by updateProductVisibility
    } else {
        noResultsMessage.classList.add('hidden');
    }

    // Adjust currentIndex if it's out of bounds for the new filtered list
    if (currentIndex >= visibleProductOriginalIndices.length) {
        currentIndex = Math.max(0, visibleProductOriginalIndices.length - 1);
    }

    updateNavigationDots(visibleProductOriginalIndices.length, currentIndex);

    // Update view to the current (possibly adjusted) index
    // Pass true to indicate this is an internal update from filtering
    goToSlide(currentIndex, true);
}

async function init() {
    try {
        const categories = [...new Set(products.map(p => p.category))].sort();
        populateCategoryFilter(categories);

        // Create all product cards once. Scene init is tied to original product order.
        createSliderStructure(products, (visibleIndex) => goToSlide(visibleIndex));
        await initializeScenes();

        // Arrow buttons will navigate based on the visible products
        setupSliderControls(
            () => goToSlide(currentIndex - 1), // Prev
            () => goToSlide(currentIndex + 1)  // Next
        );
        gui = setupGUI(config, updateLighting, updateBackground, updateCamera);
        setupEventListeners();

        applyFiltersAndSearch(); // Initial filter application (shows all)
        // goToSlide(0); // Called by applyFiltersAndSearch if list not empty

        startRenderLoop();
        hideLoadingScreen();
        isInitialized = true;

    } catch (error) {
        console.error('Failed to initialize Product Viewer:', error);
        showError('Failed to load 3D models. Please refresh the page.');
    }
}

async function initializeScenes() {
    for (let i = 0; i < products.length; i++) {
        const container = document.getElementById(`viewer-${i}`); // viewer-i is based on original index
        const product = products[i];
        const { scene, camera, renderer } = await initializeScene(product, container, config);
        scenes.push(scene);
        cameras.push(camera);
        renderers.push(renderer);
        const basicControls = createBasicControls(camera, renderer.domElement);
        controls.push(basicControls);
    }
}

function updateLighting() { /* ... remains same ... */
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
function updateBackground() { /* ... remains same ... */
    scenes.forEach(scene => {
        scene.background.setHex(config.background.color);
    });
}
function updateCamera() { /* ... remains same ... */
    cameras.forEach(camera => {
        camera.fov = config.camera.fov;
        camera.updateProjectionMatrix();
    });
}

function setupEventListeners() {
    window.addEventListener('resize', handleResize);

    document.addEventListener('keydown', (e) => {
        if (visibleProductOriginalIndices.length === 0) return; // No keyboard nav if no items
        if (e.key === 'ArrowLeft') {
            goToSlide(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            goToSlide(currentIndex + 1);
        }
    });

    const searchBar = document.getElementById('searchBar');
    if (searchBar) searchBar.addEventListener('input', applyFiltersAndSearch);

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndSearch);
}

function handleResize() { /* ... remains same ... */
    renderers.forEach((renderer, index) => {
        const container = document.getElementById(`viewer-${index}`);
        if (container) {
            const camera = cameras[index];
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
}

// sliderIndex is an index within the visibleProductOriginalIndices array
function goToSlide(sliderIndex, isInternalUpdate = false) {
    if (!isInitialized && !isInternalUpdate) return; // Don't do anything if called before init or if not internal

    const numVisible = visibleProductOriginalIndices.length;
    if (numVisible === 0) {
        // If no visible products, ensure slider is "empty" and dots are cleared
        const sliderContainer = document.getElementById('sliderContainer');
        sliderContainer.style.transform = 'translateX(0%)'; // Or hide it
        updateNavigationDots(0, 0); // Clear dots
        // updateActiveSceneControls(-1); // Deactivate any active controls
        return;
    }

    // Wrap around logic for currentIndex
    if (sliderIndex < 0) {
        currentIndex = numVisible - 1;
    } else if (sliderIndex >= numVisible) {
        currentIndex = 0;
    } else {
        currentIndex = sliderIndex;
    }

    const actualProductIndex = visibleProductOriginalIndices[currentIndex];

    if (actualProductIndex === undefined) { // Should not happen if numVisible > 0
        console.warn("goToSlide: actualProductIndex is undefined for currentIndex", currentIndex);
        return;
    }

    const sliderContainer = document.getElementById('sliderContainer');
    // The translateX must use the original index because the DOM cards are fixed
    const translateX = -actualProductIndex * 100;
    sliderContainer.style.transform = `translateX(${translateX}%)`;

    // Update dots to reflect the current visible index
    if (!isInternalUpdate) { // If it's an internal update, dots are already handled by applyFiltersAndSearch
      updateNavigationDots(numVisible, currentIndex);
    }

    // Controls for the active scene are updated in renderLoopUpdateSceneControls
}

function renderLoopUpdateSceneControls() {
    if (visibleProductOriginalIndices.length === 0 || currentIndex < 0 || currentIndex >= visibleProductOriginalIndices.length) {
        return; // No scene controls to update if no visible items or index is invalid
    }
    const actualProductIndex = visibleProductOriginalIndices[currentIndex];
    const control = controls[actualProductIndex]; // Use original index to get the correct control object

    if (control) {
        control.rotationX += (control.targetRotationX - control.rotationX) * 0.1;
        control.rotationY += (control.targetRotationY - control.rotationY) * 0.1;
        control.distance += (control.targetDistance - control.distance) * 0.1;

        const camera = control.camera; // This is cameras[actualProductIndex]
        camera.position.x = Math.sin(control.rotationY) * Math.cos(control.rotationX) * control.distance;
        camera.position.y = Math.sin(control.rotationX) * control.distance;
        camera.position.z = Math.cos(control.rotationY) * Math.cos(control.rotationX) * control.distance;
        camera.lookAt(0, 0, 0);
    }
}


function startRenderLoop() {
    const animate = () => {
        requestAnimationFrame(animate);
        if (!isInitialized) return;
        renderLoopUpdateSceneControls(); // Use the correctly indexed controls

        // Render all scenes - WebGL contexts are managed by Three.js
        // Hiding cards with display:none doesn't stop rendering if scenes are still in memory.
        // For true performance gain on many items, would need to add/remove scenes from being rendered.
        // For now, this is fine.
        renderers.forEach((renderer, index) => {
            // Optional: only render if scene's card is visible
            // const card = productCardElements[index]; // Needs productCardElements from ui-manager
            // if (card && !card.classList.contains('hidden-card')) {
            //    renderer.render(scenes[index], cameras[index]);
            // } else { // Render all for now
               renderer.render(scenes[index], cameras[index]);
            // }
        });
    };
    animate();
}

function hideLoadingScreen() { /* ... remains same ... */
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}
function showError(message) { /* ... remains same ... */
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.innerHTML = `
        <div style="text-align: center;">
            <h2>⚠️ Error</h2>
            <p>${message}</p>
        </div>
    `;
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);