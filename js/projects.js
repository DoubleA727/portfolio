// 3D Merch Section
//-------------------------------------------------------------------------------------------------------------
// import the three
import * as THREE from 'https://unpkg.com/three@0.181.2/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.181.2/examples/jsm/loaders/GLTFLoader.js?module';
import { OrbitControls } from 'https://unpkg.com/three@0.181.2/examples/jsm/controls/OrbitControls.js?module';

// paths to the modesl
const modelPaths = {
  'model-DB-Festival-Shirt': './models/db-festival-shirt-2021/scene.gltf',
  'model-MMA-Team-Shirt': './models/mma-team-shirt/scene.gltf',
  'model-Track-Nationals-Jersey': './models/track-nationals-jersey/scene.gltf',
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
//-------------------------------------------------------------------------------------------------------------


// Delivery ETA Map Section
//-------------------------------------------------------------------------------------------------------------
//start (where we deliver from)
const SP = { name: "Singapore Polytechnic", lat: 1.3099, lon: 103.7772 };

// only sg locations allowed
const SG_BBOX = [103.6, 1.15, 104.1, 1.48];

//map variables
let deliveryMap, spMarker, destMarker, routeLine;

document.addEventListener("DOMContentLoaded", function () {
  // only init if the map div exists on this page
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  initDeliveryMap();

  const form = document.getElementById("etaForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      calculateETA();
    });
  }
});

// Initialize Leaflet map
function initDeliveryMap() {
  //map on sp centered
  deliveryMap = L.map("map").setView([SP.lat, SP.lon], 12);

  // OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(deliveryMap);

  //add the marker on sp
  spMarker = L.marker([SP.lat, SP.lon])
    .addTo(deliveryMap)
    .bindPopup("Singapore Polytechnic")
    .openPopup();

  // zoom out map to can see whole sg
  deliveryMap.fitBounds([
    [SG_BBOX[1], SG_BBOX[0]],
    [SG_BBOX[3], SG_BBOX[2]]
  ]);
}

function calculateETA() {
  //take user address input
  const destInput = document.getElementById("destination");
  const dest = destInput ? destInput.value.trim() : "";

  //validate input
  if (!dest) {
    setMsg("error", "Please enter a destination in Singapore.");
    return;
  }

  //inform usr of progress
  setMsg("info", "Finding location in Singapore...");

  //get actual address from the input
  geocodeSingapore(dest)
    .then(function (results) {
      //not in sg
      if (!results || results.length === 0) {
        setMsg("error", "Location not found in Singapore. Try a more specific address.");
        return null;
      }

      //get the result lat and lon
      const place = results[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      //put the marker there
      setDestinationMarker(lat, lon, place.display_name);

      //allow user see what happening in msg div
      setMsg("info", "Calculating driving route from Singapore Polytechnic...");

      //get the route from sp to destination
      return routeFromSPTo(lat, lon);
    })
    .then(function (routeData) {
      if (!routeData) return;

      //check if route is valid
      if (routeData.code !== "Ok" || !routeData.routes || routeData.routes.length === 0) {
        setMsg("error", "Unable to calculate route. Please try again.");
        return;
      }

      const route = routeData.routes[0];

      // Draw the route from sp to destination
      if (route.geometry && route.geometry.coordinates) {
        drawRoute(route.geometry.coordinates);
      }

      // Display results
      const etaTextEl = document.getElementById("etaText");
      const distTextEl = document.getElementById("distText");

      if (etaTextEl) etaTextEl.textContent = formatSeconds(route.duration);
      if (distTextEl) distTextEl.textContent = formatKm(route.distance);

      // obvs we not delivering instantly
      const bufferEl = document.getElementById("bufferText");
      if (bufferEl) bufferEl.textContent = "1 – 2 days";

      setMsg("success", "Estimated driving time calculated. Delivery buffer: 1 – 2 days.");
    })
    .catch(function () {
      setMsg("error", "Something went wrong. Please try again later.");
    });
}

//GETTING COORDINATES FROM ADDRESS USING NOMINATIM
function geocodeSingapore(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2" +
    "&q=" + encodeURIComponent(query) +
    "&countrycodes=sg" +
    "&bounded=1" +
    "&viewbox=" + SG_BBOX[0] + "," + SG_BBOX[3] + "," + SG_BBOX[2] + "," + SG_BBOX[1] +
    "&limit=1";

  return fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" }
  }).then(function (res) { return res.json(); });
}

//GETTING ROUTE FROM SP TO DESTINATION USING OSRM
function routeFromSPTo(lat, lon) {
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    SP.lon + "," + SP.lat + ";" +
    lon + "," + lat +
    "?overview=full&geometries=geojson";

  return fetch(url).then(function (res) { return res.json(); });
}

function drawRoute(coords) {
  const latlngs = coords.map(function (c) { return [c[1], c[0]]; });

  //remove b4 incase got another
  if (routeLine) deliveryMap.removeLayer(routeLine);

  routeLine = L.polyline(latlngs, { color: "#1997e6", weight: 5, opacity: 0.85 }).addTo(deliveryMap);
  deliveryMap.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
}

function setDestinationMarker(lat, lon, label) {
  //remove previous
  if (destMarker) deliveryMap.removeLayer(destMarker);

  //set the marker, add to map, add popup
  destMarker = L.marker([lat, lon]).addTo(deliveryMap).bindPopup(label);
  destMarker.openPopup();
}

//sec
function formatSeconds(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return h + " hr " + m + " min";
  return m + " min";
}

//km
function formatKm(meters) {
  const km = meters / 1000;
  return km.toFixed(km >= 10 ? 0 : 1) + " km";
}

// displaying of the messages in the mean time inside the msg div
function setMsg(type, text) {
  const el = document.getElementById("msg");
  if (!el) return;

  const cls =
    type === "error" ? "alert-danger" :
    type === "success" ? "alert-success" :
    "alert-secondary";

  el.innerHTML = '<div class="alert ' + cls + ' py-2 mb-0">' + text + "</div>";
}
//End of Delivery ETA Map section
//-------------------------------------------------------------------------------------------------------------