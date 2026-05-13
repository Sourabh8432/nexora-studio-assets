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
  function runWhenReady() {
    initTheme();
    initHeader();
    initScrollTop();
    initReadingProgress();
    initImageOptimization();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();


/* Nexora Ajax Feeds - Home Media & Latest Posts Logic */
(function initNexoraFeeds() {
  var $ = function(selector, context) { return (context || document).querySelector(selector); };
  var $$ = function(selector, context) { return (context || document).querySelectorAll(selector); };

  async function fetchBloggerFeed(label, limit) {
    console.log(`Nexora: Fetching feed for label [${label}]...`);
    const feedUrl = label === 'ALL' 
      ? `/feeds/posts/default?alt=json&max-results=${limit}` 
      : `/feeds/posts/default/-/${label}?alt=json&max-results=${limit}`;
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const entries = data.feed.entry || [];
      console.log(`Nexora: Received ${entries.length} entries for [${label}]`);
      return entries;
    } catch (err) {
      console.error(`Nexora Feed Error [${label}]:`, err);
      return [];
    }
  }

  function getPostData(entry) {
    try {
      const title = entry.title.$t;
      const altLink = entry.link.find(l => l.rel === 'alternate');
      const url = altLink ? altLink.href : '#';
      let thumb = '';
      if (entry.media$thumbnail) thumb = entry.media$thumbnail.url.replace('s72-c', 'w600-h400-c');
      else if (entry.content && entry.content.$t.includes('<img')) {
         const match = entry.content.$t.match(/<img.*?src=["'](.*?)["']/);
         if (match) thumb = match[1];
      }
      const snippet = entry.summary ? entry.summary.$t : (entry.content ? entry.content.$t.replace(/<[^>]*>/g, '').substring(0, 100) : '');
      const date = entry.published ? new Date(entry.published.$t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      return { title, url, thumb, snippet, date };
    } catch (e) {
      console.error('Nexora: Error parsing entry', e);
      return null;
    }
  }

  function renderMediaCard(post, type) {
    if (!post) return '';
    const isPodcast = type === 'podcast';
    return `
      <div class="media-card ${isPodcast ? 'podcast-item' : ''}">
        <a href="${post.url}" class="media-thumb">
          <img src="${post.thumb || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgf_example_logo.png'}" alt="${post.title}" loading="lazy"/>
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
    if (!post) return '';
    return `
      <div class="latest-card">
        <a href="${post.url}" class="latest-thumb">
          <img src="${post.thumb || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgf_example_logo.png'}" alt="${post.title}" loading="lazy"/>
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
    console.log(`Nexora: Found ${sections.length} media feed sections.`);
    for (const section of sections) {
      const label = section.getAttribute('data-label');
      const limit = section.getAttribute('data-limit') || 4;
      const type = section.getAttribute('data-media-feed');
      const grid = $('[data-media-grid]', section);
      
      let entries = await fetchBloggerFeed(label, limit);
      if (entries.length === 0 && label !== 'ALL') {
        console.warn(`Nexora: Label "${label}" empty. Trying ALL posts fallback.`);
        entries = await fetchBloggerFeed('ALL', limit);
      }

      if (grid && entries.length > 0) {
        grid.innerHTML = entries.map(e => renderMediaCard(getPostData(e), type)).join('');
      } else {
        console.warn(`Nexora: Grid missing or no entries for ${label}`);
      }
    }
  }

  async function initLatestHome() {
    const block = $('[data-latest-home]');
    if (!block) return;
    console.log('Nexora: Initializing Latest Home block.');
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
    
    console.log(`Nexora: Loading related posts for label [${label}]`);
    const entries = await fetchBloggerFeed(label, 5);
    const related = entries.filter(e => {
        const altLink = e.link.find(l => l.rel === 'alternate');
        return altLink && altLink.href !== currentUrl;
    }).slice(0, 4);
    
    if (grid && related.length > 0) {
      grid.innerHTML = related.map(e => renderMediaCard(getPostData(e), 'story')).join('');
    }
  }

  function runWhenReady() {
    initMediaFeeds();
    initLatestHome();
    initRelatedPosts();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();
