
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Calculator, LineChart, ArrowRight, ChevronDown, CandlestickChart,
  Activity, Dices, Database, Gauge, BarChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../utils/translationUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ToolCard = ({ icon: Icon, title, description, locked = false, path, onClick }: { icon: React.ElementType; title: string; description: string; locked?: boolean; path?: string; onClick?: () => void; }) => {
  const navigate = useNavigate();
  const handleClick = () => { if (locked) return; onClick ? onClick() : path && navigate(path); };
  return (
    <Card className={`bg-card border-border ${locked ? 'opacity-60' : 'hover:border-primary/40 transition-colors duration-300'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-primary/10 rounded-full p-2.5"><Icon className="h-5 w-5 text-primary" /></div>
          {locked && <span className="terminal-text text-xs px-2 py-1 bg-secondary rounded text-muted-foreground border border-border">PRO</span>}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{description}</p>
        <Button onClick={handleClick} variant={locked ? "outline" : "finance"} className={`flex justify-between items-center w-full ${locked ? 'cursor-not-allowed' : ''}`}>
          <span className="text-sm font-medium">{locked ? "Unlock with PRO" : "Launch Tool"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

const faqItems = [
  { q: 'How are Black-Scholes prices computed?', a: 'We implement the standard Black-Scholes-Merton closed-form solution for European options. Greeks are computed analytically from partial derivatives. All computation runs in your browser — no data is sent to any server.' },
  { q: 'Is market data real-time?', a: 'No. Tools use synthetic data or user-provided inputs. For production-grade market data feeds, integrate with your own data provider. This ensures transparency and avoids data licensing constraints.' },
  { q: 'Can I export results?', a: 'Export functionality (CSV, PNG) is available for PRO subscribers. Free-tier users can screenshot or manually record outputs.' },
];

const Tools = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const allTools = [
    { icon: BarChart, title: 'Payoff Visualizer', description: 'Build multi-leg option strategies and analyze payoff diagrams, breakevens, and Greeks at expiry.', path: '/tools/payoff-visualizer' },
    { icon: Gauge, title: 'Volatility Calculator', description: 'Measure realized volatility with configurable rolling windows across multiple asset classes.', path: '/tools/volatility-calculator' },
    { icon: Calculator, title: 'Black-Scholes Pricer', description: 'Price European options and compute all first-order Greeks with interactive sensitivity analysis.', path: '/tools/black-scholes' },
    { icon: Dices, title: 'Monte Carlo Simulator', description: 'Simulate price paths under GBM and jump-diffusion. Compute VaR and expected shortfall.', path: '/tools/monte-carlo' },
    { icon: Database, title: 'Model Calibration', description: 'Calibrate Black, SABR, and Heston models to implied volatility surfaces via RMSE optimization.', path: '/tools/model-calibration' },
    { icon: Calculator, title: 'Binomial Model', description: 'Price American and European options with a configurable CRR binomial tree.', locked: true },
    { icon: LineChart, title: 'Vol Surface Explorer', description: 'Visualize and interpolate implied volatility surfaces across strikes and maturities.', locked: true },
    { icon: Calculator, title: 'Bond Calculator', description: 'Compute bond prices, yields, duration, and convexity for fixed-income analysis.', locked: true },
    { icon: LineChart, title: 'Yield Curve Builder', description: 'Construct and manipulate zero-coupon and forward rate curves from market data.', locked: true },
  ];

  const filterTools = (category: string) => {
    if (category === 'all') return allTools;
    if (category === 'calculators') return allTools.filter((_, i) => [1, 2, 5, 7].includes(i));
    if (category === 'visualizers') return allTools.filter((_, i) => [0, 4, 6, 8].includes(i));
    if (category === 'simulators') return allTools.filter((_, i) => [3].concat([]).includes(i));
    return allTools;
  };

  return (
    <>
      <Helmet>
        <title>Quantitative Tools | The Pricing Library</title>
        <meta name="description" content="Professional-grade quantitative finance tools: Black-Scholes pricer, Monte Carlo simulator, volatility calculator, model calibration, and payoff analysis." />
        <link rel="canonical" href="https://thepricinglibrary.com/tools" />
      </Helmet>

      <header className="py-12 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 terminal-text">Quantitative Tools</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            A suite of browser-based pricing, simulation, and calibration tools built for derivatives analysis, risk assessment, and quantitative research. No server round-trips — all computation runs locally.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {['Analytical pricing', 'Stochastic simulation', 'Model calibration', 'Sensitivity analysis', 'Browser-based'].map(s => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border font-medium">{s}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto scrollbar-none">
              <TabsList className="bg-transparent h-14 w-full justify-start border-b border-border">
                {['all', 'calculators', 'visualizers', 'simulators'].map(tab => (
                  <TabsTrigger key={tab} value={tab} className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none h-14 rounded-none capitalize">
                    {tab === 'all' ? 'All Tools' : tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="py-8 px-6">
              {['all', 'calculators', 'visualizers', 'simulators'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filterTools(tab).map(tool => <ToolCard key={tool.title} {...tool} />)}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>

      {/* FAQ */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-center terminal-text">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqItems.map(({ q, a }, i) => (
              <Collapsible key={i}>
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <CollapsibleTrigger className="flex justify-between items-center w-full p-4 text-left">
                      <span className="font-medium text-sm text-foreground">{q}</span>
                      <ChevronDown className="h-4 w-4 text-primary shrink-0 ml-2" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4"><p className="text-muted-foreground text-sm leading-relaxed">{a}</p></div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6 bg-secondary/30 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-3 terminal-text">Unlock the full toolkit</h2>
          <p className="text-muted-foreground mb-6">PRO subscribers get access to all tools, CSV export, advanced models, and priority feature requests.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="finance" size="lg" onClick={() => navigate('/pricing')}>View Plans <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10" onClick={() => navigate('/courses')}>Explore Courses</Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Tools;
