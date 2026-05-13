/* Nexora Search - UI & Focus Logic */
(function initNexoraSearch() {
  var $ = function(selector, context) { return (context || document).querySelector(selector); };

  function initSearch() {
    var searchTrigger = document.getElementById('searchTrigger');
    var searchClose = document.getElementById('searchClose');
    var searchBar = document.getElementById('fullSearch');

    function toggleSearch(show) {
      if (!searchBar || !searchTrigger) return;
      var isActive = show !== undefined ? show : !searchBar.classList.contains('active');
      searchBar.classList.toggle('active', isActive);
      searchTrigger.setAttribute('aria-expanded', isActive);
      if (isActive) {
        var input = searchBar.querySelector('input');
        if (input) setTimeout(() => input.focus(), 100);
      }
    }

    if (searchTrigger) searchTrigger.addEventListener('click', () => toggleSearch());
    if (searchClose) searchClose.addEventListener('click', () => toggleSearch(false));
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') toggleSearch(false);
    });
  }

  document.addEventListener("DOMContentLoaded", initSearch);
})();
