import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";
import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { experiments } from "./experiments.js";
import { supabaseConfig } from "./supabase-config.js";

const cameraEl = document.getElementById("camera");
const canvas = document.getElementById("three-canvas");
const labelsLayer = document.getElementById("labels-layer");
const cursorEl = document.getElementById("cursor");
const demoCursorEl = document.getElementById("demoCursor");
if (demoCursorEl) demoCursorEl.textContent = "";
const experimentSelect = document.getElementById("experimentSelect");
const demoToggleBtn = document.getElementById("demoToggle");
const demoStatusEl = document.getElementById("demoStatus");
const doYourselfBtn = document.getElementById("doYourselfBtn");
const stepTitleEl = document.getElementById("stepTitle");
const stepDetailEl = document.getElementById("stepDetail");
const targetLabelEl = document.getElementById("targetLabel");
const statusText = document.getElementById("statusText");
const chemTextEl = document.getElementById("chemText");
const explanationTextEl = document.getElementById("explanationText");
const detailedExplainTextEl = document.getElementById("detailedExplainText");
const wikiLinkEl = document.getElementById("wikiLink");
const cvToggleBtn = document.getElementById("cvToggle");
const rotateToggleBtn = document.getElementById("rotateToggle");
const handsOffToggleBtn = document.getElementById("handsOffToggle");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomInBtn = document.getElementById("zoomIn");
const authOverlay = document.getElementById("authOverlay");
const authForm = document.getElementById("authForm");
const userNameInput = document.getElementById("userName");
const userEmailInput = document.getElementById("userEmail");
const userPasswordInput = document.getElementById("userPassword");
const userConfirmPasswordInput = document.getElementById("userConfirmPassword");
const confirmWrap = document.getElementById("confirmWrap");
const authMessageEl = document.getElementById("authMessage");
const modeSignInBtn = document.getElementById("modeSignIn");
const modeSignUpBtn = document.getElementById("modeSignUp");
const signOutBtn = document.getElementById("signOutBtn");
const authSubmit = document.getElementById("authSubmit");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.01, 100);
const cameraBase = { x: 0, y: 1.35, z: 2.05 };
const cameraTarget = new THREE.Vector3(0, 0.15, 0);
const cameraTargetBase = new THREE.Vector3(0, 0.15, 0);
const cameraTargetDesired = new THREE.Vector3(0, 0.15, 0);
let zoomLevel = 1.0;
let reactionZoom = 1.0;
function applyZoom() {
  const effectiveZoom = zoomLevel * reactionZoom;
  const desiredX = cameraBase.x + cameraTarget.x * 0.5;
  const desiredY = cameraBase.y * effectiveZoom + (cameraTarget.y - cameraTargetBase.y) * 0.2;
  const desiredZ = cameraBase.z * effectiveZoom + Math.abs(cameraTarget.z) * 0.12;
  camera.position.set(desiredX, desiredY, desiredZ);
  camera.lookAt(cameraTarget);
}
applyZoom();

scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x31465e, 0.9));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(1.6, 2.1, 1.2);
scene.add(keyLight);

const labRoot = new THREE.Group();
scene.add(labRoot);

const table = new THREE.Mesh(
  new THREE.BoxGeometry(2.5, 0.12, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x2f3e50, roughness: 0.82, metalness: 0.1 })
);
table.position.y = -0.06;
labRoot.add(table);

const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const tmpVec = new THREE.Vector3();

const liquid = new THREE.Mesh(
  new THREE.CylinderGeometry(0.08, 0.08, 0.08, 24),
  new THREE.MeshStandardMaterial({
    color: 0x60b8ff,
    emissive: 0x143453,
    transparent: true,
    opacity: 0.8,
  })
);
labRoot.add(liquid);

const flame = new THREE.Group();
const outerFlame = new THREE.Mesh(
  new THREE.ConeGeometry(0.03, 0.12, 20),
  new THREE.MeshStandardMaterial({
    color: 0xffa23c,
    emissive: 0xaa3e00,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.8,
  })
);
outerFlame.position.y = 0.06;
const innerFlame = new THREE.Mesh(
  new THREE.ConeGeometry(0.015, 0.07, 20),
  new THREE.MeshStandardMaterial({
    color: 0x72d5ff,
    emissive: 0x1f7aa3,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.9,
  })
);
innerFlame.position.y = 0.035;
flame.add(outerFlame);
flame.add(innerFlame);
flame.visible = false;
labRoot.add(flame);

const bubbles = new THREE.Group();
for (let i = 0; i < 18; i += 1) {
  const bubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.007 + Math.random() * 0.006, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xe6f8ff, transparent: true, opacity: 0.65 })
  );
  bubble.position.set((Math.random() - 0.5) * 0.13, 0.02 + Math.random() * 0.09, (Math.random() - 0.5) * 0.13);
  bubbles.add(bubble);
}
bubbles.visible = false;
labRoot.add(bubbles);

const crystals = new THREE.Group();
for (let i = 0; i < 24; i += 1) {
  const crystal = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.01 + Math.random() * 0.015, 0),
    new THREE.MeshStandardMaterial({
      color: 0x4f8dff,
      emissive: 0x1a3068,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.1,
    })
  );
  crystal.position.set((Math.random() - 0.5) * 0.11, Math.random() * 0.1, (Math.random() - 0.5) * 0.11);
  crystals.add(crystal);
}
crystals.visible = false;
labRoot.add(crystals);

const arrowGroup = new THREE.Group();
const arrowStem = new THREE.Mesh(
  new THREE.CylinderGeometry(0.008, 0.008, 0.12, 10),
  new THREE.MeshStandardMaterial({ color: 0xffe38b, emissive: 0x5f4b09, emissiveIntensity: 0.8 })
);
arrowStem.position.y = 0.06;
const arrowHead = new THREE.Mesh(
  new THREE.ConeGeometry(0.025, 0.05, 12),
  new THREE.MeshStandardMaterial({ color: 0xffc85c, emissive: 0x5f3908, emissiveIntensity: 0.9 })
);
arrowHead.position.y = 0.145;
arrowGroup.add(arrowStem);
arrowGroup.add(arrowHead);
arrowGroup.visible = false;
labRoot.add(arrowGroup);

