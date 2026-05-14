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

function optimizeImageUrl(url) {
  if (!url || /^data:/i.test(url)) return url;
  try {
    var parsed = new URL(url, window.location.origin);
    var host = parsed.hostname.toLowerCase();

    // Blogger / Google Images
    if (host.indexOf('blogger.googleusercontent.com') !== -1 || host.indexOf('bp.blogspot.com') !== -1 || host.indexOf('googleusercontent.com') !== -1) {
      // Logic to optimize Blogger images by changing sizing segments (e.g., /s320/ to /s1600/)
      let newUrl = url.replace(/\/s\d+(-[cpd])*\//, '/s1600/');
      if (newUrl === url) newUrl = url.replace(/\/w\d+-h\d+(-[cpd])*\//, '/w1600/');
      // If no sizing found, try to append it if it's a standard Blogger URL structure
      if (newUrl === url && /\/img\/b\/[^\/]+\/s[^\/]+\//.test(url)) {
          newUrl = url.replace(/\/s[^\/]+\//, '/s1600/');
      }
      return newUrl;
    }

    if (host.indexOf('images.unsplash.com') !== -1 || host.indexOf('source.unsplash.com') !== -1) {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fm', 'webp');
      if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', '80');
      return parsed.toString();
    }

    if (host.indexOf('images.ctfassets.net') !== -1 || host.indexOf('cdn.sanity.io') !== -1) {
      parsed.searchParams.set('fm', 'webp');
      if (!parsed.searchParams.has('q')) parsed.searchParams.set('q', '80');
      return parsed.toString();
    }

    if (host.indexOf('res.cloudinary.com') !== -1 && parsed.pathname.indexOf('/upload/') !== -1 && parsed.pathname.indexOf('/f_auto') === -1) {
      parsed.pathname = parsed.pathname.replace('/upload/', '/upload/f_auto,q_auto/');
      return parsed.toString();
    }

    return parsed.toString();
  } catch (error) {
    return url;
  }
}

function optimizeSrcset(srcset) {
  if (!srcset) return srcset;
  return srcset.split(',').map(function(part) {
    var trimmed = part.trim();
    if (!trimmed) return trimmed;
    var pieces = trimmed.split(/\s+/);
    var optimized = optimizeImageUrl(pieces[0]);
    return [optimized].concat(pieces.slice(1)).join(' ');
  }).join(', ');
}

function extractFirstContentImage(html) {
  if (!html) return '';
  const matches = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return matches && matches[1] ? matches[1] : '';
}

function isWeakThumbnail(url) {
  if (!url) return true;
  return /img\.youtube\.com\/vi\/.*\/default\.jpg/i.test(url) ||
    /blogger\.googleusercontent\.com\/img\/b\/R29vZ2xl\/AVvXsEgf_example_logo/i.test(url) ||
    /via\.placeholder\.com/i.test(url);
}

const NEXORA_INFO = {
  name: "Nexora Studio AI",
  version: "1.2.0",
  author: "Nexora Architecture"
};

(function initThemeEngine() {
  console.log(`%c ${NEXORA_INFO.name} v${NEXORA_INFO.version} %c Running `, 'background:#2f5d8a;color:#fff;padding:2px 5px;border-radius:3px 0 0 3px;', 'background:#4c4c4c;color:#fff;padding:2px 5px;border-radius:0 3px 3px 0;');

  // Theme Toggle (Dark/Light)
  function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    
    // Set initial state from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    toggle.setAttribute('aria-pressed', savedTheme === 'dark');

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
      localStorage.setItem('theme', target);
      toggle.setAttribute('aria-pressed', target === 'dark');
    });
  }

  // Mobile Menu
  function initHeader() {
    const mobileBtn = document.getElementById('mobileMenuTrigger');
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileBtn || !mobileNav) return;

    const setMenuState = function(isOpen) {
      mobileNav.classList.toggle('mobile-active', isOpen);
      mobileBtn.classList.toggle('is-active', isOpen);
      mobileBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    mobileBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      setMenuState(!mobileNav.classList.contains('mobile-active'));
    });

    document.addEventListener('click', function(event) {
      if (!mobileNav.contains(event.target) && !mobileBtn.contains(event.target)) {
        setMenuState(false);
      }
    });
  }

  // Post a Comment Toggle
  function initCommentsToggle() {
    const btn = document.getElementById('toggle-comments');
    const wrapper = document.getElementById('comments-wrapper');
    if (!btn || !wrapper) return;
    btn.addEventListener('click', () => {
      const isHidden = wrapper.style.display === 'none' || !wrapper.style.display;
      wrapper.style.display = isHidden ? 'block' : 'none';
      btn.textContent = isHidden ? 'Hide Comments' : 'Post a Comment';
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
    const images = document.querySelectorAll('.post-body img, .single-body img, .media-thumb img, .latest-thumb img, .sidebar-latest-thumb, .nexora-hero-image, .single-hero, .topic-icon img');
    images.forEach((img, index) => {
      if (!img.getAttribute('alt')) img.setAttribute('alt', document.title + ' Image ' + (index + 1));
      
      const isHero = img.classList.contains('single-hero') || img.classList.contains('nexora-hero-image');

      if (!img.dataset.nexoraOptimized) {
        var src = img.getAttribute('src');
        if (src) {
           // For Hero images, we want high quality (1600px), for others 800px is enough
           const targetWidth = isHero ? 1600 : 800;
           img.setAttribute('src', optimizeImageUrl(src).replace('/s1600/', `/s${targetWidth}/`));
        }
        img.dataset.nexoraOptimized = 'true';
      }

      if (isHero || index === 0) {
        img.setAttribute('fetchpriority', 'high');
        img.setAttribute('loading', 'eager'); // Hero must load fast
      } else {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('fetchpriority', 'low');
      }
      img.setAttribute('decoding', 'async');
    });
  }

  function initDeferredEmbeds() {
    const embeds = document.querySelectorAll('.single-body iframe, .post-body iframe, .single-body video, .post-body video');
    embeds.forEach((embed, index) => {
      if (!embed.getAttribute('loading')) embed.setAttribute('loading', 'lazy');
      if (embed.tagName === 'IFRAME' && !embed.getAttribute('title')) {
        embed.setAttribute('title', 'Embedded content ' + (index + 1));
      }
      if (embed.tagName === 'VIDEO' && !embed.getAttribute('preload')) {
        embed.setAttribute('preload', 'metadata');
      }
    });
  }

  // Initialize
  function runWhenReady() {
    console.log('Nexora: Initializing Theme Components...');
    try { initTheme(); } catch(e) { console.error('Theme Toggle Error:', e); }
    try { initHeader(); } catch(e) { console.error('Header Error:', e); }
    try { initCommentsToggle(); } catch(e) { console.error('Comments Toggle Error:', e); }
    try { initScrollTop(); } catch(e) { console.error('ScrollTop Error:', e); }
    try { initReadingProgress(); } catch(e) { console.error('ReadingProgress Error:', e); }
    try { initImageOptimization(); } catch(e) { console.error('ImageOpt Error:', e); }
    try { initDeferredEmbeds(); } catch(e) { console.error('Embeds Error:', e); }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();


/* Nexora Ajax Feeds - Home Media & Latest Posts Logic */
(function initNexoraFeeds() {
  var $ = function(selector, context) { return (context || document).querySelector(selector); };
  var $$ = function(selector, context) { return (context || document).querySelectorAll(selector); };

  async function fetchBloggerFeed(label, limit) {
    const safeLabel = (label || 'ALL').trim();
    const safeLimit = parseInt(limit, 10) || 6;
    console.log(`Nexora: Fetching feed for label [${safeLabel}]...`);
    const feedUrl = safeLabel === 'ALL'
      ? `/feeds/posts/default?alt=json&max-results=${safeLimit}`
      : `/feeds/posts/default/-/${encodeURIComponent(safeLabel)}?alt=json&max-results=${safeLimit}`;
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const entries = data.feed && data.feed.entry ? data.feed.entry : [];
      console.log(`Nexora: Received ${entries.length} entries for [${safeLabel}]`);
      return entries;
    } catch (err) {
      console.error(`Nexora Feed Error [${safeLabel}]:`, err);
      return [];
    }
  }

  function getPostData(entry) {
    try {
      const title = entry.title.$t;
      const altLink = entry.link.find(l => l.rel === 'alternate');
      const url = altLink ? altLink.href : '#';
      const contentHtml = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const firstImage = extractFirstContentImage(contentHtml);
      
      let thumb = '';
      if (entry.media$thumbnail) {
        // High-res version of Blogger thumb
        thumb = entry.media$thumbnail.url.replace('s72-c', 'w1200-h630-p-k-no-nu').replace('s1600', 'w1200-h630-p-k-no-nu');
      }

      // If Blogger thumb is default/weak, use first image from content
      if ((!thumb || isWeakThumbnail(thumb)) && firstImage) {
        thumb = firstImage;
      }

      // Final fallback if everything fails
      const finalThumb = thumb || firstImage || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgf_example_logo.png';
      
      const snippet = entry.summary ? entry.summary.$t : (contentHtml ? contentHtml.replace(/<[^>]*>/g, '').substring(0, 150) : '');
      const date = entry.published ? new Date(entry.published.$t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      
      return { 
        title, 
        url, 
        thumb: optimizeImageUrl(finalThumb), 
        snippet: cleanText(snippet), 
        date 
      };
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
          <img src="${post.thumb}" alt="${post.title}" loading="lazy"/>
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
          <img src="${post.thumb}" alt="${post.title}" loading="lazy"/>
        </a>
        <div class="latest-content">
          <span class="latest-date">${post.date}</span>
          <h3 class="latest-title"><a href="${post.url}">${post.title}</a></h3>
          <p class="latest-snippet">${post.snippet}...</p>
        </div>
      </div>
    `;
  }

  function renderSidebarLatestCard(post) {
    if (!post) return '';
    return `
      <article class="sidebar-latest-card">
        <a href="${post.url}">
          <img class="sidebar-latest-thumb" src="${post.thumb}" alt="${post.title}" loading="lazy"/>
        </a>
        <div>
          <h3 class="sidebar-latest-title"><a href="${post.url}">${post.title}</a></h3>
          <p class="sidebar-latest-snippet">${post.snippet}...</p>
        </div>
      </article>
    `;
  }

  function renderArchiveItem(label, count, url) {
    return `<li><a href="${url}"><span>${label}</span><span>${count}</span></a></li>`;
  }

  async function initMediaFeeds() {
    const sections = $$('[data-media-feed]');
    console.log(`Nexora: Found ${sections.length} media feed sections.`);
    for (const section of sections) {
      const label = section.getAttribute('data-label') || 'ALL';
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

    let entries = await fetchBloggerFeed(label, limit);
    if (entries.length === 0 && label !== 'ALL') entries = await fetchBloggerFeed('ALL', limit);
    if (grid && entries.length > 0) {
      grid.innerHTML = entries.map(e => renderLatestCard(getPostData(e))).join('');
    } else if (grid) {
      grid.innerHTML = '<div class="empty-state"><h2>No content found</h2><p>Please check back later or start publishing posts to see them here.</p></div>';
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

  async function initSidebarLatest() {
    const widgets = $$('[data-sidebar-latest]');
    for (const widget of widgets) {
      const config = (widget.getAttribute('data-config') || 'ALL|5').split('|');
      const label = config[0] || 'ALL';
      const limit = parseInt(config[1], 10) || 5;
      const list = $('[data-sidebar-latest-list]', widget);
      if (!list) continue;

      let entries = await fetchBloggerFeed(label, limit);
      if (entries.length === 0 && label !== 'ALL') entries = await fetchBloggerFeed('ALL', limit);
      if (entries.length > 0) list.innerHTML = entries.map(e => renderSidebarLatestCard(getPostData(e))).join('');
    }
  }

  async function initSidebarArchive() {
    const widgets = $$('[data-sidebar-archive]');
    for (const widget of widgets) {
      const limit = parseInt(widget.getAttribute('data-limit'), 10) || 12;
      const list = $('[data-sidebar-archive-list]', widget);
      if (!list) continue;

      const entries = await fetchBloggerFeed('ALL', Math.max(limit * 10, 50));
      const buckets = [];
      const seen = {};

      entries.forEach(function(entry) {
        if (!entry.published || !entry.link) return;
        const date = new Date(entry.published.$t);
        if (isNaN(date.getTime())) return;
        const year = date.getFullYear();
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const key = year + '-' + String(date.getMonth() + 1).padStart(2, '0');
        if (!seen[key]) {
          seen[key] = {
            label: month + ' ' + year,
            count: 0,
            url: '/search?updated-max=' + year + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-31T23:59:00'
          };
          buckets.push(seen[key]);
        }
        seen[key].count += 1;
      });

      list.innerHTML = buckets.slice(0, limit).map(function(bucket) {
        return renderArchiveItem(bucket.label, bucket.count, bucket.url);
      }).join('');
    }
  }

  function runWhenReady() {
    initMediaFeeds();
    initLatestHome();
    initRelatedPosts();
    initSidebarLatest();
    initSidebarArchive();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();
