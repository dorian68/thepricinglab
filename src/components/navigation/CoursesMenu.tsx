
import React from "react";
import { NavMenuItem, NavMenuSection } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const CoursesMenu = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  
  return (
    <div className="grid grid-cols-2 gap-3 p-4 w-[500px]">
      <NavMenuSection title={st('courses.fundamentals', 'Fundamentals')}>
        <NavMenuItem 
          to="/courses/fundamentals/black-scholes" 
          title={st('coursesPage.fundamentals.blackScholes.title', 'Black-Scholes Model')} 
        />
        <NavMenuItem 
          to="/courses/fundamentals/yield-curves" 
          title={st('coursesPage.fundamentals.yieldCurves.title', 'Yield Curves')} 
        />
        <NavMenuItem 
          to="/courses/fundamentals/greeks" 
          title={st('coursesPage.fundamentals.greeks.title', 'Option Greeks')} 
        />
      </NavMenuSection>
      
      <div>
        <NavMenuSection title={st('courses.advanced', 'Advanced')}>
          <NavMenuItem 
            to="/courses/advanced/implied-vol" 
            title={st('coursesPage.advanced.impliedVol.title', 'Implied Volatility')} 
          />
          <NavMenuItem 
            to="/courses/advanced/vol-products" 
            title={st('coursesPage.advanced.volProducts.title', 'Volatility Products')} 
          />
          <NavMenuItem 
            to="/courses/advanced" 
            title={st('coursesPage.advanced.overview', 'Advanced Overview')} 
          />
        </NavMenuSection>
        
        <NavMenuSection title={st('courses.complex', 'Complex')}>
          <NavMenuItem 
            to="/courses/complex/exotic-options" 
            title={st('coursesPage.complex.exotic.title', 'Exotic Options')} 
          />
          <NavMenuItem 
            to="/courses/complex/monte-carlo" 
            title={st('coursesPage.complex.monteCarlo.title', 'Monte Carlo Methods')} 
          />
        </NavMenuSection>
      </div>
    </div>
  );
};

export default CoursesMenu;
