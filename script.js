document.addEventListener('DOMContentLoaded', () => {

  // 0.0 FORCE TOP ON LOAD
  window.history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  // 0. SMOOTH SCROLL (Lenis)
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  function raf(time) {
    lenis.raf(time);

    // 0.1.1 PARALLAX UPDATE
    document.querySelectorAll('[data-speed]').forEach(el => {
      const speed = el.getAttribute('data-speed');
      const y = window.scrollY * speed;
      el.style.transform = `translateY(${y}px)`;
    });

    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // 0.1 3D BACKGROUND (Three.js)
  const initThree = () => {
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 6500; // More stars
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const material = new THREE.PointsMaterial({
      size: 0.007,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    camera.position.z = 2;

    // Color Transition Logic for Background
    const sectionColors = {
      'home': new THREE.Color(0xffffff),         // Branco/Normal
      'skills': new THREE.Color(0xa855f7),       // Roxo/Neon
      'terminal-section': new THREE.Color(0x10b981), // Verde/Terminal
      'projects': new THREE.Color(0xf97316),     // Laranja
      'contact': new THREE.Color(0x06b6d4)       // Ciano
    };
    let targetBgColor = sectionColors['home'];

    const bgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Altera a cor alvo se a seção está visível na tela
        if (entry.isIntersecting && sectionColors[entry.target.id]) {
          targetBgColor = sectionColors[entry.target.id];
        }
      });
    }, { threshold: 0.5 }); // Reage quando 50% da seção estiver na tela

    document.querySelectorAll('section').forEach(sec => bgObserver.observe(sec));

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth color transition
      material.color.lerp(targetBgColor, 0.05);

      // Idle rotation
      particlesMesh.rotation.y += 0.0002;

      // Mouse reaction
      const targetX = (mouseX - window.innerWidth / 2) * 0.0001;
      const targetY = (mouseY - window.innerHeight / 2) * 0.0001;
      particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
      particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

      // Scroll reaction & Supernova Warp
      if (warpSpeed > 0.001) {
        warpSpeed *= 0.95; // decay
        particlesMesh.position.z += warpSpeed;

        // Lens FOV Warp Effect
        camera.fov = 75 + (warpSpeed * 100);
        camera.updateProjectionMatrix();
      } else {
        const scrollSpeed = window.scrollY * 0.0005;
        particlesMesh.position.z = scrollSpeed;

        // Restore FOV smoothly
        if (camera.fov > 75.1) {
          camera.fov += (75 - camera.fov) * 0.1;
          camera.updateProjectionMatrix();
        } else if (camera.fov !== 75) {
          camera.fov = 75;
          camera.updateProjectionMatrix();
        }
      }

      if (particlesMesh.position.z > 5) {
        particlesMesh.position.z %= 5;
      }

      renderer.render(scene, camera);
    };

    let warpSpeed = 0;
    document.addEventListener('supernova', () => {
      warpSpeed = 0.5;
    });
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };
  initThree();

  // 0.2 LIVING INTERFACE STATE
  const progressTrack = document.createElement('div');
  progressTrack.className = 'scroll-progress';
  progressTrack.setAttribute('aria-hidden', 'true');

  const progressBar = document.createElement('span');
  progressBar.className = 'scroll-progress__bar';
  progressTrack.appendChild(progressBar);
  document.body.prepend(progressTrack);

  const ambientPalette = {
    home: '255, 255, 255',
    skills: '168, 85, 247',
    'terminal-section': '16, 185, 129',
    projects: '249, 115, 22',
    contact: '6, 182, 212'
  };

  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('main section[id]');
  const sectionVisibility = new Map();

  const setAmbientSection = (id = 'home') => {
    const color = ambientPalette[id] || ambientPalette.home;
    root.style.setProperty('--section-rgb', color);
    document.body.dataset.section = id;

    pageSections.forEach(section => {
      section.classList.toggle('is-current', section.id === id);
    });

    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  };

  setAmbientSection('home');

  const sectionStateObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      sectionVisibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
    });

    let activeId = 'home';
    let activeRatio = 0;
    sectionVisibility.forEach((ratio, id) => {
      if (ratio > activeRatio) {
        activeRatio = ratio;
        activeId = id;
      }
    });

    setAmbientSection(activeId);
  }, { threshold: [0.2, 0.35, 0.5, 0.7] });

  pageSections.forEach(section => {
    sectionVisibility.set(section.id, 0);
    sectionStateObserver.observe(section);
  });

  const updateScrollProgress = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    progressBar.style.transform = `scaleX(${progress})`;
  };

  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);

  let pointerFrame = null;
  document.addEventListener('mousemove', (e) => {
    if (prefersReducedMotion) return;
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      root.style.setProperty('--cursor-x', `${e.clientX}px`);
      root.style.setProperty('--cursor-y', `${e.clientY}px`);
      pointerFrame = null;
    });
  }, { passive: true });

  // 1. SOUND SYSTEM (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let isMuted = true; // default muted as requested

  // Improved playSound with ADSR envelope and optional filter for softer, sophisticated sounds
  const playSound = ({
    freq = 440,
    type = 'sine',
    duration = 0.12,
    volume = 0.06,
    attack = 0.005,
    decay = 0.08,
    sustain = 0.6,
    release = 0.12,
    filterFreq = null,
    detune = 0
  } = {}) => {
    if (isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (detune) osc.detune.setValueAtTime(detune, now);

    const gain = audioCtx.createGain();
    const finalGain = audioCtx.createGain();

    // Filter for timbre shaping
    let filter = null;
    if (filterFreq) {
      filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
    }

    // ADSR envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    // release scheduled when stopping

    finalGain.gain.setValueAtTime(1, now);

    // routing: osc -> gain -> (filter?) -> finalGain -> destination
    osc.connect(gain);
    if (filter) gain.connect(filter), filter.connect(finalGain);
    else gain.connect(finalGain);
    finalGain.connect(audioCtx.destination);

    osc.start(now);
    const stopTime = now + duration + release;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(volume * sustain, now + duration);
    gain.gain.linearRampToValueAtTime(0.0001, stopTime);
    osc.stop(stopTime + 0.02);
  };

  // Helper sounds with softer character
  const playSoftClick = () => {
    playTypingSound({ volume: 0.03, duration: 0.06, filterFreq: 3200 });
  };

  const playChime = (base = 520) => {
    // Use a short typing sequence to emulate soft confirmation
    playTypingSequence(2, 90);
  };

  const playSuccess = () => {
    // Longer typing-like confirmation
    playTypingSequence(4, 80);
  };

  const playError = () => {
    // Lower, muted typing-like sound for error
    playTypingSound({ volume: 0.035, duration: 0.09, filterFreq: 900 });
  };

  const playSupernova = () => {
    // layered subtle swell instead of harsh rumble
    playSound({ freq: 90, type: 'sine', duration: 1.2, volume: 0.07, attack: 0.08, decay: 0.4, sustain: 0.5, release: 0.6, filterFreq: 400 });
    setTimeout(() => playSound({ freq: 520, type: 'sine', duration: 1.0, volume: 0.03, attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.4, filterFreq: 2500 }), 150);
  };

  // Typing sound implementation (noise + small click) for a sophisticated keyboard feel
  let _noiseBuffer = null;
  const _createNoiseBuffer = () => {
    const sampleRate = audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, sampleRate * 1, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    return buffer;
  };

  const playTypingSound = ({ volume = 0.03, duration = 0.06, filterFreq = 3000 } = {}) => {
    if (isMuted) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    if (!_noiseBuffer) _noiseBuffer = _createNoiseBuffer();

    // Noise burst
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = _noiseBuffer;
    noiseSource.playbackRate.setValueAtTime(1 + (Math.random() - 0.5) * 0.1, now);

    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(filterFreq + (Math.random() - 0.5) * 400, now);
    bp.Q.setValueAtTime(1.5, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.01);

    noiseSource.connect(bp);
    bp.connect(gain);
    gain.connect(audioCtx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration + 0.02);

    // Tiny oscillator click to add a musical character
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 300, now);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.01);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  const playTypingSequence = (count = 3, gap = 90) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => playTypingSound({ volume: 0.03, duration: 0.06, filterFreq: 2600 + Math.random() * 1200 }), i * gap + Math.random() * 30);
    }
  };

  const muteToggle = document.getElementById('muteToggle');
  // initialize mute icon to muted by default
  if (muteToggle && muteToggle.querySelector('.mute-icon')) muteToggle.querySelector('.mute-icon').textContent = '🔇';
  muteToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    muteToggle.querySelector('.mute-icon').textContent = isMuted ? '🔇' : '🔊';
    // only play a soft click when unmuting
    if (!isMuted) playSoftClick();
  });

  // 2. LANGUAGE SYSTEM & SCRAMBLE EFFECT
  let currentLang = 'PT';
  const langToggle = document.getElementById('langToggle');

  const scrambleText = (el, targetText) => {
    let iterations = 0;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}_+*#&@!$";
    const interval = setInterval(() => {
      el.innerText = targetText.split("").map((letter, index) => {
        if (index < iterations) return targetText[index];
        return letters[Math.floor(Math.random() * letters.length)];
      }).join("");

      if (iterations >= targetText.length) clearInterval(interval);
      iterations += 1 / 3;
    }, 30);
  };

  const updateLanguage = () => {
    const elements = document.querySelectorAll('[data-en]');
    elements.forEach(el => {
      const targetText = currentLang === 'EN' ? el.getAttribute('data-en') : el.getAttribute('data-pt');
      scrambleText(el, targetText);
    });
  };

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'PT' ? 'EN' : 'PT';
    langToggle.textContent = currentLang;
    updateLanguage();
    playChime(600);
  });

  // 3. PRE-LOADER LOGIC
  const preloader = document.getElementById('preloader');
  const bar = document.querySelector('.preloader-bar');
  const percent = document.querySelector('.status-percent');
  const supernova = document.getElementById('supernova');
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 30 + 10; // Load faster
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;
    percent.textContent = `${Math.floor(progress)}%`;

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('loaded');
        document.body.classList.add('is-loaded');

        // Supernova effect
        if (supernova) {
          supernova.classList.add('explode');
          document.body.classList.add('supernova-active');
          document.dispatchEvent(new Event('supernova'));

          // Subtle layered supernova sound
          playSupernova();
        } else {
          playChime(800);
        }
      }, 100); // Reduced delay before triggering supernova
    }
  }, 220); // Faster interval

  // 4. CUSTOM CURSOR & CONTEXTUAL LABELS
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  const cursorLabel = cursor.querySelector('.cursor-label');
  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = `${mx}px`;
    cursor.style.top = `${my}px`;
  });

  const follow = () => {
    fx += (mx - fx) * 0.1;
    fy += (my - fy) * 0.1;
    follower.style.left = `${fx}px`;
    follower.style.top = `${fy}px`;
    requestAnimationFrame(follow);
  };
  follow();

  // Contextual Cursor
  const setCursor = (label) => {
    if (label) {
      cursor.classList.add('has-label');
      cursorLabel.textContent = label;
    } else {
      cursor.classList.remove('has-label');
      cursorLabel.textContent = '';
    }
  };

  // 5. MOUSE TRAIL / PARTICLES
  const createParticle = (x, y, options = {}) => {
    const p = document.createElement('div');
    p.className = 'particle';
    if (options.burst) p.classList.add('burst');

    const size = options.size || Math.random() * 4 + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = options.color || (Math.random() > 0.5 ? 'rgba(var(--section-rgb), 0.95)' : 'var(--secondary)');

    if (options.burst) {
      p.style.setProperty('--tx', `${options.tx}px`);
      p.style.setProperty('--ty', `${options.ty}px`);
    }

    document.body.appendChild(p);

    setTimeout(() => p.remove(), options.burst ? 800 : 1000);
  };

  document.addEventListener('mousemove', (e) => {
    if (prefersReducedMotion || !hasFinePointer) return;
    if (Math.random() > 0.9) createParticle(e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (prefersReducedMotion || !hasFinePointer) return;

    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.35;
      const distance = 24 + Math.random() * 42;
      createParticle(e.clientX, e.clientY, {
        burst: true,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        size: Math.random() * 3 + 2,
        color: i % 2 === 0 ? 'rgba(var(--section-rgb), 0.95)' : 'var(--primary)'
      });
    }
  });

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      el.style.setProperty('--magnet-x', `${x}px`);
      el.style.setProperty('--magnet-y', `${y}px`);

      if (!prefersReducedMotion && hasFinePointer) {
        const moveX = (x - rect.width / 2) * 0.08;
        const moveY = (y - rect.height / 2) * 0.12;
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.setProperty('--magnet-x', '50%');
      el.style.setProperty('--magnet-y', '50%');
    });
  });

  // 6. 3D TILT EFFECT
  const tiltElements = document.querySelectorAll('.skill-card, .project-slide, .contact-card, .terminal');
  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xc = rect.width / 2;
      const yc = rect.height / 2;

      const dx = x - xc;
      const dy = y - yc;

      el.style.transform = `perspective(1000px) rotateY(${dx / 45}deg) rotateX(${-dy / 45}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
    });
  });

  // Interaction Events
  document.querySelectorAll('a, button, .skill-card, .project-slide, .terminal').forEach(el => {
    el.addEventListener('mouseenter', () => {
      follower.classList.add('hover');
      playSoftClick();

      if (el.tagName === 'A' || el.tagName === 'BUTTON') {
        setCursor('CLICK');
        if (el.classList.contains('nav-link') || el.classList.contains('section-title')) {
          scrambleText(el, el.innerText);
        }
      }
      if (el.classList.contains('project-slide')) {
        setCursor('VIEW');
        playChime(420);
      }
      if (el.classList.contains('terminal')) setCursor('TYPE');
    });

    el.addEventListener('mouseleave', () => {
      follower.classList.remove('hover');
      setCursor(null);
    });

    el.addEventListener('click', () => {
      playSoftClick();
    });
  });

  // 7. TERMINAL LOGIC
  const terminalInput = document.getElementById('terminalInput');
  const terminalBody = document.getElementById('terminalBody');

  const commands = {
    help: () => 'Available commands: help, whoami, skills, contact, clear',
    whoami: () => 'João Pedro - Frontend Developer Junior specializing in immersive UI.',
    skills: () => 'HTML5, CSS3, JS (ES6+), React, Next.js, Python, Git.',
    contact: () => 'Instagram: @peres_menese | WhatsApp: (19) 99890-0045',
    clear: () => {
      terminalBody.innerHTML = '';
      return '';
    }
  };

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = terminalInput.value.toLowerCase().trim();
      const response = commands[input] ? commands[input]() : `Command not found: ${input}. Type 'help' for assistance.`;

      const inputLine = document.createElement('div');
      inputLine.className = 'terminal-line';
      inputLine.innerHTML = `<span class="terminal-prompt">meneses@os:~$</span> ${input}`;
      terminalBody.insertBefore(inputLine, terminalInput.parentElement);

      if (response) {
        const responseLine = document.createElement('div');
        responseLine.className = 'terminal-line';
        responseLine.textContent = response;
        terminalBody.insertBefore(responseLine, terminalInput.parentElement);
      }

      terminalInput.value = '';
      terminalBody.scrollTop = terminalBody.scrollHeight;
      playSoftClick();
    }
  });

  // 8. PARALLAX
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    const spheres = document.querySelectorAll('.hero-glow-1, .hero-glow-2, .tech-sphere');
    spheres.forEach((sphere, index) => {
      const speed = (index + 1) * 15;
      sphere.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });

    const grid = document.querySelector('.grid-bg');
    if (grid) grid.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
  });

  // 9. REVEAL & PROJECTS CAROUSEL (Existing)
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');

        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => {
          entry.target.style.transitionDelay = '';
          revealObserver.unobserve(entry.target);
        }, delay * 1000 + 1300);

        if (entry.target.classList.contains('skill-card')) {
          const progress = entry.target.querySelector('.skill-progress');
          if (progress) {
            const targetWidth = progress.style.width;
            progress.style.width = '0';
            setTimeout(() => progress.style.width = targetWidth, 100);
          }
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    const delay = Number(el.dataset.delay || 0);
    if (delay) el.style.transitionDelay = `${delay}s`;
    revealObserver.observe(el);
  });

  const carousel = document.getElementById('projectCarousel');
  const slides = document.querySelectorAll('.project-slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const indicatorsContainer = document.getElementById('carouselIndicators');
  const carouselNav = document.querySelector('.carousel-nav');

  // Dynamically generate dots based on the actual number of slides
  if (indicatorsContainer) {
    indicatorsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (index === 0 ? ' active' : '');
      indicatorsContainer.appendChild(dot);
    });
  }

  // Hide nav buttons and dots if there is only 1 slide, but keep it visible if there are more
  if (slides.length <= 1) {
    if (carouselNav) carouselNav.style.display = 'none';
  } else {
    if (carouselNav) carouselNav.style.display = 'flex';
  }

  const dots = document.querySelectorAll('.carousel-indicators .dot');

  let currentSlide = 0;
  const updateCarousel = () => {
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
  };

  // Initialize carousel state immediately
  updateCarousel();

  if (slides.length > 1) {
    nextBtn.addEventListener('click', () => { currentSlide = (currentSlide + 1) % slides.length; updateCarousel(); });
    prevBtn.addEventListener('click', () => { currentSlide = (currentSlide - 1 + slides.length) % slides.length; updateCarousel(); });
    dots.forEach((dot, index) => dot.addEventListener('click', () => { currentSlide = index; updateCarousel(); }));

    // Auto-play
    let autoPlayInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      updateCarousel();
    }, 2000);

    // Reset timer on manual interaction
    const resetTimer = () => {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateCarousel();
      }, 4000);
    };

    [nextBtn, prevBtn].forEach(btn => btn.addEventListener('click', resetTimer));
    dots.forEach(dot => dot.addEventListener('click', resetTimer));
  }

  const header = document.getElementById('header');
  // 10. SCROLL HEADER STATE
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 11. FORM SUBMISSION (AJAX)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      contactForm.classList.add('is-submitting');
      contactForm.classList.remove('is-error');

      const formData = new FormData(contactForm);

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          contactForm.classList.remove('is-submitting');
          contactForm.classList.add('is-success');
          contactForm.reset();
          
          // Efeitos Sonoros de Sucesso
          playSuccess();
        } else {
          throw new Error('Falha no envio');
        }
      } catch (error) {
        contactForm.classList.remove('is-submitting');
        contactForm.classList.add('is-error');
        playError(); // Som de erro
      }
    });
  }

});
