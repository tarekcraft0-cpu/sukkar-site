const nav = document.querySelector(".nav");
const revealItems = document.querySelectorAll(".reveal");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const galleryItems = document.querySelectorAll(".gallery-item");

const onScroll = () => {
  if (!nav) return;
  nav.classList.toggle("scrolled", window.scrollY > 24);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

const openLightbox = (src, alt) => {
  lightboxImg.src = src;
  lightboxImg.alt = alt || "صورة مكبرة لسكر";
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeLightbox = () => {
  lightbox.hidden = true;
  lightboxImg.removeAttribute("src");
  document.body.style.overflow = "";
};

galleryItems.forEach((item) => {
  item.addEventListener("click", () => {
    openLightbox(item.dataset.src, item.querySelector("img")?.alt);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
});
