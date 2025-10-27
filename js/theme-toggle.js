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
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
    return prefersLight ? 'light' : 'dark';
};

let currentTheme = applyTheme(getInitialTheme());

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
