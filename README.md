# Portfolio — Kevin Lagier

Site statique (HTML / CSS / JavaScript sans framework ni étape de build) :
une page d'accueil, une page « About » et une page case study par projet.

## Lancer le site en local

```bash
python3 -m http.server 4173
```

Puis ouvrir <http://localhost:4173>. Un simple serveur de fichiers suffit : le
header et le footer sont injectés en JavaScript (`js/header.js`, `js/footer.js`),
et les liens internes sont relatifs.

## Structure

```
index.html, about.html, ai-creation.html   pages du site
<projet>.html                              une page case study par projet
css/
  main.css                                 feuille commune (importe base + composants globaux)
  base/                                    variables, reset, polices, échelle fluide (rem)
  components/                              header, footer, bouton .cta, bloc .work-cta,
                                           liste des projets de la Home (project.css),
                                           éléments communs des case studies (case-study.css)
  pages/<page>.css                         styles propres à chaque page
js/                                        marquee.js (moteur de défilement), carousel/slider,
                                           video-autoplay.js, header/footer, transitions
images/<projet>/                           images optimisées (.webp), servies par le site
videos/<projet>/                           vidéos (.mp4)
fonts/                                     Haffer XH (Medium, Regular)
images/_sources/                           exports Figma bruts — LOCAL UNIQUEMENT (voir .gitignore)
```

Chaque page charge `css/main.css`, puis (case studies) `css/components/case-study.css`,
puis sa propre feuille `css/pages/<page>.css`.

## Conventions

- **Échelle fluide** : toutes les tailles sont en `rem`, calées sur la maquette
  1920 px (desktop, 1rem = 16 px) et 375 px (mobile). Voir `css/base/variables.css`.
  Les textes du header, du footer et du texte de présentation des projets gardent
  des tailles fixes en `px` (volontairement).
- **Points de rupture** : `<440px` (images mobile), `440–1024px` (tablette : images
  desktop), `≥1025px` (desktop).
- **Nommage BEM** : `page__element--modificateur` (ex. `schlouk__bloc2`). Les éléments
  communs des case studies sont `case__*` (`case__title`, `case__credits`…).
- **Images** : exportées de Figma en PNG dans `images/_sources/<projet>/`, converties en
  `.webp` (qualité 90) dans `images/<projet>/`, **sans jamais être recadrées ni
  redimensionnées**. Elles contiennent déjà leur fond et leurs marges : aucun fond ou
  padding n'est ajouté en CSS par-dessus.
- **Vidéos** : le ratio réel de la vidéo est toujours conservé (`object-fit: contain`).
  Attention aux fichiers dont le drapeau de pixels non carrés (SAR) ne vaut pas 1:1 : le
  vrai format d'affichage est celui du drapeau (à vérifier en mesurant un élément rond
  dans l'image). Lecture automatique à l'écran via `js/video-autoplay.js`, contrôles
  natifs toujours présents.

## Ajouter un projet

1. Copier la page d'un projet existant proche (ex. `schlouk.html` + `css/pages/schlouk.css`),
   renommer les classes `schlouk__*` et le `data-page` du `<body>`.
2. Mettre les images dans `images/<projet>/` (`<projet>-desktop-NN.webp`,
   `<projet>-mobile-NN.webp`) et la vidéo dans `videos/<projet>/`.
3. Chaînage Prev / Next : modifier les liens de la page précédente et suivante.
4. Home (`index.html`) : copier un bloc projet (ou `.mini-project`), brancher le bouton
   *Discover* et, si besoin, l'image du hero (`.hero__slide`, lien vers `#project-XX` ou
   `#mini-project-XX`).

## Déploiement (Vercel)

Site statique : aucun framework, aucune commande de build, répertoire de sortie = racine.
`vercel.json` ajoute des en-têtes de cache (polices, images, vidéos) ; `.vercelignore` et
`.gitignore` excluent `images/_sources/`.

> Les polices Haffer (`fonts/`) sont des polices commerciales : leur licence web doit couvrir ce site.
