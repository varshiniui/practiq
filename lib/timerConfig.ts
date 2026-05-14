export function getTimerDuration(role: string, mode: string | null): number {
  if (mode === "company") {
    // TCS, Infosys, Wipro, Cognizant, Accenture, HCL -> 90 seconds
    if (["tcs", "infosys", "wipro", "cognizant", "accenture", "hcl"].includes(role)) {
      return 90;
    }
    // Zoho, Amazon, Google, Microsoft -> 180 seconds
    if (["zoho", "amazon", "google", "microsoft"].includes(role)) {
      return 180;
    }
    // Swiggy, Zomato, Startup General -> 150 seconds
    if (["swiggy", "zomato", "startup"].includes(role)) {
      return 150;
    }
    return 120; // Default fallback for company mode
  }

  // Role mode
  // Behavioral / Design roles -> 90 seconds
  if (["uiux", "pm", "hr"].includes(role)) {
    return 90;
  }
  // Deep technical / Architecture roles -> 180 seconds
  if (["aiml", "fullstack", "devops", "cybersecurity", "database"].includes(role)) {
    return 180;
  }
  
  // All other standard roles (e.g., sde, frontend, backend) -> 120 seconds
  return 120;
}
