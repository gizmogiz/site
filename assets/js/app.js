/* Anna — content render + atlas */
(function () {
  const DATA_URL = "content/site.json";

  const IG_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSocial(social) {
    const nav = document.getElementById("social-links");
    if (!nav || !social) return;
    nav.innerHTML = social
      .map(function (s) {
        if (s.icon === "ig") {
          return (
            '<a class="ig" href="' +
            esc(s.href) +
            '" rel="me" aria-label="Instagram">' +
            IG_SVG +
            "</a>"
          );
        }
        return (
          '<a href="' + esc(s.href) + '" rel="me">' + esc(s.label) + "</a>"
        );
      })
      .join("");
  }

  function renderProjects(projects) {
    const root = document.getElementById("projects-list");
    if (!root || !projects) return;
    const list = Array.isArray(projects)
      ? projects
      : [].concat(projects.main || [], projects.side || []);
    root.innerHTML =
      '<ul class="proj-list">' +
      list
        .map(function (p) {
          const name = p.href
            ? '<a href="' + esc(p.href) + '">' + esc(p.name) + "</a>"
            : "<span>" + esc(p.name) + "</span>";
          const ig = p.instagram
            ? '<a class="ig" href="' +
              esc(p.instagram) +
              '" aria-label="' +
              esc(p.name) +
              ' on Instagram">' +
              IG_SVG +
              "</a>"
            : "";
          return (
            "<li><div class=\"row\">" +
            name +
            ig +
            '</div><p class="blurb">' +
            esc(p.blurb) +
            "</p></li>"
          );
        })
        .join("") +
      "</ul>";
  }

  function renderWriting(writing) {
    const root = document.getElementById("writing-list");
    if (!root || !writing) return;
    root.innerHTML = writing
      .map(function (group) {
        const items = (group.items || [])
          .map(function (item) {
            const lang = item.lang === "zh" ? " cjk" : "";
            return (
              "<li><div class=\"row\"><a class=\"" +
              lang.trim() +
              '" href="' +
              esc(item.href) +
              '">' +
              esc(item.title) +
              '</a><span class="meta">' +
              esc(item.date) +
              "</span></div><p class=\"blurb" +
              lang +
              '">' +
              esc(item.blurb) +
              "</p></li>"
            );
          })
          .join("");
        return (
          '<p class="catlabel">' +
          esc(group.category) +
          '</p><ul class="proj-list">' +
          items +
          "</ul>"
        );
      })
      .join("");
  }

  function renderDefaults(defaults) {
    const ol = document.getElementById("defaults-list");
    if (!ol || !defaults) return;
    ol.innerHTML = defaults
      .map(function (d) {
        return "<li>" + esc(d) + "</li>";
      })
      .join("");
  }

  function popupHTML(s) {
    let h = '<div class="pop"><h3>' + esc(s.name) + "</h3>";
    if (s.sub) h += '<p class="g">' + esc(s.sub) + "</p>";
    if (s.note) h += '<p class="g">' + esc(s.note) + "</p>";
    return h + "</div>";
  }

  function makeLayer(items, color) {
    return L.layerGroup(
      items.map(function (s) {
        return L.circleMarker([s.lat, s.lng], {
          radius: 6,
          color: "#1A1A17",
          weight: 1,
          fillColor: color,
          fillOpacity: 0.95,
        })
          .bindTooltip(s.name)
          .bindPopup(popupHTML(s));
      })
    );
  }

  function initMap(data) {
    const el = document.getElementById("atlas-map");
    if (!el || typeof L === "undefined") {
      showMapError("Map library failed to load. Check your network.");
      return;
    }

    const map = L.map(el, {
      scrollWheelZoom: false,
      worldCopyJump: true,
      minZoom: 1,
      maxZoom: 12,
    }).setView([40.5, -74], 4);

    el.addEventListener("mouseenter", function () {
      map.scrollWheelZoom.enable();
    });
    el.addEventListener("mouseleave", function () {
      map.scrollWheelZoom.disable();
    });

    // OSM only — avoid Carto "API key required" watermark tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abc",
      maxZoom: 19,
    }).addTo(map);

    const climbingLayer = makeLayer(data.climbing || [], "#B86B7A").addTo(map);
    const travelLayer = makeLayer(data.travel || [], "#5A3A52").addTo(map);
    L.control
      .layers(
        null,
        {
          "● Climbing": climbingLayer,
          "● Travel": travelLayer,
        },
        { collapsed: false, position: "topright" }
      )
      .addTo(map);

    function refreshSize() {
      map.invalidateSize();
    }
    window.addEventListener("resize", refreshSize);
    requestAnimationFrame(function () {
      refreshSize();
      setTimeout(refreshSize, 250);
      setTimeout(refreshSize, 900);
    });

    const atlas = document.getElementById("atlas");
    if (atlas && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) refreshSize();
          });
        },
        { threshold: 0.15 }
      );
      io.observe(atlas);
    }
  }

  function showMapError(msg) {
    const el = document.getElementById("atlas-map");
    if (!el) return;
    el.innerHTML =
      '<div class="map-fallback"><p>' + esc(msg) + "</p></div>";
  }

  function initMotion() {
    document.documentElement.classList.add("js");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      io.observe(el);
    });
  }

  function openTarget() {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el && el.tagName === "DETAILS") el.open = true;
  }

  function wireChrome() {
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      a.target = "_blank";
      a.rel = "noopener";
    });
    window.addEventListener("hashchange", openTarget);
    openTarget();
    document.querySelectorAll('.nav a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () {
        const t = document.querySelector(a.getAttribute("href"));
        if (t && t.tagName === "DETAILS") t.open = true;
      });
    });
  }

  function applyMeta(meta) {
    if (!meta) return;
    const brand = document.getElementById("brand-name");
    const tag = document.getElementById("brand-tag");
    const sub = document.getElementById("brand-sub");
    const updated = document.getElementById("updated");
    if (brand) brand.textContent = meta.name || "Anna";
    if (tag) tag.textContent = meta.tagline || "";
    if (sub) sub.textContent = meta.subline || "";
    if (updated && meta.updated) updated.textContent = "Updated " + meta.updated;
  }

  function boot(data) {
    applyMeta(data.meta);
    renderSocial(data.social);
    renderProjects(data.projects);
    renderWriting(data.writing);
    renderDefaults(data.defaults);
    initMap(data);
    initMotion();
    wireChrome();
  }

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("Could not load " + DATA_URL);
      return r.json();
    })
    .then(boot)
    .catch(function (err) {
      console.error(err);
      const main = document.getElementById("content-status");
      if (main) {
        main.hidden = false;
        main.textContent =
          "Could not load content. Serve this folder over HTTP (see CONTENT.md).";
      }
      initMotion();
      wireChrome();
      showMapError("Content failed to load, so the atlas could not start.");
    });
})();
