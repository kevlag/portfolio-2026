// ============================================================================
// marquee.js — Moteur commun des rangées d'images qui se font glisser.
//
// Utilisé par le carrousel du hero, les rangées d'images des projets
// (slider.js) et les rangées de crédits des case studies (drag-row.js). Chaque page
// de réglage ne fait qu'appeler Marquee.create({ ... }) avec ses propres
// options : la mécanique est ici, une seule fois.
//
// Deux modes, choisis par l'option `loop` :
//
//  loop: true (par défaut — hero, projets)
//   - défilement continu de la droite vers la gauche (ou l'inverse avec
//     l'option `direction: 'right'`), EN BOUCLE infinie, avec
//     autant d'images que tu veux (il copie la série d'images à la suite) ;
//   - démarre quand la rangée est atteinte dans la page (pour un projet : quand
//     on arrive à sa hauteur), puis CONTINUE de défiler en permanence, même
//     quand on scrolle plus loin ;
//   - pause quand un élément a le focus au clavier.
//   Principe de la boucle : les copies sont identiques aux originaux, on
//   déplace toute la rangée vers la gauche, et dès qu'on a défilé de la
//   largeur d'une série on revient au point de départ : personne ne voit
//   le saut.
//
//  loop: false (crédits TAG Heuer) — pas de défilement automatique ni de copies :
//   juste une rangée qu'on peut faire glisser, bornée au début et à la fin.
//   Au-delà d'un bord (par le glisser, ou parce que l'inertie du relâchement
//   y porte la rangée), effet ressort : elle continue un peu puis revient
//   s'y caler en douceur, plutôt que de s'arrêter net.
//
// Dans les deux cas :
//  - glisser à la souris / au doigt, avec un peu d'inertie au relâchement ;
//  - immobile si l'utilisateur a demandé "réduire les animations"
//    (le glisser et le clavier restent possibles) ;
//  - s'arrête tout seul quand l'onglet n'est pas visible (mode boucle).
// ============================================================================

