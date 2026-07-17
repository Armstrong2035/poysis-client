(function () {
  "use strict";

  // ── Find the script tag that loaded this file ───────────────────────────
  var script =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var notebookId = script.getAttribute("data-notebook-id");
  if (!notebookId) {
    console.warn("[Poysis] Missing data-notebook-id on embed script. Widget not loaded.");
    return;
  }

  // ── Config from data attributes (all optional) ──────────────────────────
  var label    = script.getAttribute("data-label")  || "Ask us anything";
  var color    = script.getAttribute("data-color")  || "#000000";
  var origin   = script.getAttribute("data-origin") || (function () {
    // Derive the Poysis host from the script src URL
    var src = script.getAttribute("src") || "";
    var m = src.match(/^(https?:\/\/[^/]+)/);
    return m ? m[1] : "https://poysis.app";
  })();

  var IFRAME_URL = origin + "/preview?id=" + encodeURIComponent(notebookId) + "&embed=true";
  var BUBBLE_SIZE = 56;
  var WIDGET_W    = 400;
  var WIDGET_H    = 620;
  var MARGIN      = 20;
  var RADIUS      = "16px";
  var Z           = 2147483647; // max z-index

  // ── State ────────────────────────────────────────────────────────────────
  var isOpen = false;
  var iframe = null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function css(el, styles) {
    Object.assign(el.style, styles);
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return r + "," + g + "," + b;
  }

  // ── Bubble button ────────────────────────────────────────────────────────
  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", label);
  bubble.setAttribute("title", label);
  css(bubble, {
    position:     "fixed",
    bottom:       MARGIN + "px",
    right:        MARGIN + "px",
    width:        BUBBLE_SIZE + "px",
    height:       BUBBLE_SIZE + "px",
    borderRadius: "50%",
    backgroundColor: color,
    border:       "none",
    cursor:       "pointer",
    boxShadow:    "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    zIndex:       Z + "",
    transition:   "transform 0.2s ease, box-shadow 0.2s ease",
    padding:      "0",
    outline:      "none",
    WebkitFontSmoothing: "antialiased",
  });

  // Icon — chat bubble SVG when closed, X when open
  var iconChat = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var iconClose = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  bubble.innerHTML = iconChat;

  bubble.addEventListener("mouseenter", function () {
    css(bubble, { transform: "scale(1.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)" });
  });
  bubble.addEventListener("mouseleave", function () {
    css(bubble, { transform: "scale(1)", boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)" });
  });

  // ── Widget popover ───────────────────────────────────────────────────────
  var widget = document.createElement("div");
  css(widget, {
    position:     "fixed",
    bottom:       (MARGIN + BUBBLE_SIZE + 12) + "px",
    right:        MARGIN + "px",
    width:        WIDGET_W + "px",
    height:       WIDGET_H + "px",
    borderRadius: RADIUS,
    overflow:     "hidden",
    boxShadow:    "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)",
    zIndex:       (Z - 1) + "",
    opacity:      "0",
    transform:    "translateY(16px) scale(0.97)",
    pointerEvents: "none",
    transition:   "opacity 0.25s ease, transform 0.25s ease",
    border:       "1px solid rgba(0,0,0,0.08)",
  });

  // ── Toggle ───────────────────────────────────────────────────────────────
  function open() {
    isOpen = true;
    bubble.innerHTML = iconClose;

    // Lazy-create iframe on first open
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.setAttribute("src", IFRAME_URL);
      iframe.setAttribute("allow", "clipboard-write");
      iframe.setAttribute("title", label);
      css(iframe, {
        width:  "100%",
        height: "100%",
        border: "none",
        display: "block",
      });
      widget.appendChild(iframe);
    }

    css(widget, { opacity: "1", transform: "translateY(0) scale(1)", pointerEvents: "auto" });
  }

  function close() {
    isOpen = false;
    bubble.innerHTML = iconChat;
    css(widget, { opacity: "0", transform: "translateY(16px) scale(0.97)", pointerEvents: "none" });
  }

  bubble.addEventListener("click", function () {
    isOpen ? close() : open();
  });

  // Close on Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) close();
  });

  // ── Responsive: collapse to full-screen on narrow viewports ─────────────
  function applyResponsive() {
    if (window.innerWidth < 480) {
      css(widget, {
        right:  "0",
        bottom: "0",
        left:   "0",
        width:  "100%",
        height: "85dvh",
        borderRadius: RADIUS + " " + RADIUS + " 0 0",
      });
    } else {
      css(widget, {
        right:        MARGIN + "px",
        bottom:       (MARGIN + BUBBLE_SIZE + 12) + "px",
        left:         "auto",
        width:        WIDGET_W + "px",
        height:       WIDGET_H + "px",
        borderRadius: RADIUS,
      });
    }
  }
  applyResponsive();
  window.addEventListener("resize", applyResponsive);

  // ── Mount ────────────────────────────────────────────────────────────────
  document.body.appendChild(widget);
  document.body.appendChild(bubble);
})();
