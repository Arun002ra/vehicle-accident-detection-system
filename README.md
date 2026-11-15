# Vehicle Accident Detection and Alert System Using Sensors

An interactive, high-fidelity real-time simulation and college demonstration platform for an IoT-based **Vehicle Accident Detection and Alert System**.

### 🌐 Live Public Demos
- **GitHub Pages (100% Public)**: [https://arun002ra.github.io/vehicle-accident-detection-system/](https://arun002ra.github.io/vehicle-accident-detection-system/)
- **GitHub Repository**: [https://github.com/Arun002ra/vehicle-accident-detection-system](https://github.com/Arun002ra/vehicle-accident-detection-system)
- **1-Click Vercel Deploy**: [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/Arun002ra/vehicle-accident-detection-system)

---

## 🌟 Key Features

1. **60 FPS Canvas Road Environment**:
   - Multi-lane expressway with animated asphalt, lane dividers, road shoulders, and guardrails.
   - Dynamic ambient traffic vehicles and procedural roadside city skyline.
   - Subject vehicle ("Host Vehicle", `TN-09-CB-4092`) featuring headlights, taillights, roof-mounted sensor beacon, and physical motion.
   - High-impact collision physics: Sudden lane obstruction, brake lock with persistent skid marks, mechanical recoil, angular spin-out, crumple deformation, spark particles, shattered glass shards, and hood smoke.
   - Camera trauma shake with exponential decay.

2. **Real-time Live Sensor Telemetry (Oscilloscope Waveforms)**:
   - **3-Axis Accelerometer (ADXL345 / MPU-6050)**: Live scrolling waveform showing lateral ($A_x$), longitudinal ($A_y$), and vertical ($A_z$) acceleration in G-force. Dynamic red threshold line at $4.0\text{G}$.
   - **3-Axis Gyroscope (MPU-6050)**: Angular velocities (Roll, Pitch, Yaw in $^\circ/\text{s}$) capturing vehicle spin-out and tilt angle.
   - **Piezo Vibration Sensor (SW-420)**: Real-time mechanical shock percentage meter and area waveform with $75\%$ impact threshold line.
   - **GPS Geolocation Module (NEO-6M)**: Real-time satellite fix, NMEA latitude/longitude coordinates along Grand Southern Trunk Rd (NH-45), speed gauge, and a sweeping mini-radar map.

3. **Multi-Sensor Fusion & Decision Pipeline**:
   - Continuous 100Hz I2C/SPI sampling loop.
   - Mathematical condition:
     $$\text{Impact Index} = \sqrt{a_x^2 + a_y^2 + a_z^2} \ge 4.0\text{G} \quad \text{AND} \quad \text{Vibration} \ge 75\% \quad \text{AND/OR} \quad |\text{Yaw Rate}| \ge 35^\circ/\text{s}$$
   - Microcontroller pipeline stepper visualizer (Sampling $\to$ Threshold $\to$ Confirmation $\to$ GPS Lock $\to$ Dispatch).

4. **Emergency Dispatch Center & SIM800L GSM Terminal**:
   - 5-second automatic countdown with safety override (cancel false alarm option).
   - Real-time AT-Command console:
     `AT+CMGF=1`, `AT+CMGS="+919876543210"`, SMS payload formatting, and Cloud HTTP API responses.
   - Full emergency alert modal displaying:
     - Vehicle ID, timestamp, and severity rating (High: $8.4\text{G}$).
     - Locked GPS coordinates with interactive Google Maps link.
     - Family SMS delivery confirmation.
     - 108 Emergency Ambulance network dispatch with estimated arrival time (6 mins).
     - State highway patrol incident ticket.

5. **Integrated Procedural Web Audio Engine**:
   - Zero external audio files required! Synthesizes engine cruising hum, tire screeching, collision crunch, telemetry beeps, and emergency SOS siren in real time.
   - Audio mute/unmute toggle.

6. **8-Scene Automated College Project Presentation Mode**:
   - Dedicated "Auto College Demo" controller designed specifically for viva defense and video recordings.
   - Walks through all 8 college syllabus scenes with narration subtitle cards and UI element focus highlights.

---

## 🚀 How to Run the Simulation

No build tools, dependencies, or server installations are required!

### Option A: Direct Browser Launch
Simply double-click `index.html` or drag and drop it into any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).

### Option B: Local HTTP Server (Optional)
Run using Python in PowerShell/Terminal:
```powershell
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## 🎬 8-Scene Demonstration Sequence

| Scene | Name | Description |
|---|---|---|
| **Scene 1** | Normal Vehicle Cruising | Host car travels steadily at 72 km/h; ambient traffic flows; baseline telemetry green. |
| **Scene 2** | Live Sensor Telemetry | MPU-6050 and SW-420 waveforms display high-frequency baseline data. |
| **Scene 3** | Collision Event | Sudden obstacle appears; brake screech; bumper impact recoil; skid marks; sparks & glass shards. |
| **Scene 4** | Sensor Threshold Breach | Accelerometer peaks at 8.4G ($>4.0\text{G}$); vibration hits 96% ($>75\%$); abnormal yaw rotation (48°). |
| **Scene 5** | Accident Confirmation | Fusion algorithm analyzes multi-sensor data, eliminates false positives, and confirms severe crash. |
| **Scene 6** | GPS Geolocation Lock | NEO-6M locks coordinates at `13.0827° N, 80.2707° E` on NH-45; radar map pinpoints crash site. |
| **Scene 7** | Emergency Alert Dispatch | Alert modal appears; 5-second auto-dispatch countdown; SIM800L executes `AT+CMGS` SMS commands. |
| **Scene 8** | Final Emergency Dashboard | Complete emergency status displayed with family SMS delivery, 108 ambulance dispatch (ETA 6m), and police incident ticket. |

---

## 📋 Viva Presentation Q&A Guide

**Q1: Why use both an accelerometer and a vibration sensor?**
> *Answer:* An accelerometer alone may register false spikes during heavy braking or speed breakers. A piezo vibration sensor specifically measures high-frequency mechanical shock waves from metal crumpling. Combining both via sensor fusion ensures high accuracy and prevents false emergency dispatches.

**Q2: What is the purpose of the 5-second countdown timer?**
> *Answer:* It acts as a driver safety override window. If the driver dropped a phone on the sensor or experienced a minor bumper tap without injury, they can cancel the alert to avoid wasting critical emergency services resources (false alarms).

**Q3: How does the system communicate without internet connectivity?**
> *Answer:* The system uses a SIM800L GSM/GPRS module that operates over cellular 2G/4G SMS channels. SMS does not require active mobile data or Wi-Fi, ensuring reliable transmission even in remote highway areas.

**Q4: How are GPS coordinates converted to an address?**
> *Answer:* The NEO-6M provides NMEA `$GPGGA` and `$GPRMC` sentences with raw latitude and longitude. The backend or recipient device performs reverse geocoding via mapping APIs to display the nearest road/landmark.

---

## 🛠️ File Structure

```
d:/community connect/New folder/
├── index.html         # Main dashboard, UI components, HUD overlays, emergency modal
├── styles.css         # Cyber-telemetry dark theme, oscilloscope styling, responsive layout
├── js/
│   ├── sensors.js     # Mathematical models for MPU6050, SW-420, NEO-6M & canvas oscilloscopes
│   ├── simulation.js  # 60 FPS HTML5 Canvas roadway, vehicles, collision physics & particles
│   ├── app.js         # Web Audio synthesizer, state coordinator & emergency dispatch logic
│   └── demoSequence.js# 8-Scene college presentation director with subtitles & controls
└── README.md          # Comprehensive documentation, setup guide & viva Q&A
```
