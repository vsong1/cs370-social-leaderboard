// Interactive functionality for Squad Score website

// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {
    // Handle navigation link clicks
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Handle navigation based on link text
            const linkText = this.textContent.trim();
            handleNavigation(linkText);
        });
    });

    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
});

// Handle navigation actions
function handleNavigation(page) {
    console.log(`Navigating to: ${page}`);

    switch (page) {
        case 'Home':
            window.location.href = 'index.html';
            break;
        case 'Leaderboards':
            // Navigate to all leaderboards page
            window.location.href = 'all-leaderboards.html';
            break;
        case 'My Squads':
            // Navigate to squad chat hub
            window.location.href = 'chat.html';
            break;
        case 'Profile':
            window.location.href = 'profile.html';
            break;
    }
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function () {
    // Add hover effect to navigation greeting
    const greeting = document.querySelector('.nav-greeting span');
    if (greeting) {
        greeting.addEventListener('mouseenter', function () {
            this.style.color = '#68D391';
            this.style.transition = 'color 0.3s ease';
        });

        greeting.addEventListener('mouseleave', function () {
            this.style.color = 'var(--text-primary)';
        });
    }

    // Add typing effect to welcome text (optional enhancement)
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText) {
        const originalText = welcomeText.textContent;
        welcomeText.textContent = '';

        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                welcomeText.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };

        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', function (e) {
    // Handle Enter key on focused elements
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('nav-link')) {
            activeElement.click();
        } else if (activeElement.classList.contains('cta-button')) {
            viewLeaderboards();
        }
    }

    // Handle Escape key to reset navigation
    if (e.key === 'Escape') {
        const homeLink = document.querySelector('.nav-link[href="index.html"]');
        if (homeLink && !homeLink.classList.contains('active')) {
            homeLink.click();
        }
    }
});

// Add intersection observer for scroll effects (future enhancement)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements when they're added to the DOM
document.addEventListener('DOMContentLoaded', function () {
    const animatedElements = document.querySelectorAll('.welcome-section');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
});

// Profile edit functionality
(function initProfileEditor() {
    const container = document.querySelector('.profile-container');
    if (!container) {
        return;
    }

    const editButton = container.querySelector('[data-profile-action="edit"]');
    const actionsBar = container.querySelector('[data-profile-actions]');
    const form = container.querySelector('#profile-form');
    const displayName = container.querySelector('[data-profile-field="fullName"]');
    const displayTagline = container.querySelector('[data-profile-field="tagline"]');
    const fieldContainers = Array.from(container.querySelectorAll('[data-profile-field-container]'));
    const greeting = document.querySelector('.nav-greeting span');

    const originalValues = new Map();
    const PASSWORD_MASK = '*****';
    const broadcastEditingState = (isEditing) => {
        document.dispatchEvent(new CustomEvent('profile:editing-state-change', {
            detail: { editing: Boolean(isEditing) }
        }));
    };

    const setEditingState = (isEditing) => {
        container.classList.toggle('is-editing', isEditing);
        if (actionsBar) {
            actionsBar.hidden = !isEditing;
        }
        broadcastEditingState(isEditing);

        if (isEditing) {
            fieldContainers.forEach(container => {
                const input = container.querySelector('.profile-field-input');
                const display = container.querySelector('[data-profile-display]');
                if (!input) {
                    return;
                }
                originalValues.set(input.name, input.value);
                if (display && input.id !== 'profile-password') {
                    input.value = display.textContent.trim();
                }
            });
            const firstInput = form ? form.querySelector('.profile-field-input') : null;
            if (firstInput) {
                firstInput.focus();
                firstInput.select();
            }
        } else {
            fieldContainers.forEach(container => {
                const input = container.querySelector('.profile-field-input');
                if (!input) {
                    return;
                }
                if (originalValues.has(input.name)) {
                    input.value = originalValues.get(input.name);
                }
            });
            originalValues.clear();
        }
    };

    const refreshDisplays = () => {
        fieldContainers.forEach(container => {
            const input = container.querySelector('.profile-field-input');
            const display = container.querySelector('[data-profile-display]');
            if (!input || !display) {
                return;
            }

            const value = input.value.trim();
            if (input.id === 'profile-password') {
                display.textContent = value ? PASSWORD_MASK : '--';
            } else {
                display.textContent = value || '--';
            }
        });

        const firstInput = form ? form.querySelector('#profile-first-name') : null;
        const lastInput = form ? form.querySelector('#profile-last-name') : null;
        const firstValue = firstInput ? firstInput.value.trim() : '';
        const lastValue = lastInput ? lastInput.value.trim() : '';

        if (displayName) {
            const fullName = [firstValue, lastValue].filter(Boolean).join(' ').trim();
            displayName.textContent = fullName || 'Unnamed Player';
        }

        if (greeting) {
            greeting.textContent = firstValue ? `Ready to compete, ${firstValue}!` : 'Ready to compete!';
        }

        if (displayTagline) {
            const squad = 'Firepit Friends';
            displayTagline.textContent = `Captain - ${squad} - Joined March 2024`;
        }
    };

    if (actionsBar) {
        actionsBar.hidden = true;
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            refreshDisplays();
            setEditingState(true);
        });
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            refreshDisplays();
            fieldContainers.forEach(container => {
                const input = container.querySelector('.profile-field-input');
                if (!input) {
                    return;
                }
                originalValues.set(input.name, input.value);
            });
            setEditingState(false);
        });
    }

    const cancelButton = container.querySelector('[data-profile-action="cancel"]');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            setEditingState(false);
            refreshDisplays();
        });
    }

    refreshDisplays();
    broadcastEditingState(false);
})();

