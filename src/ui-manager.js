import dat from 'dat.gui';

export function createSliderStructure(products, goToSlideCallback) {
  const sliderContainer = document.getElementById('sliderContainer');
  const sliderNav = document.getElementById('sliderNav');

  products.forEach((product, index) => {
    // Create product card
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
      </div>
      <div class="product-viewer" id="viewer-${index}"></div>
    `;
    sliderContainer.appendChild(card);

    // Create navigation dot
    const dot = document.createElement('button');
    dot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlideCallback(index));
    sliderNav.appendChild(dot);
  });
}

export function setupControls(goToSlideCallback, getCurrentIndexCallback) {
  document.getElementById('prevBtn').addEventListener('click', () => {
    goToSlideCallback(getCurrentIndexCallback() - 1);
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    goToSlideCallback(getCurrentIndexCallback() + 1);
  });

  // Touch swipe for mobile
  let startX = 0;
  let startY = 0;
  const slider = document.querySelector('.product-slider');

  slider.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  slider.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToSlideCallback(getCurrentIndexCallback() + 1);
      } else {
        goToSlideCallback(getCurrentIndexCallback() - 1);
      }
    }
  });
}

export function setupGUI(config, updateLightingCallback, updateBackgroundCallback, updateCameraCallback) {
  const gui = new dat.GUI({
    autoPlace: false,
    width: 300
  });

  const controlsPanel = document.getElementById('controlsPanel');
  controlsPanel.appendChild(gui.domElement);

  // Lighting controls
  const lightingFolder = gui.addFolder('Lighting');
  lightingFolder.add(config.lighting, 'ambientIntensity', 0, 2).onChange(updateLightingCallback);
  lightingFolder.add(config.lighting, 'directionalIntensity', 0, 3).onChange(updateLightingCallback);

  // Background controls
  const backgroundFolder = gui.addFolder('Scene');
  backgroundFolder.addColor(config.background, 'color').onChange(updateBackgroundCallback);

  // Camera controls
  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(config.camera, 'fov', 20, 100).onChange(updateCameraCallback);

  lightingFolder.open();
  return gui;
}
