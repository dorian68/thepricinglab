// Bespoke, per-lesson intuition prose — the no-cost lever both personas asked for.
// Replaces the template-generated "philosophy wall" body (which repeated across
// lessons/courses with only the concept noun swapped) with text tied to the
// actual instrument, the actual desk decision, and the actual engine numbers.
// Keyed by course-script SLUG -> lesson number -> {intuition, mechanism, practice}.
// Falls back to the cleaned template when a lesson is not yet authored (wave-based
// rollout: flagship concept lessons first). Light inline $...$ math only; the heavy
// LaTeX lives in the EquationDemo proof rendered just below the prose.

const LESSON_PROSE = {
  'vanilla-options-quote': {
    1: {
      intuition: "Sales vous demande un niveau indicatif sur un call europeen avant d'appeler le client. Avant toute formule, le reflexe est de transformer la demande en six inputs propres et horodates : spot, strike, maturite, taux, dividende, volatilite. Une quote n'est defendable que si chacun est source et date.",
      mechanism: "Le prix n'est pas un nombre isole : c'est une fonction de ces six inputs via le forward $F=S_0 e^{(r-q)T}$ et la moneyness $\\ln(S_0/K)$. Tant que vous n'avez pas ecrit le forward et la convention de maturite (calendaire vs business), vous ne pouvez pas savoir quel chiffre bouge si le marche bouge.",
      practice: "Livrable : un ticket a six lignes plus la donnee manquante identifiee (souvent le dividende ou le borrow). Le piege junior : coter sur le spot brut en oubliant le carry, ce qui decale le forward et donc toute la prime.",
    },
    2: {
      intuition: "Le client valide la taille ; il faut maintenant un prix ferme, pas une fourchette. Black-Scholes repond en supposant un sous-jacent lognormal et une couverture continue : la prime devient l'esperance actualisee du payoff sous la mesure risque-neutre.",
      mechanism: "Tout le prix se lit dans $d_1$ et $d_2$ : $N(d_2)$ est la probabilite risque-neutre d'exercice, $e^{-qT}N(d_1)$ est le delta. La demonstration ci-dessous reconstruit le prix depuis l'esperance du payoff — c'est ce qui rend la formule defendable plutot que magique.",
      practice: "Controle d'ordre de grandeur : un call ATM 1 an a 20% de vol vaut environ 8% du spot. Si votre pricer sort 2% ou 25%, c'est une erreur d'unite (vol annualisee ? maturite en jours ?) avant d'etre un probleme de modele.",
    },
    3: {
      intuition: "Le put mid ne colle pas avec le call mid et le forward : avant de coter, vous devez savoir si c'est un vrai edge ou une quote stale. La parite call-put est le test sans modele qui tranche en une soustraction.",
      mechanism: "La relation $C-P=S_0 e^{-qT}-K e^{-rT}$ ne suppose aucun modele de vol : elle vient d'un portefeuille statique qui replique $\\max(S_T,K)$ des deux cotes. Tout ecart non nul signale une incoherence de funding, de dividende ou de borrow — pas une opportunite de vol.",
      practice: "Reflexe : calculez les deux membres avec VOS inputs de carry avant d'envoyer un niveau. Un ecart de parite qui ne se referme pas apres correction du dividende est souvent un cout de borrow que le desk doit facturer.",
    },
    4: {
      intuition: "Le client augmente la taille et le trader demande le hedge initial : il faut convertir la prime en risque actionnable. Le delta dit combien d'actions shorter, le vega combien de risque de vol vous portez par point.",
      mechanism: "$\\Delta=e^{-qT}N(d_1)$ et $\\nu=S_0 e^{-qT}\\varphi(d_1)\\sqrt{T}$ partagent la densite $\\varphi(d_1)$ : c'est pourquoi gamma et vega culminent au meme endroit (ATM). Au-dela du delta, c'est gamma qui cree le P&L quand le spot bouge.",
      practice: "Attention aux unites : un delta 'par 1%' n'est pas 'par 0.01'. Le livrable de hedge est un nombre d'actions plus une note vega (combien vous gagnez/perdez si la vol implicite bouge d'un point), pas seulement la prime.",
    },
  },

  'options-book-greeks-pnl': {
    1: {
      intuition: "Vous prenez le book le matin : le Greek report donne delta, gamma, vega, theta agreges. Le premier geste n'est pas de couvrir, c'est de lire quel facteur domine le risque du jour et dans quelle unite (EUR par 1% de spot, EUR par point de vol).",
      mechanism: "Chaque Greek est une derivee partielle de la valeur du book. Leur somme ponderee par les mouvements de marche reconstruit le P&L attendu : $dV\\approx\\Delta\\,dS+\\tfrac12\\Gamma\\,dS^2+\\nu\\,d\\sigma+\\Theta\\,dt$ (demonstration ci-dessous).",
      practice: "Livrable : une phrase 'le book est long/court gamma et vega, expose a X'. Le piege : confondre l'exposition nette du book avec celle d'une seule ligne ; c'est le NET qui se hedge.",
    },
    2: {
      intuition: "Le P&L overnight est tombe a -315k. Avant d'expliquer au trader, vous devez le decomposer par facteur — sinon vous ne savez pas si c'est le spot, la vol ou le temps qui a coute.",
      mechanism: "Avec delta +250k/1%, gamma -80k/1%^2, vega +120k/pt, theta -15k/j et un choc spot -2%, vol +3 : delta -500k, gamma -160k, vega +360k, theta -15k, total -315k. Chaque terme est un facteur de risque chiffre, pas une intuition.",
      practice: "Le residu (P&L reel moins P&L explique) est votre controle qualite : un residu large signale un facteur oublie (skew, cross-gamma) ou une erreur de Greek. Livrable : le waterfall des quatre facteurs plus le residu.",
    },
    3: {
      intuition: "Le book est court gamma pres d'un niveau psychologique du sous-jacent : le delta derive vite. La question n'est pas 'quel est le delta' mais 'combien d'actions je trade maintenant et a quelle frequence je re-hedge'.",
      mechanism: "Couvrir le delta, c'est choisir $h=\\Delta$ pour annuler $\\partial\\Pi/\\partial S$. Mais apres hedge, le P&L residuel est $\\tfrac12\\Gamma S^2\\big[(\\Delta S/S)^2-\\sigma^2\\Delta t\\big]$ : vous gagnez si la vol realisee depasse l'implicite payee (demonstration ci-dessous).",
      practice: "Decision : re-hedger maintenant fige la perte gamma mais coupe la convexite ; attendre parie sur un retour. Livrable : taille du hedge plus seuil de re-hedge, pas un simple 'je couvre'.",
    },
    4: {
      intuition: "Risk veut le chiffre, sales veut une phrase client-safe, le trader veut le signe : le meme book se raconte en trois langages. La competence front-office, c'est traduire sans trahir le chiffre.",
      mechanism: "Un seul P&L attribution alimente les trois : au trader 'long vega +360k, le rally de vol nous a aides' ; a risk 'vega 120k/pt, dans la limite' ; a sales 'position stable, pas d'alerte'. Le chiffre est invariant, l'angle change.",
      practice: "Livrable : trois formulations d'un meme fait, chacune avec unite et signe. Le piege : donner a sales le detail des Greeks ou a risk une phrase qualitative.",
    },
  },

  'monte-carlo-pricing': {
    1: {
      intuition: "Un payoff asiatique n'a pas de formule fermee dans l'outil vanilla : il faut simuler. Avant de coder, le ticket de simulation fixe quatre choses : processus, payoff exact, dates de monitoring, precision visee.",
      mechanism: "Le prix cible est $V_0=e^{-rT}\\mathbb{E}^{\\mathbb{Q}}[\\Phi(S)]$. Tout le reste — schema, nombre de chemins, seed — sert a estimer cette esperance avec une incertitude maitrisee. Sans precision visee, on ne sait pas combien de chemins suffisent.",
      practice: "Livrable : un ticket modele (process/payoff/monitoring/precision) avant la premiere ligne de code. Le piege : simuler 1M de chemins 'pour etre sur' sans calculer l'erreur standard — du temps CPU brule sans garantie.",
    },
    2: {
      intuition: "Pour un sous-jacent en GBM, on peut simuler le pas exactement : pas de biais de discretisation a craindre sur le sous-jacent, meme avec un grand pas — ce qui compte pour un Asian sur dates mensuelles.",
      mechanism: "Le pas exact $S_{t+\\Delta}=S_t\\exp[(r-q-\\tfrac12\\sigma^2)\\Delta+\\sigma\\sqrt{\\Delta}\\,Z]$ vient d'Ito sur $\\ln S$ (demonstration ci-dessous). Le terme $-\\tfrac12\\sigma^2$ est la correction de variation quadratique : l'oublier biaise le drift vers le haut.",
      practice: "Controle : avec seed fixe, deux runs donnent le meme prix (reproductibilite). Verifiez les moments simples (moyenne de $S_T$ proche du forward) avant de faire confiance aux chemins.",
    },
    3: {
      intuition: "Le trader veut savoir si un ecart de 5bp entre deux methodes est significatif : la reponse est dans l'intervalle de confiance, pas dans le prix seul. Un prix MC sans IC est inutilisable.",
      mechanism: "Avec 20 000 chemins : prix $=10.4711$, erreur standard $SE=e^{-rT}s_\\Phi/\\sqrt{M}=0.1046$, IC95 $=[10.2661;\\,10.6761]$. Le benchmark Black-Scholes 10.4506 tombe DANS l'intervalle — votre controle de justesse.",
      practice: "Decision : si l'ecart entre deux methodes est plus petit que le SE, il n'est pas significatif. Livrable : prix plus ou moins IC95 plus la phrase 'le BS ferme tombe dans l'IC', sinon biais d'implementation.",
    },
    4: {
      intuition: "Resserrer l'IC en multipliant les chemins coute cher : la precision ne gagne qu'en $1/\\sqrt{M}$. La vraie competence est de reduire la variance a cout CPU egal.",
      mechanism: "Variable de controle : $\\hat V_{cv}=\\hat V-\\beta^*(\\hat X-\\mathbb{E}X)$ avec $X$ le call BS analytique (correle au payoff, esperance connue). Antithetiques : utiliser $(Z,-Z)$ — mais alors l'IC se calcule sur les $M/2$ paires, pas sur les tirages pooles.",
      practice: "Decision : doubler les chemins (×1.4 de precision) ou ajouter un control variate (souvent ×5 a ×10) ? Livrable : methode plus IC obtenu a budget CPU fixe. Piege classique : annoncer un IC i.i.d. sur des tirages antithetiques correles.",
    },
  },

  'rates-swaps-dv01': {
    1: {
      intuition: "Un client veut payer fixe 5 ans contre Euribor : avant tout PV, vous fixez les conventions — dates de paiement, year fraction (30/360 vs ACT/360), sens payer/receiver. Une erreur de convention se paie en P&L direct.",
      mechanism: "Le swap vit sur une courbe de discount factors $DF_i$ deja bootstrappee. La jambe flottante vaut $DF_0-DF_N$ (telescopage), la jambe fixe $s\\sum\\alpha_i DF_i$. Le taux par annule la valeur du swap (demonstration ci-dessous).",
      practice: "Livrable : ticket avec sens, notionnel, courbe de discount et conventions. Piege : traiter ACT/360 comme 30/360 decale chaque coupon — petit par coupon, gros sur 5 ans fois le notionnel.",
    },
    2: {
      intuition: "Le swap a ete traite a 2.80% il y a un mois ; le par courant est 3.10%. Le payeur de fixe est en gain : il faut chiffrer le mark-to-market avant le call de marge.",
      mechanism: "Le MtM vaut $PV_{payeur}=N(s_{par}-s)A$ : l'ecart de taux fois l'annuite $A=\\sum\\alpha_i DF_i$. Ici (3.10-2.80%) fois $A$ fois $N$. L'annuite transforme un ecart en bp en euros.",
      practice: "Controle : le signe doit suivre l'intuition — le payeur de fixe gagne quand les taux montent. Livrable : MtM plus le bucket de courbe qui le porte. Piege : oublier que $A$ change quand la courbe bouge (convexite).",
    },
    3: {
      intuition: "Risk veut votre limite : combien perdez-vous si la courbe monte de 1bp ? C'est le DV01, l'unite de risque de taux qui pilote la limite et le hedge.",
      mechanism: "$DV01=A\\cdot N\\times 10^{-4}$ : derivee du PV par rapport au taux fois 1bp (demonstration ci-dessous). Pour un choc de +X bp, le P&L vaut environ $-DV01\\times X$, le signe suivant le sens payer/receiver.",
      practice: "Decision : si le DV01 depasse la limite, hedger avec un swap oppose ou des futures. Livrable : DV01 par bucket (2y, 5y, 10y) — un DV01 net cache un risque de pente.",
    },
    4: {
      intuition: "Vous hedgez un swap 5y avec des futures : le DV01 net est nul, mais vous portez un basis (swap vs future) et un risque de pente que le hedge parallele ne voit pas.",
      mechanism: "Le DV01 parallele suppose un mouvement uniforme de courbe. En realite, les key-rate durations different : le 2y et le 10y ne bougent pas ensemble. Un hedge parfait en DV01 total peut etre long 2y et court 10y.",
      practice: "Decision : hedger en DV01 total (rapide, imparfait) ou par key-rate (precis, plus de jambes) ? Livrable : residu de basis plus exposition de pente restante. Piege : croire qu'un DV01 net nul egale un risque nul.",
    },
  },

  'credit-derivatives-cds': {
    1: {
      intuition: "Vous achetez la protection 5y sur un nom single-name : vous payez un spread periodique, vous recevez (1-R) fois le notionnel si defaut. Le ticket fixe nom, notionnel, spread, recovery supposee, maturite.",
      mechanism: "La jambe de prime ne paie que si le nom survit : $PV=s\\sum\\alpha_i DF_i\\,\\mathbb{Q}(\\tau>t_i)$. L'annuite risquee $A$ (demonstration ci-dessous) pondere chaque coupon par la probabilite de survie.",
      practice: "Livrable : ticket plus la courbe de survie implicite (hazard). Piege : raisonner sur le spread brut sans l'annuite risquee — le spread seul ne dit pas le risque en euros.",
    },
    2: {
      intuition: "Acheteur de protection, vous payez du carry chaque jour ou rien ne se passe : c'est le cout de l'assurance. La question est de savoir si ce carry negatif est justifie par le risque de defaut couvert.",
      mechanism: "Le carry vaut environ moins notionnel fois spread fois (jours/360). Sur 50m a 120bp : environ 600k/an de prime, soit ~1.67k/jour de theta de spread. La PV de la jambe de prime (~2.52m) est ce que vous payez pour la protection.",
      practice: "Decision : porter le carry ou reduire ? Livrable : carry quotidien plus le scenario qui le justifie (elargissement attendu, evenement). Piege : confondre carry (certain) et MtM (mark-to-market du spread).",
    },
    3: {
      intuition: "Le spread du nom s'ecarte de 25bp sur une rumeur : combien gagne votre protection ? C'est le CS01, l'unite de risque de credit qui pilote la limite et le hedge par indice.",
      mechanism: "Avec $MtM\\approx(s_{mkt}-s_{contrat})A\\,N$, on a $CS01=A\\cdot N\\times 10^{-4}$. Sur 50m, RA 4.2 : CS01 ~21k/bp. Acheteur de protection : $\\Delta MtM\\approx+CS01\\times\\Delta s$ — vous gagnez quand ca s'ecarte (signe verifie dans la demonstration).",
      practice: "Decision : +25bp donne environ +525k de MtM pour l'acheteur. Livrable : CS01 plus le jump-to-default $(1-R)N$ separement — le CS01 lineaire casse au defaut, ou la perte est (1-R)N, pas A fois N.",
    },
    4: {
      intuition: "Trois chiffres se contredisent : carry negatif (cout), CS01 positif (gain si elargissement), JTD enorme (gain si defaut). La decision credit, c'est arbitrer entre payer pour attendre et le risque de saut.",
      mechanism: "Carry -600k/an, CS01 +21k/bp, JTD +30m. Si vous croyez a un defaut ou un fort elargissement, le carry est un peage acceptable ; sinon vous saignez. C'est l'asymetrie protection : petite perte reguliere contre gros gain rare.",
      practice: "Decision : tenir, reduire, ou rouler sur indice (CDX/iTraxx) moins cher en carry. Livrable : la these (carry vs CS01 vs JTD) en une ligne plus le niveau de spread qui invalide la position.",
    },
  },

  'fixed-income-bonds-duration': {
    1: {
      intuition: "Avant tout prix d'obligation, vous cartographiez les flux : coupons aux dates, principal a maturite, frequence. Le prix n'est rien d'autre que la valeur presente de cette carte de flux.",
      mechanism: "Le prix vaut $P=\\sum_i CF_i/(1+y/m)^{m t_i}$ : chaque flux actualise au yield. Tant que la carte des flux et la convention (clean vs dirty, accrued) ne sont pas posees, le prix n'a pas de sens.",
      practice: "Livrable : la carte de flux datee plus clean/dirty explicite. Piege : oublier l'accrued — le prix cote (clean) n'est pas le cash echange (dirty).",
    },
    2: {
      intuition: "Le marche cote un prix ; vous devez en extraire le yield (ou l'inverse) pour comparer deux obligations. Prix et yield sont les deux faces de la meme actualisation.",
      mechanism: "La relation prix-yield est decroissante et convexe. Inverser pour trouver $y$ se fait par Newton (comme la vol implicite), car $\\partial P/\\partial y<0$ strictement sur toute la plage.",
      practice: "Controle : une obligation au pair a yield egal au coupon ; au-dessus du pair, yield inferieur au coupon. Livrable : yield plus ecart au pair. Piege : comparer des yields de conventions differentes (semi vs annuel).",
    },
    3: {
      intuition: "Risk veut votre sensibilite aux taux : si le yield monte de 1%, combien perdez-vous ? La duration modifiee donne le pourcentage, le DV01 donne les euros par bp.",
      mechanism: "$D_{mod}=-\\tfrac1P\\tfrac{dP}{dy}=D_{mac}/(1+y/m)$ (demonstration ci-dessous) : la maturite moyenne ponderee par les PV, ajustee de la capitalisation. Le DV01 vaut $D_{mod}\\times P\\times 10^{-4}$.",
      practice: "Decision : si la duration depasse la limite, vendre ou hedger avec des futures. Livrable : duration plus DV01. Piege : une duration longue signifie plus de risque de taux, pas plus de rendement garanti.",
    },
    4: {
      intuition: "Pour un gros mouvement de taux, la duration seule sous-estime : le prix monte plus quand les taux baissent qu'il ne chute quand ils montent. Cette asymetrie est la convexite, un cadeau pour le detenteur.",
      mechanism: "Le P&L vaut $\\Delta P/P\\approx -D_{mod}\\Delta y+\\tfrac12 C(\\Delta y)^2$ (Taylor d'ordre 2, demonstration ci-dessous). Le terme de convexite est toujours positif pour une obligation classique : il amortit les pertes et amplifie les gains.",
      practice: "Decision : pour un choc de plus ou moins 200bp, la convexite change materiellement le P&L — l'ignorer sous-estime le risque ET la valeur. Livrable : P&L duration plus correction convexite. Piege : appliquer la duration seule a un gros choc.",
    },
  },

  'yield-curve-bootstrapping': {
    1: {
      intuition: "Le desk vous donne un set d'instruments cotes — depo, FRA, futures, swaps — chacun pricant a valeur nulle ou au pair. Avant de bootstrapper, vous les rangez par maturite croissante et notez la convention de chacun : c'est la matiere premiere de toute la courbe.",
      mechanism: "Chaque instrument par impose une equation : ses flux actualises valent 1 (PV nulle). En les empilant du plus court au plus long, on obtient autant d'equations que de discount factors inconnus.",
      practice: "Livrable : la liste ordonnee instrument vers maturite vers convention. Piege : melanger des instruments qui se recouvrent (un FRA et un swap sur la meme periode) cree une surdetermination et une courbe bruitee.",
    },
    2: {
      intuition: "Vous connaissez la courbe jusqu'a 4 ans et vous ajoutez le swap 5 ans : il manque exactement un discount factor. Le bootstrap le resout pas a pas, chaque nouvel instrument livrant un nouveau point.",
      mechanism: "Pour un swap par de taux $s_n$ : $DF_n=\\frac{1-s_n\\sum_{i<n}\\alpha_i DF_i}{1+s_n\\alpha_n}$ (demonstration ci-dessous). Tous les $DF_{i<n}$ sont deja connus ; on isole le dernier.",
      practice: "Controle : les $DF$ doivent etre decroissants et dans $]0,1]$. Un $DF$ qui remonte signale une quote aberrante ou une convention melangee. Livrable : la courbe de discount factors point par point.",
    },
    3: {
      intuition: "La courbe de discount factors est exacte mais illisible. Le desk parle en taux zero (pour comparer les maturites) et en forwards (pour pricer les jambes flottantes).",
      mechanism: "Taux zero continu : $z_n=-\\ln(DF_n)/t_n$. Forward entre deux dates : $f_{i,j}=\\frac{1}{t_j-t_i}\\ln\\frac{DF_i}{DF_j}$ (no-arbitrage, demonstration ci-dessous). Les forwards sont les taux que le marche garantit aujourd'hui pour le futur.",
      practice: "Controle : un forward negatif ou en dents de scie revele une interpolation grossiere des $DF$. Livrable : courbe zero plus courbe forward, avec la methode d'interpolation explicite.",
    },
    4: {
      intuition: "Avant d'utiliser la courbe pour pricer, vous la stressez : reprice-t-elle ses instruments d'input a zero ? Un bootstrap qui ne retrouve pas ses propres inputs est faux.",
      mechanism: "Test de coherence : injecter chaque instrument d'input dans la courbe construite doit redonner une PV nulle (au pair). L'ecart mesure l'erreur d'interpolation entre piliers.",
      practice: "Decision : si le repricing devie, raffiner l'interpolation (log-lineaire sur DF, ou monotone sur forwards). Livrable : courbe validee plus rapport de repricing. Piege : choisir l'interpolation pour la beaute de la courbe, pas pour le no-arbitrage des forwards.",
    },
  },

  'stochastic-calculus-for-hedging': {
    1: {
      intuition: "On ne fait pas du calcul stochastique pour le plaisir : on en fait parce que le sous-jacent qu'on couvre est aleatoire. Une SDE separe ce qui est previsible (le drift) de ce qui ne l'est pas (la diffusion).",
      mechanism: "$dX_t=\\mu_t\\,dt+\\sigma_t\\,dW_t$, avec la regle d'Ito $(dW_t)^2=dt$. Cette regle — la variance s'accumule lineairement — est la raison meme pour laquelle la convexite cree du P&L.",
      practice: "Livrable : identifier $\\mu$ et $\\sigma$ du facteur de risque que vous portez. Piege : croire que le drift $\\mu$ entre dans le prix d'une option — la couverture l'elimine (lecon 3).",
    },
    2: {
      intuition: "Votre option est une fonction du sous-jacent. Pour savoir comment sa valeur bouge, vous ne pouvez pas juste deriver : le terme de variance quadratique compte. C'est Ito.",
      mechanism: "$df=(f_t+\\mu f_x+\\tfrac12\\sigma^2 f_{xx})\\,dt+\\sigma f_x\\,dW$ (demonstration ci-dessous). $f_x$ est le delta a couvrir, $f_{xx}$ le gamma qui genere le P&L de convexite, $\\tfrac12\\sigma^2 f_{xx}$ la correction d'Ito.",
      practice: "Lecture desk : Ito relie le symbole math au ticket hedgeable. Livrable : la decomposition drift/delta/gamma de votre position. Piege : appliquer Ito a un payoff non lisse (digitale, barriere) sans precaution.",
    },
    3: {
      intuition: "Deux traders divergent sur le rendement attendu du sous-jacent mais cotent le meme prix d'option. Pourquoi ? Parce que la couverture fait disparaitre le drift reel : seul le taux sans risque compte.",
      mechanism: "En couvrant $\\Pi=V-V_S\\,S$, le risque s'annule et le portefeuille doit rapporter $r$ : on obtient l'EDP de Black-Scholes et donc $dS=(r-q)S\\,dt+\\sigma S\\,dW^{\\mathbb{Q}}$ (demonstration ci-dessous). Le drift reel $\\mu$ a disparu.",
      practice: "Consequence : ne jamais utiliser une vue directionnelle pour pricer une option couverte. Livrable : le prix comme esperance risque-neutre actualisee. Piege : confondre la mesure reelle (P) et risque-neutre (Q).",
    },
    4: {
      intuition: "Toute la theorie suppose une couverture continue, sans cout, sur un marche liquide. En production, vous re-hedgez discretement, vous payez le spread, et le marche saute. C'est la ou le modele paie ses hypotheses.",
      mechanism: "Le hedge discret laisse un P&L residuel de gamma $\\tfrac12\\Gamma S^2[(\\Delta S/S)^2-\\sigma^2\\Delta t]$ ; les sauts cassent l'hypothese de continuite ; l'incompletude reintroduit un prix de marche du risque.",
      practice: "Decision : a quelle frequence re-hedger (cout vs variance) ? Livrable : la liste des hypotheses qui ne tiennent pas pour votre produit. Piege : faire confiance au prix theorique sans reserve pour cout de hedge et gap.",
    },
  },

  'barrier-options-gap-risk': {
    1: {
      intuition: "Un call down-and-out vaut comme un call vanilla, sauf qu'il meurt si le spot touche la barriere. Le payoff ne depend plus seulement de $S_T$ mais de tout le chemin — d'ou le risque nouveau.",
      mechanism: "$\\Phi=(S_T-K)^+\\mathbf{1}_{\\{\\min_t S_t>B\\}}$. La parite in/out $C_{DO}+C_{DI}=C_{vanilla}$ dit qu'une des deux options vit toujours : on cote l'une depuis l'autre (demonstration ci-dessous).",
      practice: "Livrable : la regle de monitoring (continu ? quotidien ?) et la barriere exacte. Piege : pricer un barrier comme un vanilla — la barriere abaisse la prime, l'investisseur vend l'evenement de knock-out.",
    },
    2: {
      intuition: "Le client veut voir ce qu'il touche selon le spot final ET selon que la barriere a ete touchee. Une table de scenarios rend le produit lisible avant signature.",
      mechanism: "La table croise deux axes : niveau du spot et statut de la barriere (intacte/touchee). Chaque cellule est un payoff calcule, pas une intuition. La discontinuite a la barriere saute aux yeux.",
      practice: "Livrable : table spot fois barriere avec le payoff de chaque cellule. Piege : oublier la ligne 'barriere touchee juste avant maturite' — c'est la ou le client perd le plus et conteste.",
    },
    3: {
      intuition: "Pres de la barriere, le delta explose : couvrir demande une taille ingerable. Si le spot saute a travers $B$ avant que vous ajustiez, vous encaissez une perte que le prix Black-Scholes n'a jamais vue.",
      mechanism: "Le delta diverge : $\\lim_{S\\to B^+}|\\partial V/\\partial S|=\\infty$. La perte de gap vaut environ $\\Delta(B^+)\\times(B-S_{exec})$ : vous executez le hedge a $S_{exec}$, pas a $B$ exact (demonstration ci-dessous).",
      practice: "Decision : sur-couvrir, amortir la barriere, ou provisionner une reserve de gap. Livrable : la perte de gap estimee. Piege : croire que la diffusion continue capture le gap — il faut un modele a sauts ou une reserve.",
    },
    4: {
      intuition: "La barriere est observee a dates discretes (fixing quotidien), pas en continu. Cette nuance change le prix : le discret touche moins souvent que le continu.",
      mechanism: "Correction de Broadie-Glasserman-Kou : pricer le barrier discret avec la formule continue en decalant la barriere de $\\pm 0.5826\\,\\sigma\\sqrt{\\Delta t}$ loin du spot (demonstration ci-dessous). Rapide et precis.",
      practice: "Decision : appliquer le shift ou passer a un MC discret si la barriere est tres proche du spot. Livrable : barriere effective plus frequence de fixing. Piege : pricer un fixing quotidien avec une formule continue sans correction surestime le knock-out.",
    },
  },

  'structured-products-autocall': {
    1: {
      intuition: "Un autocall arrive en term sheet de 12 pages : votre job est d'en extraire les quatre dates et niveaux qui font le prix — barriere d'autocall, barriere de coupon, barriere de protection, dates d'observation.",
      mechanism: "Le produit se decompose en briques : une jambe de rappel anticipe, une jambe de coupons conditionnels, et un remboursement final indexe. Chaque brique a sa probabilite sous Q.",
      practice: "Livrable : la grille dates fois barrieres extraite du term sheet. Piege : confondre barriere de coupon (paie le coupon) et barriere de protection (protege le capital) — deux niveaux differents avec deux risques.",
    },
    2: {
      intuition: "A chaque date d'observation, si l'indice est au-dessus de la barriere d'autocall, la note rembourse par anticipation avec les coupons cumules. Le produit est donc court de la duration : une hausse le rappelle tot.",
      mechanism: "Temps de rappel $\\tau=\\min\\{t_i:S_{t_i}\\ge B_{AC}\\}$ ; PV de rappel $=\\sum_i DF(t_i)N(1+ic)\\,\\mathbb{Q}(\\tau=t_i)$ (demonstration ci-dessous). Les coupons memoire rattrapent les coupons manques.",
      practice: "Livrable : la PV des jambes rappel et coupon. Piege : oublier l'effet memoire — un coupon manque a $t_2$ peut etre paye a $t_3$ si l'indice repasse au-dessus.",
    },
    3: {
      intuition: "Si la note n'est jamais rappelee et que l'indice finit sous la barriere de protection, le client encaisse la baisse en plein. C'est exactement la vente d'un put barriere : le rendement eleve paie ce risque.",
      mechanism: "Remboursement final $=N\\cdot ZC-\\text{DownInPut}(K=S_0,B=B_{prot})$ (demonstration ci-dessous). L'investisseur est long un ZC et vendeur d'un put down-and-in : court de la queue de baisse.",
      practice: "Livrable : la decomposition ZC moins put barriere. Piege : vendre le produit comme 'capital protege' alors que sous la barriere, la perte est totale et indexee.",
    },
    4: {
      intuition: "Le client ne lit pas des probabilites risque-neutre : il lit une table 'si l'indice fait X, je touche Y'. Votre table doit etre honnete sur le scenario de baisse, pas seulement vendeuse.",
      mechanism: "La table croise le niveau de l'indice aux dates cles et le remboursement resultant : rappel anticipe plus coupons, ou capital protege, ou perte indexee sous barriere. Chaque ligne vient des memes briques de pricing.",
      practice: "Livrable : table de scenarios incluant explicitement le cas barriere franchie. Piege : montrer cinq scenarios haussiers et un seul baissier — biais commercial que le risk et la conformite refusent.",
    },
  },

  'market-risk-var-stress': {
    1: {
      intuition: "Avant de calculer une VaR, vous devez dire de quel risque vous parlez : quel portefeuille, quel horizon, quel niveau de confiance. Une VaR sans ces trois reponses est un chiffre orphelin.",
      mechanism: "On projette les positions sur des facteurs de risque : $P\\&L=w^\\top r$, avec $w$ les sensibilites et $r$ les mouvements de facteurs. Tout le reste decoule de la loi de $r$.",
      practice: "Livrable : portefeuille, horizon (1j ? 10j ?), confiance (95% ? 99% ?) explicites. Piege : agreger des positions sans les mapper sur des facteurs communs — on additionne alors des risques non comparables.",
    },
    2: {
      intuition: "Risk veut un seul chiffre : combien peut-on perdre dans 99% des cas demain ? La VaR parametrique le calcule en une multiplication matricielle, rapide pour une limite intraday.",
      mechanism: "Si $P\\&L\\sim\\mathcal N(0,\\sigma_P^2)$ avec $\\sigma_P^2=w^\\top\\Sigma w$, alors $\\text{VaR}_\\alpha=z_\\alpha\\sqrt{w^\\top\\Sigma w}\\,\\sqrt{h}$ (demonstration ci-dessous). $z_{99\\%}=2.326$.",
      practice: "Controle : la VaR doit croitre en $\\sqrt{h}$ avec l'horizon. Livrable : VaR plus la decomposition par facteur dominant. Piege : la VaR parametrique suppose la normalite — elle sous-estime les queues.",
    },
    3: {
      intuition: "La VaR dit ce qui se passe en regime normal ; le stress dit ce qui se passe en 2008 ou en mars 2020. Les deux sont complementaires : l'un est statistique, l'autre est un scenario nomme.",
      mechanism: "On reevalue le portefeuille sous des chocs deterministes : $P\\&L_{stress}=\\sum_k(\\partial V/\\partial x_k)\\Delta x_k+\\tfrac12\\sum_k\\Gamma_k(\\Delta x_k)^2$. L'Expected Shortfall $\\sigma_P\\varphi(z_\\alpha)/(1-\\alpha)$ capte la severite de la queue.",
      practice: "Livrable : VaR plus ES plus un jeu de scenarios historiques. Piege : un stress sensitivity-based rate les non-linearites croisees ; le full revaluation reste la reference pour les gros chocs.",
    },
    4: {
      intuition: "Une mesure de risque n'a de valeur que si elle declenche une action. La vraie competence n'est pas de calculer la VaR mais de savoir quand et quoi escalader.",
      mechanism: "On compare VaR, ES et stress aux limites. Un depassement de limite, ou un stress qui depasse le capital alloue, declenche l'escalation : reduire, hedger, ou demander une exception au risk committee.",
      practice: "Decision : sous la limite (monitorer), proche (alerter), au-dessus (reduire/escalader). Livrable : le facteur dominant plus l'action et le destinataire. Piege : reporter une VaR verte alors qu'un stress nomme creve le capital.",
    },
  },

  'implied-volatility-smile': {
    1: {
      intuition: "Le marche ne cote pas une vol, il cote des prix d'options a plusieurs strikes et maturites. Votre premier geste est de nettoyer cette chaine : retirer les quotes croisees, les bid/ask aberrants, les strikes illiquides.",
      mechanism: "Chaque prix propre se convertit en une vol implicite via l'inversion de Black-Scholes. L'ensemble des $\\sigma_{imp}(K,T)$ forme la surface — l'objet que le desk price et hedge reellement.",
      practice: "Livrable : la chaine nettoyee plus les quotes rejetees avec raison. Piege : inverser un prix sous la valeur intrinseque — aucune vol ne le reproduit, c'est une quote a jeter (lecon 2).",
    },
    2: {
      intuition: "Le prix de marche est observe ; la vol implicite est ce qu'il faut retrouver. Comme le vega est strictement positif, il existe une et une seule vol qui reproduit chaque prix valide.",
      mechanism: "On cherche le zero de $g(\\sigma)=C_{BS}(\\sigma)-C_{mkt}$. Comme $g'=\\nu>0$, la solution est unique et Newton converge : $\\sigma_{k+1}=\\sigma_k-(C_{BS}(\\sigma_k)-C_{mkt})/\\nu(\\sigma_k)$ (demonstration ci-dessous).",
      practice: "Controle : deep ITM/OTM, le vega tend vers 0 et Newton devient instable — basculer sur bisection. Livrable : la vol implicite par strike. Piege : un prix hors bornes (intrinseque ou borne sup) n'a pas de solution.",
    },
    3: {
      intuition: "Si Black-Scholes etait vrai, la vol implicite serait plate en strike. Elle ne l'est pas : les puts OTM cotent plus cher en vol (skew actions), reflet de la peur du crash et des queues epaisses.",
      mechanism: "En variance totale $w=\\sigma^2 T$, le smile a des ailes lineaires de pentes $b(1\\pm\\rho)$ : $\\rho$ controle l'asymetrie (skew), $b$ l'ouverture. Le skew dit que la distribution risque-neutre n'est pas lognormale.",
      practice: "Lecture desk : comparer vol implicite (la chaine) et vol realisee (le widget temps reel) — l'ecart est la prime de risque de variance. Livrable : la forme du smile (niveau, pente, courbure). Piege : extrapoler le smile au-dela des strikes cotes sans contrainte de no-arbitrage.",
    },
    4: {
      intuition: "Vous ne pouvez pas garder un point de vol par strike : il faut une fonction lisse pour interpoler et pricer les strikes non cotes. SVI fait cela en cinq parametres interpretables.",
      mechanism: "$w(k)=a+b[\\rho(k-m)+\\sqrt{(k-m)^2+\\eta^2}]$ (demonstration ci-dessous), avec les bornes de Roger Lee ($b\\ge0$, $|\\rho|<1$) qui imposent des pentes admissibles et une variance positive.",
      practice: "Decision : raw SVI peut violer la non-arbitrage butterfly entre maturites — passer a SSVI si besoin d'une surface globale sans arbitrage. Livrable : parametres SVI plus controle d'arbitrage. Piege : surajuster le smile sur des quotes bruitees.",
    },
  },
};

