// ============================================================================
// header.js — Génère et injecte le header dans chaque page.
//
// Une seule source du header : le modifier ici suffit à le mettre à jour
// sur TOUTES les pages, sans dupliquer le HTML dans chaque fichier.
//
// Fonctionne sans serveur local (double-clic sur le fichier HTML) car il
// ne fait AUCUNE requête réseau (pas de fetch) : le HTML est construit
// directement en JavaScript puis injecté dans <div id="site-header">.
//
// Pour marquer la page active dans la nav, chaque page doit porter
// l'attribut data-page sur sa balise <body>, ex. <body data-page="home">.
// ============================================================================

(function () {
  // Adresse utilisée pour le lien "Contact" (mailto)
  var CONTACT_EMAIL = 'lagier.kevin@gmail.com';

  // Pages de nav. `key` doit correspondre à data-page="..." sur <body>
  // pour que le bon lien s'affiche comme actif (pastille bordée).
  var NAV_LINKS = [
    { key: 'home', label: 'Design Lab', href: 'index.html' },
    { key: 'ai-creation', label: 'AI Creation', href: 'ai-creation.html' },
    { key: 'about', label: 'About', href: 'about.html' }
  ];

  // Construit le HTML d'une pastille de nav (utilisée en desktop et dans
  // l'overlay mobile, avec une classe CSS différente). Aucune n'est marquée
  // active ici : setActiveKey() s'en charge juste après l'injection, pour
  // que la bordure de la page courante apparaisse en fondu comme les autres
  // (voir l'appel à setActiveKey dans le bloc DOMContentLoaded plus bas).
  function buildPill(link, className) {
    return (
      '<a class="' + className + '"' +
      ' href="' + link.href + '"' +
      ' data-nav-key="' + link.key + '">' +
      link.label +
      '</a>'
    );
  }

  function buildHeaderMarkup() {
    // Nav desktop centrée : Design Lab + AI Creation
    var desktopNav = NAV_LINKS.slice(0, 2)
      .map(function (link) {
        return buildPill(link, 'site-header__pill');
      })
      .join('');

    // Bloc droit desktop : pastille About + lien texte Contact
    var aboutPill = buildPill(NAV_LINKS[2], 'site-header__pill');

    // Overlay mobile : les 3 pages + Contact, toutes en pastille
    var overlayNav = NAV_LINKS
      .map(function (link) {
        return buildPill(link, 'site-header__overlay-pill');
      })
      .concat(
        '<a class="site-header__overlay-pill" href="mailto:' + CONTACT_EMAIL + '">Contact</a>'
      )
      .join('');

    return (
      '<header class="site-header">' +
        '<div class="site-header__brand">' +
          '<a class="site-header__name" href="index.html">Kevin Lagier</a>' +
          '<p class="site-header__tagline">Designer - Product Builder</p>' +
        '</div>' +

        '<nav class="site-header__nav" aria-label="Navigation principale">' +
          desktopNav +
        '</nav>' +

        '<div class="site-header__links">' +
          aboutPill +
          '<a class="site-header__link" href="mailto:' + CONTACT_EMAIL + '">Contact</a>' +
        '</div>' +

        '<button class="site-header__burger" type="button" aria-expanded="false"' +
          ' aria-controls="site-header-overlay" aria-label="Ouvrir le menu">' +
          '<span class="site-header__burger-bar site-header__burger-bar--top"></span>' +
          '<span class="site-header__burger-bar site-header__burger-bar--mid"></span>' +
          '<span class="site-header__burger-bar site-header__burger-bar--bottom"></span>' +
        '</button>' +

        '<div class="site-header__overlay" id="site-header-overlay" aria-hidden="true">' +
          '<nav class="site-header__overlay-nav" aria-label="Navigation mobile">' +
            overlayNav +
          '</nav>' +
        '</div>' +
      '</header>'
    );
  }

  // Ouvre/ferme le menu mobile (aria-expanded pilote aussi l'animation CSS)
  function initBurgerMenu(root) {
    var burger = root.querySelector('.site-header__burger');
    var overlay = root.querySelector('.site-header__overlay');
    var firstLink = overlay.querySelector('a');

    function openMenu() {
      burger.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-open-menu');
      if (firstLink) firstLink.focus();
    }

    function closeMenu() {
      burger.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-open-menu');
    }

    burger.addEventListener('click', function () {
      var isOpen = burger.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Échap ferme le menu et rend le focus au bouton burger (clavier)
    overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
        burger.focus();
      }
    });

    return {
      close: closeMenu,
      // Fermeture sans animation (page ré-affichée depuis le cache du
      // navigateur avec le menu encore ouvert : pas de fondu à montrer).
      closeInstantly: function () {
        overlay.style.transition = 'none';
        closeMenu();
        void overlay.offsetHeight; // applique l'état fermé avant de réactiver la transition
        overlay.style.transition = '';
      }
    };
  }

  // Marque comme active la pastille (desktop ET overlay mobile) qui
  // correspond à `key`, et retire l'état actif des autres. Le fondu de la
  // bordure est fait par la transition CSS.
  function setActiveKey(root, key) {
    var items = root.querySelectorAll('[data-nav-key]');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-active', items[i].getAttribute('data-nav-key') === key);
    }
  }

  // Changement de page : la bordure de la pastille cible apparaît en fondu
  // dès le clic, pendant que js/page-transition.js gère le fondu de <main>
  // et le délai avant la navigation (c'est lui qui fait le preventDefault).
  function initNavFade(root, currentPage, menu) {
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[data-nav-key]');
      if (!link) return;

      // Menu mobile : il se referme dès le clic, en même temps que <main>
      // s'efface — sinon l'overlay noir reste affiché pendant tout le fondu,
      // puis la nouvelle page apparaît d'un coup.
      menu.close();

      var key = link.getAttribute('data-nav-key');
      if (key === currentPage) return;

      setActiveKey(root, key);
    });

    // Retour arrière : le navigateur peut ré-afficher la page telle qu'elle
    // était au moment de partir (bordure déjà changée) -> on la remet d'aplomb.
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        setActiveKey(root, currentPage);
        menu.closeInstantly();
      }
    });
  }

  // Le header est en position fixed (toujours visible au scroll), donc il
  // ne "pousse" plus le reste de la page : on mesure sa hauteur réelle et
  // on la pose sur <html> en variable CSS, que main.css utilise ensuite
  // en padding-top sur <main> pour ne pas passer sous le header.
  function updateHeaderHeightVar(headerEl) {
    var height = headerEl.offsetHeight;
    document.documentElement.style.setProperty('--header-height', height + 'px');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('site-header');
    if (!mount) return;

    var currentPage = document.body.getAttribute('data-page') || '';
    mount.innerHTML = buildHeaderMarkup();
    var menu = initBurgerMenu(mount);
    initNavFade(mount, currentPage, menu);

    // Marque la pastille de la page courante APRÈS l'injection (elle vient
    // d'apparaître sans bordure) : la transition CSS border-color la fait
    // apparaître en fondu, en même temps que <main> (js/page-transition.js).
    // Le double requestAnimationFrame laisse le temps au navigateur d'avoir
    // réellement affiché l'état "sans bordure" avant de la faire apparaître
    // — sinon la transition saute directement à l'état final (voir la même
    // technique, plus détaillée, dans js/page-transition.js).
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        setActiveKey(mount, currentPage);
      });
    });

    var headerEl = mount.querySelector('.site-header');
    updateHeaderHeightVar(headerEl);

    // Recalcule au redimensionnement (mobile <-> desktop change la hauteur)
    // et une fois la police Haffer XH chargée (elle peut légèrement
    // différer de la police de secours utilisée le temps du chargement).
    window.addEventListener('resize', function () {
      updateHeaderHeightVar(headerEl);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        updateHeaderHeightVar(headerEl);
      });
    }
  });
})();
