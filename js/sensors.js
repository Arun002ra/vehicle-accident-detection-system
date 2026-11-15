/**
 * Vehicle Accident Detection and Alert System
 * sensors.js - Mathematical Sensor Simulation & Real-time Telemetry Oscilloscopes
 * Sensors simulated: MPU-6050 (Accel + Gyro), SW-420 (Piezo Vibration), NEO-6M (GPS)
 */

class SensorSystem {
  constructor() {
    // Sensor Thresholds
    this.THRESHOLDS = {
      ACCEL_G: 4.0,       // G-force trigger threshold
      VIBE_PERCENT: 75.0, // Vibration trigger threshold (%)
      GYRO_YAW: 35.0      // Abnormal yaw rotation threshold (deg/s)
    };

    // Current Sensor Values
    this.state = {
      // Accelerometer (in G)
      accel: {
        x: 0.02,
        y: -0.08,
        z: 0.99,
        total: 1.00
      },
      // Gyroscope (in deg/s)
      gyro: {
        roll: 0.4,
        pitch: -0.2,
        yaw: 0.8,
        tiltAngle: 0.2
      },
      // Vibration Sensor (%)
      vibration: {
        current: 12.0,
        peak: 18.0
      },
      // GPS Module
      gps: {
        lat: 13.08270,
        lon: 80.27070,
        speed: 72.0, // km/h
        altitude: 18.5, // meters
        satellites: 9,
        hdop: 0.9,
        locked: true,
        address: "Grand Southern Trunk Rd, NH-45, Chennai"
      },
      // Detection state
      isAccident: false,
      impactSeverity: "NORMAL", // NORMAL, MODERATE, HIGH
      impactTimestamp: null
    };

    // Circular waveform history buffers (for 60fps oscilloscopes)
    this.historyLength = 120;
    this.history = {
      accelX: new Float32Array(this.historyLength).fill(0),
      accelY: new Float32Array(this.historyLength).fill(0),
      accelZ: new Float32Array(this.historyLength).fill(1.0),
      accelTotal: new Float32Array(this.historyLength).fill(1.0),

      gyroRoll: new Float32Array(this.historyLength).fill(0),
      gyroPitch: new Float32Array(this.historyLength).fill(0),
      gyroYaw: new Float32Array(this.historyLength).fill(0),

      vibration: new Float32Array(this.historyLength).fill(12.0)
    };

    // Impact physics impulse generator variables
    this.impactImpulse = 0;
    this.impactYawImpulse = 0;
    this.impactRollImpulse = 0;

    // Canvas references
    this.canvasAccel = document.getElementById('chart-accel');
    this.canvasGyro = document.getElementById('chart-gyro');
    this.canvasVibe = document.getElementById('chart-vibration');
    this.canvasMiniMap = document.getElementById('mini-map-canvas');

    this.ctxAccel = this.canvasAccel ? this.canvasAccel.getContext('2d') : null;
    this.ctxGyro = this.canvasGyro ? this.canvasGyro.getContext('2d') : null;
    this.ctxVibe = this.canvasVibe ? this.canvasVibe.getContext('2d') : null;
    this.ctxMiniMap = this.canvasMiniMap ? this.canvasMiniMap.getContext('2d') : null;

    this.initCanvasResolutions();
    window.addEventListener('resize', () => this.initCanvasResolutions());
    window.addEventListener('load', () => this.initCanvasResolutions());
    setTimeout(() => this.initCanvasResolutions(), 150);

    // Radar scan angle
    this.radarAngle = 0;
  }

