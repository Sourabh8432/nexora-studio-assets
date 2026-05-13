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


/* Nexora Ajax Feeds - Home Media & Latest Posts Logic */
(function initNexoraFeeds() {
  var $ = function(selector, context) { return (context || document).querySelector(selector); };
  var $$ = function(selector, context) { return (context || document).querySelectorAll(selector); };

  async function fetchBloggerFeed(label, limit) {
    const feedUrl = label === 'ALL' 
      ? `/feeds/posts/default?alt=json&max-results=${limit}` 
      : `/feeds/posts/default/-/${label}?alt=json&max-results=${limit}`;
    try {
      const response = await fetch(feedUrl);
      const data = await response.json();
      return data.feed.entry || [];
    } catch (err) {
      console.error('Nexora Feed Error:', err);
      return [];
    }
  }

  function getPostData(entry) {
    const title = entry.title.$t;
    const url = entry.link.find(l => l.rel === 'alternate').href;
    let thumb = '';
    if (entry.media$thumbnail) thumb = entry.media$thumbnail.url.replace('s72-c', 'w600-h400-c');
    else if (entry.content && entry.content.$t.includes('<img')) {
       const match = entry.content.$t.match(/<img.*?src=["'](.*?)["']/);
       if (match) thumb = match[1];
    }
    const snippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t.replace(/<[^>]*>/g, '').substring(0, 100) : '');
    const date = new Date(entry.published.$t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { title, url, thumb, snippet, date };
  }

  function renderMediaCard(post, type) {
    const isPodcast = type === 'podcast';
    return `
      <div class="media-card ${isPodcast ? 'podcast-item' : ''}">
        <a href="${post.url}" class="media-thumb">
          <img src="${post.thumb || 'https://via.placeholder.com/600x400'}" alt="${post.title}" loading="lazy"/>
          ${!isPodcast ? '<span class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>' : ''}
        </a>
        <div class="media-info">
          <span class="media-date">${post.date}</span>
          <h3 class="media-title"><a href="${post.url}">${post.title}</a></h3>
        </div>
      </div>
    `;
  }

  function renderLatestCard(post) {
    return `
      <div class="latest-card">
        <a href="${post.url}" class="latest-thumb">
          <img src="${post.thumb || 'https://via.placeholder.com/600x400'}" alt="${post.title}" loading="lazy"/>
        </a>
        <div class="latest-content">
          <span class="latest-date">${post.date}</span>
          <h3 class="latest-title"><a href="${post.url}">${post.title}</a></h3>
          <p class="latest-snippet">${post.snippet}...</p>
        </div>
      </div>
    `;
  }

  async function initMediaFeeds() {
    const sections = $$('[data-media-feed]');
    for (const section of sections) {
      const label = section.getAttribute('data-label');
      const limit = section.getAttribute('data-limit') || 4;
      const type = section.getAttribute('data-media-feed');
      const grid = $('[data-media-grid]', section);
      
      const entries = await fetchBloggerFeed(label, limit);
      if (grid && entries.length > 0) {
        grid.innerHTML = entries.map(e => renderMediaCard(getPostData(e), type)).join('');
      }
    }
  }

  async function initLatestHome() {
    const block = $('[data-latest-home]');
    if (!block) return;
    const config = block.getAttribute('data-config').split('|');
    const label = config[0] || 'ALL';
    const limit = config[1] || 6;
    const grid = $('[data-latest-grid]', block);

    const entries = await fetchBloggerFeed(label, limit);
    if (grid && entries.length > 0) {
      grid.innerHTML = entries.map(e => renderLatestCard(getPostData(e))).join('');
    }
  }

  async function initRelatedPosts() {
    const section = $('[data-related-posts]');
    if (!section) return;
    const label = section.getAttribute('data-label');
    const currentUrl = section.getAttribute('data-current-url');
    const grid = $('[data-related-posts-grid]', section);
    
    const entries = await fetchBloggerFeed(label, 5);
    const related = entries.filter(e => e.link.find(l => l.rel === 'alternate').href !== currentUrl).slice(0, 4);
    if (grid && related.length > 0) {
      grid.innerHTML = related.map(e => renderMediaCard(getPostData(e), 'story')).join('');
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    initMediaFeeds();
    initLatestHome();
    initRelatedPosts();
  });
})();
