    class ProductViewer {
            constructor() {
                this.products = [];
                this.currentIndex = 0;
                this.scenes = [];
                this.renderers = [];
                this.cameras = [];
                this.controls = [];
                this.gui = null;
                this.isInitialized = false;
                
                // Configuration
                this.config = {
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
                
                this.init();
            }
            
            /**
             * Initialize the application
             */
            async init() {
                try {
                    this.setupProductData();
                    this.createSliderStructure();
                    await this.initializeScenes();
                    this.setupControls();
                    this.setupGUI();
                    this.setupEventListeners();
                    this.startRenderLoop();
                    this.hideLoadingScreen();
                    this.isInitialized = true;
                } catch (error) {
                    console.error('Failed to initialize Product Viewer:', error);
                    this.showError('Failed to load 3D models. Please refresh the page.');
                }
            }
            
            /**
             * Define product data with different materials
             */
            setupProductData() {
                this.products = [
                    {
                        name: 'Metallic Cup',
                        description: 'Premium metallic finish',
                        material: 'metallic',
                        color: 0x888888,
                        roughness: 0.1,
                        metalness: 0.9
                    },
                    {
                        name: 'Matte Cup',
                        description: 'Smooth matte texture',
                        material: 'matte',
                        color: 0x4a90e2,
                        roughness: 0.8,
                        metalness: 0.1
                    },
                    {
                        name: 'Glass Cup',
                        description: 'Transparent glass effect',
                        material: 'glass',
                        color: 0x88ccff,
                        roughness: 0.0,
                        metalness: 0.0,
                        transparent: true,
                        opacity: 0.7
                    },
                    {
                        name: 'Ceramic Cup',
                        description: 'Classic ceramic finish',
                        material: 'ceramic',
                        color: 0xffffff,
                        roughness: 0.6,
                        metalness: 0.0
                    }
                ];
            }
            
            /**
             * Create the HTML structure for the slider
             */
            createSliderStructure() {
                const sliderContainer = document.getElementById('sliderContainer');
                const sliderNav = document.getElementById('sliderNav');
                
                this.products.forEach((product, index) => {
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
                    dot.addEventListener('click', () => this.goToSlide(index));
                    sliderNav.appendChild(dot);
                });
            }
            
            /**
             * Initialize Three.js scenes for each product
             */
            async initializeScenes() {
                for (let i = 0; i < this.products.length; i++) {
                    await this.createScene(i);
                }
            }
            
            /**
             * Create a Three.js scene for a specific product
             */
            async createScene(index) {
                const container = document.getElementById(`viewer-${index}`);
                const product = this.products[index];
                
                // Scene
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(this.config.background.color);
                this.scenes.push(scene);
                
                // Camera
                const camera = new THREE.PerspectiveCamera(
                    this.config.camera.fov,
                    container.clientWidth / container.clientHeight,
                    this.config.camera.near,
                    this.config.camera.far
                );
                camera.position.set(
                    this.config.camera.position.x,
                    this.config.camera.position.y,
                    this.config.camera.position.z
                );
                this.cameras.push(camera);
                
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
                this.renderers.push(renderer);
                
                // Lighting
                this.setupLighting(scene);
                
                // Create 3D model (using a procedural cup since we can't load external models)
                const model = this.createCupModel(product);
                scene.add(model);
                
                // OrbitControls
                // Note: OrbitControls would normally be imported, but we'll create basic controls
                const controls = this.createBasicControls(camera, renderer.domElement);
                this.controls.push(controls);
            }
            
            /**
             * Setup lighting for the scene
             */
            setupLighting(scene) {
                // Ambient light
                const ambientLight = new THREE.AmbientLight(
                    0xffffff, 
                    this.config.lighting.ambientIntensity
                );
                scene.add(ambientLight);
                
                // Directional light
                const directionalLight = new THREE.DirectionalLight(
                    0xffffff, 
                    this.config.lighting.directionalIntensity
                );
                directionalLight.position.set(
                    this.config.lighting.directionalPosition.x,
                    this.config.lighting.directionalPosition.y,
                    this.config.lighting.directionalPosition.z
                );
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                scene.add(directionalLight);
                
                // Environment lighting
                const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1d, 0.3);
                scene.add(hemisphereLight);
            }
            
            /**
             * Create a procedural cup model
             */
            createCupModel(product) {
                const group = new THREE.Group();
                
                // Cup body (cylinder)
                const cupGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 32);
                const cupMaterial = this.createMaterial(product);
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
                plane.position.y = -1;
                plane.receiveShadow = true;
                group.add(plane);
                
                return group;
            }
            
            /**
             * Create material based on product specifications
             */
            createMaterial(product) {
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
            
            /**
             * Create basic orbit-like controls
             */
            createBasicControls(camera, domElement) {
                const controls = {
                    camera: camera,
                    domElement: domElement,
                    isMouseDown: false,
                    mouseX: 0,
                    mouseY: 0,
                    targetRotationX: 0,
                    targetRotationY: 0,
                    rotationX: 0,
                    rotationY: 0,
                    distance: 5,
                    targetDistance: 5
                };
                
                // Mouse events
                domElement.addEventListener('mousedown', (e) => {
                    controls.isMouseDown = true;
                    controls.mouseX = e.clientX;
                    controls.mouseY = e.clientY;
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!controls.isMouseDown) return;
                    
                    const deltaX = e.clientX - controls.mouseX;
                    const deltaY = e.clientY - controls.mouseY;
                    
                    controls.targetRotationY += deltaX * 0.01;
                    controls.targetRotationX += deltaY * 0.01;
                    
                    controls.mouseX = e.clientX;
                    controls.mouseY = e.clientY;
                });
                
                document.addEventListener('mouseup', () => {
                    controls.isMouseDown = false;
                });
                
                // Wheel zoom
                domElement.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    controls.targetDistance += e.deltaY * 0.01;
                    controls.targetDistance = Math.max(2, Math.min(20, controls.targetDistance));
                });
                
                // Touch events for mobile
                let touchStartX, touchStartY;
                
                domElement.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                    }
                });
                
                domElement.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (e.touches.length === 1) {
                        const deltaX = e.touches[0].clientX - touchStartX;
                        const deltaY = e.touches[0].clientY - touchStartY;
                        
                        controls.targetRotationY += deltaX * 0.01;
                        controls.targetRotationX += deltaY * 0.01;
                        
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                    }
                });
                
                return controls;
            }
            
            /**
             * Setup slider navigation controls
             */
            setupControls() {
                document.getElementById('prevBtn').addEventListener('click', () => {
                    this.goToSlide(this.currentIndex - 1);
                });
                
                document.getElementById('nextBtn').addEventListener('click', () => {
                    this.goToSlide(this.currentIndex + 1);
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
                            this.goToSlide(this.currentIndex + 1);
                        } else {
                            this.goToSlide(this.currentIndex - 1);
                        }
                    }
                });
            }
            
            /**
             * Setup dat.GUI controls
             */
            setupGUI() {
                this.gui = new dat.GUI({ 
                    autoPlace: false,
                    width: 300
                });
                
                const controlsPanel = document.getElementById('controlsPanel');
                controlsPanel.appendChild(this.gui.domElement);
                
                // Lighting controls
                const lightingFolder = this.gui.addFolder('Lighting');
                lightingFolder.add(this.config.lighting, 'ambientIntensity', 0, 2).onChange(() => {
                    this.updateLighting();
                });
                lightingFolder.add(this.config.lighting, 'directionalIntensity', 0, 3).onChange(() => {
                    this.updateLighting();
                });
                
                // Background controls
                const backgroundFolder = this.gui.addFolder('Scene');
                backgroundFolder.addColor(this.config.background, 'color').onChange(() => {
                    this.updateBackground();
                });
                
                // Camera controls
                const cameraFolder = this.gui.addFolder('Camera');
                cameraFolder.add(this.config.camera, 'fov', 20, 100).onChange(() => {
                    this.updateCamera();
                });
                
                lightingFolder.open();
            }
            
            /**
             * Update lighting in all scenes
             */
            updateLighting() {
                this.scenes.forEach(scene => {
                    scene.children.forEach(child => {
                        if (child instanceof THREE.AmbientLight) {
                            child.intensity = this.config.lighting.ambientIntensity;
                        } else if (child instanceof THREE.DirectionalLight) {
                            child.intensity = this.config.lighting.directionalIntensity;
                        }
                    });
                });
            }
            
            /**
             * Update background in all scenes
             */
            updateBackground() {
                this.scenes.forEach(scene => {
                    scene.background.setHex(this.config.background.color);
                });
            }
            
            /**
             * Update camera settings
             */
            updateCamera() {
                this.cameras.forEach(camera => {
                    camera.fov = this.config.camera.fov;
                    camera.updateProjectionMatrix();
                });
            }
            
            /**
             * Setup window resize listener
             */
            setupEventListeners() {
                window.addEventListener('resize', () => {
                    this.handleResize();
                });
                
                // Keyboard navigation
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') {
                        this.goToSlide(this.currentIndex - 1);
                    } else if (e.key === 'ArrowRight') {
                        this.goToSlide(this.currentIndex + 1);
                    }
                });
            }
            
            /**
             * Handle window resize
             */
            handleResize() {
                this.renderers.forEach((renderer, index) => {
                    const container = document.getElementById(`viewer-${index}`);
                    const camera = this.cameras[index];
                    
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    
                    renderer.setSize(container.clientWidth, container.clientHeight);
                });
            }
            
            /**
             * Navigate to specific slide
             */
            goToSlide(index) {
                const maxIndex = this.products.length - 1;
                
                if (index < 0) {
                    this.currentIndex = maxIndex;
                } else if (index > maxIndex) {
                    this.currentIndex = 0;
                } else {
                    this.currentIndex = index;
                }
                
                // Update slider position
                const sliderContainer = document.getElementById('sliderContainer');
                const translateX = -this.currentIndex * 100;
                sliderContainer.style.transform = `translateX(${translateX}%)`;
                
                // Update navigation dots
                document.querySelectorAll('.nav-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === this.currentIndex);
                });
            }
            
            /**
             * Update controls for current scene
             */
            updateControls() {
                this.controls.forEach((control, index) => {
                    if (index !== this.currentIndex) return;
                    
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
            startRenderLoop() {
                const animate = () => {
                    requestAnimationFrame(animate);
                    
                    if (!this.isInitialized) return;
                    
                    this.updateControls();
                    
                    // Render all scenes
                    this.renderers.forEach((renderer, index) => {
                        renderer.render(this.scenes[index], this.cameras[index]);
                    });
                };
                
                animate();
            }
            
            /**
             * Hide loading screen
             */
            hideLoadingScreen() {
                const loadingScreen = document.getElementById('loadingScreen');
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
            
            /**
             * Show error message
             */
            showError(message) {
                const loadingScreen = document.getElementById('loadingScreen');
                loadingScreen.innerHTML = `
                    <div style="text-align: center;">
                        <h2>⚠️ Error</h2>
                        <p>${message}</p>
                    </div>
                `;
            }
        }
        
        // Initialize the application when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new ProductViewer();
        });