const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".work-source .video-card");
const modal = document.querySelector(".video-modal");
const closeModal = document.querySelector(".modal-close");
const modalPlayer = document.querySelector(".modal-player");
const modalVideo = modal?.querySelector("video");
const modalTitle = modal?.querySelector(".video-placeholder strong");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const backdropVideo = document.querySelector(".ai-video-backdrop video");
const soundToggle = document.querySelector(".sound-toggle");
const soundToggleText = soundToggle?.querySelector(".sound-toggle-text");
const dynamicMotion = !prefersReducedMotion.matches;

if (prefersReducedMotion.matches) {
  backdropVideo?.pause();
}

function setBackdropSound(isOn) {
  if (!backdropVideo || !soundToggle) return;
  backdropVideo.muted = !isOn;
  soundToggle.classList.toggle("is-on", isOn);
  soundToggle.setAttribute("aria-pressed", String(isOn));
  soundToggle.setAttribute("aria-label", isOn ? "השתקת סאונד רקע" : "הפעלת סאונד רקע");
  if (soundToggleText) soundToggleText.textContent = isOn ? "השתק סאונד" : "הפעל סאונד";
}

soundToggle?.addEventListener("click", () => {
  const shouldEnableSound = backdropVideo?.muted ?? true;
  if (backdropVideo) {
    backdropVideo.play().catch(() => {});
  }
  setBackdropSound(shouldEnableSound);
});

prefersReducedMotion.addEventListener?.("change", () => {
  if (!backdropVideo) return;
  if (prefersReducedMotion.matches) {
    backdropVideo.pause();
    setBackdropSound(false);
  } else {
    backdropVideo.play().catch(() => {});
  }
});

function updateScrollEffects() {
  const progress = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
}

updateScrollEffects();
window.addEventListener("scroll", updateScrollEffects, { passive: true });

if (dynamicMotion) {
  document.body.classList.add("motion-ready");

  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("has-pointer");
    document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    document.body.classList.remove("has-pointer");
  });

  const revealItems = document.querySelectorAll(".section-heading, .about-photo, .about-content, .service-grid article, .process-list li, .testimonial-grid figure, .contact-section > *");

  revealItems.forEach((item) => item.classList.add("reveal"));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

  revealItems.forEach((item) => revealObserver.observe(item));
}

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-selected", item === button));
    window.setWorkFilter?.(filter);
    cards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const youtubeSource = document.querySelector(".youtube-source");
const youtubeCoverflowRoot = document.querySelector(".youtube-coverflow:not(.work-coverflow)");
const workCoverflowRoot = document.querySelector(".work-coverflow");
const sourceCards = [...youtubeSource?.querySelectorAll(".youtube-card") ?? []];
const workSourceCards = [...document.querySelectorAll(".work-source .video-card")];

function getYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    if (parsed.pathname.includes("/shorts/")) return parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    return parsed.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function createPreviewFrame(card) {
  const thumb = card.querySelector(".youtube-thumb, .video-thumb");
  const videoLink = card.href || card.querySelector("a[href]")?.href || "";
  const id = getYoutubeId(videoLink);
  if (!thumb || !id || thumb.querySelector(".preview-frame")) return;

  const frame = document.createElement("iframe");
  frame.className = "preview-frame";
  frame.title = "תצוגה מקדימה של סרטון";
  frame.allow = "autoplay; encrypted-media; picture-in-picture";
  frame.tabIndex = -1;
  frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0`;
  thumb.append(frame);
  card.classList.add("is-previewing");
}

function removePreviewFrame(card) {
  card.querySelector(".preview-frame")?.remove();
  card.classList.remove("is-previewing");
}

class VideoCoverflow {
  constructor(root, cards) {
    this.root = root;
    this.viewport = root.querySelector(".coverflow-viewport");
    this.stage = root.querySelector(".coverflow-stage");
    this.prevButton = root.querySelector(".coverflow-prev");
    this.nextButton = root.querySelector(".coverflow-next");
    this.cards = [];
    this.activeIndex = 0;
    this.dragStartX = 0;
    this.dragOffset = 0;
    this.hasDragged = false;
    this.isDragging = false;
    this.isPaused = false;
    this.autoTimer = undefined;
    this.resumeTimer = undefined;
    this.wheelTimer = undefined;
    this.cardStep = 230;
    this.layoutScale = 1;

    this.mount(cards);
    this.bindEvents();
    this.measure();
    this.render();
    this.startAutoplay();
  }

  mount(cards) {
    this.cards.forEach((card) => removePreviewFrame(card));
    this.stage.replaceChildren();
    this.cards = [];

    cards.forEach((card, index) => {
      const sourceLink = card.matches("a[href]") ? card : card.querySelector("a[href]");
      const clone = document.createElement("a");
      clone.className = card.className;
      clone.classList.remove("reveal", "is-visible");
      clone.innerHTML = card.innerHTML;
      const title = clone.querySelector("strong, h3")?.textContent?.trim() || "סרטון לדוגמא";
      const href = sourceLink?.href || "";

      clone.querySelectorAll("a[href]").forEach((nestedLink) => {
        const span = document.createElement("span");
        span.className = nestedLink.className;
        span.innerHTML = nestedLink.innerHTML;
        nestedLink.replaceWith(span);
      });

      clone.dataset.index = String(index);
      clone.dataset.videoHref = href;
      clone.href = href;
      clone.target = "_blank";
      clone.rel = "noreferrer";
      clone.setAttribute("aria-label", `${title} - צפייה ביוטיוב`);
      clone.querySelector("img")?.setAttribute("draggable", "false");

      this.stage.append(clone);
      this.cards.push(clone);
      this.bindCardEvents(clone);
    });
  }

  setCards(cards) {
    this.pause();
    this.activeIndex = 0;
    this.dragOffset = 0;
    this.mount(cards);
    this.render();
    this.resume(700);
  }

  bindEvents() {
    this.root.addEventListener("mouseenter", () => this.pause());
    this.root.addEventListener("mouseleave", () => this.resume(700));
    this.root.addEventListener("focusin", () => this.pause());
    this.root.addEventListener("focusout", () => this.resume(700));
    this.viewport.addEventListener("keydown", (event) => this.onKeydown(event));
    this.viewport.addEventListener("wheel", (event) => this.onWheel(event), { passive: false });
    this.viewport.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.viewport.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.viewport.addEventListener("pointerup", (event) => this.onPointerUp(event));
    this.viewport.addEventListener("pointercancel", (event) => this.onPointerUp(event));
    this.prevButton?.addEventListener("click", () => this.goTo(this.activeIndex - 1));
    this.nextButton?.addEventListener("click", () => this.goTo(this.activeIndex + 1));
    window.addEventListener("resize", () => {
      this.measure();
      this.render();
    });
    prefersReducedMotion.addEventListener?.("change", () => {
      this.render();
      this.startAutoplay();
    });
  }

  bindCardEvents(card) {
    card.addEventListener("click", (event) => this.onCardClick(event, card));
    card.addEventListener("focus", () => this.goTo(Number(card.dataset.index)));
  }

  measure() {
    const width = this.viewport?.clientWidth || 900;
    this.cardStep = Math.min(280, Math.max(150, width * 0.22));
    this.layoutScale = Math.min(1, Math.max(0.72, width / 980));
  }

  normalize(index) {
    if (!this.cards.length) return 0;
    return (Math.round(index) % this.cards.length + this.cards.length) % this.cards.length;
  }

  getShortestDistance(index, progress = this.activeIndex) {
    const count = this.cards.length;
    let distance = index - progress;
    if (distance > count / 2) distance -= count;
    if (distance < -count / 2) distance += count;
    return distance;
  }

  pause() {
    this.isPaused = true;
    window.clearTimeout(this.autoTimer);
    window.clearTimeout(this.resumeTimer);
  }

  resume(delay = 0) {
    window.clearTimeout(this.resumeTimer);
    this.resumeTimer = window.setTimeout(() => {
      this.isPaused = false;
      this.startAutoplay();
    }, delay);
  }

  startAutoplay() {
    window.clearTimeout(this.autoTimer);
    if (this.isPaused || prefersReducedMotion.matches || this.cards.length < 2) return;
    this.autoTimer = window.setTimeout(() => {
      this.goTo(this.activeIndex + 1);
      this.startAutoplay();
    }, 4600);
  }

  goTo(index) {
    if (!this.cards.length) return;
    this.dragOffset = 0;
    this.activeIndex = this.normalize(index);
    this.render();
    this.startAutoplay();
  }

  render(progress = this.activeIndex) {
    const slots = [
      { x: 0, y: 92, z: 150, rotate: 0, tilt: 0, scale: 1.1, opacity: 1, blur: 0 },
      { x: 265, y: -92, z: 36, rotate: -16, tilt: 4, scale: 0.76, opacity: 0.82, blur: 0.15 },
      { x: -305, y: -40, z: -18, rotate: 18, tilt: -5, scale: 0.7, opacity: 0.62, blur: 0.75 },
      { x: 350, y: 205, z: -4, rotate: -12, tilt: -4, scale: 0.72, opacity: 0.74, blur: 0.45 },
      { x: -330, y: 245, z: -12, rotate: 14, tilt: 5, scale: 0.74, opacity: 0.7, blur: 0.5 },
      { x: 385, y: -265, z: -52, rotate: -22, tilt: 5, scale: 0.58, opacity: 0.5, blur: 1.25 },
      { x: -390, y: -240, z: -64, rotate: 22, tilt: -5, scale: 0.56, opacity: 0.42, blur: 1.55 },
      { x: 12, y: -292, z: -70, rotate: 0, tilt: 2, scale: 0.55, opacity: 0.36, blur: 1.8 },
    ];

    this.cards.forEach((card, index) => {
      const distance = this.getShortestDistance(index, progress);
      const depth = Math.abs(distance);
      const slot = slots[Math.min(slots.length - 1, Math.round(depth))];
      const side = Math.sign(distance) || 1;
      const mirror = distance < 0 ? -1 : 1;
      const x = depth < 0.5 ? slot.x : slot.x * mirror * this.layoutScale;
      const y = slot.y * this.layoutScale;
      const z = slot.z;
      const rotate = depth < 0.5 ? slot.rotate : Math.abs(slot.rotate) * -side;
      const tilt = depth < 0.5 ? slot.tilt : slot.tilt * mirror;
      const isActive = index === this.activeIndex && Math.abs(progress - this.activeIndex) < 0.02;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);
      card.style.setProperty("--z", `${z}px`);
      card.style.setProperty("--rotate", `${rotate}deg`);
      card.style.setProperty("--tilt", `${tilt}deg`);
      card.style.setProperty("--scale", String(slot.scale));
      card.style.setProperty("--card-opacity", String(slot.opacity));
      card.style.setProperty("--card-brightness", String(Math.max(0.55, 1 - depth * 0.12)));
      card.style.setProperty("--card-blur", `${slot.blur}px`);
      card.style.setProperty("--depth", String(Math.round(depth)));
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-current", isActive ? "true" : "false");
      card.tabIndex = depth <= 2.5 ? 0 : -1;

      if (isActive && !prefersReducedMotion.matches) {
        createPreviewFrame(card);
      } else {
        removePreviewFrame(card);
      }
    });
  }

  openVideo(card) {
    const href = card.dataset.videoHref || card.href || card.querySelector("a[href]")?.href;
    if (href) window.location.assign(href);
  }

  onKeydown(event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.pause();
      this.goTo(this.activeIndex - 1);
      this.resume(1000);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.pause();
      this.goTo(this.activeIndex + 1);
      this.resume(1000);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.openVideo(this.cards[this.activeIndex]);
    }
  }

  onWheel(event) {
    event.preventDefault();
    this.pause();
    const delta = event.deltaX || event.deltaY;
    this.dragOffset -= delta * 0.6;
    const progress = this.activeIndex - this.dragOffset / this.cardStep;
    this.render(progress);
    window.clearTimeout(this.wheelTimer);
    this.wheelTimer = window.setTimeout(() => {
      this.goTo(Math.round(progress));
      this.resume(900);
    }, 120);
  }

  onPointerDown(event) {
    if (event.target.closest(".coverflow-stage a[href]")) return;
    if (event.button !== undefined && event.button !== 0) return;
    this.isDragging = true;
    this.hasDragged = false;
    this.dragStartX = event.clientX;
    this.dragOffset = 0;
    this.pause();
    this.stage.classList.add("is-dragging");
    this.viewport.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.isDragging) return;
    this.dragOffset = event.clientX - this.dragStartX;
    if (Math.abs(this.dragOffset) > 6) this.hasDragged = true;
    this.render(this.activeIndex - this.dragOffset / this.cardStep);
  }

  onPointerUp(event) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.stage.classList.remove("is-dragging");
    this.viewport.releasePointerCapture?.(event.pointerId);
    this.goTo(this.activeIndex - this.dragOffset / this.cardStep);
    this.resume(900);
  }

  onCardClick(event, card) {
    if (this.hasDragged) {
      event.preventDefault();
      this.hasDragged = false;
      return;
    }
  }
}

let workCoverflow;

if (youtubeCoverflowRoot && sourceCards.length) {
  new VideoCoverflow(youtubeCoverflowRoot, sourceCards);
}

if (workCoverflowRoot && workSourceCards.length) {
  workCoverflow = new VideoCoverflow(workCoverflowRoot, workSourceCards);
  window.setWorkFilter = (filter = "all") => {
    const filteredCards = filter === "all"
      ? workSourceCards
      : workSourceCards.filter((card) => card.dataset.category === filter);
    workCoverflow.setCards(filteredCards);
  };
}

document.querySelectorAll("button.video-thumb").forEach((button) => {
  button.addEventListener("click", () => {
    const title = button.dataset.title || "וידאו";
    const src = button.dataset.video || "";

    modalTitle.textContent = title;
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalPlayer.classList.remove("has-video");

    if (src) {
      modalVideo.src = src;
      modalPlayer.classList.add("has-video");
    }

    modal.showModal();
  });
});

closeModal?.addEventListener("click", () => {
  modalVideo.pause();
  modal.close();
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    modalVideo.pause();
    modal.close();
  }
});
