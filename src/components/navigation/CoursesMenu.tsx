
import React from "react";
import { NavMenuSection, NavMenuLink } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const CoursesMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="grid grid-cols-2 gap-3 p-4 w-[500px]">
      <NavMenuSection title={st('courses.fundamentals', 'Fundamentals')}>
        <NavMenuLink 
          to="/courses/fundamentals/black-scholes" 
          title={st('coursesPage.fundamentals.blackScholes.title', 'Black-Scholes Model')} 
          description=""
        />
        <NavMenuLink 
          to="/courses/fundamentals/yield-curves" 
          title={st('coursesPage.fundamentals.yieldCurves.title', 'Yield Curves')} 
          description=""
        />
        <NavMenuLink 
          to="/courses/fundamentals/greeks" 
          title={st('coursesPage.fundamentals.greeks.title', 'Option Greeks')} 
          description=""
        />
      </NavMenuSection>
      
      <div>
        <NavMenuSection title={st('courses.advanced', 'Advanced')}>
          <NavMenuLink 
            to="/courses/advanced/implied-vol" 
            title={st('coursesPage.advanced.impliedVol.title', 'Implied Volatility')} 
            description=""
          />
          <NavMenuLink 
            to="/courses/advanced/vol-products" 
            title={st('coursesPage.advanced.volProducts.title', 'Volatility Products')} 
            description=""
          />
          <NavMenuLink 
            to="/courses/advanced" 
            title={st('coursesPage.advanced.overview', 'Advanced Overview')} 
            description=""
          />
        </NavMenuSection>
        
        <NavMenuSection title={st('courses.complex', 'Complex')}>
          <NavMenuLink 
            to="/courses/complex/exotic-options" 
            title={st('coursesPage.complex.exotic.title', 'Exotic Options')} 
            description=""
          />
          <NavMenuLink 
            to="/courses/complex/monte-carlo" 
            title={st('coursesPage.complex.monteCarlo.title', 'Monte Carlo Methods')} 
            description=""
          />
        </NavMenuSection>
      </div>
    </div>
  );
};

export default CoursesMenu;
