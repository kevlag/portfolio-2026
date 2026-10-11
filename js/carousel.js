// ============================================================================
// carousel.js — Carrousel d'images du hero (page d'accueil).
//
// Le défilement (boucle infinie, pause, glisser, clavier...) est géré par le
// moteur commun js/marquee.js. Ce fichier ne contient que les réglages propres
// au hero.
// ============================================================================

(function () {
  // Vitesse : une image (avec son espace) défile toutes les X secondes.
  // Plus le chiffre est GRAND, plus le défilement est LENT.
  var SECONDS_PER_TILE = 5;

  function init() {
    var viewport = document.querySelector('.hero__carousel');
    if (!viewport) return;

    Marquee.create({
      viewport: viewport,
      track: viewport.querySelector('.hero__carousel-track'),
      // Au départ, la rangée est centrée (comme la maquette) : elle déborde à
      // parts égales à gauche et à droite.
      getStartX: function (m) {
        return (m.viewportWidth - m.seriesWidth) / 2;
      },
      getSpeed: function (m) {
        return m.pitch / SECONDS_PER_TILE;
      },
      visibleThreshold: 0 // démarre dès qu'une partie du carrousel est visible (puis ne s'arrête plus)
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
