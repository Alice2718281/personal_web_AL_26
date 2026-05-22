const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
const navLinks = document.querySelectorAll(".mobile-nav a");

// Mobile navigation: small, dependency-free, and easy to remove if you prefer.
function setMenu(open) {
  menuButton.classList.toggle("is-open", open);
  mobileNav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
}

menuButton.addEventListener("click", () => {
  setMenu(!mobileNav.classList.contains("is-open"));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

// Interactive photo stacks in Visual Notes. Each stack keeps its own place,
// so finishing one album does not affect the others.
const photoStacks = document.querySelectorAll(".photo-stack");
const stackRotations = [-1.8, 2.1, -3, 1.4, -0.8];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const visualRestartButton = document.querySelector(".visual-restart");
const resetPhotoStacks = [];

photoStacks.forEach((stack) => {
  const photos = Array.from(stack.querySelectorAll(".stack-photo"));
  let topIndex = 0;

  function arrangePhotos() {
    photos.forEach((photo, index) => {
      const relativeIndex = Math.max(index - topIndex, 0);
      photo.style.setProperty("--stack-offset", Math.min(relativeIndex, 4));
      photo.style.zIndex = photos.length - relativeIndex + 2;
    });
  }

  photos.forEach((photo, index) => {
    photo.style.setProperty("--stack-rotate", `${stackRotations[index % stackRotations.length]}deg`);
  });

  arrangePhotos();

  if (photos.length > 0) {
    photos[0].classList.add("is-top");
  } else {
    stack.classList.add("finished");
  }

  stack.addEventListener("click", () => {
    if (stack.classList.contains("finished")) {
      return;
    }

    const currentPhoto = photos[topIndex];
    if (!currentPhoto) {
      stack.classList.add("finished");
      return;
    }

    if (currentPhoto.classList.contains("swiped")) {
      return;
    }

    currentPhoto.classList.remove("is-top");
    currentPhoto.classList.add("swiped");

    let swipeDone = false;
    const finishSwipe = (event) => {
      if (swipeDone || (event && event.propertyName !== "transform")) {
        return;
      }

      swipeDone = true;
      currentPhoto.removeEventListener("transitionend", finishSwipe);
      topIndex += 1;
      arrangePhotos();

      if (topIndex < photos.length) {
        photos[topIndex].classList.add("is-top");
      } else {
        stack.classList.add("finished");
      }
    };

    if (prefersReducedMotion.matches) {
      finishSwipe();
    } else {
      currentPhoto.addEventListener("transitionend", finishSwipe);
      window.setTimeout(() => finishSwipe(), 700);
    }
  });

  function resetStack() {
    topIndex = 0;
    stack.classList.remove("finished");

    photos.forEach((photo) => {
      photo.classList.remove("swiped", "is-top");
    });

    if (photos.length > 0) {
      photos[0].classList.add("is-top");
    } else {
      stack.classList.add("finished");
    }

    arrangePhotos();
  }

  resetPhotoStacks.push(resetStack);
});

visualRestartButton?.addEventListener("click", () => {
  resetPhotoStacks.forEach((resetStack) => resetStack());
});

// Subtle reveal animation for sections/cards. This keeps the clean old-site feel,
// but makes the new page feel a little more current.
const revealTargets = document.querySelectorAll(
  ".section, .role-card, .skill-grid article, .project-card, .visual-card, .vibe-card",
);

revealTargets.forEach((target) => target.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 },
);

revealTargets.forEach((target) => observer.observe(target));
