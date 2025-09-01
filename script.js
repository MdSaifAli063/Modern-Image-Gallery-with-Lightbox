document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const gallery = document.querySelector('.gallery');

  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('.lightbox-caption');
  const lightboxInfo = lightbox?.querySelector('.lightbox-info');

  const closeBtn = lightbox?.querySelector('.lightbox-close');
  const prevBtn = lightbox?.querySelector('.lightbox-prev');
  const nextBtn = lightbox?.querySelector('.lightbox-next');
  const zoomInBtn = lightbox?.querySelector('.lightbox-zoom-in');
  const zoomOutBtn = lightbox?.querySelector('.lightbox-zoom-out');
  const rotateBtn = lightbox?.querySelector('.lightbox-rotate');
  const fullscreenBtn = lightbox?.querySelector('.lightbox-fullscreen');
  const downloadBtn = lightbox?.querySelector('.lightbox-download');
  const shareBtn = lightbox?.querySelector('.lightbox-share');

  const searchInput = document.getElementById('search');
  const clearSearchBtn = document.getElementById('clear-search');
  const sortSelect = document.getElementById('sort');
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const resultsCount = document.getElementById('resultsCount');
  const cardSizeRange = document.getElementById('cardSizeRange');
  const themeToggle = document.getElementById('themeToggle');

  // Guard: ensure required roots exist
  if (!gallery || !lightbox || !lightboxImg) return;

  // State
  const state = {
    images: [],
    currentIndex: 0,
    scale: 1,
    rotation: 0,
    tx: 0,
    ty: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    filter: 'all',
    sort: 'default',
    favorites: new Set(JSON.parse(localStorage.getItem('gallery:favorites') || '[]')),
    theme:
      localStorage.getItem('gallery:theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    cardMin: parseInt(localStorage.getItem('gallery:cardMin') || '220', 10),
    lastFocused: null
  };

  // Init theme and card size
  document.body.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  if (cardSizeRange) cardSizeRange.value = String(state.cardMin);
  document.documentElement.style.setProperty('--card-min', `${state.cardMin}px`);

  // Build images model
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  state.images = items.map((item, idx) => {
    const img = item.querySelector('img');
    const title = item.querySelector('h3')?.textContent?.trim() || img?.alt || `Image ${idx + 1}`;
    const tagsAttr = (item.getAttribute('data-tags') || img?.getAttribute('data-tags') || '').trim();
    const tags = tagsAttr ? tagsAttr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
    return {
      id: item.dataset.id || String(idx),
      src: img?.src || '',
      full: img?.getAttribute('data-full') || img?.src || '',
      alt: img?.alt || title,
      title,
      category: item.dataset.category || 'uncategorized',
      tags,
      el: item
    };
  });

  // Attach gallery item events and favorites UI
  items.forEach(item => {
    const id = item.dataset.id || '';
    const favBtn = item.querySelector('.favorite-btn');

    if (favBtn) {
      const setFavUi = (on) => favBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      setFavUi(state.favorites.has(id));

      const toggleFav = (e) => {
        e?.stopPropagation?.();
        const nowFav = favBtn.getAttribute('aria-pressed') !== 'true';
        setFavUi(nowFav);
        if (nowFav) state.favorites.add(id);
        else state.favorites.delete(id);
        localStorage.setItem('gallery:favorites', JSON.stringify(Array.from(state.favorites)));
        if (state.filter === 'favorites') applyFiltersAndSort();
      };

      favBtn.addEventListener('click', toggleFav);
      favBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFav(e);
        }
      });
    }

    item.addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('.favorite-btn')) return;
      const index = state.images.findIndex(img => img.el === item);
      openLightbox(index);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const index = state.images.findIndex(img => img.el === item);
        openLightbox(index);
      }
    });
  });

  // Fade-in when in view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { root: null, threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    items.forEach(item => observer.observe(item));
  } else {
    items.forEach(item => item.classList.add('in-view'));
  }

  // Search with clear button
  function updateClearSearchVisibility() {
    const box = searchInput?.closest('.search-box');
    if (!box || !searchInput) return;
    if (searchInput.value.trim()) box.classList.add('has-value');
    else box.classList.remove('has-value');
  }
  searchInput?.addEventListener('input', () => {
    updateClearSearchVisibility();
    applyFiltersAndSort();
  });
  clearSearchBtn?.addEventListener('click', () => {
    if (!searchInput) return;
    searchInput.value = '';
    updateClearSearchVisibility();
    applyFiltersAndSort();
    searchInput.focus();
  });

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      state.filter = btn.dataset.category || 'all';
      applyFiltersAndSort();
    });
  });

  // Sort
  sortSelect?.addEventListener('change', () => {
    state.sort = sortSelect.value;
    applyFiltersAndSort();
  });

  // Card size slider
  cardSizeRange?.addEventListener('input', () => {
    const v = parseInt(cardSizeRange.value, 10);
    document.documentElement.style.setProperty('--card-min', `${v}px`);
    localStorage.setItem('gallery:cardMin', String(v));
  });

  // Theme toggle
  themeToggle?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', state.theme);
    localStorage.setItem('gallery:theme', state.theme);
    updateThemeIcon();
  });
  function updateThemeIcon() {
    const icon = themeToggle?.querySelector('i');
    if (!icon) return;
    icon.classList.remove('fa-moon', 'fa-sun');
    icon.classList.add(state.theme === 'dark' ? 'fa-sun' : 'fa-moon');
  }

  // Apply filter/sort and update results count
  function applyFiltersAndSort() {
    const term = (searchInput?.value || '').trim().toLowerCase();

    // Determine comparator
    const comparator = (a, b) => {
      if (state.sort === 'name') return a.title.localeCompare(b.title);
      if (state.sort === 'category') return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
      return 0;
    };

    const images = state.sort === 'default' ? state.images.slice() : state.images.slice().sort(comparator);

    // Apply filter + search and reorder DOM consistently
    let visible = 0;
    const frag = document.createDocumentFragment();

    images.forEach(img => {
      const matchesSearch =
        img.title.toLowerCase().includes(term) ||
        img.alt.toLowerCase().includes(term) ||
        (img.tags.length ? img.tags.some(t => t.includes(term)) : false);

      const matchesFilter =
        state.filter === 'all'
          ? true
          : state.filter === 'favorites'
          ? state.favorites.has(img.id)
          : img.category === state.filter;

      const show = matchesSearch && matchesFilter;
      img.el.style.display = show ? '' : 'none';
      if (show) visible++;

      frag.appendChild(img.el);
    });

    gallery.appendChild(frag);

    // Results count text
    if (resultsCount) {
      const label = state.filter === 'all' ? '' : ` · ${capitalize(state.filter)}`;
      resultsCount.textContent = `${visible} result${visible === 1 ? '' : 's'}${label}`;
    }
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  updateClearSearchVisibility();
  applyFiltersAndSort();

  // Lightbox controller
  const lb = {
    el: lightbox,
    img: lightboxImg,
    caption: lightboxCaption,
    info: lightboxInfo,
    closeBtn,
    prevBtn,
    nextBtn,
    zoomInBtn,
    zoomOutBtn,
    rotateBtn,
    fullscreenBtn,
    downloadBtn,
    shareBtn,
    counterEl: lightboxInfo?.querySelector('.image-counter') || document.querySelector('.image-counter')
  };

  function openLightbox(index) {
    if (index < 0 || index >= state.images.length) return;
    state.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    state.currentIndex = index;
    lb.el.classList.add('open'); // CSS expects .open
    lb.el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    resetTransform();
    updateLightboxImage(true);
    // Focus management
    (lb.closeBtn || lb.el).focus?.();
    trapFocus(true);
  }

  function closeLightbox() {
    lb.el.classList.remove('open');
    lb.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetTransform();
    trapFocus(false);
    // Restore focus
    state.lastFocused?.focus?.();
  }

  function prevImage() {
    state.currentIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
    updateLightboxImage(true);
  }

  function nextImage() {
    state.currentIndex = (state.currentIndex + 1) % state.images.length;
    updateLightboxImage(true);
  }

  function updateLightboxImage(reset = false) {
    const image = state.images[state.currentIndex];
    const source = image.full || image.src;
    lb.img.src = source;
    lb.img.alt = image.alt || image.title;
    if (lb.caption) lb.caption.textContent = image.title;
    if (lb.counterEl) lb.counterEl.textContent = `${state.currentIndex + 1} / ${state.images.length}`;
    if (reset) resetTransform();
    updateImageInfo();
  }

  // Image info (resolution + approx size via dataURL)
  function updateImageInfo() {
    const tmp = new Image();
    tmp.crossOrigin = 'anonymous';
    tmp.src = lb.img.src;
    tmp.onload = () => {
      const resEl = lb.info?.querySelector('.image-resolution');
      const sizeEl = lb.info?.querySelector('.image-size');
      const resolution = `${tmp.naturalWidth} x ${tmp.naturalHeight}`;
      const sizeBytes = getImageDataURLSize(tmp);
      const size = formatBytes(sizeBytes);
      if (resEl) resEl.textContent = `Resolution: ${resolution}`;
      if (sizeEl) sizeEl.textContent = `Size: ${size}`;
    };
    tmp.onerror = () => {
      const resEl = lb.info?.querySelector('.image-resolution');
      const sizeEl = lb.info?.querySelector('.image-size');
      if (resEl) resEl.textContent = '';
      if (sizeEl) sizeEl.textContent = '';
    };
  }

  function getImageDataURLSize(img) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
      return Math.ceil((base64.length * 3) / 4);
    } catch {
      return 0; // cross-origin or canvas blocked
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return '—';
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    const precision = bytes < 10 && i > 0 ? 2 : 0;
    return `${bytes.toFixed(precision)} ${units[i]}`;
  }

  // Transform helpers
  function resetTransform() {
    state.scale = 1;
    state.rotation = 0;
    state.tx = 0;
    state.ty = 0;
    applyTransform();
  }

  function applyTransform() {
    lb.img.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale}) rotate(${state.rotation}deg)`;
  }

  function setScale(next) {
    state.scale = Math.max(1, Math.min(4, next));
    if (state.scale === 1) {
      state.tx = 0;
      state.ty = 0;
    }
    applyTransform();
  }

  function zoomIn() { setScale(state.scale + 0.25); }
  function zoomOut() { setScale(state.scale - 0.25); }
  function rotateImage() { state.rotation = (state.rotation + 90) % 360; applyTransform(); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      lightbox.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
  document.addEventListener('fullscreenchange', () => {
    const icon = fullscreenBtn?.querySelector('i');
    if (!icon) return;
    icon.classList.remove('fa-expand', 'fa-compress');
    icon.classList.add(document.fullscreenElement ? 'fa-compress' : 'fa-expand');
  });

  async function downloadImage() {
    try {
      const resp = await fetch(lightboxImg.src, { mode: 'cors' });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = (state.images[state.currentIndex].title || 'image').replace(/\s+/g, '-').toLowerCase();
      const extFromUrl = (new URL(lightboxImg.src)).pathname.split('.').pop();
      const ext = extFromUrl && extFromUrl.length <= 4 ? extFromUrl : 'jpg';
      a.download = `${title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(lightboxImg.src, '_blank');
    }
  }

  async function shareImage() {
    const data = state.images[state.currentIndex];
    const payload = { title: data.title, text: data.title, url: lightboxImg.src };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(lightboxImg.src);
        toast('Image URL copied to clipboard');
      } else {
        prompt('Copy image URL:', lightboxImg.src);
      }
    } catch {
      // user canceled or not supported
    }
  }

  function toast(message) {
    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '8px',
      zIndex: '2000'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  // Lightbox controls events
  closeBtn?.addEventListener('click', closeLightbox);
  prevBtn?.addEventListener('click', prevImage);
  nextBtn?.addEventListener('click', nextImage);
  zoomInBtn?.addEventListener('click', zoomIn);
  zoomOutBtn?.addEventListener('click', zoomOut);
  rotateBtn?.addEventListener('click', rotateImage);
  fullscreenBtn?.addEventListener('click', toggleFullscreen);
  downloadBtn?.addEventListener('click', downloadImage);
  shareBtn?.addEventListener('click', shareImage);

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;

    // focus trap Tab
    if (e.key === 'Tab') {
      handleFocusTrap(e);
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeLightbox();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevImage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextImage();
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        zoomOut();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        rotateImage();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  });

  // Double click/tap to zoom
  let lastTapTime = 0;
  lightboxImg.addEventListener('dblclick', () => {
    setScale(state.scale === 1 ? 2 : 1);
  });
  lightboxImg.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      e.preventDefault();
      setScale(state.scale === 1 ? 2 : 1);
    }
    lastTapTime = now;
  });

  // Drag to pan (mouse)
  lightboxImg.addEventListener('mousedown', (e) => {
    if (state.scale <= 1) return;
    e.preventDefault();
    state.isDragging = true;
    lightboxImg.classList.add('dragging');
    state.startX = e.clientX;
    state.startY = e.clientY;
  });
  document.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    state.startX = e.clientX;
    state.startY = e.clientY;
    state.tx += dx;
    state.ty += dy;
    applyTransform();
  });
  document.addEventListener('mouseup', () => {
    state.isDragging = false;
    lightboxImg.classList.remove('dragging');
  });
  lightboxImg.addEventListener('mouseleave', () => {
    state.isDragging = false;
    lightboxImg.classList.remove('dragging');
  });

  // Touch: swipe navigation if not zoomed; pan if zoomed
  let touchStartX = 0, touchStartY = 0, swiping = false;
  lightboxImg.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    if (state.scale > 1) {
      state.isDragging = true;
      state.startX = t.clientX;
      state.startY = t.clientY;
    } else {
      swiping = true;
    }
  }, { passive: true });

  lightboxImg.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (state.isDragging) {
      e.preventDefault();
      const dx = t.clientX - state.startX;
      const dy = t.clientY - state.startY;
      state.startX = t.clientX;
      state.startY = t.clientY;
      state.tx += dx;
      state.ty += dy;
      applyTransform();
    }
  }, { passive: false });

  lightboxImg.addEventListener('touchend', (e) => {
    if (state.isDragging) {
      state.isDragging = false;
      return;
    }
    if (!swiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
      if (dx < 0) nextImage(); else prevImage();
    }
    swiping = false;
  });

  // Wheel zoom inside lightbox
  lightbox.addEventListener('wheel', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.ctrlKey) return; // allow browser zoom
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    if (delta > 0) zoomOut(); else zoomIn();
  }, { passive: false });

  // Click outside content to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Focus trap helpers
  let focusables = [];
  function collectFocusables() {
    focusables = Array.from(lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }
  function trapFocus(enable) {
    if (enable) {
      collectFocusables();
    } else {
      focusables = [];
    }
  }
  function handleFocusTrap(e) {
    if (!focusables.length) collectFocusables();
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
});