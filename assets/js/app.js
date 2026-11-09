/* Anna — site runtime: content render, atlas map, scroll motion */
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
    const blocks = [];
    if (projects.main && projects.main.length) {
      blocks.push('<p class="catlabel">Main Quest</p><ul class="proj-list">');
      projects.main.forEach(function (p) {
        blocks.push(projectItem(p));
      });
      blocks.push("</ul>");
    }
    if (projects.side && projects.side.length) {
      blocks.push('<p class="catlabel">Side Quests</p><ul class="proj-list">');
      projects.side.forEach(function (p) {
        blocks.push(projectItem(p));
      });
      blocks.push("</ul>");
    }
    root.innerHTML = blocks.join("");
  }

  function projectItem(p) {
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
    ol.innerHTML = defaults.map(function (d) {
      return "<li>" + esc(d) + "</li>";
    }).join("");
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
          radius: 5,
          color: "#1A1A17",
          weight: 1,
          fillColor: color,
          fillOpacity: 0.92,
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
      maxZoom: 8,
    }).setView([25, 15], 2);

    el.addEventListener("mouseenter", function () {
      map.scrollWheelZoom.enable();
    });
    el.addEventListener("mouseleave", function () {
      map.scrollWheelZoom.disable();
    });

    // Prefer OSM (no API key). Fall back if a provider starts failing.
    const tiles = [
      {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        opts: {
          attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
          subdomains: "abc",
          maxZoom: 19,
        },
      },
      {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        opts: {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          subdomains: "abcd",
          maxZoom: 19,
        },
      },
    ];

    let tileIndex = 0;
    let errorBurst = 0;
    let layer = L.tileLayer(tiles[0].url, tiles[0].opts).addTo(map);
    layer.on("tileerror", function () {
      errorBurst += 1;
      if (errorBurst < 4 || tileIndex >= tiles.length - 1) return;
      tileIndex += 1;
      errorBurst = 0;
      map.removeLayer(layer);
      layer = L.tileLayer(tiles[tileIndex].url, tiles[tileIndex].opts).addTo(
        map
      );
    });

    const climbingLayer = makeLayer(data.climbing || [], "#E85D4C").addTo(map);
    const travelLayer = makeLayer(data.travel || [], "#2F6F6A").addTo(map);
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
      setTimeout(refreshSize, 200);
      setTimeout(refreshSize, 800);
    });

    const atlas = document.getElementById("atlas");
    if (atlas && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) refreshSize();
          });
        },
        { threshold: 0.2 }
      );
      io.observe(atlas);
    }
  }

  function showMapError(msg) {
    const el = document.getElementById("atlas-map");
    if (!el) return;
    el.innerHTML =
      '<div class="map-fallback"><p>' +
      esc(msg) +
      "</p><p class=\"muted\">Climbing &amp; travel pins still live in <code>content/site.json</code>.</p></div>";
  }

  function initMotion() {
    document.documentElement.classList.add("js");

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        io.observe(el);
      });
    } else {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("in");
      });
    }

    const heroCollage = document.querySelector(".hero-collage");
    if (heroCollage) {
      window.addEventListener(
        "scroll",
        function () {
          const y = Math.min(window.scrollY, 600);
          heroCollage.style.transform = "translate3d(0," + y * 0.18 + "px,0)";
        },
        { passive: true }
      );
    }

    const stickyFrames = document.querySelectorAll("[data-sticky-frame]");
    if (stickyFrames.length && "IntersectionObserver" in window) {
      const sio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            stickyFrames.forEach(function (f) {
              f.classList.remove("is-active");
            });
            e.target.classList.add("is-active");
          });
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      );
      stickyFrames.forEach(function (f) {
        sio.observe(f);
      });
    }
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
    if (updated && meta.updated) {
      updated.textContent = "Updated " + meta.updated;
    }
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
          "Could not load content/site.json. Serve the folder over HTTP (see CONTENT.md).";
      }
      initMotion();
      wireChrome();
      showMapError("Content failed to load, so the atlas could not start.");
    });
})();
