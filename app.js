const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".video-card");
const modal = document.querySelector(".video-modal");
const closeModal = document.querySelector(".modal-close");
const modalPlayer = document.querySelector(".modal-player");
const modalVideo = modal?.querySelector("video");
const modalTitle = modal?.querySelector(".video-placeholder strong");

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
    cards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const youtubeSource = document.querySelector(".youtube-source");
const coverflow = document.querySelector(".youtube-coverflow");
const sourceCards = [...youtubeSource?.querySelectorAll(".youtube-card") ?? []];

function getYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    if (parsed.pathname.includes("/shorts/")) return parsed.pathname.split("/shorts/")[1]?.split("/")[0];
    return parsed.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

function createPreviewFrame(card) {
  const thumb = card.querySelector(".youtube-thumb");
  const id = getYoutubeId(card.href);
  if (!thumb || !id || thumb.querySelector(".preview-frame")) return;

  const frame = document.createElement("iframe");
  frame.className = "preview-frame";
  frame.title = "תצוגה מקדימה של סרטון";
  frame.allow = "autoplay; encrypted-media; picture-in-picture";
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

    this.mount(cards);
    this.bindEvents();
    this.measure();
    this.render();
    this.startAutoplay();
  }

  mount(cards) {
    cards.forEach((card, index) => {
      const clone = card.cloneNode(true);
      const title = clone.querySelector("strong")?.textContent?.trim() || "סרטון לדוגמא";
      clone.dataset.index = String(index);
      clone.setAttribute("aria-label", `${title} - צפייה ביוטיוב`);
      clone.querySelector("img")?.setAttribute("draggable", "false");
      this.stage.append(clone);
      this.cards.push(clone);
    });
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
    this.cards.forEach((card) => {
      card.addEventListener("click", (event) => this.onCardClick(event, card));
      card.addEventListener("focus", () => this.goTo(Number(card.dataset.index)));
    });
    window.addEventListener("resize", () => {
      this.measure();
      this.render();
    });
    prefersReducedMotion.addEventListener?.("change", () => {
      this.render();
      this.startAutoplay();
    });
  }

  measure() {
    const width = this.viewport?.clientWidth || 900;
    this.cardStep = Math.min(260, Math.max(150, width * 0.24));
  }

  normalize(index) {
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
    if (this.isPaused || prefersReducedMotion.matches || !this.cards.length) return;
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
    this.cards.forEach((card, index) => {
      const distance = this.getShortestDistance(index, progress);
      const depth = Math.abs(distance);
      const side = Math.sign(distance);
      const x = side * (depth * this.cardStep + Math.max(0, depth - 1) * 42);
      const z = 90 - depth * 92;
      const y = depth * 12;
      const rotate = Math.max(-42, Math.min(42, -distance * 30));
      const scale = Math.max(0.58, 1 - depth * 0.13);
      const opacity = Math.max(0.2, 1 - depth * 0.2);
      const blur = depth > 1 ? Math.min(2.2, (depth - 1) * 0.7) : 0;
      const isActive = index === this.activeIndex && Math.abs(progress - this.activeIndex) < 0.02;

      card.style.setProperty("--x", `${x}px`);
      card.style.setProperty("--y", `${y}px`);
      card.style.setProperty("--z", `${z}px`);
      card.style.setProperty("--rotate", `${rotate}deg`);
      card.style.setProperty("--scale", String(scale));
      card.style.setProperty("--card-opacity", String(opacity));
      card.style.setProperty("--card-brightness", String(Math.max(0.55, 1 - depth * 0.12)));
      card.style.setProperty("--card-blur", `${blur}px`);
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

    const index = Number(card.dataset.index);
    if (index !== this.activeIndex) {
      event.preventDefault();
      this.pause();
      this.goTo(index);
      this.resume(900);
    }
  }
}

if (coverflow && sourceCards.length) {
  new VideoCoverflow(coverflow, sourceCards);
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
