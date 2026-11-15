/**
 * Vehicle Accident Detection and Alert System
 * demoSequence.js - 8-Scene Automated College Project Presentation Director
 * Controls the exact demonstration sequence required for viva presentations and video recordings.
 */

class DemoPresentationDirector {
  constructor() {
    this.app = window.app;
    this.sim = window.roadSim;
    this.sensors = window.sensorSystem;

    this.currentScene = 1;
    this.totalScenes = 8;
    this.isPlaying = false;
    this.timer = null;

    // 8 Pre-scripted scenes with durations, actions, and viva narration subtitles
    this.scenes = [
      {
        scene: 1,
        title: "Scene 1: Normal Vehicle Cruising",
        desc: "The host vehicle travels smoothly along Highway NH-45 at 72 km/h. Ambient traffic flows normally and all safety parameters are green.",
        duration: 5500, // 5.5s
        action: () => this.runScene1()
      },
      {
        scene: 2,
        title: "Scene 2: Live Sensor Telemetry Acquisition",
        desc: "MPU-6050 (3-axis Accelerometer & Gyroscope) and SW-420 Piezo sensors continuously sample at 100Hz. Baseline road vibration and 1.0G gravity are monitored.",
        duration: 6500, // 6.5s
        action: () => this.runScene2()
      },
      {
        scene: 3,
        title: "Scene 3: Sudden Obstacle & Collision Event",
        desc: "A sudden hazard obstruction appears. Brakes lock creating tire skid marks, followed by high-kinetic front bumper impact with mechanical recoil.",
        duration: 4000, // 4s
        action: () => this.runScene3()
      },
      {
        scene: 4,
        title: "Scene 4: Multi-Sensor Threshold Breach",
        desc: "Accelerometer detects sudden 8.4G deceleration spike (threshold > 4.0G). Gyroscope detects 48° yaw shift, and Piezo vibration surges past 75%.",
        duration: 5000, // 5s
        action: () => this.runScene4()
      },
      {
        scene: 5,
        title: "Scene 5: Accident Confirmation & Severity Analysis",
        desc: "Microcontroller executes multi-sensor fusion logic. Eliminates false positives and confirms SEVERE ACCIDENT with high confidence.",
        duration: 4500, // 4.5s
        action: () => this.runScene5()
      },
      {
        scene: 6,
        title: "Scene 6: GPS Geolocation & Coordinate Lock",
        desc: "NEO-6M GPS module locks exact satellite coordinates (13.0827° N, 80.2707° E) with ±1.8m accuracy and generates Google Maps emergency link.",
        duration: 5000, // 5s
        action: () => this.runScene6()
      },
      {
        scene: 7,
        title: "Scene 7: Automated GSM & Emergency Alert Dispatch",
        desc: "SIM800L GSM modem executes AT commands. Transmits emergency SMS to family and triggers 108 Emergency Ambulance network API.",
        duration: 6000, // 6s
        action: () => this.runScene7()
      },
      {
        scene: 8,
        title: "Scene 8: Final Emergency Dashboard & Dispatch Tracking",
        desc: "Final emergency status displayed: Family SMS delivered, Apollo Ambulance dispatched with 6-minute ETA, and Police Incident Ticket generated.",
        duration: 7000, // 7s
        action: () => this.runScene8()
      }
    ];

    this.bindDOM();
    this.updateSceneUI(1);
  }

