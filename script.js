gsap.registerPlugin(Draggable, InertiaPlugin);

let descriptions = gsap.utils.toArray(".descriptions .title");
let items = gsap.utils.toArray(".content .item");

let carousel = buildCarousel(items, {
  radiusX: 1300,
  radiusY: 970,
  activeAngle: -90,
  draggable: true,
  // autoAdvance: 2, // seconds between next() calls
  onClick(element, self) {
    self.to(element, { duration: 3, ease: "linear" }, "short");
  },
  onActivate(element, self) {
    element.classList.add("active");
  },
  onDeactivate(element, self) {
    element.classList.remove("active");
  },
  // when a drag or animation starts (via the Carousel's to()/next()/previous() methods)
  onStart(element, self) {
    gsap.to(descriptions[items.indexOf(element)], {
      autoAlpha: 0,
      duration: 10,
      overwrite: "auto"
    });
  },
  onStop(element, self) {
    gsap.to(descriptions[items.indexOf(element)], { autoAlpha: 1, overwrite: "auto" });
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
    autoAdvance=true,
    advanceSpeed = 0.5,
  }
) {

  gsap.set(targets, { xPercent: -50, x: 0, yPercent: -50, y: 0 });
  let DEG2RAD = Math.PI / 180,
    eventTypes = (
      "ontouchstart" in document.documentElement
        ? "touchstart,touchmove,touchcancel,touchend"
        : !("onpointerdown" in document.documentElement)
        ? "mousedown,mousemove,mouseup,mouseup"
        : "pointerdown,pointermove,pointercancel,pointerup"
    ).split(","),
    round = (value) => Math.round(value * 10000) / 10000,
    tempDiv = document.createElement("div"),
    quantity = targets.length,
    angleInc = 360 / quantity,
    wrap = gsap.utils.wrap(0, quantity),
    angleWrap = gsap.utils.wrap(0, 360),
    rotation = 0,
    dragged,
    onPressRotation,
    autoAdvanceCall =
      autoAdvance &&
      gsap.delayedCall(parseFloat(autoAdvance) || 2, () => {
        self.next();
        autoAdvanceCall.restart(true);
      }),
    xSetters = targets.map((el) => gsap.quickSetter(el, "x", "px")),
    ySetters = targets.map((el) => gsap.quickSetter(el, "y", "px")),
    self = {
      rotation(value) {
        if (arguments.length) {
          let prevActive = activeElement;
          rotation = angleWrap(value);
          activeElement = targets[wrap(Math.round(-value / angleInc))];
          self.render();
          if (prevActive !== activeElement) {
            onDeactivate && prevActive && onDeactivate(prevActive, self);
            onActivate && onActivate(activeElement, self);
          }
        }
        return rotation;
      },
      resize(rx, ry) {
        radiusX = rx;
        radiusY = ry;
        self.render();
      },
      render() {
        let inc = angleInc * DEG2RAD,
          a = (rotation + activeAngle) * DEG2RAD,
          i = 0;
        for (; i < quantity; i++) {
          xSetters[i](round(Math.cos(a) * radiusX));
          ySetters[i](round(Math.sin(a) * radiusY));
          a += inc;
        }
      },
      activeElement(value) {
        if (arguments.length) {
          self.rotation(self.elementRotation(value));
        }
        return activeElement;
      },
      elementRotation(element) {
        let index = targets.indexOf(gsap.utils.toArray(element)[0]);
        return (quantity - index) * angleInc;
      },
      to(elOrRotation, vars, direction) {
        vars = vars || {};
        vars.rotation =
          typeof elOrRotation === "number"
            ? elOrRotation
            : self.elementRotation(elOrRotation) || parseFloat(elOrRotation);
        vars.overwrite = true;
        let { onUpdate, onComplete } = vars,
          _onStart = vars.onStart;
        autoAdvanceCall && autoAdvanceCall.pause();
        vars.onStart = function () {
          onStart && onStart(activeElement, self);
          _onStart && _onStart.call(this);
        };
        vars.onComplete = function () {
          onStop && onStop(activeElement, self);
          onComplete && onComplete.call(this);
          autoAdvanceCall && autoAdvanceCall.restart(true);
        };
        if (direction) {
          let getter = gsap.getProperty(tempDiv);
          vars.onUpdate = function () {
            self.rotation(getter("rotation"));
            onUpdate && onUpdate.call(this);
          };
          vars.rotation += "_" + direction;
          return gsap.fromTo(tempDiv, { rotation: rotation }, vars);
        }
        return gsap.to(self, vars);
      },
      next(vars, direction) {
        vars = {
          ...vars,
          duration: 8
        };
        let element = targets[wrap(targets.indexOf(activeElement) + 1)];
        self.to(element, vars, direction || "ccw");
      },
      previous(vars, direction) {
        vars = {
          ...vars,
          duration: 8
        };
        let element = targets[wrap(targets.indexOf(activeElement) - 1)];
        self.to(element, vars, direction || "cw");
      },
      kill() {
        targets.forEach((el) => {
          el.removeEventListener("click", _onClick);
          el.removeEventListener(eventTypes[0], onPress);
          el.removeEventListener(eventTypes[2], onRelease);
          el.removeEventListener(eventTypes[3], onRelease);
        });
        gsap.killTweensOf(self);
        tempDiv.parentNode && tempDiv.parentNode.removeChild(tempDiv);
        autoAdvanceCall && autoAdvanceCall.kill();
        draggable && draggable.kill();
      },
      autoAdvance: autoAdvanceCall
    },
    _onClick = (e) => {
      if (!dragged) {
        autoAdvanceCall && autoAdvanceCall.restart(true);
        onClick && onClick(e.currentTarget, self);
      }
    },
    onPress = (e) => {
      onPressRotation = rotation;
      gsap.set(tempDiv, { rotation: rotation });
      autoAdvanceCall && autoAdvanceCall.pause();
      gsap.killTweensOf(self);
      draggable.startDrag(e);
      dragged = false;
    },
    onRelease = (e) => {
      draggable.endDrag(e);
      if (rotation === onPressRotation) {
        autoAdvanceCall && autoAdvanceCall.restart(true);
        draggable.tween && draggable.tween.kill();
        _onClick(e);
      }
    },
    syncDraggable = () => {
      if (!dragged) {
        onStart && onStart(activeElement, self);
        dragged = true;
      }
      self.rotation(draggable.rotation);
    };
  targets[0].parentNode.appendChild(tempDiv);
  gsap.set(tempDiv, {
    visibility: "hidden",
    position: "absolute",
    width: 0,
    height: 0,
    top: "50%",
    left: "50%",
    xPercent: -50,
    yPercent: -50
  });
  targets.forEach((el) => {
    if (draggable) {
      el.addEventListener(eventTypes[0], onPress);
      el.addEventListener(eventTypes[2], onRelease);
      el.addEventListener(eventTypes[3], onRelease);
    } else {
      el.addEventListener("click", _onClick);
    }
  });

  self.snap = angleInc;
  draggable &&
    (self.draggable = draggable =
      Draggable.create(tempDiv, {
        type: "rotation",
        snap: gsap.utils.snap(angleInc),
        inertia: true,
        onThrowComplete: () => {
          autoAdvanceCall && autoAdvanceCall.restart(true);
          onStop && onStop(activeElement, self);
        },
        onThrowUpdate: syncDraggable,
        onDrag: syncDraggable
      })[0]);
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
  }, {
    threshold: 0.1
  });

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
 
