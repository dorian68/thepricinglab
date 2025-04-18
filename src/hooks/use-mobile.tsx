
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Fonction qui vérifie si l'appareil est mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Vérifier immédiatement au montage du composant
    checkIfMobile()
    
    // Ajouter un écouteur pour vérifier lors des redimensionnements
    window.addEventListener("resize", checkIfMobile)
    
    // Nettoyer l'écouteur lors du démontage
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return !!isMobile
}
