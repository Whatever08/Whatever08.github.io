// Register only Draggable (no InertiaPlugin)
gsap.registerPlugin(Draggable, ScrollTrigger);

// Setup elements
let descriptions = gsap.utils.toArray(".descriptions .title");
let items = gsap.utils.toArray(".content .item");

// Build carousel
let carousel = buildCarousel(items, {
  radiusX: 1300,
  radiusY: 970,
  activeAngle: -90,
  draggable: true,
  onClick(el, self) {
    self.to(el, { duration: 3, ease: "linear" });
  },
  onActivate(el) {
    el.classList.add("active");
  },
  onDeactivate(el) {
    el.classList.remove("active");
  },
  onStart(el) {
    gsap.to(descriptions[items.indexOf(el)], { autoAlpha: 0, duration: 1 });
  },
  onStop(el) {
    gsap.to(descriptions[items.indexOf(el)], { autoAlpha: 1, duration: 1 });
  }
});

function buildCarousel(targets, {
  radiusX = 200, radiusY = 200, activeAngle = -90,
  draggable = false, onClick, onActivate, onDeactivate, onStart, onStop
} = {}) {
  gsap.set(targets, { xPercent: -50, yPercent: -50 });
  const DEG2RAD = Math.PI / 180;
  const quantity = targets.length;
  const angleInc = 360 / quantity;
  const wrapIdx = gsap.utils.wrap(0, quantity);
  const wrapAngle = gsap.utils.wrap(0, 360);
  let rotation = 0, dragged = false, activeEl = targets[0];

  // Temp hidden element for rotation state
  const temp = document.createElement("div");
  gsap.set(temp, {
    visibility: "hidden", position: "absolute", width: 0, height: 0,
    top: "50%", left: "50%", xPercent: -50, yPercent: -50
  });
  targets[0].parentNode.append(temp);

  const xSetters = targets.map(el => gsap.quickSetter(el, "x", "px"));
  const ySetters = targets.map(el => gsap.quickSetter(el, "y", "px"));

  function render() {
    let angle = (rotation + activeAngle) * DEG2RAD;
    for (let i = 0; i < quantity; i++) {
      xSetters[i](Math.round(Math.cos(angle) * radiusX));
      ySetters[i](Math.round(Math.sin(angle) * radiusY));
      angle += angleInc * DEG2RAD;
    }
  }
  render();

  function setRotation(val) {
    rotation = wrapAngle(val);
    const idx = wrapIdx(Math.round(-rotation / angleInc));
    const prevActive = activeEl;
    activeEl = targets[idx];
    render();
    if (prevActive !== activeEl) {
      onDeactivate?.(prevActive);
      onActivate?.(activeEl);
    }
  }

  function elementRotation(el) {
    const idx = targets.indexOf(el);
    return (quantity - idx) * angleInc;
  }

  function to(elOrAngle, { duration = 1, ease = "power1.out" } = {}) {
    const targetRot = typeof elOrAngle === "number"
      ? elOrAngle
      : elementRotation(elOrAngle);
    const tween = gsap.to({ rot: rotation }, {
      rot: targetRot, duration, ease, onUpdate() {
        setRotation(this.targets()[0].rot);
      }
    });
    return tween;
  }

  function next() {
    const idx = wrapIdx(targets.indexOf(activeEl) + 1);
    to(targets[idx]);
  }
  function prev() {
    const idx = wrapIdx(targets.indexOf(activeEl) - 1);
    to(targets[idx]);
  }

  // Add event listeners
  targets.forEach(el => {
    el.addEventListener("click", e => {
      if (!dragged) {
        onClick?.(el);
        to(el);
      }
    });
  });

  if (draggable) {
    Draggable.create(temp, {
      type: "rotation",
      snap: gsap.utils.snap(angleInc),
      onPress() {
        dragged = false;
        onStart?.(activeEl);
      },
      onDrag() {
        dragged = true;
        setRotation(this.rotation);
      },
      onRelease() {
        onStop?.(activeEl);
      }
    });
  }

  return { next, prev, to, activeEl };
}

// Scroll navigation
let lastY = 0;
window.addEventListener("scroll", () => {
  const dir = window.scrollY > lastY ? "next" : "prev";
  carousel[dir]();
  lastY = window.scrollY;
});

// Scroll-triggered animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => e.target.classList.toggle("visible", e.isIntersecting));
}, { threshold: 0.1 });
document.querySelectorAll(".scroll-animation").forEach(el => observer.observe(el));

// Pause marquee on hover
const track = document.querySelector(".carousel-track");
track?.addEventListener("mouseenter", () => track.style.animationPlayState = "paused");
track?.addEventListener("mouseleave", () => track.style.animationPlayState = "running");

// Slick carousel for logos
$('.client-logo-slide').slick({
  slidesToShow: 5,
  autoplay: true,
  autoplaySpeed: 2000,
  arrows: false,
  dots: false,
  infinite: true,
  responsive: [
    { breakpoint: 768, settings: { slidesToShow: 3 } },
    { breakpoint: 480, settings: { slidesToShow: 2 } }
  ]
});
