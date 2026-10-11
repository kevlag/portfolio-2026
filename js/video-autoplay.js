// ============================================================================
// video-autoplay.js — Lecture des vidéos de page uniquement à l'écran.
//
// Toute <video data-autoplay> (avec preload="none" dans le HTML) ne se charge
// et ne joue que lorsqu'elle est visible, et se met en pause quand elle sort
// de l'écran : sinon toutes les vidéos de la page (jusqu'à 46 Mo chacune)
// démarreraient en même temps dès l'ouverture. Avec "réduire les animations",
// elles restent sur leur image d'aperçu (poster).
//
// Les vidéos avec du son (attribut `controls`, ex. Michael Jackson 02 et 03)
// démarrent muettes — les navigateurs bloquent l'autoplay avec le son — et le
// visiteur les active avec les contrôles natifs. Si le visiteur met une vidéo
// en pause, elle n'est plus relancée automatiquement quand il y revient.
// Utilisé par les case studies Michael Jackson, Bobby Buddy, Lacourte et Elium.
// ============================================================================

(function () {
  function init() {
    var videos = document.querySelectorAll('video[data-autoplay]');
    if (!videos.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function play(video) {
      var promise = video.play();
      if (promise && promise.catch) promise.catch(function () {});
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(videos, play);
      return;
    }

    var visible = [];

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            if (visible.indexOf(video) === -1) visible.push(video);
            if (!video.hasAttribute('data-user-paused')) play(video);
          } else {
            var index = visible.indexOf(video);
            if (index !== -1) visible.splice(index, 1);
            video.pause();
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    Array.prototype.forEach.call(videos, function (video) {
      // Pause pendant que la vidéo est à l'écran = action du visiteur.
      video.addEventListener('pause', function () {
        if (visible.indexOf(video) !== -1) video.setAttribute('data-user-paused', '');
      });
      video.addEventListener('play', function () {
        video.removeAttribute('data-user-paused');
      });
      observer.observe(video);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
