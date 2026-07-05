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

const youtubeShowcase = document.querySelector(".youtube-showcase");
const youtubeSection = document.querySelector(".youtube-section");
const youtubeCards = [...document.querySelectorAll(".youtube-card")];
const showcaseImage = document.querySelector(".showcase-image");
const showcaseTitle = document.querySelector(".showcase-title");
const showcaseText = document.querySelector(".showcase-text");
const showcaseLink = document.querySelector(".showcase-link");
const youtubeControls = document.querySelectorAll("[data-youtube-dir]");
let activeYoutubeIndex = 0;
let youtubeAutoplay;

function layoutYoutubeCarousel() {
  if (!youtubeCards.length) return;

  const isCompact = window.matchMedia("(max-width: 720px)").matches;
  const spacing = isCompact ? 132 : 218;
  const depth = isCompact ? 50 : 92;

  youtubeCards.forEach((item, itemIndex) => {
    let offset = itemIndex - activeYoutubeIndex;
    const half = youtubeCards.length / 2;

    if (offset > half) offset -= youtubeCards.length;
    if (offset < -half) offset += youtubeCards.length;

    const absOffset = Math.abs(offset);
    const rotate = offset * -17;
    const translateX = offset * spacing;
    const translateZ = -absOffset * depth;
    const translateY = absOffset === 0 ? -50 : -48 + absOffset * 2;
    const scale = Math.max(isCompact ? 0.62 : 0.58, 1 - absOffset * 0.12);
    const opacity = absOffset > 3 ? 0 : Math.max(0.2, 1 - absOffset * 0.22);

    item.style.transform = `translate3d(calc(-50% + ${translateX}px), ${translateY}%, ${translateZ}px) rotateY(${rotate}deg) scale(${scale})`;
    item.style.opacity = String(opacity);
    item.style.zIndex = String(100 - absOffset);
    item.style.pointerEvents = absOffset > 3 ? "none" : "auto";
    item.setAttribute("aria-hidden", absOffset > 3 ? "true" : "false");
  });
}

function setActiveYoutube(index) {
  if (!youtubeCards.length) return;

  activeYoutubeIndex = (index + youtubeCards.length) % youtubeCards.length;
  const card = youtubeCards[activeYoutubeIndex];
  const image = card.querySelector("img");
  const title = card.querySelector("strong")?.textContent?.trim() || "סרטון לדוגמא";
  const text = card.querySelector("small")?.textContent?.trim() || "צפייה בפרויקט ביוטיוב";

  youtubeShowcase?.classList.add("is-switching");
  youtubeCards.forEach((item, itemIndex) => {
    item.classList.toggle("is-active", itemIndex === activeYoutubeIndex);
  });
  layoutYoutubeCarousel();

  if (showcaseImage && image) {
    showcaseImage.src = image.src;
  }
  if (showcaseTitle) {
    showcaseTitle.textContent = title;
  }
  if (showcaseText) {
    showcaseText.textContent = text;
  }
  if (showcaseLink) {
    showcaseLink.href = card.href;
  }

  window.setTimeout(() => youtubeShowcase?.classList.remove("is-switching"), 180);
}

youtubeCards.forEach((card, index) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveYoutube(index);
    restartYoutubeAutoplay();
  });
});

youtubeControls.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.youtubeDir === "next" ? 1 : -1;
    setActiveYoutube(activeYoutubeIndex + direction);
    restartYoutubeAutoplay();
  });
});

function startYoutubeAutoplay() {
  if (!youtubeCards.length || youtubeAutoplay) return;
  youtubeAutoplay = window.setInterval(() => {
    setActiveYoutube(activeYoutubeIndex + 1);
  }, 4200);
}

function stopYoutubeAutoplay() {
  window.clearInterval(youtubeAutoplay);
  youtubeAutoplay = undefined;
}

function restartYoutubeAutoplay() {
  stopYoutubeAutoplay();
  startYoutubeAutoplay();
}

youtubeSection?.addEventListener("mouseenter", stopYoutubeAutoplay);
youtubeSection?.addEventListener("mouseleave", startYoutubeAutoplay);
youtubeSection?.addEventListener("focusin", stopYoutubeAutoplay);
youtubeSection?.addEventListener("focusout", startYoutubeAutoplay);

window.addEventListener("resize", layoutYoutubeCarousel);
setActiveYoutube(0);
startYoutubeAutoplay();

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
