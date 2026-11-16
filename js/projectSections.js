/**
 * Vehicle Accident Detection and Alert System
 * projectSections.js - Interactive Tabs, Component State Sync,
 * Live Process Highlights, and Dynamic Circuit Wiring Animation
 */

class ProjectSectionsManager {
  constructor() {
    this.currentTab = 'abstract';
    this.initTabs();
    this.initCircuitInteractiveTooltips();
  }

  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`tab-${targetTab}`);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });

    // Copy Arduino Code Button
    const btnCopy = document.getElementById('btn-copy-code');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const codeEl = document.getElementById('arduino-code-block');
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent).then(() => {
            const originalText = btnCopy.textContent;
            btnCopy.textContent = '✓ Code Copied!';
            btnCopy.classList.add('btn-copied');
            setTimeout(() => {
              btnCopy.textContent = originalText;
              btnCopy.classList.remove('btn-copied');
            }, 2500);
          }).catch(err => {
            console.error('Copy failed:', err);
          });
        }
      });
    }
  }

  initCircuitInteractiveTooltips() {
    // Add interactive hover effects to schematic pins
    const pins = document.querySelectorAll('.circuit-pin');
    pins.forEach(pin => {
      pin.addEventListener('mouseenter', () => {
        const wireId = pin.getAttribute('data-wire');
        if (wireId) {
          const wire = document.getElementById(wireId);
          if (wire) wire.classList.add('wire-highlight');
        }
      });
      pin.addEventListener('mouseleave', () => {
        const wireId = pin.getAttribute('data-wire');
        if (wireId) {
          const wire = document.getElementById(wireId);
          if (wire) wire.classList.remove('wire-highlight');
        }
      });
    });
  }

  /**
   * Called by app.js when simulation state changes (Normal, Collision, Alarm, Reset)
   */
  updateLiveState(stateName, details = {}) {
    this.updateProcessSteps(stateName, details);
    this.updateComponentCards(stateName, details);
    this.updateArchitectureBlocks(stateName, details);
    this.updateCircuitWires(stateName, details);
  }

  updateProcessSteps(stateName, details) {
    const colAccident = document.getElementById('process-col-accident');
    const colCancel = document.getElementById('process-col-cancel');
    const colSos = document.getElementById('process-col-sos');

    // Reset all step states
    document.querySelectorAll('.proc-step').forEach(s => {
      s.classList.remove('step-active', 'step-completed', 'step-alert');
    });

    if (stateName === 'cruising' || stateName === 'normal') {
      this.setStep('acc-step-1', 'step-active');
    } else if (stateName === 'braking' || stateName === 'collision_imminent') {
      this.setStep('acc-step-1', 'step-completed');
      this.setStep('acc-step-2', 'step-alert');
    } else if (stateName === 'impact' || stateName === 'accident_confirmed') {
      this.setStep('acc-step-1', 'step-completed');
      this.setStep('acc-step-2', 'step-completed');
      this.setStep('acc-step-3', 'step-completed');
      this.setStep('acc-step-4', 'step-completed');
      this.setStep('acc-step-5', 'step-completed');
      this.setStep('acc-step-6', 'step-completed');
      this.setStep('acc-step-7', 'step-completed');
      this.setStep('acc-step-8', 'step-alert');
    } else if (stateName === 'cancelled') {
      this.setStep('can-step-1', 'step-completed');
      this.setStep('can-step-2', 'step-completed');
      this.setStep('can-step-3', 'step-completed');
      this.setStep('can-step-4', 'step-alert');
      this.setStep('can-step-5', 'step-active');
    } else if (stateName === 'manual_sos') {
      this.setStep('sos-step-1', 'step-completed');
      this.setStep('sos-step-2', 'step-completed');
      this.setStep('sos-step-3', 'step-completed');
      this.setStep('sos-step-4', 'step-alert');
      this.setStep('sos-step-5', 'step-active');
    }
  }

  setStep(id, className) {
    const el = document.getElementById(id);
    if (el) el.classList.add(className);
  }

  updateComponentCards(stateName, details) {
    const isAccident = (stateName === 'impact' || stateName === 'accident_confirmed' || stateName === 'manual_sos');

    // Badge 2: MPU-6050
    const badgeMpu = document.getElementById('card-badge-mpu');
    if (badgeMpu) {
      if (isAccident) {
        badgeMpu.textContent = 'SPIKE DETECTED (8.4G)';
        badgeMpu.className = 'comp-pill pill-alert';
      } else {
        badgeMpu.textContent = 'MONITORING (1.0G)';
        badgeMpu.className = 'comp-pill pill-normal';
      }
    }

    // Badge 3: SW-420
    const badgeVibe = document.getElementById('card-badge-vibe');
    if (badgeVibe) {
      if (isAccident) {
        badgeVibe.textContent = 'IMPACT TRIGGERED (96%)';
        badgeVibe.className = 'comp-pill pill-alert';
      } else {
        badgeVibe.textContent = 'NORMAL (14%)';
        badgeVibe.className = 'comp-pill pill-normal';
      }
    }

    // Badge 4: GPS
    const badgeGps = document.getElementById('card-badge-gps');
    if (badgeGps) {
      if (isAccident) {
        badgeGps.textContent = 'COORDS LOCKED (13.0827N)';
        badgeGps.className = 'comp-pill pill-amber';
      } else {
        badgeGps.textContent = '3D FIX (9 SATS)';
        badgeGps.className = 'comp-pill pill-normal';
      }
    }

    // Badge 5: GSM
    const badgeGsm = document.getElementById('card-badge-gsm');
    if (badgeGsm) {
      if (isAccident) {
        badgeGsm.textContent = 'SMS TRANSMITTED OK';
        badgeGsm.className = 'comp-pill pill-alert';
      } else {
        badgeGsm.textContent = 'SIM800L READY';
        badgeGsm.className = 'comp-pill pill-normal';
      }
    }

    // Badge 6: Buzzer
    const badgeBuzzer = document.getElementById('card-badge-buzzer');
    if (badgeBuzzer) {
      if (isAccident) {
        badgeBuzzer.textContent = 'SIREN ACTIVE (880Hz)';
        badgeBuzzer.className = 'comp-pill pill-alert';
      } else {
        badgeBuzzer.textContent = 'STANDBY (OFF)';
        badgeBuzzer.className = 'comp-pill pill-normal';
      }
    }

    // Badge 7: LEDs
    const badgeLeds = document.getElementById('card-badge-leds');
    if (badgeLeds) {
      if (isAccident) {
        badgeLeds.textContent = 'GREEN: OFF • RED: FLASHING';
        badgeLeds.className = 'comp-pill pill-alert';
      } else {
        badgeLeds.textContent = 'GREEN: ON • RED: OFF';
        badgeLeds.className = 'comp-pill pill-normal';
      }
    }
  }

  updateArchitectureBlocks(stateName, details) {
    const isAccident = (stateName === 'impact' || stateName === 'accident_confirmed' || stateName === 'manual_sos');
    const isCancelled = (stateName === 'cancelled');

    const setNodeState = (nodeId, statusId, isAlert, text) => {
      const node = document.getElementById(nodeId);
      const st = document.getElementById(statusId);
      if (node) {
        if (isAlert) node.classList.add('node-alert');
        else node.classList.remove('node-alert');
      }
      if (st && text) {
        st.textContent = text;
      }
    };

    if (isAccident) {
      setNodeState('node-mcu', 'arch-status-mcu', true, 'COLLISION CONFIRMED');
      setNodeState('node-mpu', 'arch-status-mpu', true, 'IMPACT SPIKE (8.4G)');
      setNodeState('node-vibe', 'arch-status-vibe', true, 'SHOCK TRIGGER (96%)');
      setNodeState('node-gps', 'arch-status-gps', false, 'COORDS LOCKED (13.0827°N)');
      setNodeState('node-gsm', 'arch-status-gsm', true, 'SMS TRANSMITTED OK');
      setNodeState('node-network', 'arch-status-network', true, 'DISPATCH INITIATED (108)');
      setNodeState('node-buzzer', 'arch-status-buzzer', true, 'SIREN ACTIVE (880Hz)');
      setNodeState('node-leds', 'arch-status-leds', true, 'G: OFF • R: FLASHING');
      setNodeState('node-sos', 'arch-status-sos', stateName === 'manual_sos', stateName === 'manual_sos' ? 'PANIC OVERRIDE!' : 'ARMED (PULLUP)');
      
      // Highlight signal bus lines
      document.querySelectorAll('.arch-wire').forEach(w => w.classList.add('wire-alert'));
    } else if (isCancelled) {
      setNodeState('node-mcu', 'arch-status-mcu', false, 'CANCELLED (STANDBY)');
      setNodeState('node-mpu', 'arch-status-mpu', false, 'NORMAL (1.0G)');
      setNodeState('node-vibe', 'arch-status-vibe', false, 'NORMAL (14%)');
      setNodeState('node-gps', 'arch-status-gps', false, '3D FIX (9 SATS)');
      setNodeState('node-gsm', 'arch-status-gsm', false, 'TRANSMISSION HALTED');
      setNodeState('node-network', 'arch-status-network', false, 'STANDBY (NO ALARM)');
      setNodeState('node-buzzer', 'arch-status-buzzer', false, 'MUTED (OFF)');
      setNodeState('node-leds', 'arch-status-leds', false, 'G: ON • R: OFF');
      setNodeState('node-sos', 'arch-status-sos', false, 'ARMED (PULLUP)');

      document.querySelectorAll('.arch-wire').forEach(w => w.classList.remove('wire-alert'));
    } else {
      // Normal cruising or idle
      setNodeState('node-mcu', 'arch-status-mcu', false, 'ARMED / MONITORING');
      setNodeState('node-mpu', 'arch-status-mpu', false, 'NORMAL (1.0G)');
      setNodeState('node-vibe', 'arch-status-vibe', false, 'NORMAL (14%)');
      setNodeState('node-gps', 'arch-status-gps', false, '3D FIX (9 SATS)');
      setNodeState('node-gsm', 'arch-status-gsm', false, 'SIM800L READY');
      setNodeState('node-network', 'arch-status-network', false, 'STANDBY');
      setNodeState('node-buzzer', 'arch-status-buzzer', false, 'OFF');
      setNodeState('node-leds', 'arch-status-leds', false, 'G: ON • R: OFF');
      setNodeState('node-sos', 'arch-status-sos', false, 'ARMED (PULLUP)');
      setNodeState('node-power', 'arch-status-power', false, '12V / 5V ACTIVE');

      document.querySelectorAll('.arch-wire').forEach(w => w.classList.remove('wire-alert'));
    }
  }

  updateCircuitWires(stateName, details) {
    const isAccident = (stateName === 'impact' || stateName === 'accident_confirmed' || stateName === 'manual_sos');
    const svgCircuit = document.getElementById('circuit-svg');
    if (!svgCircuit) return;

    if (isAccident) {
      svgCircuit.classList.add('circuit-alert-mode');
    } else {
      svgCircuit.classList.remove('circuit-alert-mode');
    }
  }
}

// Global project sections manager singleton
window.projectSections = new ProjectSectionsManager();
