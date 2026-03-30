/* main.js — Consolidated JS for InstantAds
   - Popup show/hide with localStorage
   - Stagger reveal for cards
   - Horizontal grid wiring (services, process, about, case)
   - Testimonial slider with controls, dots, autoplay, swipe
   - Defensive: safe if elements are missing
*/

/* ---------- Popup logic ---------- */
(function initPopup() {
  const popup = document.getElementById('popupForm');
  const closeBtn = document.getElementById('popupClose');

  if (!popup) return;

  function showPopup() {
    popup.classList.add('show');
    popup.setAttribute('aria-hidden', 'false');
  }
  function hidePopup() {
    popup.classList.remove('show');
    popup.setAttribute('aria-hidden', 'true');
    try { localStorage.setItem('popupShown', 'true'); } catch (e) {}
  }

  if (closeBtn) closeBtn.addEventListener('click', hidePopup);
  popup.addEventListener('click', (e) => {
    if (e.target === popup) hidePopup();
  });

  // Show after delay if not shown before
  try {
    if (!localStorage.getItem('popupShown')) {
      setTimeout(showPopup, 8000);
    }
  } catch (e) {
    // localStorage may be blocked; still show popup once
    setTimeout(showPopup, 8000);
  }
})();

/* ---------- Stagger reveal for cards ---------- */
(function staggerReveal() {
  const groups = ['.about-card', '.service-box', '.process-box', '.case-box', '.testimonial-card'];
  groups.forEach(selector => {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach((node, i) => {
      // start slightly hidden for animation if not already set in CSS
      node.style.opacity = node.style.opacity || '0';
      node.style.transform = node.style.transform || 'translateY(12px)';
      setTimeout(() => {
        node.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease';
        node.style.opacity = '1';
        node.style.transform = 'translateY(0)';
      }, 120 + i * 90);
    });
  });
})();

/* ---------- Generic horizontal grid wiring (indicators + clickable dots) ---------- */
(function wireGrids() {
  /**
   * gridSelector: selector for the scroll container (e.g., '#serviceGrid')
   * indicatorSelector: selector for the indicator container (e.g., '#serviceIndicators' or '.about-indicators')
   * itemSelector: selector for items inside grid (e.g., '.service-box')
   */
  function wireGrid(gridSelector, indicatorSelector, itemSelector) {
    const grid = document.querySelector(gridSelector);
    const indicatorContainer = document.querySelector(indicatorSelector);
    if (!grid || !indicatorContainer) return;

    const items = grid.querySelectorAll(itemSelector);
    if (!items.length) return;

    // Ensure indicators match items count
    indicatorContainer.innerHTML = '';
    items.forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      indicatorContainer.appendChild(dot);
    });
    const indicators = Array.from(indicatorContainer.children);

    // compute card width + gap robustly
    function getCardWidth() {
      const style = getComputedStyle(grid);
      const gap = parseInt(style.gap || style.columnGap || 12, 10) || 12;
      return Math.round(items[0].offsetWidth + gap);
    }

    function updateActive() {
      const cardWidth = getCardWidth();
      const index = Math.round(grid.scrollLeft / cardWidth);
      indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    // scroll listener (throttled)
    let raf = null;
    grid.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActive);
    }, { passive: true });

    // clickable dots
    indicators.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const cardWidth = getCardWidth();
        grid.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
      });
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dot.click();
        }
      });
    });

    // initial update on load/resize
    window.addEventListener('load', updateActive);
    window.addEventListener('resize', updateActive);
  }

  // Wire the known grids (safe if some don't exist)
  wireGrid('#serviceGrid', '#serviceIndicators', '.service-box');
  wireGrid('#processGrid', '#processIndicators', '.process-box');
  wireGrid('#aboutRow', '.about-indicators', '.about-card');
  wireGrid('.case-grid', '.case-indicators', '.case-box'); // optional: add .case-indicators in HTML if desired
})();