const placementOverlay = new THREE.Group();
const placementRing = new THREE.Mesh(
  new THREE.RingGeometry(0.05, 0.085, 40),
  new THREE.MeshBasicMaterial({
    color: 0x9ce7ff,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
placementRing.rotation.x = -Math.PI / 2;
const placementGlow = new THREE.Mesh(
  new THREE.CylinderGeometry(0.026, 0.026, 0.12, 20, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xb8eeff,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  })
);
placementGlow.position.y = 0.04;
placementOverlay.add(placementRing);
placementOverlay.add(placementGlow);
placementOverlay.visible = false;
labRoot.add(placementOverlay);

const WIKI_BY_KEY = {
  flame_test: "https://en.wikipedia.org/wiki/Flame_test",
  crystal_growth: "https://en.wikipedia.org/wiki/Crystallization",
  acid_base_gas: "https://en.wikipedia.org/wiki/Sodium_bicarbonate",
  electrolysis_water: "https://en.wikipedia.org/wiki/Electrolysis_of_water",
  red_cabbage_indicator: "https://en.wikipedia.org/wiki/PH_indicator",
  acid_base_titration: "https://en.wikipedia.org/wiki/Acid%E2%80%93base_titration",
  back_titration: "https://en.wikipedia.org/wiki/Titration#Back_titration",
  gravimetric_sulfate: "https://en.wikipedia.org/wiki/Gravimetric_analysis",
  calorimetry_neutralization: "https://en.wikipedia.org/wiki/Calorimetry",
  hess_law: "https://en.wikipedia.org/wiki/Hess%27s_law",
  rate_temp: "https://en.wikipedia.org/wiki/Reaction_rate",
  rate_concentration: "https://en.wikipedia.org/wiki/Rate_equation",
  catalyst_h2o2: "https://en.wikipedia.org/wiki/Catalysis",
  le_chatelier: "https://en.wikipedia.org/wiki/Le_Chatelier%27s_principle",
  solubility_curve: "https://en.wikipedia.org/wiki/Solubility",
  recrystallization: "https://en.wikipedia.org/wiki/Recrystallization_(chemistry)",
  filtration: "https://en.wikipedia.org/wiki/Filtration",
  simple_distillation: "https://en.wikipedia.org/wiki/Distillation",
  fractional_distillation: "https://en.wikipedia.org/wiki/Fractional_distillation",
  steam_distillation: "https://en.wikipedia.org/wiki/Steam_distillation",
  liquid_extraction: "https://en.wikipedia.org/wiki/Liquid%E2%80%93liquid_extraction",
  drying_layer: "https://en.wikipedia.org/wiki/Drying_(chemistry)",
  melting_point: "https://en.wikipedia.org/wiki/Melting_point",
  paper_chromatography: "https://en.wikipedia.org/wiki/Paper_chromatography",
  tlc: "https://en.wikipedia.org/wiki/Thin-layer_chromatography",
  saponification: "https://en.wikipedia.org/wiki/Saponification",
  esterification: "https://en.wikipedia.org/wiki/Esterification",
  aspirin_synthesis: "https://en.wikipedia.org/wiki/Aspirin",
  nylon_rope: "https://en.wikipedia.org/wiki/Nylon",
  iodine_clock: "https://en.wikipedia.org/wiki/Iodine_clock_reaction",
  briggs_rauscher: "https://en.wikipedia.org/wiki/Briggs%E2%80%93Rauscher_reaction",
  silver_mirror: "https://en.wikipedia.org/wiki/Tollens%27_reagent",
  benedict_test: "https://en.wikipedia.org/wiki/Benedict%27s_reagent",
  cation_analysis: "https://en.wikipedia.org/wiki/Qualitative_inorganic_analysis",
  buffer_preparation: "https://en.wikipedia.org/wiki/Buffer_solution",
  buffer_capacity: "https://en.wikipedia.org/wiki/Buffer_capacity",
  conductivity: "https://en.wikipedia.org/wiki/Electrical_conductivity",
  galvanic_cell: "https://en.wikipedia.org/wiki/Galvanic_cell",
  corrosion_demo: "https://en.wikipedia.org/wiki/Corrosion",
  gas_laws: "https://en.wikipedia.org/wiki/Gas_laws",
  molar_mass_volatile: "https://en.wikipedia.org/wiki/Molar_mass",
  stoichiometry_gas: "https://en.wikipedia.org/wiki/Stoichiometry",
  limiting_reagent: "https://en.wikipedia.org/wiki/Limiting_reagent",
  percent_yield: "https://en.wikipedia.org/wiki/Reaction_yield",
  baking_soda_decomp: "https://en.wikipedia.org/wiki/Sodium_bicarbonate",
  hydrate_water: "https://en.wikipedia.org/wiki/Hydrate",
  beer_lambert: "https://en.wikipedia.org/wiki/Beer%E2%80%93Lambert_law",
  adsorption_charcoal: "https://en.wikipedia.org/wiki/Adsorption",
  enthalpy_dissolution: "https://en.wikipedia.org/wiki/Enthalpy_of_solution",
  functional_group_tests: "https://en.wikipedia.org/wiki/Functional_group",
};

const toolDefs = {
  beaker: {
    file: "bottle_glassware_beaker_medium.glb",
    folder: "assets/models",
    target: 0.28,
    pos: [-0.14, 0.05, 0.0],
    rotY: 0,
    grabbable: true,
    label: "Beaker",
    radius: 0.13,
  },
  testTube: {
    file: "bottle_glassware_test_tube_small.glb",
    folder: "assets/models",
    target: 0.22,
    pos: [0.22, 0.05, 0.3],
    rotY: 0.2,
    grabbable: true,
    label: "Test Tube",
    radius: 0.08,
  },
  dropper: {
    file: "bottle_dropper.glb",
    folder: "assets/models",
    target: 0.24,
    pos: [0.53, 0.05, 0.0],
    rotY: -0.3,
    grabbable: true,
    label: "Dropper",
    radius: 0.09,
  },
  pipet: {
    file: "bottle_pipet.glb",
    folder: "assets/models",
    target: 0.28,
    pos: [0.72, 0.05, -0.25],
    rotY: -0.6,
    grabbable: true,
    label: "Pipet",
    radius: 0.09,
  },
  stirStick: {
    file: "heating_equipment_stirring_stick.glb",
    folder: "assets/models",
    target: 0.26,
    pos: [-0.08, 0.05, 0.42],
    rotY: 0.4,
    grabbable: true,
    label: "Stirring Stick",
    radius: 0.08,
  },
  thermometer: {
    file: "heating_equipment_thermometer.glb",
    folder: "assets/models",
    target: 0.3,
    pos: [0.82, 0.05, 0.42],
    rotY: 0.1,
    grabbable: true,
    label: "Thermometer",
    radius: 0.08,
  },
  ringClamp: {
    file: "clamp_ring_clamp.glb",
    folder: "assets/models",
    target: 0.3,
    pos: [-0.46, 0.05, 0.3],
    rotY: 0.2,
    grabbable: true,
    label: "Ring Clamp",
    radius: 0.11,
  },
  burner: {
    file: "heating_equipment_bunsen_burner.glb",
    folder: "assets/models",
    target: 0.34,
    pos: [-0.94, 0.02, 0.38],
    rotY: 0,
    grabbable: false,
    label: "Bunsen Burner",
    radius: 0.12,
    flameOffset: [0, 0.18, 0],
  },
  hotPlate: {
    file: "machine_hot_plate.glb",
    folder: "assets/models",
    target: 0.42,
    pos: [-0.74, 0.02, -0.3],
    rotY: -2.25,
    grabbable: false,
    label: "Hot Plate",
    radius: 0.16,
  },
  burette: {
    file: "funnel_buret.glb",
    folder: "assets/models",
    target: 0.36,
    pos: [0.88, 0.05, -0.44],
    rotY: 0.15,
    grabbable: true,
    label: "Burette",
    radius: 0.11,
  },
};

const objects = {};
const labelEls = {};
const loader = new GLTFLoader();

const sim = {
  expIndex: 0,
  success: false,
  flameHeat: 0,
  stirTime: 0,
  dispenseCount: 0,
  electroTime: 0,
  stageA: false,
  stageB: false,
  stirIntensity: 0,
  stirPathScore: 0,
  beakerOnHotPlate: false,
  burnerOn: false,
  burnerHeat: 0,
  burnerIdleTime: 0,
  focusTool: null,
  focusZoomTarget: 1.0,
  velocities: {},
  handTrackingEnabled: true,
  pinchMode: true,
  rotateMode: false,
  worldBounds: { minX: -1.02, maxX: 0.96, minZ: -0.58, maxZ: 0.58 },
  instruction: { title: "Initializing...", detail: "", targetKey: null, status: "Status: booting" },
};
sim.liquidTargetColor = new THREE.Color(0x60b8ff);
let isSignedIn = false;
let authMode = "signin";
let releasePending = false;
let releaseStartedAt = 0;

const input = {
  active: false,
  screenX: 0,
  screenY: 0,
  prevScreenX: 0,
  prevScreenY: 0,
  pinch: false,
  prevPinch: false,
};
const demo = {
  active: false,
  phase: "idle",
  timer: 0,
  count: 0,
  pulse: 0,
};
let focusOrbitPhase = 0;
let mouseDown = false;
let grabbed = null;
let handLandmarker = null;
let lastVideoTime = -1;

const PROFILE_BY_TEMPLATE = {
  heat: {
    liquidWobble: 0.009,
    liquidSpin: 0.04,
    liquidSpread: 0.022,
    flameFlicker: 1.0,
    flameLift: 1.0,
    bubbleRise: 0.09,
    bubbleOpacity: 0.32,
    stirDecay: 0.86,
    stirGain: 2.0,
    stirThreshold: 0.044,
    contactGain: 1.0,
  },
  stir_heat: {
    liquidWobble: 0.014,
    liquidSpin: 0.085,
    liquidSpread: 0.04,
    flameFlicker: 0.9,
    flameLift: 0.95,
    bubbleRise: 0.08,
    bubbleOpacity: 0.28,
    stirDecay: 0.62,
    stirGain: 2.8,
    stirThreshold: 0.036,
    contactGain: 1.12,
  },
  dispense: {
    liquidWobble: 0.007,
    liquidSpin: 0.03,
    liquidSpread: 0.018,
    flameFlicker: 0.8,
    flameLift: 0.8,
    bubbleRise: 0.12,
    bubbleOpacity: 0.44,
    stirDecay: 0.88,
    stirGain: 1.6,
    stirThreshold: 0.046,
    contactGain: 0.96,
  },
  measure: {
    liquidWobble: 0.004,
    liquidSpin: 0.015,
    liquidSpread: 0.012,
    flameFlicker: 0.8,
    flameLift: 0.8,
    bubbleRise: 0.06,
    bubbleOpacity: 0.24,
    stirDecay: 0.9,
    stirGain: 1.5,
    stirThreshold: 0.05,
    contactGain: 0.95,
  },
  electrolysis: {
    liquidWobble: 0.008,
    liquidSpin: 0.038,
    liquidSpread: 0.026,
    flameFlicker: 0.85,
    flameLift: 0.8,
    bubbleRise: 0.14,
    bubbleOpacity: 0.52,
    stirDecay: 0.88,
    stirGain: 1.5,
    stirThreshold: 0.045,
    contactGain: 1.05,
  },
  indicator: {
    liquidWobble: 0.006,
    liquidSpin: 0.02,
    liquidSpread: 0.016,
    flameFlicker: 0.8,
    flameLift: 0.8,
    bubbleRise: 0.09,
    bubbleOpacity: 0.35,
    stirDecay: 0.88,
    stirGain: 1.4,
    stirThreshold: 0.046,
    contactGain: 0.96,
  },
};

const PROFILE_OVERRIDES = {
  flame_test: { flameFlicker: 1.2, flameLift: 1.1, contactGain: 1.2 },
  iodine_clock: { bubbleRise: 0.16, bubbleOpacity: 0.55 },
  briggs_rauscher: { liquidWobble: 0.017, liquidSpin: 0.12, liquidSpread: 0.05, stirGain: 3.0 },
  silver_mirror: { contactGain: 1.15, liquidWobble: 0.005 },
  electrolysis_water: { bubbleRise: 0.18, bubbleOpacity: 0.62, contactGain: 1.15 },
  galvanic_cell: { bubbleRise: 0.11, bubbleOpacity: 0.4 },
  red_cabbage_indicator: { liquidSpin: 0.028, liquidWobble: 0.007 },
  crystal_growth: { liquidSpread: 0.046, stirGain: 2.9 },
};

function getReactionProfile(exp) {
  const templateProfile = PROFILE_BY_TEMPLATE[exp.template] || PROFILE_BY_TEMPLATE.heat;
  const override = PROFILE_OVERRIDES[exp.key] || {};
  return { ...templateProfile, ...override };
}

function fallbackMesh(name) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x8cb6de, roughness: 0.5 });
  switch (name) {
    case "beaker":
      return new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 18), mat);
    case "burner":
      return new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 16), mat);
    case "hotPlate":
      return new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.16), mat);
    case "ringClamp":
      return new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 10, 22), mat);
    default:
      return new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.04), mat);
  }
}

