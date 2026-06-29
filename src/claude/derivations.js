// Rigorous, hand-verified mathematical demonstrations for the desk formulas used
// in every course. Keyed by the course-script SLUG (see COURSE_SCRIPT_SLUGS) then
// by the exact "### F<n> - <title>" heading parsed from the markdown.
//
// Each entry feeds the <EquationDemo> "Demonstration mathematique" scaffold:
//   { assumption, steps: [{label, math, note}], result, desk, limit }
// `math` / `result` are LaTeX WITHOUT $$ delimiters (the renderer wraps them).
// When a formula has no entry here, buildEquationDemo falls back to the generic
// family-level outline (no regression). Proofs are textbook-standard (Hull,
// Joshi, Rebonato, Brigo-Mercurio) and rewritten for the desk; numbers in the
// worked appendices are produced by the deterministic engine, not here.

const DERIVATIONS = {
  // ---------------------------------------------------------------- Vanilla BS
  'vanilla-options-quote': {
    'Black-Scholes call with dividend yield': {
      assumption: "Sous-jacent lognormal sous Q, taux r et dividende continu q et volatilite sigma constants, marche complet sans arbitrage, call europeen exerce uniquement en T.",
      steps: [
        { label: 'Valorisation risque-neutre', math: "C = e^{-rT}\\,\\mathbb{E}^{\\mathbb{Q}}\\big[(S_T-K)^+\\big]", note: "Le prix est l'esperance actualisee du payoff sous la mesure risque-neutre." },
        { label: 'Loi du sous-jacent', math: "S_T = S_0\\,e^{(r-q-\\frac12\\sigma^2)T + \\sigma\\sqrt{T}\\,Z},\\quad Z\\sim\\mathcal{N}(0,1)", note: "Solution de la GBM risque-neutre (lemme d'Ito sur ln S)." },
        { label: "Region d'exercice", math: "S_T>K \\iff Z>-d_2,\\quad d_2=\\frac{\\ln(S_0/K)+(r-q-\\frac12\\sigma^2)T}{\\sigma\\sqrt{T}}", note: "On standardise le seuil de moneyness." },
        { label: 'Probabilite d\'exercice', math: "\\mathbb{E}^{\\mathbb{Q}}[\\mathbf{1}_{S_T>K}] = \\mathbb{Q}(Z>-d_2)=N(d_2)", note: "Deuxieme morceau du payoff: la jambe strike." },
        { label: 'Esperance du spot exerce', math: "\\mathbb{E}^{\\mathbb{Q}}[S_T\\,\\mathbf{1}_{S_T>K}] = S_0\\,e^{(r-q)T}\\,N(d_1),\\quad d_1=d_2+\\sigma\\sqrt{T}", note: "Completion du carre dans la gaussienne (changement de numeraire en actif)." },
        { label: 'Recombinaison et actualisation', math: "C = e^{-rT}\\big[S_0 e^{(r-q)T}N(d_1) - K\\,N(d_2)\\big]", note: "On regroupe les deux jambes et on actualise." },
      ],
      result: "C = S_0 e^{-qT}N(d_1) - K e^{-rT}N(d_2)",
      desk: "Chaque input du ticket a sa place: spot, strike, maturite, taux, dividende, vol. Le niveau devient defendable face au client.",
      limit: "Vol unique: smile, dividendes discrets, taux stochastiques et exercice americain demandent un modele plus riche.",
    },
    'd1/d2 controls': {
      assumption: "Memes hypotheses Black-Scholes. On lit d1 et d2 comme des controles de coherence du ticket.",
      steps: [
        { label: 'Definition', math: "d_{1,2}=\\frac{\\ln(S_0/K)+(r-q\\pm\\frac12\\sigma^2)T}{\\sigma\\sqrt{T}}", note: "Log-moneyness ajuste du carry, normalise par l'ecart-type." },
        { label: 'Ecart fixe', math: "d_1-d_2=\\sigma\\sqrt{T}", note: "L'ecart ne depend que de la variance totale: un controle immediat." },
        { label: 'Sens probabiliste', math: "N(d_2)=\\mathbb{Q}(S_T>K),\\qquad e^{-qT}N(d_1)=\\frac{\\partial C}{\\partial S_0}=\\Delta", note: "d2 pilote la proba d'exercice, d1 pilote le delta." },
        { label: 'Lien vega', math: "\\nu=\\frac{\\partial C}{\\partial\\sigma}=S_0 e^{-qT}\\varphi(d_1)\\sqrt{T}", note: "La meme densite phi(d1) gouverne gamma et vega." },
      ],
      result: "N(d_2)=\\mathbb{Q}(\\text{exercice}),\\quad e^{-qT}N(d_1)=\\Delta",
      desk: "Si d2 est tres negatif, l'option est presque sans valeur: inutile de chasser des decimales de vol.",
      limit: "d1/d2 supposent une vol log-normale constante: hors-money, le smile decale la lecture probabiliste.",
    },
    'Put-call parity': {
      assumption: "Pas d'arbitrage, meme strike K et maturite T, dividende continu q, possibilite de financer/preter au taux r. Aucune hypothese de modele.",
      steps: [
        { label: 'Deux portefeuilles', math: "A: \\text{call}+Ke^{-rT}\\text{ cash};\\qquad B:\\text{put}+e^{-qT}\\text{ action}", note: "Replication statique, sans rebalancement." },
        { label: 'Payoff de A en T', math: "(S_T-K)^+ + K = \\max(S_T,K)", note: "Le cash capitalise exactement a K." },
        { label: 'Payoff de B en T', math: "(K-S_T)^+ + S_T = \\max(S_T,K)", note: "Les dividendes reinvestis amenent e^{-qT} action a 1 action en T." },
        { label: 'Loi du prix unique', math: "C + Ke^{-rT} = P + S_0 e^{-qT}", note: "Memes flux terminaux dans tous les etats => memes valeurs aujourd'hui." },
      ],
      result: "C - P = S_0 e^{-qT} - K e^{-rT}",
      desk: "Outil n.1 de detection de quote stale: un ecart non nul signale un arbitrage ou une mauvaise hypothese de carry.",
      limit: "Sensible aux conventions de dividende, cout de repo/borrow et financement collateral; la parite est un test, pas un prix.",
    },
  },

  // ----------------------------------------------------------- Greeks & P&L
  'options-book-greeks-pnl': {
    'Delta-gamma-vega-theta attribution': {
      assumption: "Valeur V(S,sigma,t) deux fois derivable; petits mouvements de spot, vol et temps sur une journee.",
      steps: [
        { label: 'Developpement de Taylor', math: "dV = \\frac{\\partial V}{\\partial S}dS + \\tfrac12\\frac{\\partial^2 V}{\\partial S^2}dS^2 + \\frac{\\partial V}{\\partial\\sigma}d\\sigma + \\frac{\\partial V}{\\partial t}dt + \\dots", note: "2e ordre en spot (convexite), 1er ordre en vol et temps." },
        { label: 'Identification des Greeks', math: "\\Delta=\\tfrac{\\partial V}{\\partial S},\\;\\Gamma=\\tfrac{\\partial^2 V}{\\partial S^2},\\;\\nu=\\tfrac{\\partial V}{\\partial\\sigma},\\;\\Theta=\\tfrac{\\partial V}{\\partial t}", note: "Chaque sensibilite = un facteur de risque du book." },
        { label: 'Substitution', math: "dV \\approx \\Delta\\,dS + \\tfrac12\\Gamma\\,dS^2 + \\nu\\,d\\sigma + \\Theta\\,dt", note: "C'est la decomposition de P&L envoyee au debrief intraday." },
      ],
      result: "\\Delta P\\&L \\approx \\Delta\\,\\Delta S + \\tfrac12\\Gamma\\,(\\Delta S)^2 + \\nu\\,\\Delta\\sigma + \\Theta\\,\\Delta t",
      desk: "L'attribution doit reconcilier le P&L explique avec le P&L reel; un residu large = facteur oublie (skew, cross-gamma).",
      limit: "Taylor casse sur gros gaps; il faut alors un repricing complet et les termes croises (vanna, volga).",
    },
    'Delta hedge notional': {
      assumption: "On neutralise le risque directionnel d'ordre 1 d'une position V en se couvrant avec h actions du sous-jacent.",
      steps: [
        { label: 'Portefeuille couvert', math: "\\Pi = V - h\\,S", note: "On cherche le nombre d'actions h qui annule la pente." },
        { label: 'Annulation du 1er ordre', math: "\\frac{\\partial\\Pi}{\\partial S}=\\frac{\\partial V}{\\partial S}-h \\stackrel{!}{=}0", note: "Condition de delta-neutralite." },
        { label: 'Ratio de couverture', math: "h^{*}=\\frac{\\partial V}{\\partial S}=\\Delta", note: "On detient Delta actions par option; on shorte Delta_book pour un book." },
      ],
      result: "\\text{Notional de hedge} = \\Delta\\cdot S \\quad(\\text{shares}=\\Delta)",
      desk: "Le hedge n'est exact qu'a l'instant t: gamma fait deriver Delta, d'ou le re-hedge.",
      limit: "Couts de transaction, liquidite et sauts rendent le re-hedge continu impossible: il reste un risque gamma/jump.",
    },
    'Residual gamma P&L': {
      assumption: "Book delta-couvert et auto-finance; on isole le P&L apres neutralisation du delta. Cadre Black-Scholes pour relier theta et gamma.",
      steps: [
        { label: 'P&L delta-couvert', math: "d\\Pi \\approx \\tfrac12\\Gamma\\,dS^2 + \\Theta\\,dt", note: "Le terme delta est annule par la couverture." },
        { label: 'EDP de Black-Scholes', math: "\\Theta + \\tfrac12\\sigma^2 S^2\\Gamma + (r-q)S\\Delta - rV = 0", note: "Pour un book delta-neutre, le carry theta est domine par -1/2 sigma^2 S^2 Gamma." },
        { label: 'Variance realisee vs implicite', math: "d\\Pi \\approx \\tfrac12\\Gamma S^2\\Big[\\big(\\tfrac{dS}{S}\\big)^2-\\sigma^2 dt\\Big]", note: "On remplace Theta par -1/2 sigma^2 S^2 Gamma (vol implicite)." },
      ],
      result: "\\Delta P\\&L_{\\text{resid}} \\approx \\tfrac12\\Gamma S^2\\big[(\\Delta S/S)^2 - \\sigma^2\\Delta t\\big]",
      desk: "Le gamma scalper gagne quand la variance realisee depasse la variance implicite payee: c'est l'edge du long gamma.",
      limit: "Vrai a vol constante; en pratique vega/vanna et le smile re-pricent l'implicite a chaque pas.",
    },
  },

  // ------------------------------------------------------------- Swaps & DV01
  'rates-swaps-dv01': {
    'Par swap rate': {
      assumption: "Courbe de discount factors DF_i deja bootstrappee, dates et year fractions alpha_i fixees, jambe flottante sans spread sur la meme courbe (mono-courbe).",
      steps: [
        { label: 'Jambe flottante', math: "PV_{\\text{float}} = DF_0 - DF_N", note: "Telescopage: somme des forwards actualises = depart moins fin." },
        { label: 'Jambe fixe', math: "PV_{\\text{fixe}} = s\\sum_{i=1}^{N}\\alpha_i DF_i = s\\,A,\\quad A=\\sum_i\\alpha_i DF_i", note: "A est l'annuite (PV01 sans notionnel)." },
        { label: 'Condition de par', math: "s\\,A = DF_0 - DF_N", note: "Le swap par cote a valeur nulle: PV fixe = PV flottante." },
      ],
      result: "s = \\frac{DF_0 - DF_N}{\\sum_{i}\\alpha_i DF_i}",
      desk: "Le taux par est une moyenne ponderee des forwards: il dit ou le marche price le cout de financement terme.",
      limit: "Multi-courbe (OIS discount vs forwarding), basis et conventions de calendrier deplacent s; mono-courbe est une simplification.",
    },
    'Swap PV around par': {
      assumption: "On valorise un swap deja traite a taux fixe s contre le taux par courant s_par.",
      steps: [
        { label: 'PV payeur de fixe', math: "PV_{\\text{payer}} = PV_{\\text{float}} - PV_{\\text{fixe}} = (DF_0-DF_N) - s\\,A", note: "Le payeur de fixe recoit le flottant." },
        { label: 'Substitution du par', math: "DF_0-DF_N = s_{\\text{par}}\\,A", note: "Par definition du taux par." },
        { label: 'Mark-to-market', math: "PV_{\\text{payer}} = (s_{\\text{par}}-s)\\,A\\,N", note: "Lineaire dans l'ecart de taux, amplifie par l'annuite." },
      ],
      result: "PV_{\\text{payer}} = N\\,(s_{\\text{par}} - s)\\,A",
      desk: "Le MtM ne depend que de l'ecart entre le par courant et le taux traite, x l'annuite: une lecture directe du risque de courbe.",
      limit: "A change quand la courbe bouge (convexite de second ordre); pour gros chocs, le terme A(s) n'est plus constant.",
    },
    'DV01': {
      assumption: "On mesure la sensibilite du PV a un choc parallele de 1 bp de la courbe de swap.",
      steps: [
        { label: 'Sensibilite analytique', math: "\\frac{\\partial PV}{\\partial s} = A\\,N", note: "Derivee du MtM (s_par - s) A N par rapport au taux." },
        { label: 'Choc de 1 bp', math: "DV01 = \\frac{\\partial PV}{\\partial s}\\times 10^{-4} = A\\,N\\times 10^{-4}", note: "1 bp = 0.0001 en taux." },
      ],
      result: "DV01 = A\\,N\\times 0.0001",
      desk: "Le DV01 dit combien d'euros bougent par bp: c'est l'unite de risque pour fixer limites et bucketer la courbe.",
      limit: "DV01 est une sensibilite parallele de 1er ordre: ignore le risque de pente/courbure (key-rate) et la convexite.",
    },
  },

  // -------------------------------------------------------- Curve bootstrap
  'yield-curve-bootstrapping': {
    'Discount factor recursion': {
      assumption: "Instruments par (depo/FRA/swap) cotant a valeur nulle / pair, dates ordonnees t_1<...<t_n, year fractions alpha_i; on resout DF_n connaissant DF_{i<n}.",
      steps: [
        { label: 'Equation de par', math: "s_n\\sum_{i=1}^{n}\\alpha_i DF_i + DF_n = 1", note: "Un instrument par price a 1: coupons + remboursement actualises." },
        { label: 'Isoler le dernier flux', math: "s_n\\alpha_n DF_n + DF_n = 1 - s_n\\sum_{i<n}\\alpha_i DF_i", note: "On separe le terme inconnu DF_n des termes deja connus." },
        { label: 'Resolution', math: "DF_n\\,(1+s_n\\alpha_n) = 1 - s_n\\sum_{i<n}\\alpha_i DF_i", note: "Equation lineaire en DF_n." },
      ],
      result: "DF_n = \\frac{1 - s_n\\sum_{i<n}\\alpha_i DF_i}{1 + s_n\\alpha_n}",
      desk: "La recursion construit la courbe pas a pas: chaque pilier ajoute un point de discount coherent avec le marche.",
      limit: "Le resultat depend de l'interpolation entre piliers et du choix mono/multi-courbe; bruit de quote => courbe non lisse.",
    },
    'Zero rate': {
      assumption: "Discount factor DF_n connu; on convertit en taux zero-coupon continu sur l'horizon t_n.",
      steps: [
        { label: 'Definition du zero continu', math: "DF_n = e^{-z_n t_n}", note: "Capitalisation continue du taux zero." },
        { label: 'Inversion', math: "\\ln DF_n = -z_n t_n", note: "On passe au logarithme." },
      ],
      result: "z_n = -\\frac{\\ln DF_n}{t_n}",
      desk: "Le taux zero rend la courbe comparable entre maturites et lisible pour le pricing de cash-flows fermes.",
      limit: "Convention de capitalisation (continue/annuelle/money-market) a fixer; un melange fausse les comparaisons.",
    },
    'Forward rate': {
      assumption: "Deux discount factors DF_i et DF_j (t_i<t_j); pas d'arbitrage entre preter spot et preter forward.",
      steps: [
        { label: 'Replication sans arbitrage', math: "DF_j = DF_i\\,e^{-f_{i,j}(t_j-t_i)}", note: "Investir jusqu'a t_j = investir jusqu'a t_i puis forward de t_i a t_j." },
        { label: 'Inversion', math: "f_{i,j}(t_j-t_i) = \\ln\\frac{DF_i}{DF_j}", note: "On isole le taux forward continu." },
      ],
      result: "f_{i,j} = \\frac{1}{t_j-t_i}\\,\\ln\\frac{DF_i}{DF_j}",
      desk: "Le forward est le taux que le marche garantit aujourd'hui pour une periode future: l'input direct des jambes flottantes.",
      limit: "Les forwards heritent du bruit de la courbe: une interpolation grossiere produit des forwards en dents de scie irrealistes.",
    },
  },

  // -------------------------------------------------------- Implied vol smile
  'implied-volatility-smile': {
    'Implied volatility root': {
      assumption: "Prix de marche C_mkt d'un call superieur a sa valeur intrinseque; modele Black-Scholes inverse pour retrouver sigma.",
      steps: [
        { label: 'Fonction objectif', math: "g(\\sigma)=C_{BS}(\\sigma)-C_{\\text{mkt}}", note: "On cherche le zero de g." },
        { label: 'Monotonie (vega>0)', math: "g'(\\sigma)=\\nu = S_0 e^{-qT}\\varphi(d_1)\\sqrt{T} > 0", note: "C_BS est strictement croissant en sigma." },
        { label: 'Bornes', math: "g(0^+) = (S_0e^{-qT}-Ke^{-rT})^+ - C_{\\text{mkt}} < 0,\\quad g(\\infty)=S_0e^{-qT}-C_{\\text{mkt}}>0", note: "Le prix balaye toute la plage admissible." },
      ],
      result: "\\exists!\\,\\sigma_{\\text{imp}}:\\; C_{BS}(\\sigma_{\\text{imp}})=C_{\\text{mkt}}",
      desk: "L'unicite (vega>0) garantit qu'une vol implicite cotee est non ambigue: une seule sigma reproduit le prix.",
      limit: "Pour prix hors bornes (intrinseque ou borne sup), aucune solution: signal de quote aberrante a nettoyer.",
    },
    'Newton update': {
      assumption: "Inversion numerique de Black-Scholes; vega disponible analytiquement comme derivee.",
      steps: [
        { label: 'Linearisation locale', math: "C_{BS}(\\sigma_{k+1}) \\approx C_{BS}(\\sigma_k) + \\nu(\\sigma_k)(\\sigma_{k+1}-\\sigma_k)", note: "Developpement de Taylor d'ordre 1 autour de sigma_k." },
        { label: 'Imposer la cible', math: "C_{BS}(\\sigma_{k+1}) = C_{\\text{mkt}}", note: "On veut atteindre le prix de marche." },
      ],
      result: "\\sigma_{k+1}=\\sigma_k - \\frac{C_{BS}(\\sigma_k)-C_{\\text{mkt}}}{\\nu(\\sigma_k)}",
      desk: "Convergence quadratique: 2-3 iterations suffisent quand vega n'est pas trop petit (ATM, maturite pas trop courte).",
      limit: "Deep ITM/OTM ou maturite tres courte: vega ~ 0 => Newton instable; on bascule sur bisection/Brent.",
    },
    'SVI total variance': {
      assumption: "On parametre la variance totale w(k)=sigma^2(k)T en fonction du log-moneyness k=ln(K/F); 5 parametres (a,b,rho,m,eta).",
      steps: [
        { label: 'Forme brute (raw SVI)', math: "w(k)=a+b\\big(\\rho(k-m)+\\sqrt{(k-m)^2+\\eta^2}\\big)", note: "Hyperbole: ailes lineaires, fond arrondi." },
        { label: 'Pentes des ailes', math: "\\lim_{k\\to+\\infty} w'(k)=b(1+\\rho),\\quad \\lim_{k\\to-\\infty} w'(k)=-b(1-\\rho)", note: "rho controle l'asymetrie (skew), b l'ouverture." },
        { label: 'Bornes de non-arbitrage', math: "b\\ge 0,\\;|\\rho|<1,\\;\\eta>0,\\;a+b\\eta\\sqrt{1-\\rho^2}\\ge 0", note: "Conditions necessaires (Roger Lee): pentes <= 2, variance positive." },
      ],
      result: "w(k)=a+b\\big[\\rho(k-m)+\\sqrt{(k-m)^2+\\eta^2}\\big]",
      desk: "SVI lisse le smile en 5 parametres interpretables et impose les pentes de Lee: indispensable pour interpoler/extrapoler proprement.",
      limit: "Raw SVI peut violer la non-arbitrage butterfly entre maturites; on passe a SSVI/calibration contrainte pour une surface sans arbitrage.",
    },
  },

  // -------------------------------------------------------- Monte Carlo
  'monte-carlo-pricing': {
    'GBM step': {
      assumption: "Sous-jacent en GBM risque-neutre dS=(r-q)S dt+sigma S dW; on veut un schema de simulation exact sur un pas Delta.",
      steps: [
        { label: 'Ito sur ln S', math: "d\\ln S = \\big(r-q-\\tfrac12\\sigma^2\\big)dt + \\sigma\\,dW", note: "Le terme -1/2 sigma^2 vient de la variation quadratique (dW)^2=dt." },
        { label: 'Integration sur Delta', math: "\\ln S_{t+\\Delta}-\\ln S_t = \\big(r-q-\\tfrac12\\sigma^2\\big)\\Delta + \\sigma\\sqrt{\\Delta}\\,Z,\\; Z\\sim\\mathcal N(0,1)", note: "Coefficients constants => increment gaussien exact." },
      ],
      result: "S_{t+\\Delta} = S_t\\,\\exp\\!\\big[(r-q-\\tfrac12\\sigma^2)\\Delta + \\sigma\\sqrt{\\Delta}\\,Z\\big]",
      desk: "Schema exact: pas de biais de discretisation sur le sous-jacent, meme avec un grand pas (utile pour l'Asian/lookback).",
      limit: "Exact pour la GBM seulement; vol locale/stochastique ou sauts demandent Euler/Milstein et reintroduisent un biais de pas.",
    },
    'Discounted estimator': {
      assumption: "M tirages i.i.d. du payoff Phi sous Q; estimateur de Monte Carlo du prix.",
      steps: [
        { label: 'Cible de pricing', math: "V_0 = e^{-rT}\\,\\mathbb{E}^{\\mathbb{Q}}[\\Phi(S)]", note: "Le prix est une esperance actualisee." },
        { label: 'Moyenne empirique', math: "\\hat V_0 = e^{-rT}\\,\\frac1M\\sum_{m=1}^{M}\\Phi(S^{(m)})", note: "On remplace l'esperance par la moyenne des tirages." },
        { label: 'Sans biais', math: "\\mathbb{E}[\\hat V_0] = e^{-rT}\\,\\mathbb{E}^{\\mathbb{Q}}[\\Phi] = V_0", note: "Linearite de l'esperance: l'estimateur est non biaise." },
      ],
      result: "\\hat V_0 = e^{-rT}\\,\\frac1M\\sum_{m=1}^{M}\\Phi(S^{(m)})",
      desk: "Le MC price tout payoff simulable; le controle: l'estimateur doit tomber sur le Black-Scholes ferme quand il existe.",
      limit: "Convergence lente en 1/sqrt(M); sans reduction de variance, la precision coute cher en chemins.",
    },
    'Confidence interval': {
      assumption: "Payoffs actualises i.i.d. de variance finie; M grand (theoreme central limite applicable).",
      steps: [
        { label: 'Variance de la moyenne', math: "\\mathrm{Var}(\\hat V_0) = \\frac{e^{-2rT}\\,\\sigma_\\Phi^2}{M}", note: "Variance divisee par M: l'erreur decroit en 1/sqrt(M)." },
        { label: 'Erreur standard', math: "SE = \\frac{e^{-rT} s_\\Phi}{\\sqrt{M}}", note: "s_Phi = ecart-type empirique des payoffs." },
        { label: 'TCL', math: "\\frac{\\hat V_0 - V_0}{SE} \\xrightarrow{d} \\mathcal{N}(0,1)", note: "Normalite asymptotique de la moyenne." },
      ],
      result: "IC_{95\\%} = \\hat V_0 \\pm 1.96\\,\\frac{e^{-rT}s_\\Phi}{\\sqrt{M}}",
      desk: "Citer un prix MC sans IC est non professionnel: l'incertitude doit etre petite face au bid/ask ou au seuil de decision.",
      limit: "TCL suppose variance finie et M grand; payoffs a queue lourde (digitales, rares) demandent plus de chemins ou de l'importance sampling.",
    },
  },

  // -------------------------------------------------------- Barriers
  'barrier-options-gap-risk': {
    'Down-and-out call payoff': {
      assumption: "Call down-and-out de barriere B<K, monitoring continu; sous-jacent GBM. lambda=(r-q+1/2 sigma^2)/sigma^2.",
      steps: [
        { label: 'Payoff conditionnel', math: "\\Phi = (S_T-K)^+\\,\\mathbf{1}_{\\{\\min_{t\\le T} S_t > B\\}}", note: "Le call ne survit que si le minimum reste au-dessus de B." },
        { label: 'Parite knock-in / knock-out', math: "C_{DO}+C_{DI}=C_{\\text{vanilla}}", note: "L'une des deux options vit toujours: leur somme = vanille." },
        { label: 'Principe de reflexion + Girsanov', math: "\\mathbb{Q}\\big(\\min W>b,\\,W_T\\in dx\\big)\\;\\Rightarrow\\;\\text{image en }2b,\\ \\text{poids }(B/S_0)^{2\\lambda-2}", note: "La reflexion du brownien construit la solution image; le drift ajoute le facteur de puissance." },
      ],
      result: "C_{DO}=C_{BS}(S_0,K)-\\Big(\\tfrac{B}{S_0}\\Big)^{2\\lambda-2}C_{BS}\\!\\Big(\\tfrac{B^2}{S_0},K\\Big)",
      desk: "La barriere abaisse la prime: l'investisseur vend l'evenement de knock-out. La parite in/out permet de coter l'un depuis l'autre.",
      limit: "Formule exacte en monitoring continu et vol constante; en pratique smile et monitoring discret deplacent fortement le prix.",
    },
    'Barrier gap loss': {
      assumption: "Pres de la barriere, delta et gamma explosent; un saut traverse B avant que le hedge soit ajuste.",
      steps: [
        { label: 'Discontinuite de valeur', math: "\\text{gap} = V(B^+)-\\text{rebate}", note: "La valeur chute d'un cran au franchissement." },
        { label: 'Delta non borne', math: "\\lim_{S\\to B^+}\\Big|\\frac{\\partial V}{\\partial S}\\Big| = \\infty", note: "Le hedge demande une taille ingerable juste au-dessus de B." },
        { label: 'Slippage de couverture', math: "\\Delta P\\&L_{\\text{gap}} \\approx -\\,\\Delta(B^+)\\,(B - S_{\\text{fill}})", note: "On execute le hedge a S_fill, pas a B exact." },
      ],
      result: "\\text{Loss}_{\\text{gap}} \\approx \\Delta(B^+)\\,(B - S_{\\text{executed}})",
      desk: "Le risque de gap n'est pas dans le prix BS: on le couvre par over-hedge, barriere amortie ou reserve de gap.",
      limit: "Modeles de diffusion sous-estiment le gap (pas de sauts); il faut un modele a sauts ou une reserve discretionnaire.",
    },
    'Discrete monitoring adjustment': {
      assumption: "Barriere observee a pas discrets Delta_t (daily/weekly) plutot qu'en continu; correction de Broadie-Glasserman-Kou.",
      steps: [
        { label: 'Effet du discret', math: "\\mathbb{Q}(\\text{breach discret}) < \\mathbb{Q}(\\text{breach continu})", note: "Le continu touche la barriere plus souvent (entre deux observations)." },
        { label: 'Barriere effective', math: "\\beta=\\frac{-\\zeta(1/2)}{\\sqrt{2\\pi}}\\approx 0.5826", note: "Constante issue de la loi du max discret d'un brownien." },
      ],
      result: "B_{\\text{disc}} = B\\,\\exp\\!\\big(\\pm\\,0.5826\\,\\sigma\\sqrt{\\Delta t}\\big)",
      desk: "On price un barrier discret avec la formule continue en decalant la barriere de ~0.58 sigma sqrt(dt) loin du spot: rapide et precis.",
      limit: "Approximation pour barriere pas trop proche du spot; tres pres ou monitoring tres espace, on revient a un arbre/MC discret.",
    },
  },

  // -------------------------------------------------------- Autocall
  'structured-products-autocall': {
    'Autocall redemption event': {
      assumption: "Note autocall observee aux dates t_1<...<t_n; rappel anticipe si S_{t_i} >= barriere d'autocall B_AC. Premier franchissement = tau.",
      steps: [
        { label: 'Temps de rappel', math: "\\tau = \\min\\{t_i : S_{t_i}\\ge B_{AC}\\}", note: "L'evenement est un premier passage discret." },
        { label: 'Flux de remboursement', math: "\\text{paiement en }t_i = N\\,(1+i\\,c)\\ \\text{si}\\ \\tau=t_i", note: "Nominal + coupons cumules a la date de rappel." },
        { label: 'PV par actualisation', math: "PV = \\sum_{i} DF(t_i)\\,N\\,(1+i\\,c)\\,\\mathbb{Q}(\\tau=t_i)", note: "On somme sur les dates pondere par la proba de rappel." },
      ],
      result: "PV_{\\text{autocall}} = \\sum_i DF(t_i)\\,N(1+i\\,c)\\,\\mathbb{Q}(\\tau=t_i)",
      desk: "Le produit est court de la duration: une hausse rappelle tot, coupe les coupons futurs et raccourcit la note.",
      limit: "Q(tau=t_i) depend du smile et de la correlation date-a-date: tres sensible au modele (local vs stochastique vol).",
    },
    'Coupon event': {
      assumption: "Coupons conditionnels (effet memoire) verses si S_{t_i} >= barriere de coupon B_cpn et note non encore rappelee.",
      steps: [
        { label: 'Condition de coupon', math: "\\text{coupon en }t_i \\iff S_{t_i}\\ge B_{cpn}\\ \\text{et}\\ \\tau\\ge t_i", note: "Memoire: un coupon manque peut etre rattrape plus tard." },
        { label: 'PV de la jambe coupon', math: "PV_{cpn} = N\\,c\\sum_i DF(t_i)\\,\\mathbb{Q}\\big(S_{t_i}\\ge B_{cpn},\\,\\tau\\ge t_i\\big)", note: "Esperance actualisee des coupons effectivement payes." },
      ],
      result: "PV_{cpn} = N\\,c\\sum_i DF(t_i)\\,\\mathbb{Q}(S_{t_i}\\ge B_{cpn},\\,\\tau\\ge t_i)",
      desk: "L'effet memoire est une vente de digitales en cascade: l'investisseur encaisse du carry contre du risque de baisse.",
      limit: "La valeur des digitales explose en sensibilite (vanna/skew) pres des barrieres: hedge instable a l'approche des dates.",
    },
    'Protected redemption': {
      assumption: "Si jamais rappelee et S_T >= barriere de protection B_prot: capital rendu. Sinon remboursement indexe a la baisse.",
      steps: [
        { label: 'Capital protege', math: "S_T\\ge B_{prot}\\;\\Rightarrow\\;\\text{remboursement}=N", note: "Au-dessus de la barriere, l'investisseur recupere le nominal." },
        { label: 'Barriere franchie', math: "S_T<B_{prot}\\;\\Rightarrow\\;\\text{remboursement}=N\\,\\tfrac{S_T}{S_0}", note: "Perte = N(1 - S_T/S_0): exposition pleine a la baisse." },
        { label: 'Decomposition', math: "\\text{terminal} = N\\cdot ZC - \\text{Put}_{\\text{down-and-in}}(K=S_0,\\,B=B_{prot})", note: "L'investisseur est long un ZC et vendeur d'un put down-and-in." },
      ],
      result: "PV_{\\text{final}} = N\\,DF(T) - \\text{DownInPut}(S_0,B_{prot})",
      desk: "Le rendement eleve paye exactement la vente du put barriere: le client est short de la queue de baisse au-dela de B_prot.",
      limit: "Le put down-and-in est tres skew-dependant; le vrai risque (correlation, gap) n'apparait pas dans un pricing vol-plate.",
    },
  },

  // -------------------------------------------------------- CDS
  'credit-derivatives-cds': {
    'Risky annuity': {
      assumption: "CDS single-name; survie Q(tau>t) de la courbe de hazard, recovery R, dates de prime t_i de year fraction alpha_i.",
      steps: [
        { label: 'Jambe de prime', math: "PV_{\\text{prime}} = s\\sum_i \\alpha_i DF(t_i)\\,\\mathbb{Q}(\\tau>t_i)", note: "On ne paie le spread que si le nom a survecu." },
        { label: 'Annuite risquee', math: "A = \\sum_i \\alpha_i DF(t_i)\\,\\mathbb{Q}(\\tau>t_i)\\;(+\\,\\text{accrual})", note: "Annuite ponderee par la probabilite de survie." },
      ],
      result: "A = \\sum_i \\alpha_i\\,DF(t_i)\\,\\mathbb{Q}(\\tau>t_i)",
      desk: "L'annuite risquee transforme un spread (bp) en PV (euros): c'est le multiplicateur de tout le risque de spread.",
      limit: "Depend de la courbe de survie (hazard) et de R supposes; un changement de recovery deplace A et le MtM.",
    },
    'CS01': {
      assumption: "MtM d'un CDS deja traite = (spread courant - spread contrat) x annuite risquee x notionnel; on choque le spread de 1 bp.",
      steps: [
        { label: 'Mark-to-market', math: "MtM \\approx (s_{\\text{mkt}}-s_{\\text{contrat}})\\,A\\,N", note: "Lineaire dans l'ecart de spread, x annuite risquee." },
        { label: 'Sensibilite', math: "\\frac{\\partial MtM}{\\partial s_{\\text{mkt}}} = A\\,N", note: "Derivee par rapport au spread de marche." },
      ],
      result: "CS01 = A\\,N\\times 0.0001",
      desk: "Le CS01 dit combien le MtM bouge par bp de spread: l'unite de risque credit pour les limites et le hedging par indice.",
      limit: "Lineaire (1er ordre): casse pour gros chocs, restructuration, ou jump-to-default ou la perte est (1-R)N, pas A N.",
    },
    'Spread P&L approximation': {
      assumption: "Variation de MtM pour un mouvement de spread Delta s; on linearise autour du niveau courant.",
      steps: [
        { label: 'Linearisation', math: "\\Delta MtM \\approx \\frac{\\partial MtM}{\\partial s}\\,\\Delta s = A\\,N\\,\\Delta s", note: "1er ordre: CS01 x mouvement en bp." },
        { label: 'Signe selon la position', math: "\\text{acheteur de protection}: \\Delta MtM \\approx +CS01\\cdot\\Delta s_{\\text{bp}}", note: "L'acheteur de protection gagne quand le spread s'ecarte." },
      ],
      result: "\\Delta MtM \\approx \\pm\\,CS01\\cdot \\Delta s_{\\text{bp}}",
      desk: "Decompose le P&L credit en carry (theta de spread) + MtM (CS01 x move): la grille de lecture du debrief.",
      limit: "Ignore la convexite de spread et le saut au defaut; en stress, jump-to-default domine la lecture lineaire.",
    },
  },

  // -------------------------------------------------------- VaR
  'market-risk-var-stress': {
    'Parametric VaR': {
      assumption: "P&L lineaire dans des facteurs gaussiens; sensibilites w, matrice de covariance Sigma, horizon h.",
      steps: [
        { label: 'P&L lineaire', math: "P\\&L = w^{\\top} r,\\quad r\\sim\\mathcal N(0,\\Sigma)", note: "On projette les positions sur les facteurs de risque." },
        { label: 'Loi du P&L', math: "P\\&L\\sim\\mathcal N\\!\\big(0,\\;\\sigma_P^2\\big),\\quad \\sigma_P^2 = w^{\\top}\\Sigma\\,w", note: "Combinaison lineaire de gaussiennes => gaussienne." },
        { label: 'Quantile de perte', math: "\\mathbb{P}(L>\\text{VaR}_\\alpha)=1-\\alpha\\;\\Rightarrow\\;\\text{VaR}_\\alpha = z_\\alpha\\,\\sigma_P", note: "z_alpha = quantile normal (1.645 a 95%, 2.326 a 99%)." },
      ],
      result: "\\text{VaR}_\\alpha = z_\\alpha\\sqrt{w^{\\top}\\Sigma\\,w}\\,\\sqrt{h}",
      desk: "La VaR parametrique se calcule en une multiplication matricielle: rapide pour suivre une limite intraday.",
      limit: "Suppose normalite et correlations stables; sous-estime les queues et les regimes de stress (les correlations vont a 1).",
    },
    'Expected shortfall': {
      assumption: "Meme cadre gaussien; on mesure la perte moyenne au-dela de la VaR (mesure coherente, sous-additive).",
      steps: [
        { label: 'Definition', math: "\\text{ES}_\\alpha = \\mathbb{E}[\\,L\\mid L>\\text{VaR}_\\alpha\\,]", note: "Moyenne conditionnelle de la queue, pas juste un quantile." },
        { label: 'Queue gaussienne', math: "\\mathbb{E}[X\\mid X>a] = \\sigma\\,\\frac{\\varphi(a/\\sigma)}{1-\\Phi(a/\\sigma)}", note: "Formule de la moyenne tronquee d'une normale." },
        { label: 'Substitution a=z_alpha sigma_P', math: "\\text{ES}_\\alpha = \\sigma_P\\,\\frac{\\varphi(z_\\alpha)}{1-\\alpha}", note: "On injecte le seuil VaR dans la moyenne tronquee." },
      ],
      result: "\\text{ES}_\\alpha = \\sigma_P\\,\\frac{\\varphi(z_\\alpha)}{1-\\alpha}",
      desk: "L'ES (Bale FRTB) capte la severite de la queue, pas seulement sa frontiere: la mesure reglementaire de reference.",
      limit: "Formule fermee valable en gaussien; pour des queues empiriques/lourdes, ES s'estime par simulation historique/MC.",
    },
    'Stress P&L': {
      assumption: "Scenario deterministe de chocs Delta x_k sur les facteurs; on agrege via sensibilites (et convexite si materielle).",
      steps: [
        { label: 'Reevaluation par facteur', math: "\\Delta V = \\sum_k \\frac{\\partial V}{\\partial x_k}\\,\\Delta x_k^{\\text{stress}}", note: "Somme des sensibilites x chocs de scenario." },
        { label: 'Terme de convexite', math: "+\\tfrac12\\sum_k \\frac{\\partial^2 V}{\\partial x_k^2}\\,(\\Delta x_k^{\\text{stress}})^2", note: "Important pour gros chocs (gamma, convexite taux)." },
      ],
      result: "P\\&L_{\\text{stress}} = \\sum_k \\frac{\\partial V}{\\partial x_k}\\Delta x_k + \\tfrac12\\sum_k \\Gamma_k(\\Delta x_k)^2",
      desk: "Le stress complete la VaR par des scenarios nommes (2008, COVID, +200bp): c'est ce qu'on escalade au risk committee.",
      limit: "Un stress sensitivity-based rate les non-linearites croisees et les sauts de liquidite; le full revaluation reste la reference.",
    },
  },

  // -------------------------------------------------------- Bonds
  'fixed-income-bonds-duration': {
    'Bond price': {
      assumption: "Obligation a coupon fixe c, frequence m, yield-to-maturity y; cash-flows CF_i aux dates t_i, remboursement du nominal en t_n.",
      steps: [
        { label: 'Actualisation des flux', math: "P = \\sum_i \\frac{CF_i}{(1+y/m)^{m t_i}}", note: "Chaque coupon et le principal actualises au yield." },
        { label: 'Forme explicite', math: "P = \\sum_{i=1}^{n}\\frac{c\\,N/m}{(1+y/m)^{i}} + \\frac{N}{(1+y/m)^{n}}", note: "Annuite de coupons + valeur du principal." },
      ],
      result: "P = \\sum_i \\frac{CF_i}{(1+y/m)^{m t_i}}",
      desk: "Le prix est entierement determine par la courbe de yield: l'input direct du clean/dirty price et de l'accrued.",
      limit: "Un yield unique ignore la forme de la courbe et le spread de credit; un pricing par DF/zero est plus fidele.",
    },
    'Modified duration': {
      assumption: "Prix P(y) derivable; on mesure la sensibilite relative du prix au yield.",
      steps: [
        { label: 'Derivee du prix', math: "\\frac{dP}{dy} = -\\sum_i \\frac{t_i\\,CF_i}{(1+y/m)^{m t_i+1}}", note: "Chaque flux contribue proportionnellement a sa maturite." },
        { label: 'Duration de Macaulay', math: "D_{\\text{mac}} = \\frac{1}{P}\\sum_i t_i\\,\\frac{CF_i}{(1+y/m)^{m t_i}}", note: "Maturite moyenne ponderee par les PV." },
        { label: 'Passage au modifie', math: "D_{\\text{mod}} = \\frac{D_{\\text{mac}}}{1+y/m}", note: "Ajustement de la capitalisation discrete." },
      ],
      result: "D_{\\text{mod}} = -\\frac{1}{P}\\frac{dP}{dy} = \\frac{D_{\\text{mac}}}{1+y/m}",
      desk: "La duration modifiee donne le % de variation de prix par 1% de yield: l'unite de risque de taux de l'obligation.",
      limit: "1er ordre seulement: pour gros mouvements, il manque la convexite (le prix-yield n'est pas lineaire).",
    },
    'Duration-convexity P&L': {
      assumption: "Petit a moyen mouvement de yield Delta y; developpement de P(y) a l'ordre 2.",
      steps: [
        { label: 'Taylor a l\'ordre 2', math: "\\Delta P \\approx \\frac{dP}{dy}\\Delta y + \\tfrac12\\frac{d^2P}{dy^2}(\\Delta y)^2", note: "On garde le terme quadratique (convexite)." },
        { label: 'Substituer duration et convexite', math: "\\frac{dP}{dy}=-D_{\\text{mod}}P,\\quad \\frac{d^2P}{dy^2}=C\\,P", note: "C = convexite = derivee seconde normalisee." },
      ],
      result: "\\frac{\\Delta P}{P} \\approx -D_{\\text{mod}}\\,\\Delta y + \\tfrac12\\,C\\,(\\Delta y)^2",
      desk: "La convexite est un cadeau pour le long: le prix monte plus quand y baisse qu'il ne chute quand y monte.",
      limit: "Approx locale: gros chocs, optionnalite (callable, MBS) ou changement de forme de courbe sortent du cadre duration-convexite.",
    },
  },

  // -------------------------------------------------------- Stochastic calc
  'stochastic-calculus-for-hedging': {
    'Ito process': {
      assumption: "Facteur de risque X dirige par un mouvement brownien W; drift mu_t et volatilite sigma_t adaptes.",
      steps: [
        { label: 'Dynamique', math: "dX_t = \\mu_t\\,dt + \\sigma_t\\,dW_t", note: "Partie previsible (drift) + partie martingale (diffusion)." },
        { label: 'Variation quadratique', math: "(dW_t)^2 = dt,\\quad dW_t\\,dt = 0,\\quad (dt)^2=0", note: "Regle de calcul d'Ito: le brownien accumule de la variance lineairement." },
      ],
      result: "dX_t = \\mu_t\\,dt + \\sigma_t\\,dW_t,\\qquad (dW_t)^2=dt",
      desk: "Cette regle (dW)^2=dt est la raison pour laquelle la convexite (gamma) cree du P&L meme sans drift.",
      limit: "Modele a diffusion continue: sauts (defaut, gaps) et volatilite stochastique sortent du cadre brownien simple.",
    },
    'Ito lemma': {
      assumption: "Fonction f(t,X) de classe C^{1,2}; X est un processus d'Ito dX=mu dt+sigma dW.",
      steps: [
        { label: 'Taylor a l\'ordre 2', math: "df = f_t\\,dt + f_x\\,dX + \\tfrac12 f_{xx}\\,(dX)^2", note: "On pousse a l'ordre 2 car (dX)^2 est d'ordre dt." },
        { label: 'Variation quadratique', math: "(dX)^2 = \\sigma^2\\,(dW)^2 = \\sigma^2\\,dt", note: "Seul le terme de diffusion survit a l'ordre dt." },
        { label: 'Collecter dt et dW', math: "df = \\big(f_t + \\mu f_x + \\tfrac12\\sigma^2 f_{xx}\\big)dt + \\sigma f_x\\,dW", note: "Le terme 1/2 sigma^2 f_xx est la correction d'Ito." },
      ],
      result: "df = \\Big(f_t + \\mu f_x + \\tfrac12\\sigma^2 f_{xx}\\Big)dt + \\sigma f_x\\,dW",
      desk: "Ito relie le symbole math au ticket hedgeable: f_x = delta a couvrir, f_xx = gamma qui genere le P&L.",
      limit: "Suppose f reguliere (C^{1,2}) et X continu; payoffs non lisses (digitales, barrieres) demandent un traitement distributionnel.",
    },
    'Risk-neutral drift': {
      assumption: "Marche complet, pas d'arbitrage; on couvre dynamiquement une option V(S,t) avec Delta actions du sous-jacent (dividende q).",
      steps: [
        { label: 'Portefeuille couvert', math: "\\Pi = V - \\frac{\\partial V}{\\partial S}\\,S", note: "On choisit Delta=V_S pour annuler le risque local." },
        { label: 'Dynamique sans alea', math: "d\\Pi = \\big(V_t + \\tfrac12\\sigma^2 S^2 V_{SS}\\big)dt", note: "Le terme en dW disparait: portefeuille localement sans risque." },
        { label: 'Absence d\'arbitrage', math: "d\\Pi = r\\,\\Pi\\,dt", note: "Un portefeuille sans risque doit rapporter le taux sans risque." },
        { label: 'EDP de pricing (Feynman-Kac)', math: "V_t + (r-q)S V_S + \\tfrac12\\sigma^2 S^2 V_{SS} - rV = 0", note: "Le drift reel mu disparait, remplace par r-q." },
      ],
      result: "dS = (r-q)\\,S\\,dt + \\sigma S\\,dW^{\\mathbb{Q}}",
      desk: "Point cle: le pricing n'utilise PAS le rendement attendu reel mu, seulement r-q. Deux traders qui divergent sur mu cotent le meme prix.",
      limit: "Repose sur la couverture continue, sans cout, et un marche complet; frictions et incompletude reintroduisent un prix de marche du risque.",
    },
  },
};

const _norm = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Returns a rich derivation { assumption, expression, steps:[{label,math,note}],
// result, desk, limit } for a (course slug, formula) pair, or null when none is
// authored (caller falls back to the generic family outline).
export function getDerivation(slug, formula) {
  if (!slug || !formula || !formula.title) return null;
  const byCourse = DERIVATIONS[slug];
  if (!byCourse) return null;
  let d = byCourse[formula.title];
  if (!d) {
    const key = Object.keys(byCourse).find((k) => _norm(k) === _norm(formula.title));
    if (key) d = byCourse[key];
  }
  if (!d) return null;
  return {
    assumption: d.assumption,
    expression: d.expression || formula.expression,
    steps: d.steps,
    result: d.result,
    desk: d.desk,
    limit: d.limit,
  };
}

export default DERIVATIONS;
