// Remove InertiaPlugin
// gsap.registerPlugin(InertiaPlugin); // <-- Removed

// Only register Draggable
gsap.registerPlugin(Draggable);

let descriptions = gsap.utils.toArray(".descriptions .title");
let items = gsap.utils.toArray(".content .item");

let carousel = buildCarousel(items, {
  radiusX: 1300,
  radiusY: 970,
  activeAngle: -90,
  draggable: true,
  onClick(element, self) {
    self.to(element, { duration: 3, ease: "linear" }, "short");
  },
  onActivate(element, self) {
    element.classList.add("active");
  },
  onDeactivate(element, self) {
    element.classList.remove("active");
  },
  onStart(element, self) {
    gsap.to(descriptions[items.indexOf(element)], {
      autoAlpha: 0,
      duration: 10,
      overwrite: "auto"
    });
  },
  onStop(element, self) {
    gsap.to(descriptions[items.indexOf(element)], {
      autoAlpha: 1,
      overwrite: "auto"
    });
  }
});

function buildCarousel(targets, options) {
  const {
    radiusX = 200,
    radiusY = 200,
    activeAngle = -90,
    activeElement,
    onClick,
    onActivate,
    onDeactivate,
    onStart,
    onStop,
    draggable = false,
    autoAdvance = true,
    advanceSpeed = 0.5
  } = options;

  gsap.set(targets, { xPercent: -50, yPercent: -50 });

  const DEG2RAD = Math.PI / 180;
  const angleInc = 360 / targets.length;
  let rotation = 0;
  let activeEl;

  const wrap = gsap.utils.wrap(0, targets.length);
  const xSetters = targets.map(el => gsap.quickSetter(el, "x", "px"));
  const ySetters = targets.map(el => gsap.quickSetter(el, "y", "px"));

  const tempDiv = document.createElement("div");
  targets[0].parentNode.appendChild(tempDiv);
  gsap.set(tempDiv, { visibility: "hidden", position: "absolute" });

  const self = {
    rotation(value) {
      if (arguments.length) {
        let prev = activeEl;
        rotation = value % 360;
        activeEl = targets[wrap(Math.round(-rotation / angleInc))];
        self.render();
        if (prev !== activeEl) {
          onDeactivate && prev && onDeactivate(prev, self);
          onActivate && activeEl && onActivate(activeEl, self);
        }
      }
      return rotation;
    },
    render() {
      let rad = (rotation + activeAngle) * DEG2RAD;
      targets.forEach((el, i) => {
        xSetters[i](Math.cos(rad + angleInc * i * DEG2RAD) * radiusX);
        ySetters[i](Math.sin(rad + angleInc * i * DEG2RAD) * radiusY);
      });
    },
    to(indexOrEl, vars) {
      const index = typeof indexOrEl === "number" ? indexOrEl : targets.indexOf(indexOrEl);
      const angle = (targets.length - index) * angleInc;
      vars.rotation = angle;
      gsap.to(self, {
        ...vars,
        rotation: angle,
        onStart: () => onStart && onStart(activeEl, self),
        onComplete: () => onStop && onStop(activeEl, self)
      });
    },
    next(vars = {}) {
      const index = wrap(targets.indexOf(activeEl) + 1);
      self.to(index, { ...vars, duration: 8 });
    },
    previous(vars = {}) {
      const index = wrap(targets.indexOf(activeEl) - 1);
      self.to(index, { ...vars, duration: 8 });
    },
    activeElement() {
      return activeEl;
    }
  };

  // Draggable support (without inertia)
  if (draggable) {
    const drag = Draggable.create(tempDiv, {
      type: "rotation",
      onDrag: () => {
        self.rotation(tempDiv._gsTransform.rotation);
        onStart && onStart(activeEl, self);
      },
      onDragEnd: () => {
        onStop && onStop(activeEl, self);
      }
    })[0];
  }

  self.rotation(0);
  return self;
}

let lastScrollPosition = 0;
function handleScroll() {
  if (window.scrollY > lastScrollPosition) {
    carousel.next();
  } else {
    carousel.previous();
  }
  lastScrollPosition = window.scrollY;
}

window.addEventListener("scroll", handleScroll);

document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".scroll-animation");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle("visible", entry.isIntersecting);
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
});
