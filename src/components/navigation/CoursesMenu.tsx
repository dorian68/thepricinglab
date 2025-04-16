
import React from "react";
import { NavMenuItem, NavMenuSection } from "./NavMenuSection";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "../../utils/translationUtils";

const CoursesMenu = () => {
  const { t } = useTranslation();
  
  return (
    <div className="grid grid-cols-2 gap-3 p-4 w-[500px]">
      <NavMenuSection title={safeTranslate(t, 'courses.fundamentals', 'Fundamentals')}>
        <NavMenuItem 
          to="/courses/fundamentals/black-scholes" 
          title={safeTranslate(t, 'coursesPage.fundamentals.blackScholes.title', 'Black-Scholes Model')} 
        />
        <NavMenuItem 
          to="/courses/fundamentals/yield-curves" 
          title={safeTranslate(t, 'coursesPage.fundamentals.yieldCurves.title', 'Yield Curves')} 
        />
        <NavMenuItem 
          to="/courses/fundamentals/greeks" 
          title={safeTranslate(t, 'coursesPage.fundamentals.greeks.title', 'Option Greeks')} 
        />
      </NavMenuSection>
      
      <div>
        <NavMenuSection title={safeTranslate(t, 'courses.advanced', 'Advanced')}>
          <NavMenuItem 
            to="/courses/advanced/implied-vol" 
            title={safeTranslate(t, 'coursesPage.advanced.impliedVol.title', 'Implied Volatility')} 
          />
          <NavMenuItem 
            to="/courses/advanced/vol-products" 
            title={safeTranslate(t, 'coursesPage.advanced.volProducts.title', 'Volatility Products')} 
          />
        </NavMenuSection>
        
        <NavMenuSection title={safeTranslate(t, 'courses.complex', 'Complex')}>
          <NavMenuItem 
            to="/courses/complex/exotic-options" 
            title={safeTranslate(t, 'coursesPage.complex.exotic.title', 'Exotic Options')} 
          />
          <NavMenuItem 
            to="/courses/complex/monte-carlo" 
            title={safeTranslate(t, 'coursesPage.complex.monteCarlo.title', 'Monte Carlo Methods')} 
          />
        </NavMenuSection>
      </div>
    </div>
  );
};

export default CoursesMenu;