/* ---------- Testimonial slider (controls, dots, autoplay, swipe) ---------- */
(function initTestimonialSlider() {
  const slider = document.querySelector('.testimonial-slider');
  if (!slider) return;

  // Create track and ensure structure
  const track = slider.querySelector('.testimonial-track');
  if (!track) return;

  const cards = Array.from(track.children);
  if (!cards.length) return;

  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'testimonial-controls';
  controls.style.display = 'flex';
  controls.style.justifyContent = 'center';
  controls.style.gap = '8px';
  controls.style.marginTop = '12px';

  // Prev / Next buttons
  const prevBtn = document.createElement('button');
  prevBtn.className = 'testimonial-prev';
  prevBtn.type = 'button';
  prevBtn.innerHTML = '&#9664;'; // left arrow
  prevBtn.setAttribute('aria-label', 'Previous testimonial');
  prevBtn.style.cursor = 'pointer';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'testimonial-next';
  nextBtn.type = 'button';
  nextBtn.innerHTML = '&#9654;'; // right arrow
  nextBtn.setAttribute('aria-label', 'Next testimonial');
  nextBtn.style.cursor = 'pointer';

  // Dots
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'testimonial-dots';
  dotsContainer.style.display = 'flex';
  dotsContainer.style.gap = '8px';
  dotsContainer.style.alignItems = 'center';

  // Append controls to slider (after track)
  controls.appendChild(prevBtn);
  controls.appendChild(dotsContainer);
  controls.appendChild(nextBtn);
  slider.appendChild(controls);

  // Build dots
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'testimonial-dot';
    d.type = 'button';
    d.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    d.style.width = '10px';
    d.style.height = '10px';
    d.style.borderRadius = '50%';
    d.style.border = 'none';
    d.style.background = i === 0 ? getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#22c55e' : '#666';
    d.style.cursor = 'pointer';
    d.style.padding = '0';
    dotsContainer.appendChild(d);

    d.addEventListener('click', () => {
      goTo(i);
      resetAutoplay();
    });
  });

  const dots = Array.from(dotsContainer.children);

  // State
  let index = 0;
  let autoplayInterval = 4500;
  let autoplayTimer = null;
  let isAnimating = false;

  function updateUI() {
    // compute offset to center first visible card
    const gap = parseInt(getComputedStyle(track).gap || 16, 10) || 16;
    const cardWidth = cards[0].offsetWidth + gap;
    const left = index * cardWidth;
    track.style.transform = `translateX(${-left}px)`;
    // update dots
    dots.forEach((d, i) => {
      d.style.background = i === index ? (getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#22c55e') : '#666';
    });
  }

  function goTo(i) {
    if (i < 0) i = 0;
    if (i >= cards.length) i = cards.length - 1;
    index = i;
    updateUI();
  }

  function next() {
    index = (index + 1) % cards.length;
    updateUI();
  }

  function prev() {
    index = (index - 1 + cards.length) % cards.length;
    updateUI();
  }

  prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });

  // Keyboard accessibility
  prevBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); prevBtn.click(); } });
  nextBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); } });

  // Autoplay
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      next();
    }, autoplayInterval);
  }
  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }
  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // Pause on hover/focus
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  slider.addEventListener('focusin', stopAutoplay);
  slider.addEventListener('focusout', startAutoplay);

  // Touch / swipe support
  (function addSwipe() {
    let startX = 0;
    let currentX = 0;
    let isDown = false;
    const threshold = 40; // px

    track.addEventListener('touchstart', (e) => {
      stopAutoplay();
      isDown = true;
      startX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      currentX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (!isDown) return;
      const diff = startX - currentX;
      if (Math.abs(diff) > threshold) {
        if (diff > 0) next(); else prev();
      }
      isDown = false;
      resetAutoplay();
    });
  })();

  // Resize handling: recalc transform to keep alignment
  window.addEventListener('resize', () => {
    // small timeout to allow layout to settle
    setTimeout(updateUI, 120);
  });

  // Initialize
  // ensure track has will-change for smoother transforms
  track.style.willChange = 'transform';
  track.style.transition = 'transform 450ms cubic-bezier(.2,.9,.2,1)';
  updateUI();
  startAutoplay();
})();

/* ---------- Optional: small helper to lazy-add aria-hidden to offscreen popup content ---------- */
(function ensureAriaHiddenForPopup() {
  const popup = document.getElementById('popupForm');
  if (!popup) return;
  // When popup is shown, set aria-hidden false; when hidden, true (already handled in popup logic)
  // This helper ensures the rest of the page is not hidden; left intentionally minimal.
})();

/* Recalc testimonial slider on load and after images load */
(function recalcTestimonialOnLoad() {
  window.addEventListener('load', () => {
    // trigger resize to force slider recalc
    window.dispatchEvent(new Event('resize'));
    // also wait for images to load then recalc
    const imgs = document.querySelectorAll('.testimonial-track img');
    let loaded = 0;
    if (!imgs.length) return;
    imgs.forEach(img => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener('load', () => {
          loaded++;
          if (loaded === imgs.length) window.dispatchEvent(new Event('resize'));
        });
      }
    });
    if (loaded === imgs.length) window.dispatchEvent(new Event('resize'));
  });
})();

/* Ensure footer contact is clickable if floating buttons overlap on small screens */
(function ensureFooterClickable() {
  const footer = document.querySelector('.footer');
  if (!footer) return;
  // add extra bottom padding if floating buttons exist
  const floats = document.querySelectorAll('.whatsapp-float, .call-float');
  if (floats.length) {
    footer.style.paddingBottom = '140px'; // ensures space for floating buttons
  }
})();

/* ---------- End of main.js ---------- */