function normalizeModel(root, targetSize) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return;
  root.scale.multiplyScalar(targetSize / maxDim);
}

function createLabel(toolKey, text) {
  const el = document.createElement("div");
  el.className = "equip-label";
  el.textContent = text;
  labelsLayer.appendChild(el);
  labelEls[toolKey] = el;
}

async function loadTool(name, def) {
  const folder = def.folder || "assets/models";
  const path = `./${folder}/${def.file}`;
  return new Promise((resolve) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        normalizeModel(model, def.target);
        model.position.set(def.pos[0], def.pos[1], def.pos[2]);
        model.rotation.y = def.rotY;
        const box = new THREE.Box3().setFromObject(model);
        const baseLift = model.position.y - box.min.y;
        const topOffset = box.max.y - model.position.y;
        model.userData = {
          name,
          grabbable: def.grabbable,
          baseLift: Number.isFinite(baseLift) ? baseLift : 0.05,
          topOffset: Number.isFinite(topOffset) ? topOffset : 0.08,
        };
        labRoot.add(model);
        objects[name] = model;
        createLabel(name, def.label);
        resolve();
      },
      undefined,
      () => {
        const f = fallbackMesh(name);
        f.position.set(def.pos[0], def.pos[1], def.pos[2]);
        f.rotation.y = def.rotY;
        const box = new THREE.Box3().setFromObject(f);
        f.userData = {
          name,
          grabbable: def.grabbable,
          baseLift: f.position.y - box.min.y,
          topOffset: box.max.y - f.position.y,
        };
        labRoot.add(f);
        objects[name] = f;
        createLabel(name, def.label);
        resolve();
      }
    );
  });
}

async function initAssets() {
  await Promise.all(Object.entries(toolDefs).map(([name, def]) => loadTool(name, def)));
  alignEffects();
}

function alignEffects(profile) {
  const pfx = profile || PROFILE_BY_TEMPLATE.heat;
  if (objects.beaker) {
    const p = objects.beaker.position;
    const wobble = Math.sin(performance.now() * 0.012) * pfx.liquidWobble * sim.stirIntensity;
    liquid.position.set(p.x, p.y + 0.055 + wobble, p.z);
    liquid.rotation.y += pfx.liquidSpin * sim.stirIntensity;
    liquid.scale.set(1 + pfx.liquidSpread * sim.stirIntensity, 1, 1 + pfx.liquidSpread * sim.stirIntensity);
    bubbles.position.set(p.x, p.y + 0.02, p.z);
    crystals.position.set(p.x, p.y + 0.02, p.z);
  }
  if (objects.burner) {
    const p = objects.burner.position;
    const topOffset = objects.burner.userData.topOffset || 0.16;
    flame.position.set(p.x, p.y + topOffset * 0.94, p.z);
    const flickerBase = 0.82 + Math.abs(Math.sin(performance.now() * 0.02 * pfx.flameFlicker)) * 0.24;
    const flick = THREE.MathUtils.lerp(0.55, flickerBase, sim.burnerHeat);
    flame.scale.set(
      (0.9 + 0.07 * flick) * sim.burnerHeat,
      flick * sim.burnerHeat * pfx.flameLift,
      (0.9 + 0.07 * flick) * sim.burnerHeat
    );
  }
}

function screenToTablePoint(x, y) {
  const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  raycaster.ray.intersectPlane(tablePlane, tmpVec);
  return tmpVec.clone();
}

function dist(a, b) {
  return a.position.distanceTo(b.position);
}

function dist2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function resolveToolKey(requested) {
  if (requested && objects[requested]) return requested;
  const fallbackMap = {
    conicalFlask: "beaker",
    volumetricFlask: "beaker",
    graduatedCylinder: "beaker",
    burette: "burette",
  };
  const mapped = fallbackMap[requested];
  if (mapped && objects[mapped]) return mapped;
  return "beaker";
}

function getChemistryContext(exp) {
  const keyMap = {
    flame_test: "Salt sample in test tube; Bunsen heating for emission color.",
    crystal_growth: "Copper sulfate solution in beaker; heating + stirring to promote crystallization.",
    acid_base_gas: "Acid reagent + bicarbonate in beaker; CO2 bubble evolution.",
    electrolysis_water: "Water/electrolyte in beaker; simulated electrode current path.",
    red_cabbage_indicator: "Red cabbage indicator in beaker; acid then base causes color shift.",
  };
  if (keyMap[exp.key]) return keyMap[exp.key];
  if (exp.template === "heat") return "Aqueous sample in vessel; thermal energy applied by burner.";
  if (exp.template === "stir_heat") return "Solution in beaker over hot plate; mixing improves mass/heat transfer.";
  if (exp.template === "dispense") return "Reagent additions into beaker; reaction progress tracked by dispenses.";
  if (exp.template === "measure") return "Solution in beaker monitored by probe-style measurement.";
  if (exp.template === "electrolysis") return "Electrolyte solution with simulated electrode contact.";
  if (exp.template === "indicator") return "Indicator solution with acid/base additions for pH transition.";
  return "Generic lab solution and reagents for this simulated protocol.";
}

function getDetailedExplanation(exp) {
  const byTemplate = {
    heat:
      "Heating gives tiny particles more energy, so they move faster and bump into each other more. More useful bumps means the reaction can happen sooner.",
    stir_heat:
      "Heat helps, but stirring spreads that heat everywhere. Think of mixing soup so every spoonful gets warm instead of only one hot spot.",
    dispense:
      "Each drop is like adding one more ingredient spoon. The simulator counts those additions until there is enough to show the reaction result.",
    measure:
      "The tool must stay touching the liquid so it can read it properly. Quick touches are noisy; steady contact gives a better answer.",
    electrolysis:
      "In real life this needs electricity and electrodes. Here, the setup step plus probe contact acts like turning the power path on so the effect can start.",
    indicator:
      "Indicators are like color storytellers. Add acid or base, and the indicator molecule changes form, so the color changes too.",
  };
  return `${exp.explanation} ${byTemplate[exp.template] || ""}`.trim();
}

function canOverlap(a, b) {
  const pair = [a, b].sort().join(":");
  return (
    pair === "beaker:hotPlate" ||
    pair === "beaker:stirStick" ||
    pair === "beaker:thermometer" ||
    pair === "beaker:dropper" ||
    pair === "beaker:pipet" ||
    pair === "beaker:burette" ||
    pair === "hotPlate:stirStick" ||
    pair === "hotPlate:thermometer" ||
    pair === "hotPlate:dropper" ||
    pair === "hotPlate:pipet" ||
    pair === "burner:testTube"
  );
}

function activeTargetTool() {
  const exp = experiments[sim.expIndex];
  if (!exp || sim.success) return null;
  if (exp.template === "heat") return resolveToolKey(exp.primaryTool || "testTube");
  if (exp.template === "dispense") return resolveToolKey(exp.primaryTool || "dropper");
  if (exp.template === "measure") return resolveToolKey(exp.primaryTool || "thermometer");
  if (exp.template === "electrolysis") return dist(objects.ringClamp, objects.beaker) < 0.28 ? "thermometer" : "ringClamp";
  if (exp.template === "indicator") return sim.stageA ? "pipet" : "dropper";
  if (exp.template === "stir_heat") {
    const hotTop = objects.hotPlate.position.y + (objects.hotPlate.userData.topOffset || 0.08);
    const onPlate =
      sim.beakerOnHotPlate ||
      (dist2D(objects.beaker.position, objects.hotPlate.position) < 0.2 &&
        objects.beaker.position.y > hotTop - 0.02);
    return onPlate ? "stirStick" : "beaker";
  }
  return "beaker";
}

function setLiquidTarget(hex) {
  sim.liquidTargetColor.setHex(hex);
}

