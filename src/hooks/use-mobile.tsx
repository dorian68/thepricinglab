
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // The error occurs because useState is being called incorrectly
  // Let's make sure we're importing React correctly and using hooks properly
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Function that checks if the device is mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check immediately on component mount
    checkIfMobile()
    
    // Add listener to check on window resize
    window.addEventListener("resize", checkIfMobile)
    
    // Clean up listener on component unmount
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return isMobile
}
