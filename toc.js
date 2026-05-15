/* Nexora TOC - Dynamic Table of Contents & Scrolling */
(function initNexoraTOC() {
  var $ = function(selector) { return document.querySelector(selector); };
  var $$ = function(selector) { return document.querySelectorAll(selector); };

  function initToc() {
    const toc = $('[data-post-toc]');
    const list = $('[data-post-toc-list]');
    const body = $('.single-body');
    if (!toc || !list || !body) return;

    const headings = body.querySelectorAll('h2, h3, h4');
    if (headings.length < 2) return;

    let html = '';
    let counter = 1;
    headings.forEach((heading) => {
      const text = heading.textContent.trim().replace(/[→\u2192]/g, '');
      
      // Skip "Inside this Article" or empty text
      if (!text || text.toLowerCase().includes('inside this article')) return;
      
      const id = heading.id || 'section-' + counter;
      heading.id = id;
      const tag = heading.tagName.toLowerCase();
      const isMain = tag === 'h2';
      const num = counter.toString().padStart(2, '0');
      let cls = tag === 'h3' ? 'is-sub' : (tag === 'h4' ? 'is-sub2' : '');
      
      html += `
        <li class="${cls}">
          ${isMain ? `<div class="toc-sidebar-num">${num}</div>` : ''}
          <a href="#${id}" data-toc-link="${id}">${text}</a>
          <svg class="toc-chevron" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
        </li>`;
      
      if (isMain) counter++;
    });

    list.innerHTML = html;
    toc.classList.add('is-ready');

    // Fixed Toggle Logic
    const toggleBtn = toc.querySelector('.single-toc-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toc.classList.toggle('is-collapsed');
        const span = toggleBtn.querySelector('span');
        if (span) {
          span.textContent = toc.classList.contains('is-collapsed') ? 'Show' : 'Hide';
        }
      });
    }

    // Scroll Spy
    const links = list.querySelectorAll('[data-toc-link]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(link => link.classList.toggle('is-active', link.getAttribute('data-toc-link') === entry.target.id));
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });
    headings.forEach(h => observer.observe(h));

    list.addEventListener('click', e => {
      const link = e.target.closest('[data-toc-link]');
      if (link) {
        e.preventDefault();
        const target = document.getElementById(link.getAttribute('data-toc-link'));
        if (target) {
          window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
          history.pushState(null, null, '#' + target.id);
        }
      }
    });
  }

  function runWhenReady() {
    initToc();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();
