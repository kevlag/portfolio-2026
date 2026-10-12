// ============================================================================
// page-transition.js — Fondu de <main> entre les pages.
//
// <main> démarre invisible (opacity: 0, voir css/base/reset.css) : ce script
// le fait apparaître en fondu au chargement de la page, puis disparaître en
// fondu juste avant de naviguer vers une autre page du site (le header et le
// footer sont en dehors de <main> : ils restent visibles pendant tout ce
// temps). La nouvelle page démarre alors déjà invisible, prête à réapparaître
// à son tour : la transition paraît continue.
//
// Ne s'applique qu'aux clics simples sur des liens internes qui changent
// réellement de page — pas aux ancres # (ex. Back to top), aux liens
// mailto:/tel:, aux liens externes (ex. réseaux sociaux, nouvel onglet), ni
// au lien vers la page où l'on se trouve déjà.
//
// Chargé en dernier (après header.js et footer.js) : sa logique tourne dans
// le même événement DOMContentLoaded, après celle du header, pour que
// --header-height soit déjà calculée avant que <main> ne réapparaisse.
// ============================================================================

(function () {
  // Doit rester égal à la durée de la transition CSS sur <main> (voir
  // css/base/reset.css) et sur la bordure des pastilles actives du header
  // (voir css/components/header.css), pour que la navigation attende la fin
  // du fondu et que les deux fondus restent synchronisés.
  var FADE_MS = 600;

  var isLeaving = false;

  // Ajoute la classe qui déclenche le fondu 2 frames plus tard : au tout
  // premier rendu, le navigateur n'a pas forcément encore "affiché" l'état
  // de départ (opacity: 0) avant que le script ne s'exécute — sans ce délai,
  // le changement de classe arrive trop tôt et saute directement à l'état
  // final, sans jouer la transition (effet de fondu brusque/invisible).
  // Sert de solution de repli pour les navigateurs sans Web Animations.
  function revealNextFrame(el, className) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        el.classList.add(className);
      });
    });
  }

  // Apparition en fondu : posée avec l'API Web Animations plutôt qu'avec une
  // transition CSS. Une transition dépend de l'état de départ déjà "affiché"
  // par le navigateur (sinon elle saute directement à l'état final — vu sur
  // iPhone), et elle est neutralisée par la règle "réduire les animations" de
  // css/base/reset.css (transition-duration: 0.01ms). L'animation, elle, se joue
  // toujours, depuis la toute première image. Avec "réduire les animations",
  // le mouvement (glissement de 16px) est retiré : il ne reste que le fondu.
  function fadeIn(el, className, withMotion) {
    if (el.classList.contains(className)) return;
    if (!el.animate) {
      revealNextFrame(el, className);
      return;
    }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var from = { opacity: 0 };
    var to = { opacity: 1 };
    if (withMotion && !reduce) {
      from.transform = 'translateY(16px)';
      to.transform = 'none';
    }
    // L'état final (classe) est posé tout de suite, sans transition CSS : c'est
    // l'animation qui fait l'apparition, puis on rend la main au CSS.
    el.style.transition = 'none';
    el.classList.add(className);
    var animation = el.animate([from, to], { duration: FADE_MS, easing: 'ease-out' });
    var done = function () {
      el.style.transition = '';
    };
    animation.onfinish = done;
    animation.oncancel = done;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var main = document.querySelector('main');
    if (!main) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Révèle la page qui vient de charger.
    fadeIn(main, 'main--visible', true);

    // Prev/Next des case studies (classe commune .case__controls) : en dehors
    // de <main>, donc pas concerné par son fondu — a besoin du sien, déclenché
    // de la même façon et en même temps.
    var controls = document.querySelector('.case__controls');
    if (controls) fadeIn(controls, 'is-visible', false);

    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (!link) return;

      // Laisse le navigateur gérer : ouverture dans un nouvel onglet,
      // clic milieu/droit, ou clic avec une touche de modification.
      var isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey &&
        !event.shiftKey && !event.altKey;
      if (!isPlainClick || link.target === '_blank') return;

      var href = link.getAttribute('href');
      if (!href) return;

      // Ignore : ancre sur la page actuelle, lien mail/tel, lien externe.
      if (href.charAt(0) === '#') return;
      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0 || href.indexOf('//') === 0) return;

      // Déjà sur cette page (ex. clic sur "Kevin Lagier" depuis la home).
      var currentFile = window.location.pathname.split('/').pop() || 'index.html';
      if (href === currentFile) return;

      if (reduceMotion) return; // navigation normale, sans fondu ni délai

      event.preventDefault();
      if (isLeaving) return; // évite un double clic pendant le fondu
      isLeaving = true;

      main.classList.remove('main--visible');
      window.setTimeout(function () {
        window.location.href = link.href;
      }, FADE_MS);
    });

    // Retour arrière : le navigateur peut ré-afficher la page telle qu'elle
    // était au moment de partir (main invisible) -> on la fait réapparaître.
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        isLeaving = false;
        fadeIn(main, 'main--visible', true);
      }
    });
  });
})();