(function initProfileAvatarControls() {
    const avatarEl = document.querySelector('.profile-avatar');
    const trigger = document.querySelector('[data-avatar-trigger]');
    const fileInput = document.querySelector('[data-avatar-input]');
    const modal = document.querySelector('[data-avatar-modal]');

    if (!avatarEl || !trigger || !fileInput || !modal) {
        return;
    }

    const initialsEl = avatarEl.querySelector('[data-profile-avatar-initials]');
    const imageEl = avatarEl.querySelector('[data-profile-avatar-image]');
    const helperEl = document.querySelector('[data-avatar-helper]');
    const placeholderEl = modal.querySelector('[data-avatar-placeholder]');
    const accentPanel = document.querySelector('[data-avatar-accent-panel]');
    const accentButtons = accentPanel ? Array.from(accentPanel.querySelectorAll('[data-avatar-accent-option]')) : [];
    const uploadButton = document.querySelector('[data-avatar-upload]');
    const toolsContainer = document.querySelector('[data-avatar-tools]');

    const canvas = modal.querySelector('[data-avatar-canvas]');
    const zoomInput = modal.querySelector('[data-avatar-zoom]');
    const applyButton = modal.querySelector('[data-avatar-apply]');
    const errorEl = modal.querySelector('[data-avatar-error]');
    const repickButton = modal.querySelector('[data-avatar-repick]');
    const resetButtons = Array.from(document.querySelectorAll('[data-avatar-reset], [data-avatar-reset-modal]'));
    const outputCanvas = document.getElementById('avatar-output-canvas');

    if (!canvas || !zoomInput || !applyButton || !errorEl || !outputCanvas) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');

    if (!ctx || !outputCtx) {
        return;
    }

    canvas.width = canvas.height = 320;
    outputCanvas.width = outputCanvas.height = 320;

    const storageKeys = {
        avatar: 'squadScore.profile.avatar',
        accent: 'squadScore.profile.avatarAccent'
    };

    const safeStorage = {
        get(key) {
            try {
                return window.localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        set(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (err) {
                console.warn('Unable to persist avatar data:', err);
            }
        },
        remove(key) {
            try {
                window.localStorage.removeItem(key);
            } catch (err) {
                console.warn('Unable to remove avatar data:', err);
            }
        }
    };

    const state = {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        image: null,
        pointerId: null,
        lastPointerPosition: null,
        modalOpen: false,
        focusReturn: null,
        accent: avatarEl.dataset.avatarAccent || 'sunset',
        hasAvatar: false,
        isEditable: false
    };

    const computeInitials = () => {
        const first = document.getElementById('profile-first-name')?.value.trim() || '';
        const last = document.getElementById('profile-last-name')?.value.trim() || '';
        const username = document.getElementById('profile-username')?.value.trim() || '';
        const emailValue = document.getElementById('profile-email')?.value || '';
        const emailName = emailValue.includes('@') ? emailValue.split('@')[0] : emailValue;
        const fallback = (username || emailName || 'SquadScore').replace(/[^A-Za-z0-9]/g, '') || 'SS';

        const nameInitials = (first.charAt(0) + last.charAt(0)).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (nameInitials.length >= 2) {
            return nameInitials.slice(0, 2);
        }
        if (nameInitials.length === 1) {
            const second = fallback.split('').find(char => char !== nameInitials) || fallback.charAt(0);
            return (nameInitials + (second || 'S')).slice(0, 2).toUpperCase();
        }
        return fallback.slice(0, 2).toUpperCase();
    };

    const updateInitialsDisplay = () => {
        if (!initialsEl) return;
        initialsEl.textContent = computeInitials();
    };

    const updateAccentPanelVisibility = () => {
        if (!accentPanel) {
            return;
        }
        const shouldShow = state.isEditable;
        accentPanel.hidden = !shouldShow;
        accentPanel.setAttribute('aria-hidden', String(!shouldShow));
    };

    const updateResetVisibility = () => {
        const shouldShow = state.hasAvatar && state.isEditable;
        resetButtons.forEach(button => {
            if (!button) {
                return;
            }
            button.hidden = !shouldShow;
            button.setAttribute('aria-hidden', String(!shouldShow));
        });
        updateAccentPanelVisibility();
    };

    const setPlaceholderVisible = (shouldShow) => {
        if (!placeholderEl) {
            canvas.hidden = shouldShow;
            if (!shouldShow) {
                canvas.removeAttribute('hidden');
            }
            return;
        }
        placeholderEl.hidden = !shouldShow;
        canvas.hidden = shouldShow;
        if (!shouldShow) {
            canvas.removeAttribute('hidden');
        }
    };

    const applyAccent = (accent) => {
        if (!accent) {
            return;
        }
        state.accent = accent;
        avatarEl.dataset.avatarAccent = accent;
        safeStorage.set(storageKeys.accent, accent);
        accentButtons.forEach(button => {
            const isMatch = button.dataset.avatarAccentOption === accent;
            button.classList.toggle('is-selected', isMatch);
        });
    };

    const clearCanvas = (targetCtx) => {
        targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
        targetCtx.fillStyle = '#0f172a';
        targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    };

    const getDrawMetrics = (targetCanvas = canvas) => {
        if (!state.image) {
            return null;
        }
        const baseScale = Math.max(
            targetCanvas.width / state.image.width,
            targetCanvas.height / state.image.height
        );
        const drawWidth = state.image.width * baseScale * state.zoom;
        const drawHeight = state.image.height * baseScale * state.zoom;
        const maxOffsetX = Math.max(0, (drawWidth - targetCanvas.width) / 2);
        const maxOffsetY = Math.max(0, (drawHeight - targetCanvas.height) / 2);

        state.offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, state.offsetX));
        state.offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, state.offsetY));

        const x = (targetCanvas.width - drawWidth) / 2 + state.offsetX;
        const y = (targetCanvas.height - drawHeight) / 2 + state.offsetY;

        return { drawWidth, drawHeight, x, y };
    };

    const drawPreview = () => {
        if (!state.image) {
            clearCanvas(ctx);
            return;
        }
        const metrics = getDrawMetrics(canvas);
        if (!metrics) {
            clearCanvas(ctx);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(state.image, metrics.x, metrics.y, metrics.drawWidth, metrics.drawHeight);
    };

    const renderToDataUrl = () => {
        if (!state.image) {
            return null;
        }
        const metrics = getDrawMetrics(outputCanvas);
        if (!metrics) {
            return null;
        }
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        outputCtx.drawImage(state.image, metrics.x, metrics.y, metrics.drawWidth, metrics.drawHeight);
        return outputCanvas.toDataURL('image/png', 0.92);
    };

    const showAvatarError = (message) => {
        if (!errorEl) {
            return;
        }
        if (!message) {
            errorEl.hidden = true;
            errorEl.textContent = '';
            return;
        }
        errorEl.hidden = false;
        errorEl.textContent = message;
    };

    const setAvatarState = (nextState) => {
        avatarEl.dataset.avatarState = nextState;
    };

    const resetCropState = () => {
        state.image = null;
        state.zoom = 1;
        state.offsetX = 0;
        state.offsetY = 0;
        state.pointerId = null;
        state.lastPointerPosition = null;
        zoomInput.value = '1';
        applyButton.disabled = true;
        showAvatarError('');
        clearCanvas(ctx);
        fileInput.value = '';
        setPlaceholderVisible(true);
    };

    const getFocusableElements = () => {
        return Array.from(
            modal.querySelectorAll(
                'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        );
    };

    const handleFocusTrap = (event) => {
        if (!state.modalOpen || event.key !== 'Tab') {
            return;
        }
        const focusable = getFocusableElements();
        if (!focusable.length) {
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const openModal = () => {
        if (state.modalOpen) {
            return;
        }
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('avatar-modal-open');
        state.modalOpen = true;
        state.focusReturn = document.activeElement;
        requestAnimationFrame(() => {
            const focusable = getFocusableElements();
            if (focusable.length) {
                focusable[0].focus();
            }
        });
    };

    const closeModal = () => {
        if (!state.modalOpen) {
            return;
        }
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('avatar-modal-open');
        state.modalOpen = false;
        resetCropState();
        const targetFocus = state.focusReturn || trigger;
        if (targetFocus && typeof targetFocus.focus === 'function') {
            requestAnimationFrame(() => targetFocus.focus());
        }
    };

    const applyAvatar = () => {
        if (!state.image) {
            showAvatarError('Select a photo to continue.');
            return;
        }
        const dataUrl = renderToDataUrl();
        if (!dataUrl) {
            showAvatarError('Unable to save avatar. Please try again.');
            return;
        }
        if (imageEl) {
            imageEl.src = dataUrl;
            imageEl.hidden = false;
        }
        safeStorage.set(storageKeys.avatar, dataUrl);
        setAvatarState('image');
        state.hasAvatar = true;
        updateResetVisibility();
        closeModal();
    };

    const resetAvatar = () => {
        if (imageEl) {
            imageEl.removeAttribute('src');
            imageEl.hidden = true;
        }
        safeStorage.remove(storageKeys.avatar);
        setAvatarState('initials');
        updateInitialsDisplay();
        state.hasAvatar = false;
        updateResetVisibility();
        if (state.modalOpen) {
            closeModal();
        } else {
            resetCropState();
        }
    };

    const loadImageForEditing = (source) => {
        if (!source) {
            return;
        }
        const img = new Image();
        img.onload = () => {
            state.image = img;
            state.zoom = 1;
            state.offsetX = 0;
            state.offsetY = 0;
            zoomInput.value = '1';
            applyButton.disabled = false;
            showAvatarError('');
            setPlaceholderVisible(false);
            drawPreview();
        };
        img.onerror = () => {
            showAvatarError('Could not load that file. Please choose a different image.');
        };
        img.src = source;
    };

    const handleFileSelection = (event) => {
        const [file] = event.target.files || [];
        if (!file) {
            return;
        }
        if (!state.isEditable) {
            fileInput.value = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
            showAvatarError('Please choose an image file (PNG or JPG).');
            fileInput.value = '';
            return;
        }
        setAvatarState('loading');
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            openModal();
            setAvatarState(imageEl && !imageEl.hidden ? 'image' : 'initials');
            loadImageForEditing(loadEvent.target?.result);
        };
        reader.onerror = () => {
            showAvatarError('Unable to read that file. Please try again.');
            setAvatarState(imageEl && !imageEl.hidden ? 'image' : 'initials');
        };
        reader.readAsDataURL(file);
    };

    const handlePointerDown = (event) => {
        if (!state.image || state.pointerId) {
            return;
        }
        state.pointerId = event.pointerId;
        state.lastPointerPosition = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (!state.image || state.pointerId !== event.pointerId || !state.lastPointerPosition) {
            return;
        }
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const deltaX = (event.clientX - state.lastPointerPosition.x) * scaleX;
        const deltaY = (event.clientY - state.lastPointerPosition.y) * scaleY;
        state.offsetX += deltaX;
        state.offsetY += deltaY;
        state.lastPointerPosition = { x: event.clientX, y: event.clientY };
        drawPreview();
    };

    const handlePointerEnd = (event) => {
        if (state.pointerId !== event.pointerId) {
            return;
        }
        canvas.releasePointerCapture(event.pointerId);
        state.pointerId = null;
        state.lastPointerPosition = null;
    };

    trigger.addEventListener('click', (event) => {
        if (trigger.disabled) {
            event.preventDefault();
            return;
        }
        fileInput.click();
    });

    if (uploadButton) {
        uploadButton.addEventListener('click', (event) => {
            if (!state.isEditable) {
                event.preventDefault();
                return;
            }
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', handleFileSelection);

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerEnd);
    canvas.addEventListener('pointercancel', handlePointerEnd);

    zoomInput.addEventListener('input', (event) => {
        const nextZoom = Number(event.target.value) || 1;
        state.zoom = Math.min(3, Math.max(1, nextZoom));
        drawPreview();
    });

    accentButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!state.isEditable) {
                return;
            }
            applyAccent(button.dataset.avatarAccentOption);
        });
    });

    if (repickButton) {
        repickButton.addEventListener('click', () => {
            fileInput.click();
        });
    }

    resetButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (button.hidden) {
                return;
            }
            event.preventDefault();
            resetAvatar();
        });
    });

    modal.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        if (target.matches('[data-avatar-dismiss]')) {
            event.preventDefault();
            closeModal();
        }
    });

    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeModal();
            return;
        }
        handleFocusTrap(event);
    });

    applyButton.addEventListener('click', applyAvatar);

    const storedAvatar = safeStorage.get(storageKeys.avatar);
    if (storedAvatar && imageEl) {
        imageEl.src = storedAvatar;
        imageEl.hidden = false;
        setAvatarState('image');
        state.hasAvatar = true;
    } else {
        if (imageEl) {
            imageEl.hidden = true;
        }
        setAvatarState('initials');
        state.hasAvatar = false;
        updateInitialsDisplay();
    }
    updateResetVisibility();

    const storedAccent = safeStorage.get(storageKeys.accent);
    if (storedAccent) {
        applyAccent(storedAccent);
    } else {
        applyAccent(state.accent);
    }

    ['profile-first-name', 'profile-last-name', 'profile-username'].forEach((id) => {
        const input = document.getElementById(id);
        if (!input) {
            return;
        }
        input.addEventListener('input', () => {
            if (avatarEl.dataset.avatarState === 'initials') {
                updateInitialsDisplay();
            }
        });
    });

    setPlaceholderVisible(true);
    clearCanvas(ctx);

    const setEditableState = (isEditable) => {
        state.isEditable = Boolean(isEditable);
        trigger.disabled = !state.isEditable;
        trigger.setAttribute('aria-disabled', String(!state.isEditable));
        avatarEl.dataset.avatarEditable = state.isEditable ? 'true' : 'false';
        if (uploadButton) {
            uploadButton.disabled = !state.isEditable;
            uploadButton.setAttribute('aria-disabled', String(!state.isEditable));
        }
        if (toolsContainer) {
            toolsContainer.hidden = !state.isEditable;
            toolsContainer.setAttribute('aria-hidden', String(!state.isEditable));
        }
        if (helperEl) {
            helperEl.hidden = !state.isEditable;
        }
        if (!state.isEditable && state.modalOpen) {
            closeModal();
        }
        updateResetVisibility();
    };

    document.addEventListener('profile:editing-state-change', (event) => {
        setEditableState(Boolean(event.detail?.editing));
    });

    setEditableState(false);
})();