function getAllowedToolSet() {
  const set = new Set();
  const key = activeTargetTool();
  if (key) set.add(key);
  if (key === "stirStick") set.add("beaker");
  return set;
}

function updateCursor() {
  if (demo.active) {
    cursorEl.style.display = "none";
    return;
  }
  if (!input.active) {
    cursorEl.style.display = "none";
    return;
  }
  cursorEl.style.display = "block";
  cursorEl.style.left = `${input.screenX}px`;
  cursorEl.style.top = `${input.screenY}px`;
}

function worldToScreen(world) {
  const projected = world.clone().project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * window.innerWidth,
    y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
  };
}

function setDemoStatus(text) {
  demoStatusEl.textContent = `Demo: ${text}`;
}

function stopDemo(resetText = true, hideDoYourself = true) {
  demo.active = false;
  demo.phase = "idle";
  demo.timer = 0;
  demo.count = 0;
  demo.pulse = 0;
  demoCursorEl.style.display = "none";
  demoToggleBtn.classList.remove("active");
  if (hideDoYourself) doYourselfBtn.hidden = true;
  if (resetText) setDemoStatus("off");
}

function startDemo() {
  if (!isSignedIn) {
    setDemoStatus("sign in first");
    return;
  }
  resetExperiment(sim.expIndex);
  if (grabbed) releaseGrab();
  demo.active = true;
  demo.phase = "setup";
  demo.timer = 0;
  demo.count = 0;
  demo.pulse = 0;
  demoToggleBtn.classList.add("active");
  doYourselfBtn.hidden = true;
  setDemoStatus("running guided steps");
}

function moveToolDemo(key, target, speed, yBias = 0) {
  const obj = objects[key];
  if (!obj) return false;
  const next = new THREE.Vector3(target.x, target.y + yBias, target.z);
  obj.position.lerp(next, Math.min(1, speed));
  return obj.position.distanceTo(next) < 0.03;
}

function showDemoCursorAtTool(key, lift = 0.08) {
  const obj = objects[key];
  if (!obj) return;
  const world = obj.position.clone();
  world.y += lift;
  const p = worldToScreen(world);
  demoCursorEl.style.display = "block";
  demoCursorEl.style.left = `${p.x}px`;
  demoCursorEl.style.top = `${p.y}px`;
}

function runDemo(dt) {
  if (!demo.active || sim.success) {
    if (demo.active && sim.success) {
      if (demo.phase !== "done") {
        demo.phase = "done";
        setDemoStatus("off");
        doYourselfBtn.hidden = false;
        stopDemo(false, false);
      }
    }
    return;
  }
  const demoSpeed = 0.55;
  const exp = experiments[sim.expIndex];
  const requiredTime = exp.requiredTime || 3.0;
  const requiredCount = exp.requiredCount || 3;
  const beakerPos = objects.beaker.position;
  const burnerPos = objects.burner.position;
  const hotPlatePos = objects.hotPlate.position;
  const beakerTop = objects.beaker.position.y + Math.min(0.09, (objects.beaker.userData.topOffset || 0.12) * 0.7);
  demo.timer += dt * demoSpeed;
  demo.pulse += dt * demoSpeed;

  if (exp.template === "heat") {
    const heatKey = resolveToolKey(exp.primaryTool || "testTube");
    const target = new THREE.Vector3(burnerPos.x + 0.02, burnerPos.y + (objects.burner.userData.topOffset || 0.16) * 0.94, burnerPos.z);
    moveToolDemo(heatKey, target, 0.045);
    sim.burnerOn = true;
    sim.flameHeat += dt * 0.85;
    showDemoCursorAtTool(heatKey, 0.11);
    setDemoStatus("holding vessel at burner flame");
    return;
  }

  if (exp.template === "stir_heat") {
    if (demo.phase === "setup") {
      const hotTop = objects.hotPlate.position.y + (objects.hotPlate.userData.topOffset || 0.08) + (objects.beaker.userData.baseLift || 0.04);
      const placed = moveToolDemo("beaker", new THREE.Vector3(hotPlatePos.x, hotTop, hotPlatePos.z), 0.06);
      showDemoCursorAtTool("beaker", 0.1);
      setDemoStatus("placing beaker on hot plate");
      if (placed) {
        sim.beakerOnHotPlate = true;
        demo.phase = "stir";
        demo.timer = 0;
      }
      return;
    }
    const angle = demo.pulse * 2.5;
    const r = 0.045;
    const target = new THREE.Vector3(beakerPos.x + Math.cos(angle) * r, beakerTop - 0.06, beakerPos.z + Math.sin(angle) * r);
    moveToolDemo("stirStick", target, 0.1);
    sim.stirPathScore = Math.min(1.2, sim.stirPathScore + dt * 1.5);
    sim.stirTime += dt * 0.75;
    sim.stirIntensity = Math.min(1.2, sim.stirIntensity + dt * 1.6);
    objects.stirStick.rotation.x = -1.2;
    objects.stirStick.rotation.z = 0.2 + Math.sin(demo.pulse * 6) * 0.08;
    showDemoCursorAtTool("stirStick", 0.1);
    setDemoStatus("stirring in circular submerged motion");
    return;
  }

  if (exp.template === "dispense") {
    const tool = resolveToolKey(exp.primaryTool || "dropper");
    const target = new THREE.Vector3(beakerPos.x + 0.01, beakerTop + 0.08, beakerPos.z + 0.01);
    moveToolDemo(tool, target, 0.06);
    showDemoCursorAtTool(tool, 0.09);
    if (demo.timer > 1.2 && sim.dispenseCount < requiredCount) {
      handleDispense(tool);
      demo.timer = 0;
    }
    setDemoStatus(`dispensing reagent (${sim.dispenseCount}/${requiredCount})`);
    return;
  }

  if (exp.template === "electrolysis") {
    if (demo.phase === "setup") {
      const targetClamp = new THREE.Vector3(beakerPos.x - 0.1, objects.ringClamp.position.y, beakerPos.z + 0.05);
      const placed = moveToolDemo("ringClamp", targetClamp, 0.055);
      showDemoCursorAtTool("ringClamp", 0.1);
      setDemoStatus("positioning ring clamp");
      if (placed) demo.phase = "probe";
      return;
    }
    const targetProbe = new THREE.Vector3(beakerPos.x + 0.02, beakerTop - 0.03, beakerPos.z);
    moveToolDemo("thermometer", targetProbe, 0.07);
    sim.electroTime += dt * 0.8;
    showDemoCursorAtTool("thermometer", 0.1);
    setDemoStatus("holding probe contact");
    return;
  }

  if (exp.template === "measure") {
    const tool = resolveToolKey(exp.primaryTool || "thermometer");
    const target = new THREE.Vector3(beakerPos.x + 0.015, beakerTop - 0.03, beakerPos.z + 0.01);
    moveToolDemo(tool, target, 0.07);
    sim.electroTime += dt * 0.78;
    showDemoCursorAtTool(tool, 0.1);
    setDemoStatus(`measuring contact (${Math.min(sim.electroTime, requiredTime).toFixed(1)}s)`);
    return;
  }

  if (exp.template === "indicator") {
    const tool = sim.stageA ? "pipet" : "dropper";
    const target = new THREE.Vector3(beakerPos.x, beakerTop + 0.08, beakerPos.z);
    moveToolDemo(tool, target, 0.06);
    showDemoCursorAtTool(tool, 0.1);
    if (demo.timer > 1.25) {
      handleDispense(tool);
      demo.timer = 0;
    }
    setDemoStatus(sim.stageA ? "adding base with pipet" : "adding acid with dropper");
    return;
  }

  setDemoStatus("template not recognized");
}

function nearestGrabbable(localPoint) {
  const preferred = activeTargetTool();
  let best = null;
  let bestD = Infinity;
  for (const [key, obj] of Object.entries(objects)) {
    if (!obj.userData.grabbable) continue;
    const d = obj.position.distanceTo(localPoint);
    const assistRadius = key === preferred ? 0.42 : 0.32;
    if (d < assistRadius && d < bestD) {
      bestD = d;
      best = obj;
    }
  }
  return best;
}

function resolveRigidPlacement(toolKey, desiredPos) {
  const result = desiredPos.clone();
  const myR = toolDefs[toolKey].radius || 0.1;
  result.x = Math.max(sim.worldBounds.minX, Math.min(sim.worldBounds.maxX, result.x));
  result.z = Math.max(sim.worldBounds.minZ, Math.min(sim.worldBounds.maxZ, result.z));

  for (let iter = 0; iter < 4; iter += 1) {
    for (const [otherKey, otherObj] of Object.entries(objects)) {
      if (otherKey === toolKey) continue;
      if (canOverlap(toolKey, otherKey)) continue;
      const otherR = toolDefs[otherKey].radius || 0.1;
      const minD = myR + otherR;
      const dx = result.x - otherObj.position.x;
      const dz = result.z - otherObj.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 >= minD * minD) continue;
      const d = Math.sqrt(Math.max(d2, 0.000001));
      const nx = dx / d;
      const nz = dz / d;
      const push = minD - d;
      result.x += nx * push;
      result.z += nz * push;
      result.x = Math.max(sim.worldBounds.minX, Math.min(sim.worldBounds.maxX, result.x));
      result.z = Math.max(sim.worldBounds.minZ, Math.min(sim.worldBounds.maxZ, result.z));
    }
  }
  return result;
}

