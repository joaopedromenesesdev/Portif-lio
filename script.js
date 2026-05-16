document.addEventListener('DOMContentLoaded', () => {
  
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
    const particlesCount = 3000; // More stars
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

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Idle rotation
      particlesMesh.rotation.y += 0.0002;
      
      // Mouse reaction
      const targetX = (mouseX - window.innerWidth / 2) * 0.0001;
      const targetY = (mouseY - window.innerHeight / 2) * 0.0001;
      particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
      particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

      // Scroll reaction (Space Warp effect)
      const scrollSpeed = window.scrollY * 0.0005;
      particlesMesh.position.z = scrollSpeed;
      if (particlesMesh.position.z > 5) {
          particlesMesh.position.z = 0;
      }

      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };
  initThree();

  // 1. SOUND SYSTEM (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let isMuted = false;

  const playSound = (freq, type = 'sine', duration = 0.1, vol = 0.1) => {
    if (isMuted) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  const muteToggle = document.getElementById('muteToggle');
  muteToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    muteToggle.querySelector('.mute-icon').textContent = isMuted ? '🔇' : '🔊';
    playSound(isMuted ? 200 : 400, 'square');
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
    playSound(600, 'sine', 0.05);
  });

  // 3. PRE-LOADER LOGIC
  const preloader = document.getElementById('preloader');
  const bar = document.querySelector('.preloader-bar');
  const percent = document.querySelector('.status-percent');
  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;
    percent.textContent = `${Math.floor(progress)}%`;

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('loaded');
        playSound(800, 'triangle', 0.5, 0.05);
      }, 500);
    }
  }, 150);

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
  const createParticle = (x, y) => {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = Math.random() > 0.5 ? 'var(--primary)' : 'var(--secondary)';
    document.body.appendChild(p);

    setTimeout(() => p.remove(), 1000);
  };

  document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.9) createParticle(e.clientX, e.clientY);
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
      playSound(1200, 'sine', 0.02, 0.01);

      if (el.tagName === 'A' || el.tagName === 'BUTTON') {
        setCursor('CLICK');
        if (el.classList.contains('nav-link') || el.classList.contains('section-title')) {
           scrambleText(el, el.innerText);
        }
      }
      if (el.classList.contains('project-slide')) {
        setCursor('VIEW');
        playSound(400, 'triangle', 0.1, 0.02);
      }
      if (el.classList.contains('terminal')) setCursor('TYPE');
    });

    el.addEventListener('mouseleave', () => {
      follower.classList.remove('hover');
      setCursor(null);
    });

    el.addEventListener('click', () => {
      playSound(400, 'square', 0.1, 0.05);
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
      playSound(300, 'sine', 0.05);
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

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const carousel = document.getElementById('projectCarousel');
  const slides = document.querySelectorAll('.project-slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dots = document.querySelectorAll('.carousel-indicators .dot');

  let currentSlide = 0;
  const updateCarousel = () => {
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
  };

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

  const header = document.getElementById('header');
  // 10. SCROLL HEADER STATE
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

});
