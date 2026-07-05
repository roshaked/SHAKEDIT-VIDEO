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
