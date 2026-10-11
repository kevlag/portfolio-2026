// ============================================================================
// michaeljackson.js — Réglages propres à la page case study Michael Jackson.
//
// Bloc-9 : les 2 rangées d'images défilent en boucle (moteur js/marquee.js),
// la 1re vers la droite, la 2e vers la gauche, à la vitesse --slider-speed
// (voir michaeljackson.css).
//
// La lecture des vidéos à l'écran est gérée par js/video-autoplay.js.
// ============================================================================

(function () {
  function initBloc9() {
    var rows = document.querySelectorAll('.michaeljackson__bloc9-row');
    Array.prototype.forEach.call(rows, function (viewport, index) {
      Marquee.create({
        viewport: viewport,
        track: viewport.querySelector('.michaeljackson__bloc9-track'),
        direction: index === 0 ? 'right' : 'left',
        // Au départ la rangée est centrée (comme la maquette).
        getStartX: function (m) {
          return (m.viewportWidth - m.seriesWidth) / 2;
        },
        getSpeed: function () {
          return Marquee.measureLength(viewport, '--slider-speed');
        },
        visibleThreshold: 0.25 // démarre quand 25 % de la rangée est visible (puis ne s'arrête plus)
      });
    });
  }

  function init() {
    initBloc9();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
