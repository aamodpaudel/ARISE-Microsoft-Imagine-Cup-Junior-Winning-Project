# ARISE: Microsoft Imagine Cup Junior Winning Project

**ARISE** (Augmented Reality Interactive Science Environment) is a browser-based, gesture-driven virtual chemistry laboratory. It runs entirely in the browser with no installation required, using your webcam and hand gestures to interact with 3D lab equipment in an augmented reality overlay.

This project was recognized as a winning entry in the **Microsoft Imagine Cup Junior** competition.

---

## Overview

ARISE simulates 50 chemistry experiments ranging from a classic Flame Test to complex oscillating reactions and electrochemical cells. The application overlays a fully interactive 3D lab scene onto your live webcam feed, letting you grab, move, and use virtual lab tools using pinch gestures detected in real time by a hand-tracking AI model.

For each experiment, the system provides guided instructions, chemical context, mechanism-level explanations, and linked Wikipedia references.

---

## Features

- **50 Guided Chemistry Experiments** covering thermochemistry, kinetics, electrochemistry, organic synthesis, analytical chemistry, and more
- **Real-Time Hand Tracking** powered by MediaPipe HandLandmarker for pinch-to-grab interactions
- **3D Lab Rendering** using Three.js with GLB models for authentic lab equipment
- **AR Webcam Overlay** that places the virtual lab scene on top of your live camera feed
- **Gesture Controls**: pinch to grab tools, move your hand to move equipment, release over a beaker to dispense
- **Mouse Fallback**: left-click drag and `Space` key for dispense, for use without a webcam
- **Per-Experiment Guidance Panel** with step-by-step instructions, chemical context, and reaction explanations
- **Mechanism-Level Explanations** for each experiment template
- **Wikipedia Integration** with direct links to relevant articles for each experiment
- **Hand Rotate Mode**: pinch-drag to rotate the entire lab table
- **Zoom Controls**: on-screen plus/minus buttons to adjust camera distance
- **Frontend Sign-In Screen** (backend auth integration planned)

---

## Experiments

The simulator includes 50 experiments across the following categories.

| Category | Experiments |
|---|---|
| Thermochemistry | Flame Test, Calorimetry, Hess's Law, Enthalpy of Dissolution |
| Reaction Kinetics | Rate vs Temperature, Rate vs Concentration, Catalyst Decomposition, Iodine Clock, Briggs-Rauscher |
| Equilibrium and pH | Le Chatelier Shift, Red Cabbage Indicator, Buffer Preparation, Buffer Capacity |
| Electrochemistry | Electrolysis of Water, Galvanic Cell, Corrosion and Galvanization, Conductivity |
| Analytical Chemistry | Acid-Base Titration, Back Titration, Gravimetric Sulfate Analysis, Qualitative Cation Analysis, Beer-Lambert Colorimetry |
| Separation Techniques | Simple Distillation, Fractional Distillation, Steam Distillation, Liquid-Liquid Extraction, Filtration, Recrystallization, Paper Chromatography, TLC |
| Organic Chemistry | Saponification, Esterification, Aspirin Synthesis, Nylon Rope Trick, Silver Mirror Test, Benedict's Test, Functional Group Tests |
| Stoichiometry and Gas Laws | Gas Laws Demo, Molar Mass of Volatile Liquid, Stoichiometry by Gas Collection, Limiting Reagent, Percent Yield |
| Crystal and Physical Chemistry | Copper Sulfate Crystal Growth, Solubility Curve, Melting Point, Hydrate Analysis, Adsorption on Charcoal |

---

## Technology Stack