function autoDockTool(key, targetX, targetY, targetZ, snap, rotationX = null, rotationZ = null) {
  if (!grabbed || grabbed.userData.name !== key) return null;
  const nx = THREE.MathUtils.lerp(grabbed.position.x, targetX, snap);
  const ny = THREE.MathUtils.lerp(grabbed.position.y, targetY, snap);
  const nz = THREE.MathUtils.lerp(grabbed.position.z, targetZ, snap);
  if (rotationX !== null) grabbed.rotation.x = THREE.MathUtils.lerp(grabbed.rotation.x, rotationX, snap);
  if (rotationZ !== null) grabbed.rotation.z = THREE.MathUtils.lerp(grabbed.rotation.z, rotationZ, snap);
  return new THREE.Vector3(nx, ny, nz);
}

function releaseGrab() {
  if (!grabbed) return;
  if (grabbed.userData.name === "stirStick") {
    grabbed.rotation.x = 0;
    grabbed.rotation.z = 0;
  }
  if (grabbed.userData.name === "beaker" && objects.hotPlate) {
    const hotTop = objects.hotPlate.position.y + (objects.hotPlate.userData.topOffset || 0.08);
    sim.beakerOnHotPlate =
      dist2D(objects.beaker.position, objects.hotPlate.position) < 0.16 &&
      objects.beaker.position.y > hotTop - 0.02;
  }
  const beaker = objects.beaker;
  if (beaker && grabbed.position.distanceTo(beaker.position) < 0.24) {
    handleDispense(grabbed.userData.name);
  }
  grabbed = null;
}

function handleDispense(toolName) {
  const exp = experiments[sim.expIndex];
  if (exp.template === "dispense") {
    const expectedTool = resolveToolKey(exp.primaryTool || "dropper");
    if (toolName === expectedTool) {
      sim.dispenseCount += 1;
      bubbles.visible = true;
    }
  }

  if (exp.template === "indicator") {
    if (toolName === "dropper" && !sim.stageA) {
      sim.stageA = true;
      setLiquidTarget(0xff6ba8);
      setInstruction("Indicator Test", "Now add base using the pipet.", "pipet", "Status: acid added, color turned pink");
    } else if (toolName === "pipet" && sim.stageA && !sim.stageB) {
      sim.stageB = true;
      setLiquidTarget(0x74db86);
      setInstruction("Indicator Test", "Base added successfully.", "beaker", "Status: base added, color turned green");
    }
  }
}

function estimateVelocity(name, dt) {
  const obj = objects[name];
  if (!obj) return 0;
  const prev = sim.velocities[name] || obj.position.clone();
  const v = obj.position.distanceTo(prev) / Math.max(dt, 0.001);
  sim.velocities[name] = obj.position.clone();
  return v;
}

function setInstruction(title, detail, targetKey, status, explanation) {
  sim.instruction = { title, detail, targetKey, status, explanation };
}

function renderInstruction() {
  stepTitleEl.textContent = sim.instruction.title;
  stepDetailEl.textContent = sim.instruction.detail;
  targetLabelEl.textContent = `Target: ${sim.instruction.targetKey ? toolDefs[sim.instruction.targetKey].label : "--"}`;
  statusText.textContent = sim.instruction.status;
  const exp = experiments[sim.expIndex];
  chemTextEl.textContent = `Chemicals: ${getChemistryContext(exp)}`;
  explanationTextEl.textContent = `Explanation: ${sim.instruction.explanation || "Follow the guided steps to view concept notes."}`;
  detailedExplainTextEl.textContent = getDetailedExplanation(exp);
  wikiLinkEl.href = WIKI_BY_KEY[exp.key] || "https://en.wikipedia.org/wiki/Chemical_reaction";
  wikiLinkEl.textContent = `Open: ${exp.title}`;
}

function updateArrow(nowMs) {
  if (sim.success) {
    arrowGroup.visible = false;
    return;
  }
  const key = sim.instruction.targetKey;
  if (!key || !objects[key]) {
    arrowGroup.visible = false;
    return;
  }
  const target = objects[key];
  arrowGroup.visible = true;
  arrowGroup.position.set(target.position.x, target.position.y + 0.18 + Math.sin(nowMs * 0.005) * 0.03, target.position.z);
}

function placementTargetForCurrentStep() {
  const exp = experiments[sim.expIndex];
  if (!exp || sim.success) return null;
  if (exp.template === "heat") {
    const heatKey = resolveToolKey(exp.primaryTool || "testTube");
    const b = objects.burner;
    if (!b) return null;
    const burnerTop = b.position.y + (b.userData.topOffset || 0.16) * 0.94;
    return { key: heatKey, position: new THREE.Vector3(b.position.x, burnerTop, b.position.z), ring: 0.055 };
  }
  if (exp.template === "stir_heat") {
    if (!sim.beakerOnHotPlate) {
      return { key: "beaker", position: objects.hotPlate.position.clone().setY(objects.hotPlate.position.y + 0.08), ring: 0.085 };
    }
    return { key: "stirStick", position: objects.beaker.position.clone().setY(objects.beaker.position.y + 0.01), ring: 0.06 };
  }
  if (exp.template === "dispense" || exp.template === "indicator" || exp.template === "measure" || exp.template === "electrolysis") {
    return { key: activeTargetTool() || "beaker", position: objects.beaker.position.clone().setY(objects.beaker.position.y + 0.07), ring: 0.07 };
  }
  return null;
}

function updatePlacementOverlay(nowMs) {
  const target = placementTargetForCurrentStep();
  if (!target || !target.position) {
    placementOverlay.visible = false;
    return;
  }
  placementOverlay.visible = true;
  placementOverlay.position.copy(target.position);
  const pulse = 1.0 + Math.sin(nowMs * 0.006) * 0.3;
  placementRing.scale.setScalar((target.ring || 0.06) / 0.055 * pulse);
  placementGlow.scale.y = 1.0 + pulse * 0.45;
  placementRing.material.opacity = 0.45 + Math.abs(Math.sin(nowMs * 0.006)) * 0.3;
}

function updateLabels() {
  const allowed = getAllowedToolSet();
  for (const [key, obj] of Object.entries(objects)) {
    const label = labelEls[key];
    if (!label) continue;

    const world = new THREE.Vector3();
    obj.getWorldPosition(world);
    world.y -= 0.07;
    const projected = world.project(camera);
    const onScreen = projected.z > -1 && projected.z < 1;
    if (!onScreen) {
      label.style.opacity = "0";
      continue;
    }
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    if (x < 70 || x > window.innerWidth - 70 || y < 40 || y > window.innerHeight - 30) {
      label.style.opacity = "0";
      continue;
    }
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.style.opacity = allowed.has(key) || !obj.userData.grabbable ? "1" : "0.45";
    label.style.borderColor = sim.instruction.targetKey === key ? "rgba(255, 214, 122, 0.9)" : "rgba(120, 188, 255, 0.5)";
  }
}

function resetExperiment(index) {
  sim.expIndex = index;
  sim.success = false;
  sim.flameHeat = 0;
  sim.stirTime = 0;
  sim.dispenseCount = 0;
  sim.electroTime = 0;
  sim.stageA = false;
  sim.stageB = false;
  sim.stirIntensity = 0;
  sim.stirPathScore = 0;
  sim.beakerOnHotPlate = false;
  sim.burnerOn = false;
  sim.burnerHeat = 0;
  sim.burnerIdleTime = 0;
  sim.focusTool = null;
  sim.focusZoomTarget = 1.0;
  sim.velocities = {};

  liquid.material.color.setHex(0x60b8ff);
  setLiquidTarget(0x60b8ff);
  bubbles.visible = false;
  crystals.visible = false;
  flame.visible = false;

  for (const [name, obj] of Object.entries(objects)) {
    const d = toolDefs[name];
    obj.position.set(d.pos[0], d.pos[1], d.pos[2]);
    obj.rotation.y = d.rotY;
  }
  alignEffects();
  setInstruction(
    "Experiment Ready",
    experiments[index].step,
    resolveToolKey(experiments[index].primaryTool || "beaker"),
    "Status: in progress",
    "This panel will show the concept explanation after completion."
  );
}