  initCanvasResolutions() {
    const dpr = window.devicePixelRatio || 1;
    [
      { c: this.canvasAccel, h: 85 },
      { c: this.canvasGyro, h: 85 },
      { c: this.canvasVibe, h: 50 },
      { c: this.canvasMiniMap, h: 65 }
    ].forEach(({ c, h }) => {
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const w = rect.width || 340;
      c.width = w * dpr;
      c.height = h * dpr;
      const ctx = c.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr);
    });
  }

  /**
   * Called on collision trigger with calculated impact forces
   */
  triggerImpact(magnitudeG = 8.4, yawAngle = 48) {
    this.state.isAccident = true;
    this.impactImpulse = magnitudeG;
    this.impactYawImpulse = yawAngle * 3.5;
    this.impactRollImpulse = (Math.random() > 0.5 ? 1 : -1) * 28.0;
    this.state.impactTimestamp = new Date();

    if (magnitudeG >= 6.5) {
      this.state.impactSeverity = "HIGH";
    } else if (magnitudeG >= 3.5) {
      this.state.impactSeverity = "MODERATE";
    } else {
      this.state.impactSeverity = "LOW";
    }
  }

  reset() {
    this.state.isAccident = false;
    this.impactImpulse = 0;
    this.impactYawImpulse = 0;
    this.impactRollImpulse = 0;
    this.state.impactSeverity = "NORMAL";
    this.state.impactTimestamp = null;
    this.state.gps.speed = 72.0;

    // Reset history buffers
    this.history.accelX.fill(0);
    this.history.accelY.fill(0);
    this.history.accelZ.fill(1.0);
    this.history.accelTotal.fill(1.0);
    this.history.gyroRoll.fill(0);
    this.history.gyroPitch.fill(0);
    this.history.gyroYaw.fill(0);
    this.history.vibration.fill(12.0);
  }

  /**
   * Main per-frame physics & mathematical update loop (60Hz)
   */
  update(carSpeed, isCarMoving, dt = 0.016) {
    const time = performance.now() / 1000;

    // 1. Decay impact impulse
    if (this.impactImpulse > 0.01) {
      this.impactImpulse *= 0.88; // fast damping
    } else {
      this.impactImpulse = 0;
    }

    if (Math.abs(this.impactYawImpulse) > 0.1) {
      this.impactYawImpulse *= 0.90;
    } else {
      this.impactYawImpulse = 0;
    }

    if (Math.abs(this.impactRollImpulse) > 0.1) {
      this.impactRollImpulse *= 0.89;
    } else {
      this.impactRollImpulse = 0;
    }

    // 2. Synthesize Accelerometer Readings
    if (this.impactImpulse > 0.1) {
      // Collision phase
      const noise = (Math.random() - 0.5) * 0.8;
      this.state.accel.y = -(this.impactImpulse * 0.85 + noise);
      this.state.accel.x = (Math.sin(time * 30) * this.impactImpulse * 0.45);
      this.state.accel.z = 1.0 + (Math.cos(time * 25) * this.impactImpulse * 0.35);
    } else if (isCarMoving) {
      // Normal driving with highway asphalt vibrations
      const roadRumble = Math.sin(time * 18) * 0.04 + (Math.random() - 0.5) * 0.05;
      const laneSway = Math.cos(time * 1.5) * 0.03;
      this.state.accel.x = laneSway + (Math.random() - 0.5) * 0.03;
      this.state.accel.y = -0.05 + roadRumble * 0.6;
      this.state.accel.z = 0.98 + roadRumble;
    } else {
      // Stationary car
      this.state.accel.x = (Math.random() - 0.5) * 0.01;
      this.state.accel.y = (Math.random() - 0.5) * 0.01;
      this.state.accel.z = 1.00 + (Math.random() - 0.5) * 0.01;
    }

    // Total G-force vector sum
    this.state.accel.total = Math.sqrt(
      this.state.accel.x * this.state.accel.x +
      this.state.accel.y * this.state.accel.y +
      this.state.accel.z * this.state.accel.z
    );

    // 3. Synthesize Gyroscope Readings
    if (Math.abs(this.impactYawImpulse) > 0.1) {
      this.state.gyro.yaw = this.impactYawImpulse + (Math.random() - 0.5) * 4.0;
      this.state.gyro.roll = this.impactRollImpulse + (Math.random() - 0.5) * 3.0;
      this.state.gyro.pitch = (this.impactImpulse * 2.8) + (Math.random() - 0.5) * 2.0;
      this.state.gyro.tiltAngle = Math.abs(this.state.gyro.roll * 0.4);
    } else if (isCarMoving) {
      this.state.gyro.yaw = Math.sin(time * 2.2) * 1.4 + (Math.random() - 0.5) * 0.6;
      this.state.gyro.roll = Math.cos(time * 2.0) * 0.8 + (Math.random() - 0.5) * 0.4;
      this.state.gyro.pitch = Math.sin(time * 4.0) * 0.5 + (Math.random() - 0.5) * 0.3;
      this.state.gyro.tiltAngle = 0.3;
    } else {
      this.state.gyro.yaw = (Math.random() - 0.5) * 0.2;
      this.state.gyro.roll = (Math.random() - 0.5) * 0.2;
      this.state.gyro.pitch = (Math.random() - 0.5) * 0.2;
      this.state.gyro.tiltAngle = 0.0;
    }

    // 4. Synthesize Piezo Vibration Sensor
    if (this.impactImpulse > 0.1) {
      const spike = Math.min(100, (this.impactImpulse / 8.0) * 98 + Math.random() * 5);
      this.state.vibration.current = spike;
      if (spike > this.state.vibration.peak) {
        this.state.vibration.peak = spike;
      }
    } else if (isCarMoving) {
      // Normal highway vibration 12% - 22%
      const speedFactor = (carSpeed / 100);
      const vibe = 10 + speedFactor * 10 + Math.sin(time * 22) * 4 + (Math.random() * 3);
      this.state.vibration.current = Math.min(35, Math.max(5, vibe));
      if (!this.state.isAccident) {
        this.state.vibration.peak = Math.max(this.state.vibration.peak * 0.995, this.state.vibration.current);
      }
    } else {
      this.state.vibration.current = Math.random() * 2;
    }

    // 5. GPS Simulation
    this.state.gps.speed = carSpeed;
    if (isCarMoving && !this.state.isAccident) {
      // Increment latitude slightly to simulate northward transit along highway
      const speedMps = (carSpeed * 1000) / 3600;
      const deltaLat = (speedMps * dt) / 111111; // 1 deg lat approx 111,111m
      this.state.gps.lat += deltaLat;
    }

    // Push into circular history arrays
    this.pushHistory(this.history.accelX, this.state.accel.x);
    this.pushHistory(this.history.accelY, this.state.accel.y);
    this.pushHistory(this.history.accelZ, this.state.accel.z);
    this.pushHistory(this.history.accelTotal, this.state.accel.total);

    this.pushHistory(this.history.gyroRoll, this.state.gyro.roll);
    this.pushHistory(this.history.gyroPitch, this.state.gyro.pitch);
    this.pushHistory(this.history.gyroYaw, this.state.gyro.yaw);

    this.pushHistory(this.history.vibration, this.state.vibration.current);

    // Update DOM readouts
    this.updateDOM();

    // Render Canvas Charts
    this.renderAccelChart();
    this.renderGyroChart();
    this.renderVibeChart();
    this.renderMiniMap();
  }

  pushHistory(array, value) {
    for (let i = 0; i < array.length - 1; i++) {
      array[i] = array[i + 1];
    }
    array[array.length - 1] = value;
  }

  /**
   * Sync telemetry numbers to HTML elements
   */
  updateDOM() {
    // Accelerometer DOM
    const elX = document.getElementById('val-accel-x');
    const elY = document.getElementById('val-accel-y');
    const elZ = document.getElementById('val-accel-z');
    const elTot = document.getElementById('val-accel-total');
    const badgeAccel = document.getElementById('accel-status-badge');

    if (elX) elX.textContent = `${this.state.accel.x >= 0 ? '+' : ''}${this.state.accel.x.toFixed(2)} G`;
    if (elY) elY.textContent = `${this.state.accel.y >= 0 ? '+' : ''}${this.state.accel.y.toFixed(2)} G`;
    if (elZ) elZ.textContent = `${this.state.accel.z >= 0 ? '+' : ''}${this.state.accel.z.toFixed(2)} G`;
    if (elTot) {
      elTot.textContent = `${this.state.accel.total.toFixed(2)} G`;
      if (this.state.accel.total >= this.THRESHOLDS.ACCEL_G) {
        elTot.className = 'metric-val text-bold text-red';
      } else {
        elTot.className = 'metric-val text-bold text-cyan';
      }
    }

    if (badgeAccel) {
      if (this.state.accel.total >= this.THRESHOLDS.ACCEL_G) {
        badgeAccel.textContent = `CRITICAL SPIKE > ${this.THRESHOLDS.ACCEL_G}G`;
        badgeAccel.classList.add('breached');
      } else {
        badgeAccel.textContent = `NORMAL < ${this.THRESHOLDS.ACCEL_G}.0G`;
        badgeAccel.classList.remove('breached');
      }
    }

    // Gyroscope DOM
    const elRoll = document.getElementById('val-gyro-roll');
    const elPitch = document.getElementById('val-gyro-pitch');
    const elYaw = document.getElementById('val-gyro-yaw');
    const elTilt = document.getElementById('val-gyro-orientation');
    const badgeGyro = document.getElementById('gyro-status-badge');

    if (elRoll) elRoll.textContent = `${this.state.gyro.roll.toFixed(1)} °/s`;
    if (elPitch) elPitch.textContent = `${this.state.gyro.pitch.toFixed(1)} °/s`;
    if (elYaw) elYaw.textContent = `${this.state.gyro.yaw.toFixed(1)} °/s`;
    if (elTilt) {
      if (this.state.gyro.tiltAngle > 15.0) {
        elTilt.textContent = `ABNORMAL TILT (${this.state.gyro.tiltAngle.toFixed(1)}°)`;
        elTilt.className = 'metric-val text-bold text-red';
      } else {
        elTilt.textContent = `LEVEL (${this.state.gyro.tiltAngle.toFixed(1)}°)`;
        elTilt.className = 'metric-val text-green';
      }
    }

    if (badgeGyro) {
      if (Math.abs(this.state.gyro.yaw) > this.THRESHOLDS.GYRO_YAW || this.state.gyro.tiltAngle > 15.0) {
        badgeGyro.textContent = 'ABNORMAL ROTATION';
        badgeGyro.classList.add('breached');
      } else {
        badgeGyro.textContent = 'STABLE';
        badgeGyro.classList.remove('breached');
      }
    }

    // Vibration DOM
    const elVibeVal = document.getElementById('val-vibe-percent');
    const elVibePeak = document.getElementById('val-vibe-peak');
    const barVibe = document.getElementById('vibe-progress-bar');
    const tagVibe = document.getElementById('vibe-tag');

    if (elVibeVal) elVibeVal.textContent = `${this.state.vibration.current.toFixed(0)}%`;
    if (elVibePeak) elVibePeak.textContent = `${this.state.vibration.peak.toFixed(0)}%`;
    if (barVibe) barVibe.style.width = `${Math.min(100, this.state.vibration.current)}%`;

    if (tagVibe) {
      if (this.state.vibration.current >= this.THRESHOLDS.VIBE_PERCENT) {
        tagVibe.textContent = 'IMPACT TRIGGERED';
        tagVibe.className = 'status-indicator-tag alert-tag';
      } else {
        tagVibe.textContent = 'NORMAL';
        tagVibe.className = 'status-indicator-tag';
      }
    }

    // GPS DOM
    const elLat = document.getElementById('gps-lat');
    const elLon = document.getElementById('gps-lon');
    if (elLat) elLat.textContent = `${this.state.gps.lat.toFixed(5)}° N`;
    if (elLon) elLon.textContent = `${this.state.gps.lon.toFixed(5)}° E`;
  }

  /**
   * Render Accelerometer Multi-trace Oscilloscope Chart
   */
  renderAccelChart() {
    if (!this.ctxAccel) return;
    const ctx = this.ctxAccel;
    const w = this.canvasAccel.clientWidth || 340;
    const h = 85;

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 15; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline (0G) and Earth Gravity (1G)
    const midY = h * 0.65;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // Red Danger Threshold Line (4.0G)
    const thresholdY = midY - (4.0 * 6.5);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(w, thresholdY);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Trace Plotter Helper
    const drawTrace = (buffer, color, scale = 6.5, offsetY = midY) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const step = w / (this.historyLength - 1);
      for (let i = 0; i < this.historyLength; i++) {
        const x = i * step;
        const y = offsetY - (buffer[i] * scale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Draw Traces: X, Y, Z
    drawTrace(this.history.accelX, '#38bdf8'); // Cyan (X)
    drawTrace(this.history.accelY, '#3b82f6'); // Blue (Y)
    drawTrace(this.history.accelZ, '#a855f7'); // Purple (Z)

    // Total Vector Sum Highlight Line (if spiking)
    if (this.state.accel.total >= this.THRESHOLDS.ACCEL_G) {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 8;
      drawTrace(this.history.accelTotal, '#ef4444', 6.5, midY);
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Render Gyroscope Angular Velocity Chart
   */
  renderGyroChart() {
    if (!this.ctxGyro) return;
    const ctx = this.ctxGyro;
    const w = this.canvasGyro.clientWidth || 340;
    const h = 85;

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 15; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Zero deg/s Center Baseline
    const midY = h * 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    const drawTrace = (buffer, color, scale = 0.45) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = w / (this.historyLength - 1);
      for (let i = 0; i < this.historyLength; i++) {
        const x = i * step;
        const y = midY - (buffer[i] * scale);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Draw Roll, Pitch, Yaw
    drawTrace(this.history.gyroRoll, '#facc15');   // Yellow
    drawTrace(this.history.gyroPitch, '#fb923c');  // Orange
    drawTrace(this.history.gyroYaw, '#34d399');    // Emerald
  }

  /**
   * Render Piezo Vibration Waveform
   */
  renderVibeChart() {
    if (!this.ctxVibe) return;
    const ctx = this.ctxVibe;
    const w = this.canvasVibe.clientWidth || 160;
    const h = 50;

    ctx.clearRect(0, 0, w, h);

    // Area Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (this.state.vibration.current >= this.THRESHOLDS.VIBE_PERCENT) {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
      ctx.strokeStyle = '#ef4444';
    } else {
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
      grad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
      ctx.strokeStyle = '#f59e0b';
    }

    ctx.beginPath();
    const step = w / (this.historyLength - 1);
    ctx.moveTo(0, h);
    for (let i = 0; i < this.historyLength; i++) {
      const x = i * step;
      const y = h - ((this.history.vibration[i] / 100) * (h - 6));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < this.historyLength; i++) {
      const x = i * step;
      const y = h - ((this.history.vibration[i] / 100) * (h - 6));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /**
   * Render GPS Mini Radar & Location Map
   */
  renderMiniMap() {
    if (!this.ctxMiniMap) return;
    const ctx = this.ctxMiniMap;
    const w = this.canvasMiniMap.clientWidth || 160;
    const h = 65;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Draw radar concentric circles
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    [15, 28, 42].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy);
    ctx.lineTo(cx + 45, cy);
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx, cy + 25);
    ctx.stroke();

    // Sweeping Radar Line
    this.radarAngle += 0.04;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(this.radarAngle) * 44, cy + Math.sin(this.radarAngle) * 44);
    ctx.stroke();

    // Vehicle Target Blip
    if (this.state.isAccident) {
      // Flashing Emergency Crash Pinpoint
      const pulse = (Math.sin(performance.now() / 150) + 1) / 2;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + pulse * 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal moving vehicle blip
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// Global sensor system singleton
window.sensorSystem = new SensorSystem();
