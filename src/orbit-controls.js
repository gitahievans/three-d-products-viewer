export function createBasicControls(camera, domElement) {
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
