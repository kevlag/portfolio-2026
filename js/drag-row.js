// ============================================================================
// drag-row.js — Rangées qui se font glisser sur les pages case study
// (crédits de Studio Boam / TAG Heuer, aperçus des autres projets de
// Studio Boam).
//
// Se fait glisser à la souris / au doigt / aux flèches du clavier, bornée au
// début et à la fin (option loop:false du moteur js/marquee.js).
//
// Dans le HTML : data-drag-row sur le conteneur qui défile (le "viewport") et
// data-drag-track sur la liste qu'il contient. Selon la page, le CSS peut
// rendre ce conteneur transparent en desktop (la grille de crédits n'a alors
// plus besoin de glisser).
// ============================================================================

(function () {
  function init() {
    var rows = document.querySelectorAll('[data-drag-row]');

    Array.prototype.forEach.call(rows, function (viewport) {
      Marquee.create({
        viewport: viewport,
        track: viewport.querySelector('[data-drag-track]'),
        loop: false,
        keyboard: true
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
