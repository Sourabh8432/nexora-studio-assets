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

  document.addEventListener("DOMContentLoaded", function() {
    initMediaFeeds();
    initLatestHome();
  });
})();
