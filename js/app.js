/**
 * Vehicle Accident Detection and Alert System
 * app.js - Master Application Coordinator, Web Audio Synthesizer,
 * Embedded Microcontroller Detection Engine & Emergency Dispatch Workflow
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // Engine sound nodes
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;

    // Alarm sound nodes
    this.alarmOsc = null;
    this.alarmGain = null;
    this.alarmInterval = null;

    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
      this.setupEngineSound();
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  setupEngineSound() {
    if (!this.ctx || this.engineOsc) return;

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
  }

  updateEnginePitch(speed, isMoving) {
    if (!this.ctx || !this.engineOsc || this.muted) return;
    if (this.ctx.state === 'suspended') return;

    if (!isMoving || speed <= 1) {
      this.engineGain.gain.setTargetAtTime(0.015, this.ctx.currentTime, 0.1);
      this.engineOsc.frequency.setTargetAtTime(45, this.ctx.currentTime, 0.1);
      this.engineFilter.frequency.setTargetAtTime(100, this.ctx.currentTime, 0.1);
    } else {
      const targetGain = 0.045;
      const targetFreq = 50 + (speed / 100) * 85; // 50Hz to 135Hz
      const targetCutoff = 120 + (speed / 100) * 160;

      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.1);
    }
  }

  playScreech() {
    if (!this.ctx || this.muted) return;
    this.resume();

    // Synthesize brake screech with filtered high frequency noise
    const bufferSize = this.ctx.sampleRate * 0.7; // 700ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.8));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.6);
    filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  playCrash() {
    if (!this.ctx || this.muted) return;
    this.resume();

    // 1. Low Frequency Impact Thud
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.5);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);

    // 2. Metal Crunch / Shatter Noise Burst
    const bufferSize = this.ctx.sampleRate * 0.9;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.9);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start();
  }

  startEmergencySiren() {
    if (!this.ctx || this.muted || this.alarmInterval) return;
    this.resume();

    let high = true;
    const playChirp = () => {
      if (!this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(high ? 960 : 720, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
      high = !high;
    };

    playChirp();
    this.alarmInterval = setInterval(playChirp, 340);
  }

  stopEmergencySiren() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  playBeep() {
    if (!this.ctx || this.muted) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.stopEmergencySiren();
    } else {
      this.resume();
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    }
    return !this.muted;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

// Global Sound instance
window.soundFX = new SoundEngine();

/**
 * Main Controller Application
 */
class AccidentDetectionApp {
  constructor() {
    this.sim = window.roadSim;
    this.sensors = window.sensorSystem;
    this.sound = window.soundFX;

    this.state = {
      detectionStep: 1, // 1 to 5
      countdownTimer: null,
      countdownSeconds: 5,
      isAlertActive: false,
      alertCancelled: false
    };

    this.bindDOM();
    this.setupSimulationCallbacks();
    this.logTerminal("System initialized. Microcontroller ESP32 online at 240MHz dual-core.", "text-muted");
    this.logTerminal("I2C Bus: MPU6050 Accelerometer/Gyro found at 0x68.", "text-muted");
    this.logTerminal("Digital GPIO 4: SW-420 Piezo Shock Sensor armed.", "text-muted");
    this.logTerminal("UART2: NEO-6M GPS baud 9600 locked (3D Fix, 9 Satellites).", "text-muted");
    this.logTerminal("UART1: SIM800L GSM Module initialized. Network registered: Airtel 4G.", "text-muted");
    this.logTerminal("CRASH DETECTION THRESHOLDS: |G| > 4.0G | Vibration > 75% | Yaw > 35°/s", "text-cyan");

    // Auto-start simulation in cruising mode
    this.sim.start();
    const btnStart = document.getElementById('btn-start-sim');
    const btnStop = document.getElementById('btn-stop-sim');
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;
  }