function runExperiment(dt) {
  if (sim.success) return;
  const exp = experiments[sim.expIndex];
  const profile = getReactionProfile(exp);
  alignEffects(profile);
  sim.focusTool = null;
  sim.focusZoomTarget = 1.0;
  if (exp.template !== "heat") {
    sim.burnerOn = false;
    sim.burnerIdleTime = 0;
  }
  if (exp.template !== "dispense" && exp.template !== "electrolysis") bubbles.visible = false;
  if (exp.template !== "stir_heat") crystals.visible = false;
  sim.stirIntensity = Math.max(0, sim.stirIntensity - dt * profile.stirDecay);
  sim.stirPathScore = Math.max(0, sim.stirPathScore - dt * 0.7);
  sim.burnerHeat = THREE.MathUtils.lerp(sim.burnerHeat, sim.burnerOn ? 1 : 0, Math.min(1, dt * (sim.burnerOn ? 4.2 : 3.0)));
  flame.visible = sim.burnerHeat > 0.06;

  if (exp.template === "heat") {
    const heatKey = resolveToolKey(exp.primaryTool || "testTube");
    const heatTool = objects[heatKey] || objects.testTube;
    const required = exp.requiredTime || 3.0;
    const burnerTop = objects.burner.position.y + (objects.burner.userData.topOffset || 0.16) * 0.94;
    const closeEnough2D = dist2D(heatTool.position, objects.burner.position) < 0.13;
    const heightAligned = Math.abs(heatTool.position.y - burnerTop) < 0.12;
    const activeHeatingContact = closeEnough2D && heightAligned;
    if (activeHeatingContact) {
      sim.burnerOn = true;
      sim.burnerIdleTime = 0;
    } else {
      sim.burnerIdleTime += dt;
      if (sim.burnerIdleTime > 1.1) sim.burnerOn = false;
    }
    if (sim.burnerHeat > 0.45 && activeHeatingContact) {
      sim.flameHeat += dt * profile.contactGain;
      setInstruction(
        exp.title,
        "Hold the vessel directly in the active flame zone.",
        heatKey,
        `Status: heating ${Math.min(sim.flameHeat, required).toFixed(1)}/${required.toFixed(1)}s`,
        "Why: sustained flame contact raises kinetic energy and drives the thermal step."
      );
      setLiquidTarget(0x7ab7ff);
      sim.focusTool = heatKey;
      sim.focusZoomTarget = 0.66;
    } else {
      sim.flameHeat = Math.max(0, sim.flameHeat - dt * 0.58);
      setInstruction(
        exp.title,
        "Align vessel tip with burner mouth to ignite and heat.",
        heatKey,
        "Status: position for ignition",
        "Why: proximity alone is not enough; the active heating zone is at the burner mouth."
      );
      setLiquidTarget(0x60b8ff);
      sim.focusTool = "burner";
      sim.focusZoomTarget = 0.74;
    }
    if (sim.flameHeat >= required) sim.success = true;
  }

  if (exp.template === "stir_heat") {
    const required = exp.requiredTime || 3.0;
    const hotTop = objects.hotPlate.position.y + (objects.hotPlate.userData.topOffset || 0.08);
    const onPlate =
      sim.beakerOnHotPlate ||
      (dist2D(objects.beaker.position, objects.hotPlate.position) < 0.2 &&
        objects.beaker.position.y > hotTop - 0.02);
    const stirVelocity = estimateVelocity("stirStick", dt);
    const stickDist2D = dist2D(objects.stirStick.position, objects.beaker.position);
    const beakerTop = objects.beaker.position.y + Math.min(0.09, (objects.beaker.userData.topOffset || 0.12) * 0.7);
    const inLiquid =
      stickDist2D < 0.2 &&
      objects.stirStick.position.y > objects.beaker.position.y - 0.04 &&
      objects.stirStick.position.y < beakerTop + 0.01;
    const angularTrack = Math.abs(objects.stirStick.position.x - objects.beaker.position.x) + Math.abs(objects.stirStick.position.z - objects.beaker.position.z);
    const stirring = inLiquid && stirVelocity > profile.stirThreshold && angularTrack > 0.028;
    if (!onPlate) {
      setInstruction(
        exp.title,
        "Move beaker onto hot plate.",
        "beaker",
        "Status: place beaker on hot plate",
        "Why: plate contact provides the heat source before stirring can homogenize the solution."
      );
      setLiquidTarget(0x60b8ff);
      sim.focusTool = "hotPlate";
      sim.focusZoomTarget = 0.76;
    } else if (!stirring) {
      setInstruction(
        exp.title,
        "Stir in circular motion while tip stays submerged.",
        "stirStick",
        "Status: build stable stirring pattern",
        "Why: submerged circular motion improves convective mixing and heat transfer."
      );
      setLiquidTarget(0x5aa7ee);
      sim.focusTool = "beaker";
      sim.focusZoomTarget = 0.64;
    } else {
      sim.stirPathScore = Math.min(1.2, sim.stirPathScore + dt * profile.stirGain);
      sim.stirTime += dt * Math.min(1.1, 0.55 + sim.stirPathScore);
      sim.stirIntensity = Math.min(1.2, sim.stirIntensity + dt * profile.stirGain);
      setInstruction(exp.title, "Keep circular stirring for homogeneous heating.", "stirStick", `Status: stirring quality ${(Math.min(sim.stirPathScore, 1) * 100).toFixed(0)}% | time ${Math.min(sim.stirTime, required).toFixed(1)}/${required.toFixed(1)}s`);
      setLiquidTarget(0x4a86d8);
      sim.focusTool = "beaker";
      sim.focusZoomTarget = 0.58;
    }
    crystals.visible = sim.stirTime > Math.max(1.4, required * 0.55);
    if (sim.stirTime >= required) sim.success = true;
  }

  if (exp.template === "dispense") {
    const required = exp.requiredCount || 3;
    const targetTool = resolveToolKey(exp.primaryTool || "dropper");
    bubbles.visible = sim.dispenseCount > 0;
    const t = performance.now();
    bubbles.children.forEach((b, i) => {
      b.position.y = 0.02 + ((t * (0.0002 + profile.bubbleRise * 0.0007) + i * 0.04) % 0.1);
      b.material.opacity = profile.bubbleOpacity + 0.34 * (0.7 + 0.3 * Math.sin(t * 0.012));
    });
    setInstruction(
      exp.title,
      "Release target tool above beaker repeatedly.",
      targetTool,
      `Status: dispensed ${sim.dispenseCount}/${required}`,
      "Why: each release is a metered reagent addition used to model stoichiometric progression."
    );
    setLiquidTarget(0x77c5ff);
    sim.focusTool = "beaker";
    sim.focusZoomTarget = 0.68;
    if (sim.dispenseCount >= required) sim.success = true;
  }

  if (exp.template === "electrolysis") {
    const required = exp.requiredTime || 3.0;
    const clampPlaced = dist(objects.ringClamp, objects.beaker) < 0.28;
    const probeTouching = dist(objects.thermometer, objects.beaker) < 0.2;
    if (!clampPlaced) {
      setInstruction(
        exp.title,
        "Move ring clamp next to beaker.",
        "ringClamp",
        "Status: place ring clamp",
        "Why: in this simulator the clamp marks the electrode-fixture setup stage before current is applied."
      );
      setLiquidTarget(0x60b8ff);
      sim.electroTime = Math.max(0, sim.electroTime - dt * 0.15);
    } else if (!probeTouching) {
      setInstruction(
        exp.title,
        "Touch beaker with thermometer (simulation probe acting as electrode control).",
        "thermometer",
        "Status: touch beaker with simulation probe",
        "Why: probe contact is the virtual current-on trigger for electrolysis behavior."
      );
      setLiquidTarget(0x60b8ff);
      sim.electroTime = Math.max(0, sim.electroTime - dt * 0.15);
    } else {
      sim.electroTime += dt * profile.contactGain;
      bubbles.visible = true;
      setInstruction(
        exp.title,
        "Keep contact to simulate current flow.",
        "thermometer",
        `Status: current applied ${Math.min(sim.electroTime, required).toFixed(1)}/${required.toFixed(1)}s`,
        "Why: sustained contact models continued current flow and gas evolution."
      );
      setLiquidTarget(0x8ad6ff);
      sim.focusTool = "beaker";
      sim.focusZoomTarget = 0.66;
    }
    if (sim.electroTime >= required) sim.success = true;
  }

  if (exp.template === "measure") {
    const required = exp.requiredTime || 2.5;
    const measureKey = resolveToolKey(exp.primaryTool || "thermometer");
    const measureTool = objects[measureKey] || objects.thermometer;
    if (dist(measureTool, objects.beaker) < 0.2) {
      sim.electroTime += dt * profile.contactGain;
      setInstruction(
        exp.title,
        "Keep sensor contact with beaker.",
        measureKey,
        `Status: measuring ${Math.min(sim.electroTime, required).toFixed(1)}/${required.toFixed(1)}s`,
        "Why: stable sensor contact improves the reliability of the sampled value."
      );
      setLiquidTarget(0x86c8ff);
      sim.focusTool = "beaker";
      sim.focusZoomTarget = 0.7;
    } else {
      sim.electroTime = Math.max(0, sim.electroTime - dt * 0.18);
      setInstruction(exp.title, "Touch beaker with measurement tool.", measureKey, "Status: move tool to beaker");
      setLiquidTarget(0x60b8ff);
    }
    if (sim.electroTime >= required) sim.success = true;
  }

  if (exp.template === "indicator") {
    if (!sim.stageA) {
      setInstruction(exp.title, "Release dropper above beaker to add acid.", "dropper", "Status: waiting for acid");
      setLiquidTarget(0x8d58cc);
    } else if (!sim.stageB) {
      setInstruction(exp.title, "Release pipet above beaker to add base.", "pipet", "Status: acid added, now add base");
      setLiquidTarget(0xff6ba8);
    }
    if (sim.stageA && sim.stageB) sim.success = true;
    sim.focusTool = "beaker";
    sim.focusZoomTarget = 0.68;
  }

  if (sim.success) {
    setInstruction(
      "Completed",
      experiments[sim.expIndex].successText,
      null,
      "Status: complete",
      experiments[sim.expIndex].explanation
    );
    setLiquidTarget(0x74db86);
    sim.focusTool = "beaker";
    sim.focusZoomTarget = 0.72;
  }
}

