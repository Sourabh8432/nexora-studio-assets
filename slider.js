/* Nexora Sliders - Hero & Trending Logic */
(function initNexoraSliders() {
  var $ = function(selector, context) { return (context || document).querySelector(selector); };
  var $$ = function(selector, context) { return (context || document).querySelectorAll(selector); };

  function initHero() {
    var heroes = $$('[data-hero="nexora"]');
    heroes.forEach(function(hero) {
      var track = $('.nexora-hero-track', hero);
      var slides = $$('.nexora-hero-slide', hero);
      if (!track || slides.length < 2) return;

      var current = 0;
      var isMoving = false;

      function goTo(index) {
        var nextIndex = (index + slides.length) % slides.length;
        if (nextIndex === current || isMoving) return;
        isMoving = true;
        current = nextIndex;
        track.style.transform = 'translate3d(-' + (current * 100) + '%, 0, 0)';
        $$('.nexora-hero-num', hero).forEach(function(button) {
          button.classList.toggle('is-active', Number(button.getAttribute('data-slide')) === current);
        });
        setTimeout(function() { isMoving = false; }, 850);
      }

      hero.addEventListener('click', function(event) {
        if (event.target.closest('[data-hero-next]')) goTo(current + 1);
        else if (event.target.closest('[data-hero-prev]')) goTo(current - 1);
        var num = event.target.closest('.nexora-hero-num');
        if (num) goTo(Number(num.getAttribute('data-slide')) || 0);
      });
    });
  }

  function initTrending() {
    var strips = $$('[data-trending="nexora"]');
    strips.forEach(function(strip) {
      var list = $('.trending-list', strip);
      if (!list) return;
      function doScroll(dir) {
        list.scrollBy({ left: dir * Math.max(220, Math.floor(list.clientWidth * 0.55)), behavior: 'smooth' });
      }
      strip.addEventListener('click', function(event) {
        if (event.target.closest('[data-trending-next]')) doScroll(1);
        else if (event.target.closest('[data-trending-prev]')) doScroll(-1);
      });
    });
  }

  function runWhenReady() {
    initHero();
    initTrending();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();
