import * as React from "react"

/**
 * This script is used to prevent theme flickering on initial page load.
 * It's injected into the page before the React app is rendered.
 * The script checks for theme stored in localStorage and applies it immediately
 * before any rendering occurs, preventing the default theme from flashing.
 */
const ThemeScript = React.memo(() => {
  // This script runs before any React hydration to prevent theme flickering
  const themeScript = React.useMemo(() => {
    const themeScript = `
      (function() {
        // Get theme from localStorage or use system preference as fallback
        try {
          const storedTheme = localStorage.getItem('theme');
          if (!storedTheme) {
            // If no theme preference, check system dark mode preference
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', systemPrefersDark);
            localStorage.setItem('theme', systemPrefersDark ? 'dark' : 'light');
            return;
          }
          
          // Apply theme from localStorage
          document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        } catch (e) {
          // If error, use light theme as fallback
          document.documentElement.classList.remove('dark');
          console.error('Error setting theme:', e);
        }
      })();
    `;
    return themeScript;
  }, []);

  return (
    <script
      id="theme-initializer"
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
});

ThemeScript.displayName = "ThemeScript";

export default ThemeScript;