(function () {
  // ---- Réglages communs ----
  var PAUSE_EASE_SECONDS = 0.25; // douceur de l'arrêt / du redémarrage
  var INERTIA_SECONDS = 0.4;     // durée de la "glissade" après un glisser
  var DRAG_THRESHOLD = 5;        // distance (px) à partir de laquelle un clic devient un glisser
  var KEY_EASE_SECONDS = 0.12;   // douceur du déplacement aux flèches du clavier
  var KEY_STEP_RATIO = 0.6;      // une flèche = 60 % de la largeur visible
  var RUBBER_BAND_RESISTANCE = 0.35; // rangée bornée : part du dépassement gardée pendant le glisser, au-delà du bord
  var SPRING_STIFFNESS = 90; // rangée bornée : force de rappel du "ressort" au-delà d'un bord (grand = revient plus vite)
  // Amortissement du ressort : DOIT rester ≥ 2×racine(SPRING_STIFFNESS) (≈18.97
  // ici) pour ne jamais dépasser le bord de l'autre côté en revenant (sans quoi
  // la rangée quitte le ressort en plein élan, puis s'arrête par simple
  // friction n'importe où — elle ne revient alors plus jamais pile alignée).
  var SPRING_DAMPING = 20;

  // Convertit une variable CSS de longueur (ex. "5rem") en pixels.
  function measureLength(element, cssVariable) {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;height:0;width:var(' + cssVariable + ')';
    element.appendChild(probe);
    var width = probe.getBoundingClientRect().width;
    element.removeChild(probe);
    return width;
  }

  // options :
  //   viewport         (élément)  la "fenêtre" qui coupe ce qui dépasse
  //   track            (élément)  la rangée d'images (liste) qui bouge
  //   loop             true (défaut) = boucle infinie ; false = rangée bornée,
  //                    qui s'arrête au début et à la fin
  //   getStartX(m)     (loop uniquement) position (px) de la 1re image au départ
  //   getSpeed(m)      (loop uniquement) vitesse de défilement (px par seconde)
  //   direction        (loop uniquement) 'left' (défaut) = les images défilent
  //                    vers la gauche ; 'right' = vers la droite
  //   visibleThreshold (loop uniquement) part de la rangée (0 à 1) qui doit être
  //                    visible pour DÉMARRER le défilement
  //   keyboard         true = flèches gauche / droite quand la rangée a le focus
  //   m = { pitch, period, seriesWidth, viewportWidth }
  function create(options) {
    var viewport = options.viewport;
    var track = options.track;
    var originals = Array.prototype.slice.call(track.children);
    if (originals.length < 2) return; // rien à faire défiler

    var loop = options.loop !== false;
    var direction = options.direction === 'right' ? -1 : 1; // sens du défilement automatique
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---- État ----
    var clones = [];      // copies à la suite des originaux (loop uniquement)
    var leadClones = [];  // copies placées AVANT les originaux (loop uniquement)
    var metrics = null;
    var period = 0;       // largeur (px) d'une série d'images, espace final compris (loop)
    var startX = 0;       // position de départ de la 1re image (loop)
    var speed = 0;        // vitesse de défilement, px/s (loop)
    var hasMargin = false; // true si le départ laisse une marge vide à gauche (loop)
    var hasFlowed = false; // la marge de départ est-elle déjà passée ? (loop)
    var maxScroll = 0;    // distance (px) maximale qu'on peut glisser (bornée, sans boucle)
    var scroll = 0;       // distance (px) déjà défilée vers la gauche
    var speedFactor = 0;  // 1 = défile, 0 = arrêté (change en douceur : démarre à l'arrêt)
    var inertia = 0;      // vitesse (px/s) restante après un glisser
    var target = null;    // destination d'un déplacement au clavier
    var hasStarted = !loop; // la rangée a-t-elle déjà été atteinte ? (bornée : toujours prête)
    var isFocused = false;
    var isDragging = false;

    viewport.classList.add('is-active'); // le CSS laisse alors le script piloter la rangée

    // ---- Construction : mesures (+ copies en mode boucle) ----
    function build() {
      if (!loop) {
        // Rangée bornée : le CSS place déjà la rangée à sa position de repos
        // (padding-inline compris) ; le script ne fait qu'ajouter un décalage
        // vers la gauche par-dessus, borné à la largeur réellement cachée.
        maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        // Rien à glisser (ex. display:contents en desktop, quand la rangée
        // redevient une grille normale) : pas de curseur "main" trompeur.
        viewport.classList.toggle('can-drag', maxScroll > 0);
        scroll = limit(scroll);
        render();
        return;
      }

      var previousRatio = period ? scroll / period : 0;

      clones.concat(leadClones).forEach(function (clone) {
        clone.remove();
      });
      clones = [];
      leadClones = [];

      var first = originals[0].getBoundingClientRect();
      var second = originals[1].getBoundingClientRect();
      var last = originals[originals.length - 1].getBoundingClientRect();
      var viewportWidth = viewport.clientWidth;

      var gap = second.left - first.right;
      var seriesWidth = last.right - first.left; // sans l'espace final
      period = seriesWidth + gap;
      metrics = {
        pitch: second.left - first.left,
        period: period,
        seriesWidth: seriesWidth,
        viewportWidth: viewportWidth
      };
      startX = options.getStartX(metrics);
      speed = options.getSpeed(metrics); // px par seconde

      function copySeries(list, before) {
        originals.forEach(function (item) {
          var clone = item.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          Array.prototype.forEach.call(clone.querySelectorAll('a, button'), function (el) {
            el.setAttribute('tabindex', '-1');
          });
          if (before) track.insertBefore(clone, originals[0]);
          else track.appendChild(clone);
          list.push(clone);
        });
      }

      // La rangée est : [copies de tête] [originaux] [copies à la suite].
      // Les originaux sont au MILIEU : ils restent atteignables à l'écran quelle
      // que soit la position (important pour le focus clavier sur un lien).
      // Copies à la suite : la rangée doit toujours couvrir l'écran.
      var trailSeries = Math.max(1, Math.ceil((viewportWidth + gap) / period - 0.5));
      for (var i = 0; i < trailSeries; i++) copySeries(clones, false);
      copySeries(leadClones, true);

      // Si la 1re image démarre avec une marge à sa gauche (ex. 80px), les
      // copies de tête restent cachées tant que cette marge n'est pas passée,
      // pour que l'état de départ soit exactement celui de la maquette.
      hasMargin = startX > 0.5;
      updateLeadVisibility();

      scroll = previousRatio * period; // garde la même position après un resize
      render();
    }

    function updateLeadVisibility() {
      leadClones.forEach(function (clone) {
        clone.style.visibility = hasMargin && !hasFlowed ? 'hidden' : '';
      });
    }

    // ---- Affichage : déplace la rangée ----
    function render() {
      if (!loop) {
        track.style.transform = 'translate3d(' + -scroll + 'px, 0, 0)';
        return;
      }
      // Position de la 1re image originale, ramenée entre -period/2 et +period/2
      // (les copies de tête la précèdent d'une période).
      var x = startX - scroll;
      x = ((x + period / 2) % period + period) % period - period / 2;
      track.style.transform = 'translate3d(' + (x - period) + 'px, 0, 0)';
    }

    // Bornée : on ne peut pas glisser avant le début ni après la fin.
    // Boucle : on ne peut pas "reculer" avant le départ tant que la marge de
    // départ n'a pas été passée une première fois.
    function limit(value) {
      if (!loop) return Math.max(0, Math.min(maxScroll, value));
      return hasMargin && !hasFlowed ? Math.max(0, value) : value;
    }

    // Pendant le glisser d'une rangée bornée, on laisse dépasser le bord avec
    // une résistance ("rubber band", comme un scroll natif iOS) plutôt qu'un
    // arrêt net : sensation plus fluide, proche de la boucle des projets qui,
    // elle, ne rencontre jamais de bord. limit() reste le vrai bord, utilisé
    // au repos une fois relâché (voir tick()).
    function dragLimit(value) {
      if (loop) return limit(value);
      if (value < 0) return value * RUBBER_BAND_RESISTANCE;
      if (value > maxScroll) return maxScroll + (value - maxScroll) * RUBBER_BAND_RESISTANCE;
      return value;
    }

    function markFlowedIfNeeded() {
      if (loop && hasMargin && !hasFlowed && scroll >= startX) {
        hasFlowed = true;
        updateLeadVisibility();
      }
    }

    // ---- Boucle d'animation (une fois par image affichée) ----
    var lastTime = null;

    function tick(now) {
      var dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (loop && !period) {
        window.requestAnimationFrame(tick);
        return;
      }

      if (loop) {
        var paused = !hasStarted || isFocused || isDragging;
        speedFactor += ((paused ? 0 : 1) - speedFactor) * (1 - Math.exp(-dt / PAUSE_EASE_SECONDS));
      }

      if (!isDragging) {
        if (target !== null) {
          scroll += (target - scroll) * (1 - Math.exp(-dt / KEY_EASE_SECONDS));
          if (Math.abs(target - scroll) < 0.5) {
            scroll = target;
            target = null;
          }
          scroll = limit(scroll);
        } else if (loop) {
          var autoSpeed = reduceMotion.matches ? 0 : speed * speedFactor * direction;
          scroll += (autoSpeed + inertia) * dt;
          inertia *= Math.exp(-dt / INERTIA_SECONDS);
          if (Math.abs(inertia) < 1) inertia = 0;
          scroll = limit(scroll);
          markFlowedIfNeeded();
          if (!hasMargin || hasFlowed) scroll %= period;
        } else if (scroll < 0 || scroll > maxScroll) {
          // Bornée, au-delà d'un bord (glissée là par le doigt, ou portée par
          // l'inertie même sans dépassement pendant le glisser) : effet
          // ressort. La rangée continue un peu sur sa lancée, puis revient
          // se caler en douceur sur le bord — pas d'arrêt nét. La vitesse
          // d'arrivée (inertia) pilote l'ampleur du rebond ; plus on arrive
          // vite, plus il va loin avant de revenir.
          var edge = scroll < 0 ? 0 : maxScroll;
          var overshoot = scroll - edge;
          inertia += -SPRING_STIFFNESS * overshoot * dt;
          inertia *= Math.exp(-SPRING_DAMPING * dt);
          scroll += inertia * dt;
          // Le ressort s'approche du bord sans jamais tout à fait l'atteindre
          // (amortissement exponentiel) : sous ce seuil, on cale net dessus
          // pour ne pas laisser un décalage résiduel imperceptible mais
          // permanent (la rangée ne revenait alors plus jamais pile alignée).
          if (Math.abs(scroll - edge) < 0.5 && Math.abs(inertia) < 1) {
            scroll = edge;
            inertia = 0;
          }
        } else if (inertia !== 0) {
          // Bornée, dans les limites : seule l'inertie du glisser fait encore
          // bouger la rangée.
          scroll += inertia * dt;
          inertia *= Math.exp(-dt / INERTIA_SECONDS);
          if (Math.abs(inertia) < 1) inertia = 0;
        }
      }

      render();
      window.requestAnimationFrame(tick);
    }

    // ---- Démarrage (mode boucle uniquement) : quand la rangée est atteinte
    // dans la page. On la considère "atteinte" quand au moins `visibleThreshold`
    // de sa surface est à l'écran (ex. 0.25 = un quart). Le défilement démarre
    // alors, et ne s'arrête plus ensuite, même si on scrolle plus loin.
    // (Une rangée bornée n'a pas de défilement automatique à déclencher.)
    if (loop) {
      var threshold = options.visibleThreshold || 0;
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(
          function (entries) {
            var entry = entries[entries.length - 1];
            var reached = threshold > 0 ? entry.intersectionRatio >= threshold - 0.001 : entry.isIntersecting;
            if (reached) {
              hasStarted = true;
              observer.disconnect(); // plus besoin de surveiller
            }
          },
          { threshold: threshold > 0 ? [0, threshold] : [0] }
        );
        observer.observe(viewport);
      } else {
        hasStarted = true;
      }
    }

    // ---- Pause + mise en vue au focus clavier ----
    viewport.addEventListener('focusin', function (event) {
      if (!event.target.matches(':focus-visible')) return; // pas après un clic souris
      isFocused = true;
      speedFactor = 0; // arrêt immédiat (pas de dérive pendant la navigation clavier)
      inertia = 0;

      // Si l'élément sélectionné est en partie hors écran, on le ramène.
      if (event.target === viewport) return;
      var view = viewport.getBoundingClientRect();
      var item = event.target.getBoundingClientRect();
      if (item.left < view.left) scroll -= view.left - item.left;
      else if (item.right > view.right) scroll += item.right - view.right;
      scroll = limit(scroll);
    });
    viewport.addEventListener('focusout', function () {
      isFocused = false;
    });

    // ---- Glisser (souris, doigt, stylet) ----
    var pointerId = null;
    var pressStartX = 0;
    var lastPointerX = 0;
    var lastPointerTime = 0;
    var dragVelocity = 0;
    var hasDragged = false;

    // Classe "is-pressed" tant qu'on appuie (clic, maintien, glisser) : le CSS
    // s'en sert pour l'effet d'appui sur les images. Elle est retirée au
    // relâchement, même si on relâche en dehors de la rangée.
    function releasePress() {
      viewport.classList.remove('is-pressed');
      window.removeEventListener('pointerup', releasePress);
      window.removeEventListener('pointercancel', releasePress);
    }

    viewport.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      viewport.classList.add('is-pressed');
      window.addEventListener('pointerup', releasePress);
      window.addEventListener('pointercancel', releasePress);
      pointerId = event.pointerId;
      pressStartX = lastPointerX = event.clientX;
      lastPointerTime = event.timeStamp;
      dragVelocity = 0;
      inertia = 0;
      target = null;
      hasDragged = false;
    });

    viewport.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId) return;

      // Bouton déjà relâché sans qu'on ait reçu le pointerup (relâché hors de
      // la fenêtre, fenêtre qui perd le focus…) : on termine le glisser ici,
      // sinon la rangée resterait "collée" à la souris.
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        endDrag(event);
        releasePress();
        return;
      }

      if (!isDragging) {
        // Rangée bornée devenue non-scrollable (ex. display:contents en
        // desktop, quand la rangée redevient une grille normale) : rien à
        // révéler, pas de glisser à déclencher — sinon l'effet ressort
        // (dragLimit) donne l'impression qu'on peut quand même la tirer.
        if (!loop && maxScroll <= 0) return;
        // Tant qu'on n'a pas bougé assez, c'est un simple clic.
        if (Math.abs(event.clientX - pressStartX) < DRAG_THRESHOLD) return;
        isDragging = true;
        hasDragged = true;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.add('is-dragging');
        lastPointerX = event.clientX;
        lastPointerTime = event.timeStamp;
        return;
      }

      var moved = event.clientX - lastPointerX;
      var elapsed = (event.timeStamp - lastPointerTime) / 1000;
      scroll = dragLimit(scroll - moved); // glisser vers la droite = la rangée part vers la droite
      markFlowedIfNeeded();
      if (elapsed > 0) dragVelocity = 0.8 * dragVelocity + 0.2 * (-moved / elapsed);
      lastPointerX = event.clientX;
      lastPointerTime = event.timeStamp;
      render();
    });

    function endDrag(event) {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      // Si on s'est arrêté avant de relâcher, pas d'inertie.
      var stoppedBeforeRelease = event.timeStamp - lastPointerTime > 80;
      inertia = stoppedBeforeRelease ? 0 : Math.max(-2500, Math.min(2500, dragVelocity));
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    // Filets de sécurité : capture du pointeur perdue, ou fenêtre qui perd le
    // focus en plein glisser (le pointerup n'arriverait alors jamais).
    // ATTENTION : au doigt, le navigateur capture d'office le pointeur sur
    // l'élément touché (l'image) ; quand on appelle viewport.setPointerCapture(),
    // cette capture implicite est perdue et un `lostpointercapture` remonte
    // (il "bubble") depuis l'image jusqu'ici. Seul celui de la rangée elle-même
    // compte, sinon le glisser s'arrêterait aussitôt sur mobile.
    viewport.addEventListener('lostpointercapture', function (event) {
      if (event.target !== viewport) return;
      endDrag(event);
    });
    window.addEventListener('blur', function (event) {
      if (pointerId === null) return;
      endDrag({ pointerId: pointerId, timeStamp: event.timeStamp });
      releasePress();
    });

    // Après un glisser, on ne doit pas "cliquer" sur l'élément sous le doigt.
    viewport.addEventListener(
      'click',
      function (event) {
        if (hasDragged) {
          event.preventDefault();
          event.stopPropagation();
          hasDragged = false;
        }
      },
      true
    );

    // Empêche le glisser-déposer natif des images / liens du navigateur.
    viewport.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    // ---- Clavier (option) : flèches gauche / droite quand la rangée a le focus ----
    if (options.keyboard) {
      viewport.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        var step = viewport.clientWidth * KEY_STEP_RATIO * (event.key === 'ArrowRight' ? 1 : -1);
        inertia = 0;
        if (reduceMotion.matches) {
          scroll = limit(scroll + step);
          markFlowedIfNeeded();
          render();
        } else {
          target = limit((target === null ? scroll : target) + step);
        }
      });
    }

    // ---- Démarrage ----
    // Recalcule tout quand la taille de la fenêtre (donc des images) change.
    new ResizeObserver(build).observe(viewport);
    window.requestAnimationFrame(tick);
  }

  window.Marquee = { create: create, measureLength: measureLength };
})();
