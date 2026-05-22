const frames = Array.from(document.querySelectorAll(".puppy-frame"));
const puppy = document.querySelector(".puppy-wrap");
const storyText = document.querySelector("#storyText");
const progressBar = document.querySelector("#progressBar");

const messages = [
  "Hi, I am ready to play!",
  "Come play with me!",
  "I am a little tired...",
  "Wait... is that a treat?",
  "Yay! Coming!",
];

let targetProgress = 0;
let renderedProgress = 0;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// A small easing helper keeps the image crossfades and camera moves soft.
function smoothstep(value) {
  const x = Math.min(Math.max(value, 0), 1);
  return x * x * (3 - 2 * x);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = scrollable > 0 ? window.scrollY / scrollable : 0;
}

function render(time = 0) {
  // Ease the visual state toward the real scroll position for a cinematic glide.
  renderedProgress = lerp(renderedProgress, targetProgress, 0.12);

  const exactFrame = renderedProgress * (frames.length - 1);
  const activeIndex = Math.round(exactFrame);
  const localProgress = exactFrame - Math.floor(exactFrame);

  frames.forEach((frame, index) => {
    const distance = Math.abs(exactFrame - index);
    const opacity = Math.max(0, 1 - distance);
    const frameLift = (index - exactFrame) * 18;
    const frameScale = 1 + Math.max(0, 1 - distance) * 0.018;

    frame.style.opacity = opacity.toFixed(3);
    frame.style.setProperty("--frame-y", `${frameLift.toFixed(2)}px`);
    frame.style.setProperty("--frame-scale", frameScale.toFixed(4));
  });

  // Motion layers: camera push, breathing, listening tilt, play bow, and run bounce.
  const phase = time / 1000;
  const introPush = smoothstep(Math.min(renderedProgress / 0.25, 1));
  const motionAmount = prefersReducedMotion.matches ? 0 : 1;
  const breathing = Math.sin(phase * 2.2) * 0.012 * motionAmount;
  const listeningTilt =
    Math.sin(phase * 2.8) *
    (1 - smoothstep(renderedProgress / 0.28)) *
    3.2 *
    motionAmount;
  const playfulBow =
    Math.sin(phase * 8) *
    smoothstep(1 - Math.abs(renderedProgress - 0.25) / 0.2) *
    6 *
    motionAmount;
  const runEnergy = smoothstep((renderedProgress - 0.72) / 0.28);
  const runBounce = Math.abs(Math.sin(phase * 10)) * runEnergy * 18 * motionAmount;
  const happyWiggle = Math.sin(phase * 6.5) * (0.6 + runEnergy * 1.8) * motionAmount;

  const cameraScale = 0.9 + introPush * 0.16 + runEnergy * 0.2 + breathing;
  const cameraY = lerp(12, -10, introPush) - runBounce;
  const cameraX = Math.sin(phase * 1.6) * 4 * runEnergy;
  const rotation = listeningTilt + happyWiggle + playfulBow * 0.12;

  puppy.style.setProperty("--puppy-scale", cameraScale.toFixed(4));
  puppy.style.setProperty("--puppy-x", `${cameraX.toFixed(2)}px`);
  puppy.style.setProperty("--puppy-y", `${cameraY.toFixed(2)}px`);
  puppy.style.setProperty("--puppy-rotate", `${rotation.toFixed(2)}deg`);
  puppy.style.setProperty("--shadow-scale", (1 + runEnergy * 0.22).toFixed(3));
  puppy.style.setProperty("--shadow-opacity", (0.78 - runEnergy * 0.16).toFixed(3));

  const nextMessage = messages[activeIndex] || messages[messages.length - 1];
  if (storyText.textContent !== nextMessage) {
    storyText.textContent = nextMessage;
  }

  // Give the caption a tiny float at each beat transition.
  const textPulse = Math.sin(localProgress * Math.PI);
  storyText.style.setProperty("--text-y", `${(-textPulse * 8).toFixed(2)}px`);
  storyText.style.setProperty("--text-opacity", (0.86 + textPulse * 0.14).toFixed(3));

  progressBar.style.transform = `scaleX(${renderedProgress.toFixed(4)})`;

  requestAnimationFrame(render);
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

// Decode images early when supported, then paint the first frame.
Promise.all(
  frames.map((frame) => {
    if ("decode" in frame) {
      return frame.decode().catch(() => undefined);
    }
    return Promise.resolve();
  }),
).finally(updateScrollProgress);

requestAnimationFrame(render);