function updateReactionCamera(dt) {
  cameraTarget.copy(cameraTargetBase);
  reactionZoom = 1.0;
  if (!sim.rotateMode) {
    labRoot.rotation.y = THREE.MathUtils.lerp(labRoot.rotation.y, 0, Math.min(1, dt * 6.2));
    labRoot.rotation.x = THREE.MathUtils.lerp(labRoot.rotation.x, 0, Math.min(1, dt * 6.2));
  }
  applyZoom();
}

function updateHandInput() {
  if (!sim.handTrackingEnabled || !handLandmarker) return;
  if (cameraEl.readyState < 2) return;
  if (cameraEl.currentTime === lastVideoTime) return;
  lastVideoTime = cameraEl.currentTime;

  const results = handLandmarker.detectForVideo(cameraEl, performance.now());
  if (!results.landmarks || results.landmarks.length === 0) {
    if (mouseDown) return;
    input.active = false;
    return;
  }
  const points = results.landmarks[0];
  const indexTip = points[8];
  const thumbTip = points[4];
  const dx = indexTip.x - thumbTip.x;
  const dy = indexTip.y - thumbTip.y;
  const dz = indexTip.z - thumbTip.z;
  const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  input.active = true;
  input.prevScreenX = input.screenX;
  input.prevScreenY = input.screenY;
  input.screenX = (1 - indexTip.x) * window.innerWidth;
  input.screenY = indexTip.y * window.innerHeight;
  input.pinch = pinchDist < 0.045;
}

function setInteractionMode(mode) {
  sim.rotateMode = mode === "rotate";
  sim.pinchMode = mode === "pinch";

  cvToggleBtn.textContent = `Pinch: ${sim.pinchMode ? "ON" : "OFF"}`;
  rotateToggleBtn.textContent = `Hand Rotate: ${sim.rotateMode ? "ON" : "OFF"}`;
  handsOffToggleBtn.textContent = `Hands: ${mode === "off" ? "OFF (ACTIVE)" : "OFF"}`;

  cvToggleBtn.classList.toggle("active", sim.pinchMode);
  rotateToggleBtn.classList.toggle("active", sim.rotateMode);
  handsOffToggleBtn.classList.toggle("active", mode === "off");

  document.body.classList.toggle("rotate-mode", sim.rotateMode);
  if (!sim.rotateMode) document.body.classList.remove("grabbing");

  if (grabbed) releaseGrab();
}

function updateManipulation() {
  if (demo.active) {
    if (grabbed) releaseGrab();
    input.prevPinch = input.pinch;
    updateCursor();
    return;
  }
  if (!isSignedIn) {
    if (grabbed) releaseGrab();
    input.prevPinch = input.pinch;
    return;
  }
  if (!input.active) {
    if (grabbed && input.prevPinch) releaseGrab();
    input.prevPinch = false;
    updateCursor();
    return;
  }

  if (sim.rotateMode) {
    if (!input.prevPinch && input.pinch) {
      if (grabbed) releaseGrab();
    }
    if (input.pinch) {
      let dx = input.screenX - input.prevScreenX;
      let dy = input.screenY - input.prevScreenY;
      if (Math.abs(dx) < 2.5) dx = 0;
      if (Math.abs(dy) < 2.5) dy = 0;
      dx = Math.max(-14, Math.min(14, dx));
      dy = Math.max(-14, Math.min(14, dy));
      if (dx !== 0 || dy !== 0) {
        labRoot.rotation.y += dx * 0.0012;
        labRoot.rotation.x = Math.max(-0.22, Math.min(0.12, labRoot.rotation.x + dy * 0.00035));
      }
    }
    document.body.classList.toggle("grabbing", !!input.pinch);
    input.prevPinch = input.pinch;
    updateCursor();
    return;
  }
  document.body.classList.remove("grabbing");

  if (!sim.pinchMode) {
    if (grabbed) releaseGrab();
    input.prevPinch = input.pinch;
    updateCursor();
    return;
  }

  const world = screenToTablePoint(input.screenX, input.screenY);
  const local = labRoot.worldToLocal(world.clone());
  if (!input.prevPinch && input.pinch) {
    releasePending = false;
    const candidate = grabbed || nearestGrabbable(local);
    const allowed = getAllowedToolSet();
    grabbed = candidate && allowed.has(candidate.userData.name) ? candidate : null;
  } else if (input.prevPinch && !input.pinch) {
    releasePending = true;
    releaseStartedAt = performance.now();
  }

  if (releasePending && !input.pinch && grabbed) {
    const heldKey = grabbed.userData.name;
    const graceMs = heldKey === "stirStick" ? 520 : 320;
    if (performance.now() - releaseStartedAt > graceMs) {
      releaseGrab();
      releasePending = false;
    }
  }
  if (input.pinch && releasePending) {
    releasePending = false;
  }

  if (grabbed && input.pinch) {
    const key = grabbed.userData.name;
    const desired = new THREE.Vector3(local.x, grabbed.position.y, local.z);
    const rigid = resolveRigidPlacement(key, desired);
    const tableTopY = table.position.y + 0.06;
    const baseLift = grabbed.userData.baseLift || 0.05;
    let targetX = rigid.x;
    let targetZ = rigid.z;
    let y = tableTopY + baseLift;

    if (key === "beaker" && objects.hotPlate) {
      const d = dist2D({ x: rigid.x, z: rigid.z }, objects.hotPlate.position);
      if (d < 0.3) {
        const dock = smoothstep(0.3, 0.06, d);
        targetX = THREE.MathUtils.lerp(rigid.x, objects.hotPlate.position.x, dock * 0.92);
        targetZ = THREE.MathUtils.lerp(rigid.z, objects.hotPlate.position.z, dock * 0.92);
        const hotTop = objects.hotPlate.position.y + (objects.hotPlate.userData.topOffset || 0.08);
        y = hotTop + baseLift + 0.003;
        sim.beakerOnHotPlate = dock > 0.45;
      } else {
        sim.beakerOnHotPlate = false;
      }
    }

    if (key === "beaker" && objects.burner) {
      const dBurner = dist2D({ x: rigid.x, z: rigid.z }, objects.burner.position);
      if (dBurner < 0.36) {
        const snap = smoothstep(0.36, 0.04, dBurner) * 0.92;
        const burnerTop = objects.burner.position.y + (objects.burner.userData.topOffset || 0.16) + 0.035;
        const docked = autoDockTool("beaker", objects.burner.position.x, burnerTop, objects.burner.position.z, snap, 0.03, 0);
        if (docked) {
          targetX = docked.x;
          targetZ = docked.z;
          y = docked.y;
        }
      }
    }

    if (key === "stirStick" && objects.beaker) {
      const exp = experiments[sim.expIndex];
      const stirringStage = exp && exp.template === "stir_heat";
      const snapRadius = stirringStage ? 0.52 : 0.3;
      const nearBeaker = dist2D({ x: targetX, z: targetZ }, objects.beaker.position) < snapRadius;
      if (nearBeaker) {
        const bx = objects.beaker.position.x;
        const bz = objects.beaker.position.z;
        const dx = targetX - bx;
        const dz = targetZ - bz;
        const angle = Math.atan2(dz, dx);
        const radial = Math.sqrt(dx * dx + dz * dz);
        const radius = stirringStage
          ? Math.max(0.02, Math.min(0.055, radial * 0.45))
          : Math.max(0.035, Math.min(0.075, radial));
        targetX = bx + Math.cos(angle) * radius;
        targetZ = bz + Math.sin(angle) * radius;
        const beakerTop = objects.beaker.position.y + Math.min(0.09, (objects.beaker.userData.topOffset || 0.12) * 0.7);
        const beakerBottom = objects.beaker.position.y - 0.03;
        y = stirringStage ? beakerBottom + 0.012 : beakerTop - 0.03;
        sim.stirIntensity = Math.min(1.2, sim.stirIntensity + 0.02);
        grabbed.rotation.x = -1.2;
        grabbed.rotation.z = 0.25 + Math.sin(performance.now() * 0.01) * 0.05;
      } else {
        grabbed.rotation.x = 0;
        grabbed.rotation.z = 0;
      }
    }

    if (key === "thermometer" && objects.beaker) {
      const nearBeaker = dist2D({ x: targetX, z: targetZ }, objects.beaker.position) < 0.16;
      if (nearBeaker) y = objects.beaker.position.y + (objects.beaker.userData.topOffset || 0.12) * 0.5;
    }

    if (key === "testTube") {
      const exp = experiments[sim.expIndex];
      if (exp && exp.template === "heat" && objects.burner) {
        const d = dist2D({ x: targetX, z: targetZ }, objects.burner.position);
        if (d < 0.28) {
          const snap = smoothstep(0.28, 0.03, d);
          targetX = THREE.MathUtils.lerp(targetX, objects.burner.position.x, snap * 0.92);
          targetZ = THREE.MathUtils.lerp(targetZ, objects.burner.position.z, snap * 0.92);
          const burnerTop = objects.burner.position.y + (objects.burner.userData.topOffset || 0.16) * 0.94;
          y = THREE.MathUtils.lerp(y, burnerTop, snap * 0.88);
          grabbed.rotation.x = -1.15;
        } else {
          grabbed.rotation.x = 0;
        }
      }
    }

    if (key === "thermometer" && objects.hotPlate) {
      const dHot = dist2D({ x: targetX, z: targetZ }, objects.hotPlate.position);
      if (dHot < 0.24) {
        const snap = smoothstep(0.24, 0.03, dHot) * 0.88;
        const hotTop = objects.hotPlate.position.y + (objects.hotPlate.userData.topOffset || 0.08) + 0.03;
        const docked = autoDockTool("thermometer", objects.hotPlate.position.x + 0.03, hotTop, objects.hotPlate.position.z, snap, -0.95, 0.06);
        if (docked) {
          targetX = docked.x;
          targetZ = docked.z;
          y = docked.y;
        }
      }
    }

    if ((key === "dropper" || key === "pipet" || key === "burette") && objects.beaker) {
      const dBeaker = dist2D({ x: targetX, z: targetZ }, objects.beaker.position);
      if (dBeaker < 0.34) {
        const snap = smoothstep(0.34, 0.04, dBeaker) * 0.82;
        const beakerTop = objects.beaker.position.y + (objects.beaker.userData.topOffset || 0.12) + 0.05;
        const docked = autoDockTool(key, objects.beaker.position.x, beakerTop, objects.beaker.position.z, snap, -0.75, 0.02);
        if (docked) {
          targetX = docked.x;
          targetZ = docked.z;
          y = docked.y;
        }
      }
    }

    const follow = key === "stirStick" ? 0.48 : 0.28;
    grabbed.position.lerp(new THREE.Vector3(targetX, y, targetZ), follow);
  }

  input.prevPinch = input.pinch;
  updateCursor();
}

