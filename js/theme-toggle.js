const THEME_STORAGE_KEY = 'preferredTheme';
const root = document.documentElement;

const applyTheme = (theme) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    const isLight = nextTheme === 'light';
    root.classList.toggle('theme-light', isLight);
    root.dataset.theme = nextTheme;
    return nextTheme;
};

const getInitialTheme = () => {
    // First, check if there's already a theme applied to the document
    // This preserves the theme across page navigations
    if (root.dataset.theme === 'light' || root.classList.contains('theme-light')) {
        const existingTheme = 'light';
        // Save it to localStorage if not already saved
        if (window.localStorage.getItem(THEME_STORAGE_KEY) !== existingTheme) {
            window.localStorage.setItem(THEME_STORAGE_KEY, existingTheme);
        }
        return existingTheme;
    }
    
    // Check if dark theme is explicitly set
    if (root.dataset.theme === 'dark') {
        const existingTheme = 'dark';
        // Save it to localStorage if not already saved
        if (window.localStorage.getItem(THEME_STORAGE_KEY) !== existingTheme) {
            window.localStorage.setItem(THEME_STORAGE_KEY, existingTheme);
        }
        return existingTheme;
    }
    
    // Check localStorage for saved preference
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }
    // Default to dark theme (site default) instead of system preference
    // This prevents unwanted theme changes on navigation or login
    return 'dark';
};

// Initialize theme - check current state first to avoid unnecessary changes
let currentTheme;
const detectedTheme = getInitialTheme();
// Only apply if different from current state
if ((detectedTheme === 'light' && !root.classList.contains('theme-light')) ||
    (detectedTheme === 'dark' && root.classList.contains('theme-light'))) {
    currentTheme = applyTheme(detectedTheme);
} else {
    // Use existing theme state
    currentTheme = root.classList.contains('theme-light') ? 'light' : 'dark';
    root.dataset.theme = currentTheme;
}

const updateToggleVisual = (toggle) => {
    if (!toggle) {
        return;
    }
    toggle.setAttribute('aria-pressed', String(currentTheme === 'light'));
    toggle.setAttribute('data-theme', currentTheme);
    const label = currentTheme === 'light' ? 'Light' : 'Dark';
    toggle.querySelector('[data-theme-label]').textContent = `${label} Mode`;
};

const createThemeToggle = () => {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer || navContainer.querySelector('.theme-toggle')) {
        return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle site theme');
    toggle.innerHTML = `
        <span class="theme-toggle__icon" aria-hidden="true"></span>
        <span class="theme-toggle__text" data-theme-label></span>
    `;

    toggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        currentTheme = applyTheme(currentTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
        updateToggleVisual(toggle);
    });

    navContainer.appendChild(toggle);
    updateToggleVisual(toggle);
};

document.addEventListener('DOMContentLoaded', createThemeToggle);

window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY || (event.newValue !== 'light' && event.newValue !== 'dark')) {
        return;
    }
    const newTheme = applyTheme(event.newValue);
    if (newTheme === currentTheme) {
        return;
    }
    currentTheme = newTheme;
    updateToggleVisual(document.querySelector('.theme-toggle'));
});
