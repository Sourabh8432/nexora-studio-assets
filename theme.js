/* Nexora Theme Engine - Core Utilities & Global UI */
var $ = function(selector, context) { return (context || document).querySelector(selector); };
var $$ = function(selector, context) { return (context || document).querySelectorAll(selector); };

function decodeHtml(value) {
  var txt = document.createElement('textarea');
  txt.innerHTML = value || '';
  return txt.value;
}
function cleanText(value) {
  return decodeHtml(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

const NEXORA_INFO = {
  name: "Nexora Studio AI",
  version: "1.1.0",
  author: "Nexora Architecture"
};

(function initThemeEngine() {
  console.log(`%c ${NEXORA_INFO.name} v${NEXORA_INFO.version} %c Running `, 'background:#2f5d8a;color:#fff;padding:2px 5px;border-radius:3px 0 0 3px;', 'background:#4c4c4c;color:#fff;padding:2px 5px;border-radius:0 3px 3px 0;');

  // Theme Toggle (Dark/Light)
  function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    let theme = localStorage.getItem('theme') || 'light';
    toggle.setAttribute('aria-pressed', theme === 'dark');
    toggle.addEventListener('click', () => {
      theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      toggle.setAttribute('aria-pressed', theme === 'dark');
    });
  }

  // Mobile Menu
  function initHeader() {
    var mobileBtn = document.getElementById('mobileMenuTrigger');
    var nav = document.getElementById('mobileNav');
    if (mobileBtn && nav) {
      mobileBtn.addEventListener('click', function() {
        var isActive = !nav.classList.contains('mobile-active');
        nav.classList.toggle('mobile-active', isActive);
        mobileBtn.setAttribute('aria-expanded', isActive);
      });
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav) {
        nav.classList.remove('mobile-active');
        if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // UI Components
  function initScrollTop() {
    var btn = document.getElementById('scrollTop');
    if (!btn) return;
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 400) btn.classList.add('show');
      else btn.classList.remove('show');
    }, { passive: true });
    btn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function initReadingProgress() {
    const bar = document.getElementById('progressBar');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const winScroll = window.pageYOffset || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      bar.style.width = scrolled + "%";
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  function initImageOptimization() {
    const images = document.querySelectorAll('.post-body img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) img.setAttribute('alt', document.title + ' Image ' + (index + 1));
      if (index === 0) img.setAttribute('fetchpriority', 'high');
      else { img.setAttribute('loading', 'lazy'); img.setAttribute('fetchpriority', 'low'); }
      img.setAttribute('decoding', 'async');
      if (!img.getAttribute('width')) img.setAttribute('width', '1200');
      if (!img.getAttribute('height')) img.setAttribute('height', '630');
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", function() {
    initTheme();
    initHeader();
    initScrollTop();
    initReadingProgress();
    initImageOptimization();
  });
})();
