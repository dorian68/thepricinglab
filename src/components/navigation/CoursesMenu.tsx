
import React from "react";
import { NavMenuItem, NavMenuSection } from "./NavMenuSection";
import { useTranslation } from "react-i18next";

const CoursesMenu = () => {
  const { t } = useTranslation();
  
  return (
    <div className="grid grid-cols-2 gap-3 p-4 w-[500px]">
      <NavMenuSection title="Fondamentaux">
        <NavMenuItem 
          to="/courses/fundamentals/black-scholes" 
          title={t('coursesPage.fundamentals.blackScholes.title')} 
        />
        <NavMenuItem 
          to="/courses/fundamentals/yield-curves" 
          title={t('coursesPage.fundamentals.yieldCurves.title')} 
        />
        <NavMenuItem 
          to="/courses/fundamentals/greeks" 
          title={t('coursesPage.fundamentals.greeks.title')} 
        />
      </NavMenuSection>
      
      <div>
        <NavMenuSection title="Avancé">
          <NavMenuItem 
            to="/courses/advanced/implied-vol" 
            title={t('coursesPage.advanced.impliedVol.title')} 
          />
          <NavMenuItem 
            to="/courses/advanced/vol-products" 
            title={t('coursesPage.advanced.volProducts.title')} 
          />
        </NavMenuSection>
        
        <NavMenuSection title="Complexe">
          <NavMenuItem 
            to="/courses/complex/exotic-options" 
            title={t('coursesPage.complex.exotic.title')} 
          />
          <NavMenuItem 
            to="/courses/complex/monte-carlo" 
            title={t('coursesPage.complex.monteCarlo.title')} 
          />
        </NavMenuSection>
      </div>
    </div>
  );
};

export default CoursesMenu;