  bindDOM() {
    const btnToggle = document.getElementById('btn-toggle-demo');
    const btnNext = document.getElementById('btn-next-scene');
    const btnPrev = document.getElementById('btn-prev-scene');

    btnToggle.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pauseDemo();
      } else {
        this.playDemo();
      }
    });

    btnNext.addEventListener('click', () => {
      this.pauseDemo();
      this.nextScene();
    });

    btnPrev.addEventListener('click', () => {
      this.pauseDemo();
      this.prevScene();
    });
  }

  playDemo() {
    this.isPlaying = true;
    document.getElementById('demo-btn-icon').textContent = '⏸';
    document.getElementById('demo-btn-text').textContent = 'Pause Demo';

    // If starting from end, reset to Scene 1
    if (this.currentScene >= this.totalScenes) {
      this.currentScene = 1;
    }

    this.executeCurrentScene();
  }

  pauseDemo() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    document.getElementById('demo-btn-icon').textContent = '▶';
    document.getElementById('demo-btn-text').textContent = 'Auto College Demo';
  }

  nextScene() {
    if (this.currentScene < this.totalScenes) {
      this.currentScene++;
      this.executeCurrentScene();
    }
  }

  prevScene() {
    if (this.currentScene > 1) {
      this.currentScene--;
      this.executeCurrentScene();
    }
  }

  executeCurrentScene() {
    const sceneObj = this.scenes[this.currentScene - 1];
    this.updateSceneUI(this.currentScene);

    // Run custom scene logic
    sceneObj.action();

    // If playing in automated presentation mode, queue next scene
    if (this.isPlaying) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (this.currentScene < this.totalScenes) {
          this.currentScene++;
          this.executeCurrentScene();
        } else {
          this.pauseDemo();
        }
      }, sceneObj.duration);
    }
  }

  updateSceneUI(sceneNum) {
    const sceneObj = this.scenes[sceneNum - 1];
    document.getElementById('current-scene-badge').textContent = `SCENE ${sceneObj.scene} of ${this.totalScenes}`;
    document.getElementById('current-scene-title').textContent = sceneObj.title;
    document.getElementById('current-scene-desc').textContent = sceneObj.desc;

    // Remove previous element highlights
    document.querySelectorAll('.card-highlight-active').forEach(el => {
      el.classList.remove('card-highlight-active');
    });
  }

  highlightElement(elId) {
    const el = document.getElementById(elId);
    if (el) {
      el.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
      el.style.borderColor = '#38bdf8';
      el.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.4)';
      setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }, 3500);
    }
  }

  /* =========================================================================
     Scene Script Actions
     ========================================================================= */

  // Scene 1: Normal Cruising
  runScene1() {
    this.app.resetAll();
    this.sim.start();
    this.highlightElement('canvas-container');
    this.app.logTerminal("[SCENE_1] Vehicle cruising normally at 72 km/h. Telemetry steady.", "text-green");
  }

  // Scene 2: Live Sensor Telemetry
  runScene2() {
    this.highlightElement('card-accel');
    this.highlightElement('card-gyro');
    this.highlightElement('card-vibration');
    this.app.logTerminal("[SCENE_2] High-frequency sampling active: Accel 1.0G, Gyro stable, Vibration nominal.", "text-cyan");
  }

  // Scene 3: Sudden Obstacle & Collision
  runScene3() {
    this.app.triggerAccidentWorkflow();
    this.highlightElement('canvas-container');
    this.app.logTerminal("[SCENE_3] Hazardous collision event triggered!", "text-red");
  }

  // Scene 4: Sensor Threshold Breach
  runScene4() {
    this.highlightElement('card-accel');
    this.highlightElement('card-vibration');
    this.app.logTerminal("[SCENE_4] Threshold breached! Peak Deceleration = 8.4G | Vibration = 96%", "text-red");
  }

  // Scene 5: Accident Confirmation
  runScene5() {
    this.app.setPipelineStep(3);
    this.highlightElement('pipe-step-3');
    this.app.logTerminal("[SCENE_5] Multi-sensor verification passed. Impact severity rated: HIGH.", "text-amber");
  }

  // Scene 6: GPS Geolocation Lock
  runScene6() {
    this.app.setPipelineStep(4);
    this.highlightElement('card-gps');
    this.app.logTerminal("[SCENE_6] NEO-6M GPS locked coordinates: 13.0827° N, 80.2707° E.", "text-cyan");
  }

  // Scene 7: Emergency Alert Notification Generation
  runScene7() {
    this.app.setPipelineStep(5);
    const modal = document.getElementById('emergency-alert-modal');
    modal.classList.remove('hidden');
    this.app.logTerminal("[SCENE_7] Emergency modal activated. 5-second automatic dispatch initiated.", "text-amber");
  }

  // Scene 8: Final Emergency Dashboard & Dispatch Tracking
  runScene8() {
    this.app.executeGSMDispatch();
    const modal = document.getElementById('emergency-alert-modal');
    modal.classList.remove('hidden');
    this.app.logTerminal("[SCENE_8] Final incident dispatch confirmed. SMS & Ambulance tracking active.", "text-green");
  }
}

// Global presentation director
window.demoDirector = new DemoPresentationDirector();
