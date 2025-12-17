// 3D Merch Section
// import the three
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.181.2/examples/jsm/loaders/GLTFLoader.js?module';
import { OrbitControls } from 'https://unpkg.com/three@0.181.2/examples/jsm/controls/OrbitControls.js?module';

// paths to the modesl
const modelPaths = {
  'model-DB-Festival-Shirt': '../public/models/db-festival-shirt-2021/scene.gltf',
  'model-MMA-Team-Shirt': '../public/models/mma-team-shirt/scene.gltf',
  'model-Track-Nationals-Jersey': '../public/models/track-nationals-jersey/scene.gltf',
};

function init3DModel(container) {
  //get sizes
  const width = container.clientWidth-100 || 600;
  const height = container.clientHeight-100 || 500;

  //make scene and remove bg
  const scene = new THREE.Scene();
  scene.background = null;

  //make the cam and set pos to be abit above and away
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.5, 3);

  //make renderer inside scene to load models
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // store if needed ltr
  container._renderer = renderer;
  container._camera = camera;
  container._scene = scene;

  //orbit controls to circle around 
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;

  //add lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  //make the loader for model and get path from id
  const loader = new GLTFLoader();
  const path = modelPaths[container.id];

  if (!path) {
    container.innerHTML = '<p style="color: red; text-align: center;">Model isnt inside folder</p>';
    return;
  }

  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;

      //check smallest box to contain model / get center of the model / get sizes of the box
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      //get the largest dimension / scale up or down to 2.5 units
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.5 / maxDim;

      //moves model back to world center THEN scaling
      model.position.sub(center.multiplyScalar(scale));
      model.scale.set(scale, scale, scale);
      scene.add(model);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    },
    undefined,
    (error) => {
      console.error('GLTF load error:', error);
      container.innerHTML = '<p style="color: red;">Failed to load 3D model 😔</p>';
    }
  );

  // in case resize make usre camera and renderer cahnge
  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);
}

// Initialize carousel models
function initCarouselModels() {
  const carousel = document.getElementById('merchCarousel');

  // Load active slide
  const activeContainer = document.querySelector('#merchCarousel .carousel-item.active .model-canvas');
  if (activeContainer && !activeContainer._rendered) {
    init3DModel(activeContainer);
    //make sure dont reload everytime
    activeContainer._rendered = true;
  }

  // Load when slide becomes active
  carousel.addEventListener('slid.bs.carousel', (event) => {
    const activeSlide = event.relatedTarget;
    const container = activeSlide.querySelector('.model-canvas');
    if (container && !container._rendered) {
      init3DModel(container);
      container._rendered = true;
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', initCarouselModels);
//End of 3D Merch section