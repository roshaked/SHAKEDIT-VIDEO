const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const filterButtons = document.querySelectorAll("[data-filter]");
const cards = document.querySelectorAll(".video-card");
const modal = document.querySelector(".video-modal");
const closeModal = document.querySelector(".modal-close");
const modalPlayer = document.querySelector(".modal-player");
const modalVideo = modal.querySelector("video");
const modalTitle = modal.querySelector(".video-placeholder strong");

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
const marqueeRows = [...document.querySelectorAll(".video-marquee-row")];
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

class InfiniteVideoRow {
  constructor(row, cards, rowIndex) {
    this.row = row;
    this.cards = cards;
    this.rowIndex = rowIndex;
    this.direction = row.dataset.direction === "right" ? 1 : -1;
    this.speed = Number(row.dataset.speed || 12);
    this.offset = 0;
    this.groupWidth = 1;
    this.isPaused = false;
    this.isHovered = false;
    this.isDragging = false;
    this.hasDragged = false;
    this.dragStartX = 0;
    this.dragStartOffset = 0;
    this.resumeTimer = undefined;

    this.track = document.createElement("div");
    this.track.className = "video-marquee-track";
    this.row.append(this.track);
    this.renderCards();
    this.bindEvents();
    this.measure();
  }

  renderCards() {
    const orderedCards = this.cards.slice(this.rowIndex).concat(this.cards.slice(0, this.rowIndex));
    const repeatCount = 3;

    for (let groupIndex = 0; groupIndex < repeatCount; groupIndex += 1) {
      const group = document.createElement("div");
      group.className = "video-card-group";
      group.dataset.group = String(groupIndex);

      orderedCards.forEach((card) => {
        const clone = card.cloneNode(true);
        const title = clone.querySelector("strong")?.textContent?.trim() || "סרטון לדוגמא";
        clone.setAttribute("aria-label", `${title} - צפייה ביוטיוב`);
        clone.addEventListener("mouseenter", () => createPreviewFrame(clone));
        clone.addEventListener("mouseleave", () => removePreviewFrame(clone));
        clone.addEventListener("focus", () => createPreviewFrame(clone));
        clone.addEventListener("blur", () => removePreviewFrame(clone));
        group.append(clone);
      });

      this.track.append(group);
    }
  }

  bindEvents() {
    this.row.addEventListener("mouseenter", () => {
      this.isHovered = true;
      this.pause();
    });
    this.row.addEventListener("mouseleave", () => {
      this.isHovered = false;
      if (!this.isDragging) this.resume();
    });
    this.row.addEventListener("focusin", () => this.pause());
    this.row.addEventListener("focusout", () => {
      if (!this.isHovered) this.resume();
    });
    this.row.addEventListener("wheel", (event) => this.onWheel(event), { passive: false });
    this.row.addEventListener("click", (event) => this.onClick(event), true);
    this.row.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.row.addEventListener("pointermove", (event) => this.onPointerMove(event));
    this.row.addEventListener("pointerup", () => this.onPointerUp());
    this.row.addEventListener("pointercancel", () => this.onPointerUp());
    window.addEventListener("resize", () => this.measure());
  }

  measure() {
    const firstGroup = this.track.querySelector(".video-card-group");
    this.groupWidth = firstGroup?.scrollWidth || 1;
    this.normalize();
    this.applyTransform();
  }

  normalize() {
    this.offset = ((this.offset % this.groupWidth) + this.groupWidth) % this.groupWidth;
  }

  pause() {
    this.isPaused = true;
    window.clearTimeout(this.resumeTimer);
  }

  resume(delay = 0) {
    window.clearTimeout(this.resumeTimer);
    this.resumeTimer = window.setTimeout(() => {
      if (!this.isHovered && !this.isDragging) this.isPaused = false;
    }, delay);
  }

  onWheel(event) {
    event.preventDefault();
    this.pause();
    this.offset += event.deltaX || event.deltaY;
    this.normalize();
    this.applyTransform();
    this.resume(900);
  }

  onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    this.isDragging = true;
    this.hasDragged = false;
    this.dragStartX = event.clientX;
    this.dragStartOffset = this.offset;
    this.pause();
    this.row.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.isDragging) return;
    const delta = event.clientX - this.dragStartX;
    if (Math.abs(delta) > 6) this.hasDragged = true;
    this.offset = this.dragStartOffset - delta;
    this.normalize();
    this.applyTransform();
  }

  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.resume(900);
  }

  onClick(event) {
    if (!this.hasDragged) return;
    event.preventDefault();
    event.stopPropagation();
    this.hasDragged = false;
  }

  tick(deltaSeconds) {
    if (!this.isPaused && !prefersReducedMotion.matches) {
      this.offset += this.speed * deltaSeconds * (this.direction === -1 ? 1 : -1);
      this.normalize();
      this.applyTransform();
    }
  }

  applyTransform() {
    this.track.style.transform = `translate3d(${-this.offset}px, 0, 0)`;
  }
}

const videoRows = marqueeRows.map((row, index) => new InfiniteVideoRow(row, sourceCards, index));
let lastFrameTime = performance.now();

function animateVideoRows(now) {
  const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  videoRows.forEach((row) => row.tick(deltaSeconds));
  requestAnimationFrame(animateVideoRows);
}

if (videoRows.length) {
  requestAnimationFrame(animateVideoRows);
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
