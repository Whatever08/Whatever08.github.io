// No longer using InertiaPlugin
// gsap.registerPlugin(Draggable);

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

function buildCarousel(
  targets,
  {
    radiusX = 200,
    radiusY = 200,
    activeAngle = -90,
    activeElement,
    onClick,
    onActivate,
    onDeactivate,
    onStart,
    onStop,
    draggable,
    autoAdvance = true,
    advanceSpeed = 0.5
  }
) {
  gsap.set(targets, { xPercent: -50, yPercent: -50 });
  let DEG2RAD = Math.PI / 180,
    round = (v) => Math.round(v * 10000) / 10000,
    tempDiv = document.createElement("div"),
    quantity = targets.length,
    angleInc = 360 / quantity,
    wrap = gsap.utils.wrap(0, quantity),
    angleWrap = gsap.utils.wrap(0, 360),
    rotation = 0,
    dragged,
    velocity = 0,
    raf,
    onPressRotation,
    autoAdvanceCall = autoAdvance && gsap.delayedCall(autoAdvance, tick),
    xSetters = targets.map((el) => gsap.quickSetter(el, "x", "px")),
    ySetters = targets.map((el) => gsap.quickSetter(el, "y", "px")),
    self = {
      rotation(value) {
        if (arguments.length) {
          let prev = activeElement;
          rotation = angleWrap(value);
          activeElement = targets[wrap(Math.round(-value / angleInc))];
          self.render();
          if (prev !== activeElement) {
            onDeactivate && prev && onDeactivate(prev, self);
            onActivate && activeElement && onActivate(activeElement, self);
          }
        }
        return rotation;
      },
      render() {
        let inc = angleInc * DEG2RAD,
          a = (rotation + activeAngle) * DEG2RAD;
        for (let i = 0; i < quantity; i++) {
          xSetters[i](round(Math.cos(a) * radiusX));
          ySetters[i](round(Math.sin(a) * radiusY));
          a += inc;
        }
      },
      to(elOrRot, vars, dir) {
        vars = vars || {};
        vars.rotation = typeof elOrRot === "number" ? elOrRot : self.elementRotation(elOrRot);
        vars.overwrite = true;
        let { onUpdate, onComplete } = vars,
          _onStart = vars.onStart;
        autoAdvanceCall && autoAdvanceCall.pause();
        vars.onStart = () => {
          onStart && onStart(activeElement, self);
          _onStart && _onStart();
        };
        vars.onComplete = () => {
          onStop && onStop(activeElement, self);
          onComplete && onComplete();
          autoAdvanceCall && autoAdvanceCall.restart(true);
        };
        return gsap.to(self, vars);
      },
      next(vars = {}, dir) {
        vars.duration = 8;
        self.to(targets[wrap(targets.indexOf(activeElement) + 1)], vars, dir || "ccw");
      },
      previous(vars = {}, dir) {
        vars.duration = 8;
        self.to(targets[wrap(targets.indexOf(activeElement) - 1)], vars, dir || "cw");
      },
      activeElement(v) {
        if (v) self.rotation(self.elementRotation(v));
        return activeElement;
      },
      elementRotation(el) {
        let idx = targets.indexOf(gsap.utils.toArray(el)[0]);
        return (quantity - idx) * angleInc;
      },
      kill() {
        cancelAnimationFrame(raf);
        gsap.killTweensOf(self);
        autoAdvanceCall && autoAdvanceCall.kill();
        draggable && draggable.kill();
      }
    };

  function tick() {
    self.next();
    autoAdvanceCall.restart(true);
  }

  function throwInertia() {
    velocity *= 0.95;
    if (Math.abs(velocity) > 0.1) {
      rotation += velocity;
      self.rotation(rotation);
      raf = requestAnimationFrame(throwInertia);
    } else {
      cancelAnimationFrame(raf);
      autoAdvanceCall && autoAdvanceCall.restart(true);
      onStop && onStop(activeElement, self);
    }
  }

  tempDiv.style.cssText = "position:absolute;width:0;height:0;top:50%;left:50%;pointer-events:none;";
  targets[0].parentNode.appendChild(tempDiv);

  if (draggable) {
    self.draggable = Draggable.create(tempDiv, {
      type: "rotation",
      onPress() {
        cancelAnimationFrame(raf);
        velocity = 0;
        onPressRotation = rotation;
        gsap.set(tempDiv, { rotation });
        autoAdvanceCall && autoAdvanceCall.pause();
        gsap.killTweensOf(self);
        dragged = false;
      },
      onDrag() {
        let delta = this.get("rotation") - rotation;
        velocity = delta;
        dragged = true;
        self.rotation(this.get("rotation"));
        onStart && onStart(activeElement, self);
      },
      onRelease(e) {
        if (!dragged) {
          onClick && onClick(e.currentTarget, self);
          autoAdvanceCall && autoAdvanceCall.restart(true);
          return;
        }
        throwInertia();
      }
    })[0];
  } else {
    targets.forEach((el) => el.addEventListener("click", (e) => onClick && onClick(e.currentTarget, self)));
  }

  self.activeElement(gsap.utils.toArray(activeElement)[0] || targets[0]);
  return self;
}

function handleScroll() {
  if (window.scrollY > lastScrollPosition) {
    carousel.next();
  } else {
    carousel.previous();
  }
  lastScrollPosition = window.scrollY;
}

let lastScrollPosition = 0;
window.addEventListener("scroll", handleScroll);

document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".scroll-animation");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      } else {
        entry.target.classList.remove("visible");
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
});

const track = document.querySelector('.carousel-track');
let isPaused = false;
track.addEventListener('mouseenter', () => {
  isPaused = true;
  track.style.animationPlayState = 'paused';
});
track.addEventListener('mouseleave', () => {
  isPaused = false;
  track.style.animationPlayState = 'running';
});

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
