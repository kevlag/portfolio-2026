// ============================================================================
// slider.js — Rangée d'images des projets (.project__slider).
//
// Défile en boucle, de la droite vers la gauche. Démarre une fois qu'on a
// scrollé jusqu'au projet (quand au moins 25 % de la rangée est visible à
// l'écran), puis continue de défiler même si on scrolle plus loin. On peut
// aussi la faire glisser à la souris / au doigt, ou avec les flèches du
// clavier. Elle ne réagit PAS au défilement horizontal du trackpad / de la
// souris.
//
// Le défilement lui-même est géré par le moteur commun js/marquee.js ; ce
// fichier ne contient que les réglages propres à cette rangée. Il gère
// chaque rangée de la page séparément.
//
// Sans JavaScript, les rangées gardent leur défilement horizontal natif (le
// CSS ne les "bloque" que lorsque le moteur a démarré : classe .is-active).
//
// Réglages dans le CSS (project.css), pour suivre l'échelle de la page :
//   --slider-margin : marge à gauche de la 1re image (80px desktop / 20px mobile)
//   --slider-speed  : vitesse de défilement (distance parcourue par seconde)
// ============================================================================

(function () {
  function init() {
    var sliders = document.querySelectorAll('.project__slider');

    Array.prototype.forEach.call(sliders, function (viewport) {
      Marquee.create({
        viewport: viewport,
        track: viewport.querySelector('.project__slides'),
        // Au départ, la 1re image est calée sur la marge de la page.
        getStartX: function () {
          return Marquee.measureLength(viewport, '--slider-margin');
        },
        getSpeed: function () {
          return Marquee.measureLength(viewport, '--slider-speed');
        },
        visibleThreshold: 0.25, // démarre quand 25 % de la rangée est visible (puis ne s'arrête plus)
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
