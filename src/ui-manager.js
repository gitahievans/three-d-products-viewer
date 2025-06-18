import dat from 'dat.gui';

let productCardElements = [];
let currentGoToSlideCallback = null; // To store the goToSlide from main.js

export function createSliderStructure(products, goToSlideCallback) {
  const sliderContainer = document.getElementById('sliderContainer');
  // sliderNav is handled by updateNavigationDots

  sliderContainer.innerHTML = '';
  productCardElements = [];
  currentGoToSlideCallback = goToSlideCallback; // Store for use by dots

  products.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.originalIndex = index;
    card.innerHTML = `
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="product-category">Category: ${product.category || 'N/A'}</p>
      </div>
      <div class="product-viewer" id="viewer-${index}"></div>
    `;
    sliderContainer.appendChild(card);
    productCardElements.push(card);
  });
  // Initial dot creation will be handled by the first call to updateNavigationDots
}

export function updateNavigationDots(numberOfVisibleProducts, activeVisibleIndex) {
  const sliderNav = document.getElementById('sliderNav');
  if (!sliderNav) return;
  sliderNav.innerHTML = ''; // Clear existing dots

  if (numberOfVisibleProducts === 0) return; // No dots if no products

  for (let i = 0; i < numberOfVisibleProducts; i++) {
    const dot = document.createElement('button');
    dot.className = 'nav-dot';
    if (i === activeVisibleIndex) {
      dot.classList.add('active');
    }
    // When a dot is clicked, it calls the stored goToSlideCallback
    // with its index *within the visible set*.
    dot.addEventListener('click', () => {
      if(currentGoToSlideCallback) {
        currentGoToSlideCallback(i);
      }
    });
    sliderNav.appendChild(dot);
  }
}


export function updateProductVisibility(visibleIndices) {
  const visibleIndicesSet = new Set(visibleIndices);
  productCardElements.forEach((card) => {
    // Use originalIndex stored in dataset to check against visibleIndicesSet
    const originalIndex = parseInt(card.dataset.originalIndex, 10);
    if (visibleIndicesSet.has(originalIndex)) {
      card.classList.remove('hidden-card');
    } else {
      card.classList.add('hidden-card');
    }
  });
}

export function populateCategoryFilter(categories) {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;

  categoryFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Categories';
  categoryFilter.appendChild(allOption);

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// getCurrentIndexCallback will now refer to the index within the visible products.
export function setupControls(goToPrevSlideCallback, goToNextSlideCallback) {
  document.getElementById('prevBtn').addEventListener('click', goToPrevSlideCallback);
  document.getElementById('nextBtn').addEventListener('click', goToNextSlideCallback);

  let startX = 0;
  let startY = 0;
  const slider = document.querySelector('.product-slider');
  if (!slider) return;

  slider.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  slider.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToNextSlideCallback();
      } else {
        goToPrevSlideCallback();
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
  if(!controlsPanel) return null; // Guard if panel is not on page
  controlsPanel.innerHTML = ''; // Clear panel before adding new GUI
  controlsPanel.appendChild(gui.domElement);

  const lightingFolder = gui.addFolder('Lighting');
  lightingFolder.add(config.lighting, 'ambientIntensity', 0, 2).onChange(updateLightingCallback);
  lightingFolder.add(config.lighting, 'directionalIntensity', 0, 3).onChange(updateLightingCallback);

  const backgroundFolder = gui.addFolder('Scene');
  backgroundFolder.addColor(config.background, 'color').onChange(updateBackgroundCallback);

  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(config.camera, 'fov', 20, 100).onChange(updateCameraCallback);

  lightingFolder.open();
  return gui;
}