  bindDOM() {
    // Toolbar buttons
    const btnStart = document.getElementById('btn-start-sim');
    const btnStop = document.getElementById('btn-stop-sim');
    const btnTrigger = document.getElementById('btn-trigger-accident');
    const btnSOS = document.getElementById('btn-send-sos');
    const btnReset = document.getElementById('btn-reset-sim');
    const btnSound = document.getElementById('btn-toggle-sound');

    btnStart.addEventListener('click', () => {
      this.sound.init();
      this.sound.resume();
      this.sim.start();
      btnStart.disabled = true;
      btnStop.disabled = false;
      const lbl = document.getElementById('start-btn-label');
      if (lbl) lbl.textContent = "Simulation Active";
      this.logTerminal("[USER_CMD] Simulation resumed by operator.", "text-cyan");
    });

    btnStop.addEventListener('click', () => {
      this.sim.pause();
      btnStart.disabled = false;
      btnStop.disabled = true;
      const lbl = document.getElementById('start-btn-label');
      if (lbl) lbl.textContent = "Resume Simulation";
      this.logTerminal("[USER_CMD] Simulation paused.", "text-muted");
    });

    btnTrigger.addEventListener('click', () => {
      this.sound.init();
      this.sound.resume();
      this.triggerAccidentWorkflow();
    });

    btnSOS.addEventListener('click', () => {
      this.sound.init();
      this.sound.resume();
      this.logTerminal("[SOS_BUTTON] Manual SOS panic switch pressed by vehicle occupant!", "text-red");
      this.triggerEmergencyWorkflow(true);
    });

    btnReset.addEventListener('click', () => {
      this.resetAll();
    });

    // Sound toggle
    btnSound.addEventListener('click', () => {
      this.sound.init();
      const isAudible = this.sound.toggleMute();
      const label = document.getElementById('sound-label');
      const iconOn = document.getElementById('icon-sound-on');
      const iconOff = document.getElementById('icon-sound-off');

      if (isAudible) {
        label.textContent = "Audio ON";
        iconOn.classList.remove('hidden');
        iconOff.classList.add('hidden');
      } else {
        label.textContent = "Audio OFF";
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
      }
    });

    // Modal buttons
    document.getElementById('btn-cancel-alert').addEventListener('click', () => {
      this.cancelAlert();
    });

    document.getElementById('btn-confirm-emergency').addEventListener('click', () => {
      this.dispatchEmergencyImmediately();
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
      document.getElementById('emergency-alert-modal').classList.add('hidden');
      this.sound.stopEmergencySiren();
    });

    // Enable audio on first user interaction anywhere
    const enableAudio = () => {
      this.sound.init();
      this.sound.resume();
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
    window.addEventListener('click', enableAudio);
    window.addEventListener('keydown', enableAudio);
  }

  setupSimulationCallbacks() {
    this.sim.onAccidentTriggered = (gForce) => {
      this.handleCollisionEvent(gForce);
    };

    this.sim.onSpeedChanged = (spd) => {
      this.sound.updateEnginePitch(spd, this.sim.isRunning);

      // Update engine RPM display in HUD
      const rpmEl = document.getElementById('hud-engine');
      if (rpmEl) {
        if (spd > 0) {
          const rpm = 1200 + Math.round((spd / 100) * 3200);
          rpmEl.textContent = `RUNNING (${rpm.toLocaleString()} RPM)`;
          rpmEl.className = 'hud-val text-green';
        } else {
          rpmEl.textContent = 'STALLED / SHUTDOWN';
          rpmEl.className = 'hud-val text-red';
        }
      }

      const throttleEl = document.getElementById('hud-throttle');
      if (throttleEl) {
        if (spd > 0) {
          const thr = Math.round(40 + (spd / 100) * 45);
          throttleEl.textContent = `${thr}% CRUISE`;
        } else {
          throttleEl.textContent = '0% EMERGENCY CUTOFF';
        }
      }
    };
  }

  triggerAccidentWorkflow() {
    this.sim.triggerAccident();
    document.getElementById('btn-start-sim').disabled = true;
    document.getElementById('btn-stop-sim').disabled = true;
    this.setPipelineStep(2);
    this.logTerminal("[ALERT] Forward obstacle detected at 12m. Emergency braking engaged!", "text-amber");
  }

  /**
   * Called when physical impact occurs
   */
  handleCollisionEvent(gForce) {
    this.state.isAlertActive = true;
    this.state.alertCancelled = false;
    this.state.peakImpactG = gForce || 8.4;

    // Step 2 & 3: Threshold Breached & Confirmation
    this.setPipelineStep(3);

    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    this.logTerminal(`[CRASH_INTERRUPT] ISR Pin Triggered! MPU-6050 G-Vector = ${(this.state.peakImpactG).toFixed(2)}G!`, "text-red");
    this.logTerminal(`[FUSION_ALGO] Multi-Sensor Verification: Accel > 4G (PASS), Vibration > 75% (PASS), Yaw > 35° (PASS).`, "text-amber");
    this.logTerminal(`[CONFIRMED] Severe accident confirmed at ${timeStr}. Locking telemetry!`, "text-red");

    // Start Emergency Siren Sound
    this.sound.startEmergencySiren();

    // Step 4: GPS Coordinate Lock
    setTimeout(() => {
      this.setPipelineStep(4);
      const lat = this.sensors.state.gps.lat.toFixed(5);
      const lon = this.sensors.state.gps.lon.toFixed(5);
      this.logTerminal(`[GPS_LOCK] Satellite coordinates frozen: ${lat}° N, ${lon}° E. Accuracy ±1.8m.`, "text-cyan");
      this.logTerminal(`[REVERSE_GEO] Landmark: Grand Southern Trunk Rd, NH-45, Chennai.`, "text-cyan");
    }, 700);

    // Step 5: Emergency Dispatch
    setTimeout(() => {
      this.triggerEmergencyWorkflow(false);
    }, 1400);
  }

  triggerEmergencyWorkflow(isManualSOS = false) {
    this.setPipelineStep(5);

    const modal = document.getElementById('emergency-alert-modal');
    modal.classList.remove('hidden');

    // Populate modal fields
    const now = new Date();
    document.getElementById('alert-time').textContent = `Today, ${now.toLocaleTimeString()} IST`;
    const severityG = this.state.peakImpactG ? this.state.peakImpactG.toFixed(1) : "8.4";
    document.getElementById('alert-severity').textContent = isManualSOS
      ? 'MANUAL SOS TRIGGER (HIGH PRIORITY)'
      : `HIGH SEVERITY (${severityG}G)`;

    const lat = this.sensors.state.gps.lat.toFixed(4);
    const lon = this.sensors.state.gps.lon.toFixed(4);
    document.getElementById('alert-coords').textContent = `${lat}° N, ${lon}° E`;

    // Start 5-second automatic dispatch countdown
    this.state.countdownSeconds = 5;
    const countdownVal = document.getElementById('countdown-val');
    countdownVal.textContent = `${this.state.countdownSeconds}s`;

    if (this.state.countdownTimer) clearInterval(this.state.countdownTimer);

    this.state.countdownTimer = setInterval(() => {
      this.state.countdownSeconds--;
      if (this.state.countdownSeconds > 0) {
        countdownVal.textContent = `${this.state.countdownSeconds}s`;
        this.sound.playBeep();
      } else {
        clearInterval(this.state.countdownTimer);
        this.state.countdownTimer = null;
        countdownVal.textContent = `SENT`;
        this.executeGSMDispatch();
      }
    }, 1000);
  }

  executeGSMDispatch() {
    const lat = this.sensors.state.gps.lat.toFixed(4);
    const lon = this.sensors.state.gps.lon.toFixed(4);

    this.logTerminal("[GSM_TX] AT+CMGF=1 -> OK (Text Mode SMS)", "text-muted");
    this.logTerminal(`[GSM_TX] AT+CMGS="+919876543210" -> >`, "text-muted");
    this.logTerminal(`[GSM_SMS_PAYLOAD] "EMERGENCY: TN-09-CB-4092 crashed at NH-45 (${lat}N, ${lon}E). Severity: HIGH. Map: https://maps.google.com/?q=${lat},${lon}"`, "text-green");
    this.logTerminal("[GSM_SUCCESS] +CMGS: 142 OK. SMS delivered to primary emergency contact.", "text-green");
    this.logTerminal("[HTTP_POST] https://api.emergency-108.gov.in/v1/dispatch -> 200 OK", "text-cyan");
    this.logTerminal("[DISPATCH_ACK] Nearest Apollo Ambulance #AMB-108-C dispatched (ETA 6 mins).", "text-cyan");
    this.logTerminal("[HIGHWAY_PATROL] State Highway Police incident ticket #INC-94821 created.", "text-cyan");

    // Update Modal Badges
    const badgeSMS = document.getElementById('badge-sms-family');
    if (badgeSMS) {
      badgeSMS.className = 'dispatch-badge badge-sent';
      badgeSMS.innerHTML = '<span class="dot-green"></span> SMS DELIVERED';
    }

    const badgeAmb = document.getElementById('badge-ambulance');
    if (badgeAmb) {
      badgeAmb.className = 'dispatch-badge badge-dispatching';
      badgeAmb.innerHTML = '<span class="dot-amber"></span> UNIT DISPATCHED (ETA 6m)';
    }

    const badgePolice = document.getElementById('badge-police');
    if (badgePolice) {
      badgePolice.className = 'dispatch-badge badge-sent';
      badgePolice.innerHTML = '<span class="dot-green"></span> POLICE ALERTED';
    }
  }

  cancelAlert() {
    if (this.state.countdownTimer) {
      clearInterval(this.state.countdownTimer);
      this.state.countdownTimer = null;
    }

    this.state.alertCancelled = true;
    this.sound.stopEmergencySiren();

    const countdownVal = document.getElementById('countdown-val');
    if (countdownVal) countdownVal.textContent = "CANCELLED";

    this.logTerminal("[SAFETY_OVERRIDE] Driver cancelled emergency alert within 5-second countdown window.", "text-amber");
    this.logTerminal("[STATUS] False alarm registered. SMS dispatch aborted.", "text-green");

    setTimeout(() => {
      document.getElementById('emergency-alert-modal').classList.add('hidden');
    }, 600);
  }

  dispatchEmergencyImmediately() {
    if (this.state.countdownTimer) {
      clearInterval(this.state.countdownTimer);
      this.state.countdownTimer = null;
    }
    const countdownVal = document.getElementById('countdown-val');
    if (countdownVal) countdownVal.textContent = "SENT";

    this.executeGSMDispatch();
  }

  setPipelineStep(stepNumber) {
    this.state.detectionStep = stepNumber;
    for (let i = 1; i <= 5; i++) {
      const stepEl = document.getElementById(`pipe-step-${i}`);
      if (!stepEl) continue;

      if (i < stepNumber) {
        stepEl.className = 'step-item step-active';
      } else if (i === stepNumber) {
        stepEl.className = stepNumber >= 3 ? 'step-item step-alert' : 'step-item step-active';
      } else {
        stepEl.className = 'step-item';
      }
    }
  }

  resetAll() {
    if (this.state.countdownTimer) {
      clearInterval(this.state.countdownTimer);
      this.state.countdownTimer = null;
    }

    this.sound.stopEmergencySiren();
    this.sim.reset();
    this.sensors.reset();

    this.state.isAlertActive = false;
    this.state.alertCancelled = false;
    this.setPipelineStep(1);

    document.getElementById('emergency-alert-modal').classList.add('hidden');
    const btnStart = document.getElementById('btn-start-sim');
    const btnStop = document.getElementById('btn-stop-sim');
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;
    const lbl = document.getElementById('start-btn-label');
    if (lbl) lbl.textContent = "Simulation Active";

    this.logTerminal("--------------------------------------------------", "text-muted");
    this.logTerminal("[RESET] System state restored. Ready for new demonstration run.", "text-green");
  }

  logTerminal(message, colorClass = "text-muted") {
    const term = document.getElementById('gsm-terminal-body');
    if (!term) return;

    const line = document.createElement('div');
    line.className = `terminal-line ${colorClass}`;
    line.textContent = message;
    term.appendChild(line);

    // Auto-scroll to bottom
    term.scrollTop = term.scrollHeight;

    // Keep history manageable
    if (term.childNodes.length > 80) {
      term.removeChild(term.firstChild);
    }
  }
}

// Global application singleton
window.app = new AccidentDetectionApp();
