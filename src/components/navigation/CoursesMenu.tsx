
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
          to="/courses/blackscholes" 
          title={safeTranslate(t, 'coursesPage.fundamentals.blackScholes.title', 'Black-Scholes Model')} 
        />
        <NavMenuItem 
          to="/courses/yield-curves" 
          title={safeTranslate(t, 'coursesPage.fundamentals.yieldCurves.title', 'Yield Curves')} 
        />
        <NavMenuItem 
          to="/courses/greeks" 
          title={safeTranslate(t, 'coursesPage.fundamentals.greeks.title', 'Option Greeks')} 
        />
      </NavMenuSection>
      
      <div>
        <NavMenuSection title={safeTranslate(t, 'courses.advanced', 'Advanced')}>
          <NavMenuItem 
            to="/courses/implied-vol" 
            title={safeTranslate(t, 'coursesPage.advanced.impliedVol.title', 'Implied Volatility')} 
          />
          <NavMenuItem 
            to="/courses/vol-products" 
            title={safeTranslate(t, 'coursesPage.advanced.volProducts.title', 'Volatility Products')} 
          />
        </NavMenuSection>
        
        <NavMenuSection title={safeTranslate(t, 'courses.complex', 'Complex')}>
          <NavMenuItem 
            to="/courses/exotic-options" 
            title={safeTranslate(t, 'coursesPage.complex.exotic.title', 'Exotic Options')} 
          />
          <NavMenuItem 
            to="/courses/monte-carlo" 
            title={safeTranslate(t, 'coursesPage.complex.monteCarlo.title', 'Monte Carlo Methods')} 
          />
        </NavMenuSection>
      </div>
    </div>
  );
};

export default CoursesMenu;
