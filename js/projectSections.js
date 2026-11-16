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

    const blockMcu = document.getElementById('arch-block-mcu');
    const blockSensors = document.getElementById('arch-block-sensors');
    const blockGsm = document.getElementById('arch-block-gsm');
    const blockBuzzer = document.getElementById('arch-block-buzzer');
    const blockServices = document.getElementById('arch-block-services');

    if (blockMcu) {
      if (isAccident) {
        blockMcu.classList.add('arch-block-alert');
        const st = document.getElementById('arch-status-mcu');
        if (st) st.textContent = 'COLLISION CONFIRMED';
      } else {
        blockMcu.classList.remove('arch-block-alert');
        const st = document.getElementById('arch-status-mcu');
        if (st) st.textContent = 'ACTIVE (100Hz)';
      }
    }

    if (blockSensors) {
      if (isAccident) {
        blockSensors.classList.add('arch-block-alert');
        const st = document.getElementById('arch-status-sensors');
        if (st) st.textContent = 'THRESHOLD BREACHED';
      } else {
        blockSensors.classList.remove('arch-block-alert');
        const st = document.getElementById('arch-status-sensors');
        if (st) st.textContent = 'SAMPLING OK';
      }
    }

    if (blockGsm) {
      if (isAccident) {
        blockGsm.classList.add('arch-block-alert');
        const st = document.getElementById('arch-status-gsm');
        if (st) st.textContent = 'TRANSMITTING SMS';
      } else {
        blockGsm.classList.remove('arch-block-alert');
        const st = document.getElementById('arch-status-gsm');
        if (st) st.textContent = 'NETWORK STANDBY';
      }
    }

    if (blockBuzzer) {
      if (isAccident) {
        blockBuzzer.classList.add('arch-block-alert');
        const st = document.getElementById('arch-status-buzzer');
        if (st) st.textContent = 'SIREN SOUNDING';
      } else {
        blockBuzzer.classList.remove('arch-block-alert');
        const st = document.getElementById('arch-status-buzzer');
        if (st) st.textContent = 'STANDBY';
      }
    }

    if (blockServices) {
      if (isAccident) {
        blockServices.classList.add('arch-block-alert');
        const st = document.getElementById('arch-status-services');
        if (st) st.textContent = 'DISPATCH INITIATED';
      } else {
        blockServices.classList.remove('arch-block-alert');
        const st = document.getElementById('arch-status-services');
        if (st) st.textContent = 'MONITORING';
      }
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
