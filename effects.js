/* Scrolleffekter for Om Marianne og sidene om konsertprogrammene.
   1. Innhold glir opp fra bunnen og tones inn når det kommer til syne.
   2. Bildene i historiene beveger seg litt saktere enn siden (parallakse).
   Alt er avslått for dem som har valgt redusert bevegelse, og uten JavaScript vises alt som vanlig. */
(function () {
  if (!("IntersectionObserver" in window)) {
    return;
  }
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var root = document.documentElement;
  root.classList.add("has-effects");

  /* ---------- 1. Innglidning ---------- */

  var revealSelector = [
    ".section-head",
    ".intro-grid",
    ".story",
    ".program-card",
    ".upcoming-card",
    ".gallery-item",
    ".album-card",
    ".video-card",
    ".event-item",
    ".contact-grid",
    ".program-hero-grid",
    ".program-details-grid"
  ].join(",");

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var element = entry.target;
        element.classList.add("is-revealed");
        revealObserver.unobserve(element);
        /* Rydd opp etterpå, så elementenes egne hovereffekter virker som før. */
        element.addEventListener("transitionend", function done(event) {
          if (event.target !== element || event.propertyName !== "transform") {
            return;
          }
          element.removeEventListener("transitionend", done);
          element.classList.remove("reveal", "is-revealed");
          element.style.transitionDelay = "";
        });
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -6% 0px"
  });

  document.querySelectorAll(revealSelector).forEach(function (element) {
    /* Elementer i samme rutenett kommer litt etter hverandre. */
    var siblings = element.parentElement ? element.parentElement.children : [];
    var index = Array.prototype.indexOf.call(siblings, element);
    if (siblings.length > 1 && index > 0) {
      element.style.transitionDelay = (index % 5) * 90 + "ms";
    }
    element.classList.add("reveal");
    revealObserver.observe(element);
  });

  /* ---------- 2. Parallakse på bildene i historiene ---------- */

  var parallaxImages = Array.prototype.slice.call(
    document.querySelectorAll(".history .story-media img")
  );
  if (!parallaxImages.length) {
    return;
  }

  var MAX_SHIFT = 22; /* piksler opp eller ned */
  var ticking = false;

  function updateParallax() {
    var viewport = window.innerHeight;
    parallaxImages.forEach(function (image) {
      var rect = image.parentElement.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > viewport + 100) {
        return;
      }
      /* -1 når bildet er nederst i vinduet, 1 når det er øverst */
      var progress = (viewport / 2 - (rect.top + rect.height / 2)) / (viewport / 2 + rect.height / 2);
      progress = Math.max(-1, Math.min(1, progress));
      image.style.setProperty("--parallax", (progress * MAX_SHIFT).toFixed(1) + "px");
    });
    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    }
  }

  root.classList.add("has-parallax");
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateParallax();
})();