// Long-form EDITORIAL narrative (Hull-chapter density) for the key lesson of each
// course — rendered full-width with a drop cap above the compact key-point cards.
// This is the verbose teaching voice; accented French, engine-accurate numbers.
const LESSON_NARRATIVE = {
  'vanilla-options-quote': {
    1: "Le carry est ce qui sépare un prix scolaire d'un prix de desk. Le sous-jacent coté aujourd'hui à $S_0$ ne se livre pas aujourd'hui : l'option regarde le forward $F = S_0 e^{(r-q)T}$. Si vous cotez sur le spot brut, vous décalez le forward de tout le terme de portage — dividende, repo, borrow — et la prime entière hérite de l'erreur. Sur une action versant 2% de dividende, oublier $q$ sur une maturité un an déplace le forward d'environ 2%, et le delta-cash de votre couverture d'autant.\n\nLe réflexe de desk est donc d'écrire le forward **avant** toute formule, puis de nommer la donnée que vous avez dû supposer — le plus souvent le borrow, parce que c'est précisément celle que le client contestera. Une quote n'est jamais un nombre seul : c'est un nombre accompagné de la liste des conventions qui le rendent défendable. Le contrôle d'ordre de grandeur vient juste après : un call à la monnaie, un an, vol 20%, vaut environ 8% du spot. Si le pricer sort 2% ou 25%, cherchez l'erreur d'unité avant d'incriminer le modèle.",
  },
  'options-book-greeks-pnl': {
    2: "Le résidu est votre détecteur de mensonge. Vous avez expliqué le $-315\\text{k}$ de la nuit avec quatre facteurs — delta $-500\\text{k}$, gamma $-160\\text{k}$, vega $+360\\text{k}$, theta $-15\\text{k}$ ; le P&L réel du book, lui, tombe du système indépendamment de votre attribution. S'ils collent à quelques milliers près, votre lecture du risque est juste. S'il reste $-180\\text{k}$ inexpliqués, vous avez oublié un facteur : du cross-gamma (le spot **et** la vol ont bougé ensemble), du skew (votre vega est en réalité un vecteur par strike, pas un scalaire), ou une erreur de Greek en amont.\n\nSur le desk, on n'envoie jamais une attribution sans sa ligne « résidu ». Un résidu large n'est pas un détail comptable : c'est le signal qu'un risque non couvert vit dans le book, et qu'il se réveillera au prochain mouvement. La discipline n'est pas de produire un joli waterfall — c'est de le réconcilier au centime avec le P&L officiel, puis d'expliquer l'écart.",
  },
  'implied-volatility-smile': {
    3: "Si Black-Scholes disait vrai, vous traceriez la vol implicite contre le strike et vous obtiendriez une ligne plate. Vous ne l'obtenez jamais. Sur indice actions, les puts hors-monnaie cotent systématiquement une vol plus élevée que les calls : c'est le skew, et il a un sens économique précis. Le marché paie pour se protéger d'un krach, et cette demande asymétrique déforme la distribution risque-neutre — queue gauche épaisse, asymétrie négative.\n\nLa vol implicite n'est donc pas une prévision de volatilité ; c'est un **prix**, celui de l'assurance. D'où la lecture de desk, lisible juste sous ce paragraphe sur données réelles : comparez le VIX (implicite) à la vol réalisée 21 jours du S&P 500. L'écart, presque toujours positif, est la prime de risque de variance — ce que les vendeurs de vol encaissent en moyenne, et reperdent violemment dans les crises. Un smile n'est pas une courbe à ajuster pour la beauté du fit : c'est la photographie de ce que le marché redoute.",
  },
  'rates-swaps-dv01': {
    1: "Le ticket dit « payer 5Y EUR, 100m, contre Euribor 3M ». Avant le moindre PV, trois conventions décident du signe de votre P&L. La base de la jambe fixe (30/360) et celle de la jambe flottante (ACT/360) ne comptent pas les jours de la même façon : sur un coupon ça se chiffre en centaines d'euros, sur cinq ans fois 100m ça devient une ligne que le middle-office vous renverra. Le calendrier de paiement (modified following, fin de mois) décale chaque date de fixing. Et le sens — payer le fixe, c'est **recevoir** le flottant — fixe lequel des deux d'une hausse de taux vous enrichit.\n\nTant que ces trois lignes ne sont pas écrites au-dessus du pricer, le DV01 que vous sortirez sera juste au centime et faux sur le signe. La valorisation d'un swap n'est pas difficile ; c'est la discipline de convention qui sépare le quant junior qui « a le bon chiffre » du trader qui sait dans quel bucket de courbe ce chiffre vit.",
  },
  'yield-curve-bootstrapping': {
    2: "Vous connaissez la courbe jusqu'à deux ans : $DF_1 = 0.971$, $DF_2 = 0.939$. Le swap 3 ans cote 3.35% au par, et il manque exactement un inconnu, $DF_3$. Le par impose que les coupons actualisés plus le remboursement valent 1 ; on isole le dernier flux : $DF_3 = (1 - 0.0335\\,(0.971+0.939)) / (1+0.0335) \\approx 0.906$.\n\nLe contrôle n'est pas optionnel : un discount factor doit décroître ($0.971 > 0.939 > 0.906$) et rester dans $]0,1]$. S'il remonte, ce n'est pas la courbe qui est intéressante — c'est une quote aberrante ou deux conventions mélangées, et le forward 2 ans vers 3 ans qui en sort partira en dents de scie. Bootstrapper, ce n'est pas tourner une formule : c'est construire un objet peg par peg en vérifiant à chaque pilier que le no-arbitrage tient. La courbe que vous obtenez n'est belle que si elle reprice exactement les instruments qui l'ont fabriquée.",
  },
  'fixed-income-bonds-duration': {
    4: "Montez le yield de 100bp : le prix tombe de, disons, 7.8 points. Baissez-le de 100bp : il monte de 8.3. Même choc, gain plus gros que la perte — la relation prix-yield est courbée, pas droite. La duration seule, qui n'est que la tangente, vous aurait promis 8.05 dans les deux sens : elle surestime la perte et sous-estime le gain.\n\nCet écart, c'est la convexité, et pour une obligation classique il joue toujours en votre faveur : $\\Delta P/P \\approx -D_{mod}\\,\\Delta y + \\tfrac12 C(\\Delta y)^2$, où le second terme est positif. D'où la règle de desk : sur un choc de $\\pm 200\\text{bp}$, citer la duration seule, c'est sous-estimer à la fois votre risque **et** la valeur que vous détenez. La convexité est un actif silencieux — on la paie en rendement (les obligations convexes cotent un peu plus cher), et on l'encaisse quand les taux bougent fort.",
  },
  'monte-carlo-pricing': {
    3: "Un prix Monte-Carlo n'est pas un nombre, c'est un nombre avec un nuage autour de lui, et le métier consiste à connaître la taille du nuage avant de le montrer au trader. Vous simulez vingt mille trajectoires, vous moyennez les payoffs actualisés, et vous obtenez $10.4711$. Tentant de s'arrêter là. Mais l'écart-type des payoffs vaut environ 15.5 — énorme devant le prix lui-même — et l'erreur standard de votre moyenne est $e^{-rT}\\,15.5/\\sqrt{20000} \\approx 0.10$. Votre intervalle à 95% est donc $[10.27;\\,10.68]$.\n\nLe Black-Scholes fermé donne $10.4506$ : il tombe à l'intérieur. C'est votre seul contrôle de non-biais — si le prix fermé était **hors** de l'intervalle, vous n'auriez pas un bruit d'échantillonnage mais une erreur d'implémentation (drift mal corrigé, oubli du $-\\tfrac12\\sigma^2$, payoff mal codé). Et c'est ici que la convergence en $1/\\sqrt{N}$ devient une décision économique : pour diviser ce nuage par deux, il faut quatre fois plus de trajectoires, donc quatre fois plus de CPU sur le batch overnight.",
  },
  'barrier-options-gap-risk': {
    3: "Approchez la barrière et le delta cesse d'être un nombre : il devient une falaise. À 30 pips au-dessus de $H$, une option down-and-out se comporte presque comme une vanille, delta tranquille autour de 0.6. À 5 pips, ce même delta peut dépasser 8 ou 10 en valeur absolue — vous devriez vendre dix fois le notionnel en spot pour rester couvert, sur un marché qui, justement parce qu'il teste un niveau technique, vient de perdre la moitié de sa profondeur.\n\nEt si le spot ne glisse pas mais **saute** à travers $H$ — un fixing BCE, un flash de fin de séance tokyoïte — vous n'avez jamais l'occasion d'exécuter ce hedge. Vous vous réveillez de l'autre côté : l'option est morte, votre couverture short spot est intacte, et la perte est $\\Delta_{\\text{pre-hit}}\\times(S_{\\text{hit}}-S_{\\text{next}})$, un chiffre que Black-Scholes, qui suppose des trajectoires continues, n'a jamais provisionné. C'est pourquoi un desk d'exotiques ne cote pas une barrière sur le seul prix du modèle : il ajoute une réserve de gap, élargit le spread près du niveau, ou « amortit » la barrière. Le risque dominant n'est pas grec. Il est topologique.",
  },
  'structured-products-autocall': {
    3: "Le rendement n'est jamais gratuit ; il est le prix d'un risque que quelqu'un porte, et dans un autocall ce quelqu'un est le client. Décomposez la note et la magie disparaît : l'investisseur détient un zéro-coupon — son capital, rendu à terme — et il a **vendu** un put down-and-in de strike 100% et de barrière 60%. Tant que l'indice reste au-dessus de 60%, ce put n'existe pas : la barrière n'est pas franchie, le capital revient entier, et le coupon de 6% ressemble à un rendement obligataire généreux.\n\nMais le jour où l'Euro Stoxx clôture sous 60% à maturité — et 2008, 2020 et 2022 rappellent que ce jour arrive — le put s'active d'un coup, le client encaisse la totalité de la baisse, et découvre qu'un produit vendu comme « à coupon élevé » était en réalité une position vendeuse de queue de distribution. Le structureur, lui, est de l'autre côté : long volatilité, long skew, et sur les worst-of, court corrélation. C'est pourquoi une table de scénarios autocall honnête ne montre jamais cinq cas haussiers et un seul krach.",
  },
  'credit-derivatives-cds': {
    4: "Acheter de la protection, c'est accepter une structure de P&L que tout le reste du desk déteste : vous perdez un peu, tous les jours, avec certitude. Sur 50m à 120bp, ce sont $600\\text{k}$ par an — environ $1\\,670$ qui sortent chaque matin où il ne se passe rien. En échange, vous tenez deux options. La première est linéaire : si le spread s'écarte de 25bp sur une rumeur, votre CS01 de $21\\text{k}$/bp transforme le mouvement en $+525\\text{k}$ de MtM.\n\nLa seconde est explosive et hors du modèle linéaire : au défaut, le CS01 ne veut plus rien dire — vous touchez $(1-R)\\,N$, soit $30\\text{m}$ d'un coup, près de 1 400 fois le carry quotidien. Toute la décision crédit tient dans cette phrase : combien de jours de carry suis-je prêt à payer pour porter une option dont le strike est la faillite du nom ? Le piège junior n'est pas de mal calculer le CS01 ; c'est de gérer la position **au** CS01 alors que le vrai risque est le saut que le CS01 ne voit pas.",
  },
  'market-risk-var-stress': {
    3: "La VaR paramétrique a une qualité fatale : elle est rassurante. En régime normal, la cloche gaussienne colle, la limite est verte, tout le monde signe. Le 19 octobre 1987, le S&P a perdu 22.9% — un événement que le modèle gaussien situe à plus de vingt écarts-types, c'est-à-dire « jamais » à l'échelle de l'univers. Sur un book réel, la VaR historique à 99% est déjà près de deux fois la paramétrique, et l'Expected Shortfall — la perte moyenne **au-delà** de la VaR, celle que Bâle FRTB a rendue réglementaire précisément parce que la VaR cache la sévérité — est encore au-dessus.\n\nLa leçon n'est pas que le chiffre est faux ; c'est qu'un chiffre vert n'est une décision que si un stress nommé, lui, ne crève pas le capital. En 2008, ce qui a tué les books n'était pas la taille des VaR mais la disparition de la diversification : des corrélations estimées à 0.3 sont parties à 0.95 en une semaine, et toutes les positions « décorrélées » ont perdu ensemble. La distribution réelle, juste en dessous, montre exactement ce que la cloche efface.",
  },
  'stochastic-calculus-for-hedging': {
    3: "Deux traders ne sont d'accord sur rien. L'un croit le sous-jacent promis à $+15\\%$, l'autre à $-5\\%$. Posez-leur la même option : ils cotent le même prix. Ce n'est pas un tour de passe-passe, c'est la couverture qui parle. En détenant $\\Delta$ actions contre l'option, vous annulez localement le terme en $dW$ — le portefeuille ne sait plus dans quel sens le marché penche, et un portefeuille sans risque ne peut rapporter que $r$.\n\nLe rendement attendu réel $\\mu$, l'objet de toutes les disputes, a disparu de l'équation de pricing ; il reste $r-q$. Regardez les deux trajectoires que trace le widget : drifts opposés, et pourtant la distribution du P&L delta-couvert est la même cloche centrée sur zéro. C'est la conséquence opérationnelle la plus mal comprise du métier : ne jamais laisser une vue directionnelle entrer dans le prix d'une option que vous couvrez. Le calcul stochastique n'est pas là pour décorer — il dit précisément quel symbole ($f_x$, le delta ; $f_{xx}$, le gamma) correspond à quel euro de P&L.",
  },
};

// Full editorial narratives for EVERY lesson of every course (~280 words each,
// authored to the desk-voice gold standard). Keyed slug -> "lessonNumber".
import LESSON_NARRATIVES from './lessonNarratives.json';

export function getLessonProse(slug, lessonNumber) {
  const base = LESSON_PROSE[slug]?.[lessonNumber] || null;
  const narrative = LESSON_NARRATIVES[slug]?.[String(lessonNumber)]
    || LESSON_NARRATIVE[slug]?.[lessonNumber]
    || null;
  if (!base && !narrative) return null;
  return { ...(base || {}), narrative };
}

export default LESSON_PROSE;