async function initCameraAndCV() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });
    cameraEl.srcObject = stream;
    await cameraEl.play();
  } catch (err) {
    setInstruction("Input Fallback", "Webcam unavailable. Use mouse drag + Space.", "beaker", "Status: webcam unavailable");
    sim.handTrackingEnabled = false;
    setInteractionMode("off");
    return;
  }

  const fileset = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  handLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    numHands: 1,
    runningMode: "VIDEO",
  });
}

cvToggleBtn.addEventListener("click", () => setInteractionMode("pinch"));
rotateToggleBtn.addEventListener("click", () => setInteractionMode("rotate"));
handsOffToggleBtn.addEventListener("click", () => setInteractionMode("off"));
setInteractionMode("pinch");

zoomInBtn.addEventListener("click", () => {
  zoomLevel = Math.max(0.7, zoomLevel - 0.1);
  applyZoom();
});
zoomOutBtn.addEventListener("click", () => {
  zoomLevel = Math.min(1.6, zoomLevel + 0.1);
  applyZoom();
});

window.addEventListener("keydown", (e) => {
  if (demo.active) return;
  if (e.code === "Space" && grabbed) handleDispense(grabbed.userData.name);
});

window.addEventListener("mousedown", (e) => {
  if (demo.active) return;
  if (e.button !== 0) return;
  mouseDown = true;
  input.active = true;
  input.prevScreenX = e.clientX;
  input.prevScreenY = e.clientY;
  input.screenX = e.clientX;
  input.screenY = e.clientY;
  input.pinch = true;
});

window.addEventListener("mousemove", (e) => {
  if (demo.active) return;
  if (!mouseDown) return;
  input.active = true;
  input.prevScreenX = input.screenX;
  input.prevScreenY = input.screenY;
  input.screenX = e.clientX;
  input.screenY = e.clientY;
  input.pinch = true;
});

window.addEventListener("mouseup", (e) => {
  if (demo.active) return;
  if (e.button !== 0) return;
  mouseDown = false;
  input.prevScreenX = input.screenX;
  input.prevScreenY = input.screenY;
  input.screenX = e.clientX;
  input.screenY = e.clientY;
  input.pinch = false;
  document.body.classList.remove("grabbing");
  setTimeout(() => {
    if (!sim.handTrackingEnabled || !handLandmarker) input.active = false;
  }, 30);
});

for (const [i, exp] of experiments.entries()) {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = exp.title;
  experimentSelect.appendChild(opt);
}
experimentSelect.addEventListener("change", () => {
  if (demo.active) stopDemo();
  resetExperiment(Number(experimentSelect.value));
});
demoToggleBtn.addEventListener("click", () => {
  if (demo.active) {
    stopDemo();
  } else {
    startDemo();
  }
});
doYourselfBtn.addEventListener("click", () => {
  doYourselfBtn.hidden = true;
  resetExperiment(sim.expIndex);
  setDemoStatus("off");
});

const hasSupabaseConfig = Boolean(supabaseConfig?.url && supabaseConfig?.anonKey);
const supabase = hasSupabaseConfig ? createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;

async function initAuth() {
  if (!supabase) {
    isSignedIn = false;
    signOutBtn.hidden = true;
    authOverlay.classList.remove("hidden");
    authMessageEl.textContent = "Auth is not configured. Add Supabase URL and anon key in src/supabase-config.js.";
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (!error && data?.session) {
    isSignedIn = true;
    signOutBtn.hidden = false;
    authOverlay.classList.add("hidden");
  } else {
    isSignedIn = false;
    signOutBtn.hidden = true;
    authOverlay.classList.remove("hidden");
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const signUp = mode === "signup";
  const nameLabel = document.querySelector("label[for='userName']");
  modeSignInBtn.classList.toggle("active", !signUp);
  modeSignUpBtn.classList.toggle("active", signUp);
  confirmWrap.hidden = !signUp;
  userConfirmPasswordInput.hidden = !signUp;
  if (nameLabel) nameLabel.hidden = !signUp;
  userNameInput.hidden = !signUp;
  userNameInput.required = signUp;
  userConfirmPasswordInput.required = signUp;
  if (!signUp) {
    userConfirmPasswordInput.value = "";
    userNameInput.value = "";
  }
  authMessageEl.textContent = "";
  authSubmit.textContent = signUp ? "Create account" : "Sign in";
}

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!supabase) {
    authMessageEl.textContent = "Auth is not configured. Add Supabase credentials first.";
    return;
  }
  const name = userNameInput.value.trim();
  const email = userEmailInput.value.trim().toLowerCase();
  const password = userPasswordInput.value;
  const confirm = userConfirmPasswordInput.value;
  if (!email || !password) return;
  if (password.length < 8) {
    authMessageEl.textContent = "Password must be at least 8 characters.";
    return;
  }

  try {
    if (authMode === "signup") {
      if (!name) {
        authMessageEl.textContent = "Name is required for sign up.";
        return;
      }
      if (password !== confirm) {
        authMessageEl.textContent = "Passwords do not match.";
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) {
        authMessageEl.textContent = error.message || "Sign up failed.";
        return;
      }
      authMessageEl.textContent = "Account created. Check your email for verification, then sign in.";
      setAuthMode("signin");
      userPasswordInput.value = "";
      userConfirmPasswordInput.value = "";
      return;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        authMessageEl.textContent = error.message || "Sign in failed.";
        return;
      }
    }
  } catch (err) {
    authMessageEl.textContent = err?.message || JSON.stringify(err) || "Authentication failed.";
    return;
  }

  isSignedIn = true;
  signOutBtn.hidden = false;
  authOverlay.classList.add("hidden");
  authMessageEl.textContent = "";
});

modeSignInBtn.addEventListener("click", () => setAuthMode("signin"));
modeSignUpBtn.addEventListener("click", () => setAuthMode("signup"));
signOutBtn.addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
  isSignedIn = false;
  signOutBtn.hidden = true;
  authOverlay.classList.remove("hidden");
  setAuthMode("signin");
  userPasswordInput.value = "";
  userConfirmPasswordInput.value = "";
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  updateHandInput();
  updateManipulation();
  runDemo(dt);
  alignEffects();
  runExperiment(dt);
  updateReactionCamera(dt);
  liquid.material.color.lerp(sim.liquidTargetColor, Math.min(1, dt * 4.5));
  updateArrow(now);
  updatePlacementOverlay(now);
  updateLabels();
  renderInstruction();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

await initAssets();
await initCameraAndCV();
resetExperiment(0);
setAuthMode("signin");
initAuth();
requestAnimationFrame(loop);
