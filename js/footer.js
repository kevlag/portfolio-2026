// ============================================================================
// footer.js — Génère et injecte le footer dans chaque page.
//
// Comme header.js : une seule source du footer, modifiable ici pour toutes
// les pages, sans requête réseau (fonctionne en double-clic sur le HTML).
// Injecté dans <div id="site-footer"></div>.
// ============================================================================

(function () {
  // Réseaux sociaux (label affiché, nom lu par les lecteurs d'écran, lien)
  var SOCIALS = [
    { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com/kevinlagier.design/?hl=fr' },
    { label: 'DR', name: 'Dribbble', href: 'https://dribbble.com/kevlag' },
    { label: 'BE', name: 'Behance', href: 'https://www.behance.net/KevinLagier' },
    { label: 'LK', name: 'LinkedIn', href: 'https://www.linkedin.com/in/k%C3%A9vin-lagier-79382a4a/' }
  ];

  function buildFooterMarkup() {
    var socials = SOCIALS.map(function (social) {
      return (
        '<a class="site-footer__social" href="' + social.href + '"' +
        ' target="_blank" rel="noopener noreferrer"' +
        ' aria-label="' + social.name + '">' + social.label + '</a>'
      );
    }).join('');

    return (
      '<footer class="site-footer">' +
        '<a class="site-footer__top" href="#"><span class="site-footer__top-label">Back to top</span></a>' +
        '<div class="site-footer__group">' +
          '<div class="site-footer__socials">' + socials + '</div>' +
          '<p class="site-footer__copyright">© Copyright - All Rights Reserved</p>' +
        '</div>' +
      '</footer>'
    );
  }

  // "Back to top" : remonte en haut de page (en douceur, sauf si
  // l'utilisateur a demandé de réduire les animations).
  function initBackToTop(root) {
    var link = root.querySelector('.site-footer__top');
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // "Back to top" invisible tant qu'on est tout en haut de la page : il
  // apparaît (en fondu, géré par le CSS) dès qu'on a commencé à scroller.
  function initBackToTopVisibility(root) {
    var link = root.querySelector('.site-footer__top');

    function update() {
      link.classList.toggle('is-visible', window.scrollY > 0);
    }

    update(); // au chargement (la page peut s'ouvrir déjà scrollée)
    window.addEventListener('scroll', update, { passive: true });
  }

  // Footer fixe : on mesure sa hauteur réelle et on la pose en variable CSS
  // (--footer-height) pour que <main> garde un padding-bottom équivalent.
  function updateFooterHeightVar(footerEl) {
    document.documentElement.style.setProperty('--footer-height', footerEl.offsetHeight + 'px');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('site-footer');
    if (!mount) return;

    mount.innerHTML = buildFooterMarkup();
    initBackToTop(mount);
    initBackToTopVisibility(mount);

    var footerEl = mount.querySelector('.site-footer');
    updateFooterHeightVar(footerEl);

    // Recalcule au redimensionnement (mobile <-> desktop change la hauteur)
    // et une fois la police chargée.
    window.addEventListener('resize', function () {
      updateFooterHeightVar(footerEl);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        updateFooterHeightVar(footerEl);
      });
    }
  });
})();
