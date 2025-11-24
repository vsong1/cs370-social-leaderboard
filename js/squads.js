const STORAGE_KEY = 'squad_records';
const DIRECTORY_KEY = 'squad_directory';

const SEED_SQUADS = [
    {
        id: 'seed_valorant_legends',
        owner: 'system_valorant',
        created_at: '2024-03-18T18:00:00.000Z',
        squad_name: 'Valorant Legends',
        game_title: 'Valorant',
        skill_tier: 'Immortal',
        visibility: 'private',
        invite_code: 'VAL-LEGENDS-23',
        description: 'Strategy-first Valorant crew reviewing every mid-round call.'
    },
    {
        id: 'seed_net_ninjas',
        owner: 'system_net',
        created_at: '2024-03-15T14:15:00.000Z',
        squad_name: 'Net Ninjas',
        game_title: 'Overwatch 2',
        skill_tier: 'Grandmaster',
        visibility: 'private',
        invite_code: 'NET-NINJAS-08',
        description: 'Tournament-focused squad drilling coordination and ult tracking.'
    },
    {
        id: 'seed_csgo_allstars',
        owner: 'system_csgo',
        created_at: '2024-03-12T11:30:00.000Z',
        squad_name: 'CSGO Allstars',
        game_title: 'Counter-Strike 2',
        skill_tier: 'Global Elite',
        visibility: 'private',
        invite_code: 'CSGO-ELITE-5',
        description: 'Weekly scrims, strat swaps, and demo reviews.'
    }
];

const selectors = {
    panel: document.querySelector('[data-panel]'),
    toggle: document.querySelector('[data-action="toggle-form"]'),
    form: document.getElementById('create-squad-form'),
    error: document.querySelector('[data-error]'),
    list: document.querySelector('[data-squad-list]'),
    emptyState: document.querySelector('[data-empty-state]'),
    joinForm: document.getElementById('join-squad-form'),
    joinError: document.querySelector('[data-join-error]'),
    joinFeedback: document.querySelector('[data-join-feedback]'),
    inviteBanner: document.querySelector('[data-invite-banner]'),
    inviteCodeValue: document.querySelector('[data-invite-code]'),
    copyInviteButton: document.querySelector('[data-copy-invite]'),
    copyInviteFeedback: document.querySelector('[data-copy-feedback]'),
    inviteDismissButton: document.querySelector('[data-dismiss-invite]')
};

const squadState = {
    records: [],
    directory: []
};

const normalizeCode = (code) => (code || '').trim().toLowerCase();

const readFromStorage = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(`Failed to parse ${key}:`, error);
        return [];
    }
};

const writeToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to persist ${key}:`, error);
    }
};

const ensureSeedDirectory = (directory) => {
    if (!Array.isArray(directory) || !directory.length) {
        writeToStorage(DIRECTORY_KEY, SEED_SQUADS);
        return [...SEED_SQUADS];
    }

    const existingIds = new Set(directory.map((record) => record.id));
    let mutated = false;
    SEED_SQUADS.forEach((seed) => {
        if (!existingIds.has(seed.id)) {
            directory.push({ ...seed });
            mutated = true;
        }
    });
    if (mutated) {
        writeToStorage(DIRECTORY_KEY, directory);
    }
    return directory;
};

const readDirectory = () => ensureSeedDirectory(readFromStorage(DIRECTORY_KEY));

const readUserRecords = () => {
    const records = readFromStorage(STORAGE_KEY);
    return records.map((record) => ({
        ...record,
        membership: record.membership || 'owner'
    }));
};

const writeUserRecords = (records) => writeToStorage(STORAGE_KEY, records);

const togglePanel = (shouldShow) => {
    if (!selectors.panel || !selectors.toggle) {
        return;
    }
    selectors.panel.hidden = !shouldShow;
    selectors.toggle.textContent = shouldShow ? 'Close' : '+ Create Squad';
    selectors.toggle.setAttribute('aria-expanded', String(shouldShow));
    if (!shouldShow && selectors.form) {
        selectors.form.reset();
        clearError();
    }
};

const showError = (message) => {
    if (!selectors.error) {
        return;
    }
    selectors.error.textContent = message;
    selectors.error.hidden = !message;
};

const clearError = () => showError('');

const showJoinError = (message) => {
    if (!selectors.joinError) {
        return;
    }
    selectors.joinError.textContent = message;
    selectors.joinError.hidden = !message;
    if (message) {
        showJoinFeedback('');
    }
};

const clearJoinError = () => showJoinError('');

let joinFeedbackTimer;
let inviteCopyTimer;

const showJoinFeedback = (message) => {
    if (!selectors.joinFeedback) {
        return;
    }
    selectors.joinFeedback.textContent = message;
    selectors.joinFeedback.hidden = !message;
    if (joinFeedbackTimer) {
        clearTimeout(joinFeedbackTimer);
    }
    if (message) {
        joinFeedbackTimer = setTimeout(() => {
            selectors.joinFeedback.hidden = true;
        }, 3000);
    }
};

const setCopyInviteFeedback = (message) => {
    if (!selectors.copyInviteFeedback) {
        return;
    }
    selectors.copyInviteFeedback.textContent = message;
    selectors.copyInviteFeedback.hidden = !message;
    if (inviteCopyTimer) {
        clearTimeout(inviteCopyTimer);
    }
    if (message) {
        inviteCopyTimer = setTimeout(() => {
            selectors.copyInviteFeedback.hidden = true;
        }, 2500);
    }
};

const hideInviteSuccess = () => {
    if (selectors.inviteBanner) {
        selectors.inviteBanner.hidden = true;
    }
};

const showInviteSuccess = (inviteCode) => {
    if (selectors.inviteBanner && selectors.inviteCodeValue) {
        selectors.inviteCodeValue.textContent = inviteCode || 'N/A';
        selectors.inviteBanner.hidden = false;
        selectors.inviteBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setCopyInviteFeedback('');
        return true;
    }

    const fallbackMessage = inviteCode
        ? `Squad created! Invite code: ${inviteCode}`
        : 'Squad created!';
    alert(fallbackMessage);
    return false;
};

const ensureListVisibility = () => {
    if (!selectors.emptyState) {
        return;
    }
    selectors.emptyState.hidden = squadState.records.length > 0;
};

const createCard = (record) => {
    const card = document.createElement('article');
    card.className = 'squad-card';

    const header = document.createElement('div');
    header.className = 'squad-card-header';

    const title = document.createElement('h2');
    title.className = 'squad-card-title';
    title.textContent = record.squad_name;

    const badge = document.createElement('span');
    badge.className = 'squad-badge';
    badge.textContent = record.visibility === 'private' ? 'Private' : 'Public';

    header.append(title, badge);

    const meta = document.createElement('div');
    meta.className = 'squad-card-meta';

    const roleInfo = document.createElement('span');
    roleInfo.textContent = `Role: ${record.membership === 'owner' ? 'Owner' : 'Member'}`;
    meta.append(roleInfo);

    if (record.game_title) {
        const gameInfo = document.createElement('span');
        gameInfo.textContent = `Game: ${record.game_title}`;
        meta.append(gameInfo);
    }
    if (record.skill_tier) {
        const tierInfo = document.createElement('span');
        tierInfo.textContent = `Tier: ${record.skill_tier}`;
        meta.append(tierInfo);
    }
    if (record.membership === 'owner' && record.invite_code) {
        const inviteInfo = document.createElement('span');
        inviteInfo.textContent = `Invite Code: ${record.invite_code}`;
        meta.append(inviteInfo);
    }

    const description = document.createElement('p');
    description.className = 'squad-card-description';
    description.textContent = record.description || 'No description provided.';

    card.append(header, meta, description);
    return card;
};

const renderSquads = () => {
    if (!selectors.list) {
        return;
    }
    selectors.list.querySelectorAll('.squad-card').forEach((node) => node.remove());
    const fragment = document.createDocumentFragment();
    const sortedRecords = [...squadState.records].sort((a, b) => {
        if (a.membership === b.membership) {
            return new Date(b.created_at || b.joined_at || 0) - new Date(a.created_at || a.joined_at || 0);
        }
        return a.membership === 'owner' ? -1 : 1;
    });
    sortedRecords.forEach((record) => {
        fragment.append(createCard(record));
    });
    selectors.list.append(fragment);
    ensureListVisibility();
};

const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!selectors.form) {
        return;
    }

    if (!selectors.form.reportValidity()) {
        return;
    }

    const formData = new FormData(selectors.form);
    const nextRecord = Object.fromEntries(formData.entries());
    const trimmedName = nextRecord.squad_name.trim();
    const trimmedGame = nextRecord.game_title.trim();
    const trimmedTier = (nextRecord.skill_tier || '').trim();
    const trimmedDescription = (nextRecord.description || '').trim();
    const visibility = nextRecord.visibility;

    clearError();

    // Disable form while submitting
    const submitButton = selectors.form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating...';
    }

    try {
        // Create squad in database
        const { data: squad, error } = await window.Database.createSquad({
            name: trimmedName,
            game_title: trimmedGame,
            skill_tier: trimmedTier || null,
            visibility: visibility || 'public',
            description: trimmedDescription || null
        });

        if (error) {
            showError(error.message || 'Failed to create squad. Please try again.');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
            return;
        }

        // Success - reset form and close panel
        selectors.form.reset();
        togglePanel(false);

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }

        const handled = showInviteSuccess(squad.invite_code);
        if (handled) {
            return;
        }

        // If the invite banner isn't available, fall back to prior behavior
        if (window.location.pathname.includes('createsquad.html')) {
            window.location.reload();
        }

    } catch (error) {
        console.error('Unexpected error creating squad:', error);
        showError('An unexpected error occurred. Please try again.');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
};

const handleJoinSubmit = async (event) => {
    event.preventDefault();
    if (!selectors.joinForm) {
        return;
    }

    const formData = new FormData(selectors.joinForm);
    const inviteInput = (formData.get('invite_code') || '').trim();

    if (!inviteInput) {
        showJoinError('Please enter an invitation code.');
        return;
    }

    clearJoinError();

    // Disable form while submitting
    const submitButton = selectors.joinForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton?.textContent;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Joining...';
    }

    try {
        // Join squad using database
        const { data, error } = await window.Database.joinSquadByInviteCode(inviteInput);

        if (error) {
            showJoinError(error.message || 'Failed to join squad. Please check the invite code and try again.');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
            return;
        }

        // Success
        selectors.joinForm.reset();
        showJoinFeedback('Joined squad successfully!');
        
        // Reload page to show the new squad
        if (window.location.pathname.includes('joinsquad.html') || window.location.pathname.includes('createsquad.html')) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            // If on a different page, redirect to chat
            setTimeout(() => {
                window.location.href = 'chat.html';
            }, 1000);
        }

    } catch (error) {
        console.error('Unexpected error joining squad:', error);
        showJoinError('An unexpected error occurred. Please try again.');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
};

const handleToggle = () => {
    const isHidden = selectors.panel?.hidden !== false;
    togglePanel(isHidden);
};

const handleCancel = () => togglePanel(false);

const handleCopyInvite = async () => {
    const code = selectors.inviteCodeValue?.textContent?.trim();
    if (!code) {
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
        } else {
            const tempInput = document.createElement('input');
            tempInput.value = code;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
        setCopyInviteFeedback('Copied to clipboard');
    } catch (error) {
        console.error('Failed to copy invite code:', error);
        setCopyInviteFeedback('Copy failed. Try again.');
    }
};

const handleInviteDismiss = () => {
    hideInviteSuccess();
    if (window.location.pathname.includes('createsquad.html')) {
        window.location.reload();
    }
};

const init = async () => {
    const hasListView = Boolean(selectors.list);
    const hasJoinForm = Boolean(selectors.joinForm);

    if (!hasListView && !hasJoinForm) {
        return;
    }

    if (hasListView) {
        // Wait for auth and database to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load squads from database instead of localStorage
        try {
            const { data: squads, error } = await window.Database?.getUserSquads();
            
            if (error) {
                console.error('Error loading squads:', error);
                // Fall back to localStorage if database fails
                squadState.directory = readDirectory();
                squadState.records = readUserRecords();
            } else if (squads && squads.length > 0) {
                // Convert database squads to the format expected by renderSquads
                squadState.records = squads.map(squad => ({
                    id: squad.id,
                    squad_name: squad.name,
                    game_title: squad.game_title,
                    skill_tier: squad.skill_tier,
                    visibility: squad.visibility,
                    invite_code: squad.invite_code,
                    description: squad.description,
                    created_at: squad.created_at,
                    membership: squad.membershipRole || 'member',
                    owner: squad.created_by
                }));
                squadState.directory = [...squadState.records];
            } else {
                // No squads in database, check localStorage as fallback
                squadState.directory = readDirectory();
                squadState.records = readUserRecords();
            }
        } catch (error) {
            console.error('Unexpected error loading squads:', error);
            // Fall back to localStorage
            squadState.directory = readDirectory();
            squadState.records = readUserRecords();
        }

        renderSquads();

        selectors.toggle?.addEventListener('click', handleToggle);
        selectors.form?.addEventListener('submit', handleCreateSubmit);
        selectors.form?.querySelector('[data-action="cancel"]')?.addEventListener('click', handleCancel);
        selectors.copyInviteButton?.addEventListener('click', handleCopyInvite);
        selectors.inviteDismissButton?.addEventListener('click', handleInviteDismiss);
    }

    if (hasJoinForm) {
        selectors.joinForm.addEventListener('submit', handleJoinSubmit);
    }
};

document.addEventListener('DOMContentLoaded', init);
