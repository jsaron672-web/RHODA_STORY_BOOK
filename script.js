// Pagebound - JS features: dark/light mode, like button, show/hide synopsis, reading progress, search + genre filter
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const safe = (fn) => { try { return fn(); } catch (e) { return null; } };

  // Dark / light mode
  const toggle = document.getElementById("theme-toggle");
  const applyTheme = (t) => { root.dataset.theme = t; if (toggle) toggle.textContent = t === "dark" ? "Light mode" : "Dark mode"; };
  applyTheme(safe(() => localStorage.getItem("theme")) || "light");
  toggle && toggle.addEventListener("click", () => {
    const t = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(t); safe(() => localStorage.setItem("theme", t));
  });

  // Hide missing images (colored cover shows instead)
  document.querySelectorAll(".cover img").forEach((img) => img.addEventListener("error", () => (img.style.display = "none")));
  document.querySelectorAll(".reading img").forEach((img) => img.addEventListener("error", () => (img.closest("figure").style.display = "none")));

  // Per-story features: like button + show/hide synopsis
  document.querySelectorAll(".story").forEach((story) => {
    const like = story.querySelector(".like");
    if (like) {
      const key = "like-" + like.dataset.id;
      const render = (on) => { like.setAttribute("aria-pressed", on); like.querySelector(".count").textContent = on ? "(Liked)" : ""; };
      render(safe(() => localStorage.getItem(key)) === "1");
      like.addEventListener("click", () => {
        const on = like.getAttribute("aria-pressed") !== "true";
        render(on); safe(() => localStorage.setItem(key, on ? "1" : "0"));
      });
    }
    const btn = story.querySelector(".syn-toggle"), syn = story.querySelector(".synopsis");
    if (btn && syn) {
      btn.addEventListener("click", () => {
        syn.hidden = !syn.hidden;
        btn.textContent = syn.hidden ? "Show synopsis" : "Hide synopsis";
        btn.setAttribute("aria-expanded", String(!syn.hidden));
      });
    }
  });

  // Reading progress bar
  const bar = document.getElementById("progress");
  if (bar) {
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", update, { passive: true }); update();
  }

  // Library search + genre filter
  const search = document.getElementById("search"), genre = document.getElementById("genre");
  if (search && genre) {
    const cards = document.querySelectorAll("#grid .book-card"), empty = document.getElementById("empty");
    const filter = () => {
      const q = search.value.trim().toLowerCase(); let shown = 0;
      cards.forEach((c) => {
        const ok = c.dataset.title.includes(q) && (genre.value === "all" || c.dataset.genre === genre.value);
        c.hidden = !ok; if (ok) shown++;
      });
      empty.hidden = shown > 0;
    };
    search.addEventListener("input", filter); genre.addEventListener("change", filter);
  }

  // Book details pop-up
  let dlg = null;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const openDetails = (d) => {
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.className = "details-dialog";
      dlg.addEventListener("click", (ev) => { if (ev.target === dlg || ev.target.closest("[data-close]") || ev.target.closest("a")) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.textContent = "";
    const body = el("div", "dlg-body"), cover = el("div", "cover"), img = document.createElement("img");
    cover.appendChild(el("span", "cover-title", d.title));
    img.src = d.cover; img.alt = "Cover of " + d.title; img.addEventListener("error", () => (img.style.display = "none")); cover.appendChild(img);
    const text = el("div", "dlg-text");
    text.append(el("h2", "", d.title), el("p", "author", "by " + d.author), el("p", "genre", d.genre), el("p", "", d.synopsis));
    const acts = el("div", "dlg-actions"), read = el("a", "btn", "Read Story"), close = el("button", "btn ghost", "Close");
    read.href = d.href; close.type = "button"; close.setAttribute("data-close", ""); acts.append(read, close); text.appendChild(acts);
    body.append(cover, text); dlg.appendChild(body); dlg.showModal();
  };
  document.addEventListener("click", (e) => { const b = e.target.closest(".details"); if (b) openDetails(b.dataset); });

  // Interactive buttons: random story + text size
  document.querySelectorAll(".surprise").forEach((b) => b.addEventListener("click", () => {
    const n = String(1 + Math.floor(Math.random() * 30)).padStart(2, "0"), href = b.dataset.pattern.replace("@@", n);
    if (href[0] === "#") { const a = document.createElement("a"); a.href = href; document.body.appendChild(a); a.click(); a.remove(); } else location.href = href;
  }));
  const sizes = ["1.15rem", "1.35rem", "1.55rem"];
  document.querySelectorAll(".size-btn").forEach((b) => { let i = 0; b.addEventListener("click", () => {
    i = (i + 1) % sizes.length; b.closest(".story").querySelector(".reading").style.fontSize = sizes[i];
    b.textContent = "Text size " + (i + 1) + "/3";
  }); });

  // Reading progress label
  const label = document.getElementById("progress-label");
  if (label) {
    const upd = () => { const h = document.documentElement.scrollHeight - window.innerHeight; label.textContent = Math.round(h > 0 ? (window.scrollY / h) * 100 : 0) + "% read"; };
    window.addEventListener("scroll", upd, { passive: true }); upd();
  }

  // Image slideshow (home page)
  const slides = document.querySelectorAll(".slide");
  if (slides.length) {
    const dots = document.getElementById("dots"); let cur = 0, timer = null;
    const go = (i) => { cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("active", k === cur));
      dots.querySelectorAll("button").forEach((d, k) => d.classList.toggle("on", k === cur)); };
    slides.forEach((_, k) => { const d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Go to slide " + (k + 1)); d.addEventListener("click", () => go(k)); dots.appendChild(d); });
    document.getElementById("prev").addEventListener("click", () => go(cur - 1));
    document.getElementById("next").addEventListener("click", () => go(cur + 1));
    const box = document.querySelector(".slideshow");
    const start = () => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => go(cur + 1), 5000); };
    const stop = () => clearInterval(timer);
    box.addEventListener("mouseenter", stop); box.addEventListener("mouseleave", () => { stop(); start(); });
    go(0); start();
  }
});