| Component | Technology |
|---|---|
| 3D Rendering | [Three.js](https://threejs.org/) v0.161.0 (via CDN) |
| Hand Tracking | [MediaPipe Tasks-Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) v0.10.14 (via CDN) |
| 3D Models | GLTF / GLB (CC0 licensed lab assets) |
| Frontend | Vanilla HTML, CSS, and JavaScript (ES Modules) |
| Server | Any static HTTP server |

No build step, no npm install, no bundler. The entire application runs from static files.

---

## Project Structure

```
Virtual_AI_Lab/
├── index.html              # Main application shell and UI layout
├── styles.css              # All styling for HUD, panels, cursor, and overlays
├── src/
│   ├── main.js             # Core application: Three.js scene, hand tracking, interaction loop
│   └── experiments.js      # Definitions for all 50 experiments (steps, templates, tools)
├── assets/
│   └── models/             # GLB models for lab equipment (CC0 licensed)
│       ├── bottle_glassware_beaker_medium.glb
│       ├── bottle_glassware_test_tube_small.glb
│       ├── bottle_dropper.glb
│       ├── bottle_pipet.glb
│       ├── clamp_ring_clamp.glb
│       ├── funnel_buret.glb
│       ├── heating_equipment_bunsen_burner.glb
│       ├── heating_equipment_stirring_stick.glb
│       ├── heating_equipment_thermometer.glb
│       ├── machine_hot_plate.glb
│       └── LICENSE_LabAssets_CC0.txt
└── lab_assets/             # Additional GLB assets (full glassware pack and extras)
    ├── basic_tableware.glb
    ├── bunsen_burner.glb
    ├── burette.glb
    ├── free_conical_flask__laboratory__low_poly.glb
    ├── free_pipette__laboratory__low_poly.glb
    ├── graduated_cylinder.glb
    ├── laboratory_glasswares_pack.glb
    ├── laboratory_hot_plate.glb
    ├── test_tube_rack.glb
    ├── tripod_stand.glb
    └── volumetric_flask.glb
```

---

## Requirements

- A modern Chromium-based browser (Chrome, Edge) with WebGL and camera permissions enabled
- Internet access for CDN-loaded modules:
  - `three` (Three.js)
  - `@mediapipe/tasks-vision`
- A webcam (optional; mouse fallback is available)

---

## Running Locally

Serve the project root with any local HTTP server. Do not open `index.html` directly as a file, because ES module imports require an HTTP context.

**Using Python:**

```powershell
cd d:\0_Github_Repos\Virtual_AI_Lab
python -m http.server 8080
```

**Using Node.js (`http-server`):**

```powershell
npx http-server . -p 8080
```

Then open your browser to:

```
http://localhost:8080
```

---

## Production Auth Setup (Supabase)

This project now uses hosted email/password auth with Supabase for real multi-user sign-in.

1. Create a Supabase project.
2. In Supabase dashboard, open `Authentication` and enable `Email` provider.
3. Copy your:
   - Project URL (`https://<project-ref>.supabase.co`)
   - Anon public key (`Project Settings -> API`)
4. Edit [src/supabase-config.js](./src/supabase-config.js):

```js
export const supabaseConfig = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

5. Optional but recommended:
   - Configure email templates and SMTP for reliable verification emails.
   - Set your site URL and redirect URLs in Supabase Auth settings for deployed domains.

If `src/supabase-config.js` is left empty, the app will show an auth configuration message and keep the sign-in overlay open.

---

## Controls

### Gesture Controls (Webcam Required)

| Gesture | Action |
|---|---|
| Pinch (thumb + index) | Grab the nearest grabbable tool |
| Move hand while pinching | Move the grabbed tool |
| Release pinch above a beaker | Trigger a dispense action |
| Pinch-drag (Hand Rotate mode) | Rotate the entire lab table |

### Mouse Fallback

| Input | Action |
|---|---|
| Left-click and drag | Move the selected tool |
| `Space` key | Trigger dispense |

### UI Buttons

| Button | Description |
|---|---|
| Pinch: ON/OFF | Toggle pinch-to-grab gesture detection |
| Hand Rotate: ON/OFF | Switch between move mode and rotate mode |
| Hands: OFF | Disable all gesture input |
| + / - | Zoom camera in or out |

---

## Interaction Model

Each experiment follows one of the following interaction templates:

- **heat**: Move the target vessel near the Bunsen burner and hold it for the required duration.
- **stir_heat**: Place the beaker on the hot plate, then stir with the stirring stick.
- **dispense**: Release the specified tool above the beaker the required number of times.
- **measure**: Hold the thermometer or probe in contact with the beaker for the required duration.
- **electrolysis**: Position the ring clamp near the beaker, then apply the thermometer as a probe.
- **indicator**: Dispense the dropper (acid) first to change color, then the pipet (base) for the second transition.

The guide panel on the right updates with each step, providing target information, status, chemical context, and a detailed particle-level explanation.

---

## Asset Credits

The GLB lab equipment models in `assets/models/` are released under the **Creative Commons Zero (CC0)** license. See `assets/models/LICENSE_LabAssets_CC0.txt` for details.

---

## License

This project is provided for educational and demonstration purposes. The application source code (`index.html`, `styles.css`, `src/`) is the original work of the author. Third-party assets retain their respective licenses as noted above.
