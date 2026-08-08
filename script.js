const nav = document.querySelector(".nav");
const revealItems = document.querySelectorAll(".reveal");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const galleryItems = document.querySelectorAll(".gallery-item");
const reviewForm = document.getElementById("reviewForm");
const reviewsList = document.getElementById("reviewsList");
const reviewsCount = document.getElementById("reviewsCount");
const formStatus = document.getElementById("formStatus");
const reviewSubmit = document.getElementById("reviewSubmit");

const API_URL = "/api/reviews";

const onScroll = () => {
  nav?.classList.toggle("scrolled", window.scrollY > 24);
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
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
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

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderReviews(reviews) {
  if (!reviewsList || !reviewsCount) return;

  const list = Array.isArray(reviews) ? reviews : [];
  reviewsCount.textContent = list.length === 1 ? "رأي واحد" : `${list.length} رأي`;

  if (!list.length) {
    reviewsList.innerHTML = `<p class="reviews-empty">كن أول واحد يكتب رأيه عن سكر ✨</p>`;
    return;
  }

  reviewsList.innerHTML = list
    .map(
      (review) => `
      <article class="review-card">
        <strong>${escapeHtml(review.name)}</strong>
        <p>${escapeHtml(review.text)}</p>
        <time datetime="${escapeHtml(review.createdAt || "")}">${formatDate(
          review.createdAt
        )}</time>
      </article>`
    )
    .join("");
}

function setStatus(message, type = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`.trim();
}

async function loadReviews() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("تعذر التحميل");
    const data = await response.json();
    renderReviews(data.reviews || []);
  } catch {
    if (reviewsList) {
      reviewsList.innerHTML =
        `<p class="reviews-empty">ما قدرنا نحمّل الآراء الحين. جرّب بعد شوي.</p>`;
    }
  }
}

reviewForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(reviewForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    text: String(formData.get("text") || "").trim(),
    website: String(formData.get("website") || "").trim(),
  };

  if (payload.name.length < 2 || payload.text.length < 3) {
    setStatus("اكتب اسمك ورأيك بشكل أوضح", "err");
    return;
  }

  reviewSubmit.disabled = true;
  setStatus("جاري النشر…");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "فشل النشر");

    renderReviews(data.reviews || [data.review]);
    reviewForm.reset();
    setStatus("تم نشر رأيك بنجاح", "ok");
  } catch (error) {
    setStatus(error.message || "صار خطأ، جرّب مرة ثانية", "err");
  } finally {
    reviewSubmit.disabled = false;
  }
});

loadReviews();
