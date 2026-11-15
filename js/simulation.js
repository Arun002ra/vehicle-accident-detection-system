/**
 * Vehicle Accident Detection and Alert System
 * simulation.js - 60 FPS HTML5 Canvas Road Environment, Vehicle Dynamics,
 * Collision Mechanics, Skid Marks, Particle Systems & Camera Shake
 */

// Universal polyfill for roundRect across all browsers and devices
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    let r = 0;
    if (typeof radii === 'number') r = radii;
    else if (Array.isArray(radii) && radii.length > 0) r = radii[0];
    if (w < 2 * r) r = Math.abs(w) / 2;
    if (h < 2 * r) r = Math.abs(h) / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

class RoadSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Canvas sizing
    this.width = 800;
    this.height = 380;
    this.dpr = window.devicePixelRatio || 1;

    // Simulation states
    this.isRunning = true;
    this.isAccident = false;
    this.speed = 72.0;       // km/h (target cruise speed)
    this.currentSpeed = 72.0;
    this.roadOffset = 0;

    // Camera shake trauma
    this.cameraTrauma = 0;
    this.cameraShakeX = 0;
    this.cameraShakeY = 0;

    // Roadway dimensions
    this.roadWidth = 380;
    this.laneCount = 3;
    this.laneWidth = this.roadWidth / this.laneCount;

    // Subject Vehicle (Host Car)
    this.playerCar = {
      x: 400,
      y: 270,
      width: 44,
      height: 82,
      targetLane: 1, // 0 = Left, 1 = Center, 2 = Right
      currentX: 400,
      angle: 0,      // in radians
      angularVelocity: 0,
      hazardLights: false,
      brakeLights: false,
      damaged: false,
      crumpleAmount: 0
    };

    // Ambient Traffic Vehicles
    this.ambientCars = [];
    this.initAmbientTraffic();

    // Sudden Obstacle Vehicle (for collision event)
    this.obstacleCar = null;

    // Persistent tire skid marks
    this.skidMarks = [];

    // Particle Emitter Systems (Sparks, Glass shards, Tire Smoke, Hood Smoke)
    this.particles = [];

    // Roadside Procedural Scenery (Streetlights, Buildings)
    this.scenery = [];
    this.initScenery();

    // Callbacks
    this.onAccidentTriggered = null;
    this.onSpeedChanged = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('load', () => this.resizeCanvas());
    setTimeout(() => this.resizeCanvas(), 100);
    setTimeout(() => this.resizeCanvas(), 500);

    // Start rendering loop immediately
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  // Guaranteed safe rounded rectangle drawing helper
  drawRoundRect(ctx, x, y, w, h, r = 4) {
    if (w < 2 * r) r = Math.abs(w) / 2;
    if (h < 2 * r) r = Math.abs(h) / 2;
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width > 50 ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 800);
    const h = rect.height > 50 ? rect.height : (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 380);

    this.width = w || 800;
    this.height = h || 380;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    // Adapt road width to screen size
    this.roadWidth = Math.min(Math.max(this.width * 0.52, 340), 440);
    this.laneWidth = this.roadWidth / this.laneCount;

    // Reposition player car in center lane
    const roadCenterX = this.width / 2;
    this.playerCar.x = roadCenterX;
    this.playerCar.y = this.height - 110;
    if (!this.playerCar.damaged) {
      this.playerCar.currentX = roadCenterX;
    }
  }

  initAmbientTraffic() {
    this.ambientCars = [
      {
        id: 1,
        lane: 0, // Left lane
        y: -180,
        speedFactor: 0.88,
        color: '#94a3b8', // Silver Sedan
        type: 'sedan',
        width: 42,
        height: 78
      },
      {
        id: 2,
        lane: 2, // Right lane
        y: -380,
        speedFactor: 1.12,
        color: '#dc2626', // Red Sports Car
        type: 'sports',
        width: 44,
        height: 80
      },
      {
        id: 3,
        lane: 0,
        y: -650,
        speedFactor: 0.75,
        color: '#eab308', // Yellow Cargo Truck
        type: 'truck',
        width: 50,
        height: 110
      }
    ];
  }

  initScenery() {
    this.scenery = [];
    for (let i = 0; i < 18; i++) {
      this.scenery.push({
        y: i * 80 - 200,
        leftHeight: 40 + Math.random() * 55,
        leftWidth: 70 + Math.random() * 60,
        rightHeight: 45 + Math.random() * 65,
        rightWidth: 75 + Math.random() * 60,
        leftColor: Math.random() > 0.5 ? '#0f172a' : '#131e36',
        rightColor: Math.random() > 0.5 ? '#111c34' : '#0e182d',
        hasLight: i % 2 === 0
      });
    }
  }

  start() {
    this.isRunning = true;
    if (this.currentSpeed <= 0) {
      this.currentSpeed = 72.0;
    }
  }

  pause() {
    this.isRunning = false;
  }

  reset() {
    this.isRunning = true;
    this.isAccident = false;
    this.speed = 72.0;
    this.currentSpeed = 72.0;
    this.cameraTrauma = 0;
    this.cameraShakeX = 0;
    this.cameraShakeY = 0;

    // Reset player car
    const roadCenterX = this.width / 2;
    this.playerCar.x = roadCenterX;
    this.playerCar.y = this.height - 110;
    this.playerCar.currentX = roadCenterX;
    this.playerCar.angle = 0;
    this.playerCar.angularVelocity = 0;
    this.playerCar.hazardLights = false;
    this.playerCar.brakeLights = false;
    this.playerCar.damaged = false;
    this.playerCar.crumpleAmount = 0;
    this.playerCar.targetLane = 1;

    this.obstacleCar = null;
    this.skidMarks = [];
    this.particles = [];
    this.initAmbientTraffic();

    // Hide impact badge
    const badge = document.getElementById('impact-flash-badge');
    if (badge) badge.classList.remove('active');

    // Update HUD
    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) {
      hudStatus.textContent = 'NORMAL TRANSIT';
      hudStatus.className = 'hud-val text-green';
    }
    const hudRadar = document.getElementById('hud-radar');
    if (hudRadar) {
      hudRadar.textContent = 'CLEAR (38m)';
      hudRadar.className = 'hud-val text-cyan';
    }
  }

  triggerAccident() {
    if (this.isAccident) return;

    this.isRunning = true;
    this.isAccident = true;

    // Spawn sudden obstacle vehicle cutting directly across the center lane
    const roadCenterX = this.width / 2;
    this.obstacleCar = {
      x: roadCenterX + 8,
      y: this.playerCar.y - 120,
      width: 52,
      height: 98,
      color: '#475569',
      angle: 0.15,
      speedFactor: 0.15
    };

    this.playerCar.brakeLights = true;

    const hudRadar = document.getElementById('hud-radar');
    if (hudRadar) {
      hudRadar.textContent = 'COLLISION IMMINENT (4m)';
      hudRadar.className = 'hud-val text-red';
    }

    if (window.soundFX) {
      window.soundFX.playScreech();
    }
  }

  executeImpactImpact() {
    this.playerCar.damaged = true;
    this.playerCar.hazardLights = true;
    this.playerCar.crumpleAmount = 14;
    this.playerCar.angularVelocity = 0.28;
    this.currentSpeed = 0;
    this.speed = 0;

    this.cameraTrauma = 1.0;

    const impactPointX = this.playerCar.x;
    const impactPointY = this.playerCar.y - this.playerCar.height / 2;

    this.spawnSparks(impactPointX, impactPointY, 45);
    this.spawnGlassShards(impactPointX, impactPointY, 30);
    this.spawnTireSmoke(impactPointX, impactPointY + 40, 20);

    const badge = document.getElementById('impact-flash-badge');
    if (badge) badge.classList.add('active');

    const hudStatus = document.getElementById('hud-status');
    if (hudStatus) {
      hudStatus.textContent = 'CRITICAL IMPACT DETECTED';
      hudStatus.className = 'hud-val text-red';
    }
    const hudRadar = document.getElementById('hud-radar');
    if (hudRadar) {
      hudRadar.textContent = 'IMPACT CONFIRMED (0m)';
      hudRadar.className = 'hud-val text-red';
    }

    if (window.soundFX) {
      window.soundFX.playCrash();
    }

    if (window.sensorSystem) {
      window.sensorSystem.triggerImpact(8.4, 48.0);
    }

    if (this.onAccidentTriggered) {
      this.onAccidentTriggered(8.4);
    }
  }

  loop(timestamp) {
    // Schedule next frame FIRST so errors never halt the render loop
    requestAnimationFrame((t) => this.loop(t));

    try {
      const now = timestamp || performance.now();
      const dt = Math.min(Math.max((now - this.lastTime) / 1000, 0.001), 0.1);
      this.lastTime = now;

      this.update(dt);
      this.render();
    } catch (err) {
      console.error("Simulation frame error:", err);
    }
  }

  update(dt) {
    // 1. Speed dynamics
    if (this.isAccident && this.playerCar.damaged) {
      this.currentSpeed = 0;
    } else if (this.isAccident && this.obstacleCar) {
      this.currentSpeed = Math.max(0, this.currentSpeed - 120 * dt);
    } else if (this.isRunning) {
      this.currentSpeed += (this.speed - this.currentSpeed) * 0.05;
    } else {
      this.currentSpeed *= 0.95;
    }

    const roadPixelSpeed = (this.currentSpeed * 6.0);
    this.roadOffset += roadPixelSpeed * dt;

    const speedTag = document.getElementById('vehicle-speed-tag');
    if (speedTag) speedTag.textContent = `Speed: ${this.currentSpeed.toFixed(0)} km/h`;

    if (this.onSpeedChanged) {
      this.onSpeedChanged(this.currentSpeed);
    }

    // 2. Camera Shake Trauma Decay
    if (this.cameraTrauma > 0) {
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.5);
      const shakeMagnitude = Math.pow(this.cameraTrauma, 2) * 18;
      this.cameraShakeX = (Math.random() - 0.5) * shakeMagnitude * 2;
      this.cameraShakeY = (Math.random() - 0.5) * shakeMagnitude * 2;
    } else {
      this.cameraShakeX = 0;
      this.cameraShakeY = 0;
    }

    // 3. Update Obstacle & Collision Dynamics
    if (this.obstacleCar) {
      if (!this.playerCar.damaged) {
        this.obstacleCar.y += (roadPixelSpeed * 0.45) * dt;

        this.addSkidMark(this.playerCar.x - 14, this.playerCar.y + 35);
        this.addSkidMark(this.playerCar.x + 14, this.playerCar.y + 35);
        this.spawnTireSmoke(this.playerCar.x, this.playerCar.y + 40, 2);

        const dist = (this.playerCar.y - this.playerCar.height / 2) -
                     (this.obstacleCar.y + this.obstacleCar.height / 2);

        if (dist <= 6) {
          this.executeImpactImpact();
        }
      } else {
        this.obstacleCar.y -= 15 * dt;
        this.playerCar.y += 10 * dt;
      }
    }

    // 4. Update Player Car Rotation
    if (this.playerCar.damaged) {
      this.playerCar.angle += this.playerCar.angularVelocity;
      this.playerCar.angularVelocity *= 0.88;
      if (Math.abs(this.playerCar.angularVelocity) < 0.005) {
        this.playerCar.angularVelocity = 0;
      }

      if (Math.random() > 0.4) {
        this.spawnHoodSmoke(this.playerCar.x, this.playerCar.y - 20);
      }
    } else if (this.isRunning) {
      const sway = Math.sin(performance.now() / 600) * 0.015;
      this.playerCar.angle = sway;
      this.playerCar.currentX = this.playerCar.x;
    }

    // 5. Update Ambient Traffic
    if (this.isRunning && !this.isAccident) {
      const roadCenterX = this.width / 2;
      const lanePositions = [
        roadCenterX - this.laneWidth,
        roadCenterX,
        roadCenterX + this.laneWidth
      ];

      this.ambientCars.forEach(car => {
        const relativeSpeed = (car.speedFactor - 1.0) * roadPixelSpeed;
        car.y -= relativeSpeed * dt;

        if (car.y > this.height + 150) {
          car.y = -250;
        } else if (car.y < -350) {
          car.y = this.height + 100;
        }
      });
    }

    // 6. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      p.size = Math.max(0, p.size + p.growth * dt);
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 7. Age Skid Marks
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const sm = this.skidMarks[i];
      if (this.isRunning && !this.isAccident) {
        sm.y += roadPixelSpeed * dt;
      }
      sm.alpha -= 0.008 * dt;
      if (sm.alpha <= 0 || sm.y > this.height + 100) {
        this.skidMarks.splice(i, 1);
      }
    }

    // 8. Update Sensor System
    if (window.sensorSystem) {
      window.sensorSystem.update(this.currentSpeed, this.isRunning && this.currentSpeed > 5, dt);
    }
  }

  addSkidMark(x, y) {
    this.skidMarks.push({
      x: x,
      y: y,
      width: 6,
      height: 12,
      alpha: 0.65
    });
  }

  spawnSparks(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        growth: -1.0,
        color: Math.random() > 0.4 ? '#facc15' : '#fb923c',
        alpha: 1.0,
        decay: 1.8 + Math.random() * 2.5
      });
    }
  }

  spawnGlassShards(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.0 + Math.random() * 3.0,
        growth: 0,
        color: '#e0f2fe',
        alpha: 0.9,
        decay: 1.2
      });
    }
  }

  spawnTireSmoke(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 28,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 35,
        vy: -20 - Math.random() * 30,
        size: 8 + Math.random() * 12,
        growth: 24,
        color: '#94a3b8',
        alpha: 0.45,
        decay: 1.2
      });
    }
  }

  spawnHoodSmoke(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 20,
      vy: -40 - Math.random() * 45,
      size: 6 + Math.random() * 8,
      growth: 18,
      color: Math.random() > 0.5 ? '#64748b' : '#334155',
      alpha: 0.6,
      decay: 0.9
    });
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    // Reset transform on each frame
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    ctx.save();
    ctx.translate(this.cameraShakeX, this.cameraShakeY);

    // 1. Clear background & terrain
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.width, this.height);

    const roadLeft = (this.width - this.roadWidth) / 2;
    const roadRight = roadLeft + this.roadWidth;

    // Procedural side scenery
    this.renderSideScenery(ctx, roadLeft, roadRight);

    // 2. Road surface (asphalt)
    ctx.fillStyle = '#111827';
    ctx.fillRect(roadLeft, 0, this.roadWidth, this.height);

    // Curbs & Shoulders
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(roadLeft - 8, 0, 8, this.height);
    ctx.fillRect(roadRight, 0, 8, this.height);

    // Solid border lines
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(roadLeft, 0, 3, this.height);
    ctx.fillRect(roadRight - 3, 0, 3, this.height);

    // 3. Moving dashed lane markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const dashLength = 28;
    const dashGap = 24;
    const totalDash = dashLength + dashGap;
    const dashOffsetY = this.roadOffset % totalDash;

    for (let lane = 1; lane < this.laneCount; lane++) {
      const laneX = roadLeft + lane * this.laneWidth;
      for (let y = -dashLength + dashOffsetY; y < this.height + dashLength; y += totalDash) {
        ctx.fillRect(laneX - 1.5, y, 3, dashLength);
      }
    }

    // 4. Render Skid Marks
    this.skidMarks.forEach(sm => {
      ctx.fillStyle = `rgba(15, 23, 42, ${sm.alpha})`;
      ctx.fillRect(sm.x - sm.width / 2, sm.y - sm.height / 2, sm.width, sm.height);
    });

    // 5. Render Ambient Traffic
    const roadCenterX = this.width / 2;
    const lanePositions = [
      roadCenterX - this.laneWidth,
      roadCenterX,
      roadCenterX + this.laneWidth
    ];

    this.ambientCars.forEach(car => {
      const x = lanePositions[car.lane];
      this.renderVehicle(ctx, x, car.y, car.width, car.height, car.color, 0, false, false, false);
    });

    // 6. Render Obstacle Car (if present)
    if (this.obstacleCar) {
      this.renderVehicle(
        ctx,
        this.obstacleCar.x,
        this.obstacleCar.y,
        this.obstacleCar.width,
        this.obstacleCar.height,
        this.obstacleCar.color,
        this.obstacleCar.angle,
        true,
        false,
        false
      );
    }

    // 7. Render Particles
    this.renderParticles(ctx);

    // 8. Render Subject Vehicle (Host Car)
    const hostCarX = this.playerCar.currentX;
    const hostCarY = this.playerCar.y;
    this.renderSubjectCar(ctx, hostCarX, hostCarY);

    ctx.restore();
  }

  renderSideScenery(ctx, roadLeft, roadRight) {
    if (roadLeft <= 20) return;
    const scroll = (this.roadOffset * 0.4) % 160;

    for (let y = -100 + scroll; y < this.height + 100; y += 80) {
      const leftBuildingW = Math.max(10, roadLeft - 18);
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, y, leftBuildingW, 65);
      ctx.strokeStyle = '#17253d';
      ctx.strokeRect(0, y, leftBuildingW, 65);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      for (let wx = 15; wx < leftBuildingW - 15; wx += 20) {
        ctx.fillRect(wx, y + 15, 8, 12);
        ctx.fillRect(wx, y + 35, 8, 12);
      }

      const rightBuildingW = Math.max(10, this.width - (roadRight + 18));
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(roadRight + 18, y, rightBuildingW, 65);
      ctx.strokeStyle = '#17253d';
      ctx.strokeRect(roadRight + 18, y, rightBuildingW, 65);

      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      for (let wx = roadRight + 35; wx < roadRight + 18 + rightBuildingW - 15; wx += 22) {
        ctx.fillRect(wx, y + 15, 8, 12);
        ctx.fillRect(wx, y + 35, 8, 12);
      }

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(roadLeft - 8, y + 30, 3, 0, Math.PI * 2);
      ctx.arc(roadRight + 8, y + 30, 3, 0, Math.PI * 2);
      ctx.fill();

      const lightGradLeft = ctx.createRadialGradient(roadLeft - 8, y + 30, 2, roadLeft - 8, y + 30, 35);
      lightGradLeft.addColorStop(0, 'rgba(253, 224, 71, 0.25)');
      lightGradLeft.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = lightGradLeft;
      ctx.beginPath();
      ctx.arc(roadLeft - 8, y + 30, 35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderVehicle(ctx, x, y, width, height, color, angle = 0, brakeLights = false, hazardLights = false, isHost = false) {
    ctx.save();
    ctx.translate(x, y);
    if (angle !== 0) ctx.rotate(angle);

    // Car Body Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.drawRoundRect(ctx, -width / 2 + 2, -height / 2 + 4, width, height, 8);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#0f172a';
    [-width / 2 - 2, width / 2 - 4].forEach(wx => {
      ctx.fillRect(wx, -height / 2 + 12, 6, 16);
      ctx.fillRect(wx, height / 2 - 26, 6, 16);
    });

    // Main Chassis
    ctx.fillStyle = color;
    this.drawRoundRect(ctx, -width / 2, -height / 2, width, height, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Windshield & Rear glass
    ctx.fillStyle = '#0f172a';
    this.drawRoundRect(ctx, -width / 2 + 4, -height / 2 + 18, width - 8, 14, 3);
    ctx.fill();

    this.drawRoundRect(ctx, -width / 2 + 5, height / 2 - 24, width - 10, 10, 3);
    ctx.fill();

    // Roof section
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(-width / 2 + 6, -height / 2 + 32, width - 12, height - 58);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-width / 2 + 4, -height / 2 + 1, 8, 4);
    ctx.fillRect(width / 2 - 12, -height / 2 + 1, 8, 4);

    // Taillights
    ctx.fillStyle = brakeLights ? '#ef4444' : '#991b1b';
    ctx.fillRect(-width / 2 + 4, height / 2 - 4, 8, 4);
    ctx.fillRect(width / 2 - 12, height / 2 - 4, 8, 4);

    if (brakeLights) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-width / 2 + 4, height / 2 - 4, 8, 4);
      ctx.fillRect(width / 2 - 12, height / 2 - 4, 8, 4);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  renderSubjectCar(ctx, x, y) {
    const car = this.playerCar;
    ctx.save();
    ctx.translate(x, y);
    if (car.angle !== 0) ctx.rotate(car.angle);

    const w = car.width;
    const h = car.height;

    // 1. Headlight Cones casting onto road
    if (this.currentSpeed > 0 || !car.damaged) {
      const lightGrad = ctx.createRadialGradient(0, -h / 2, 10, 0, -h / 2 - 140, 90);
      lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      lightGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 6, -h / 2);
      ctx.lineTo(-w / 2 - 45, -h / 2 - 140);
      ctx.lineTo(w / 2 + 45, -h / 2 - 140);
      ctx.lineTo(w / 2 - 6, -h / 2);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Car Chassis Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.drawRoundRect(ctx, -w / 2 + 2, -h / 2 + 4, w, h, 9);
    ctx.fill();

    // 3. Wheels
    ctx.fillStyle = '#090d16';
    [-w / 2 - 3, w / 2 - 3].forEach(wx => {
      ctx.fillRect(wx, -h / 2 + 14, 6, 18);
      ctx.fillRect(wx, h / 2 - 28, 6, 18);
    });

    // 4. Metallic Deep Blue Subject Car Body
    const bodyGrad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    bodyGrad.addColorStop(0, '#0369a1');
    bodyGrad.addColorStop(0.4, '#0284c7');
    bodyGrad.addColorStop(1, '#0369a1');

    ctx.fillStyle = bodyGrad;
    this.drawRoundRect(ctx, -w / 2, -h / 2, w, h, 9);
    ctx.fill();

    // Damaged Front Bumper Crumple effect
    if (car.damaged) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 6, -h / 2);
      ctx.lineTo(0, -h / 2 + car.crumpleAmount);
      ctx.lineTo(w / 2 - 6, -h / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 5. Cabin Glass
    ctx.fillStyle = '#08101e';
    this.drawRoundRect(ctx, -w / 2 + 4, -h / 2 + 20, w - 8, 16, 4);
    ctx.fill();

    this.drawRoundRect(ctx, -w / 2 + 5, h / 2 - 26, w - 10, 12, 3);
    ctx.fill();

    // 6. Roof Mounted Sensor Array Node
    ctx.fillStyle = '#0f172a';
    this.drawRoundRect(ctx, -10, -8, 20, 16, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();

    // Blinking Sensor Heartbeat Beacon
    const blink = (Math.sin(performance.now() / 120) + 1) / 2;
    ctx.fillStyle = car.damaged
      ? `rgba(239, 68, 68, ${0.5 + blink * 0.5})`
      : `rgba(16, 185, 129, ${0.6 + blink * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (!car.damaged) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 - blink * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 7 + blink * 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 7. Headlights
    ctx.fillStyle = '#e0f2fe';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(-w / 2 + 4, -h / 2 + 1, 9, 4);
    ctx.fillRect(w / 2 - 13, -h / 2 + 1, 9, 4);
    ctx.shadowBlur = 0;

    // 8. Taillights & Brake/Hazard flashers
    const isHazardBlink = car.hazardLights && (Math.floor(performance.now() / 250) % 2 === 0);

    if (isHazardBlink) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-w / 2 + 2, -h / 2 + 2, 6, 4);
      ctx.fillRect(w / 2 - 8, -h / 2 + 2, 6, 4);
      ctx.fillRect(-w / 2 + 2, h / 2 - 6, 6, 4);
      ctx.fillRect(w / 2 - 8, h / 2 - 6, 6, 4);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = car.brakeLights || car.damaged ? '#ef4444' : '#b91c1c';
      if (car.brakeLights || car.damaged) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
      }
      ctx.fillRect(-w / 2 + 4, h / 2 - 5, 8, 4);
      ctx.fillRect(w / 2 - 12, h / 2 - 5, 8, 4);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

// Global simulation singleton instance
window.roadSim = new RoadSimulation('simulation-canvas');
