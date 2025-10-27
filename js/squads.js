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
    joinFeedback: document.querySelector('[data-join-feedback]')
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

const handleCreateSubmit = (event) => {
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
    const trimmedInvite = (nextRecord.invite_code || '').trim().toUpperCase();
    const trimmedDescription = (nextRecord.description || '').trim();
    const visibility = nextRecord.visibility;

    const duplicateName = squadState.records.find(
        (record) => record.squad_name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
        showError('A squad with this name already exists. Try a different name.');
        return;
    }

    if (visibility === 'private' && !trimmedInvite) {
        showError('Private squads require an invite code.');
        return;
    }

    const inviteInUse =
        trimmedInvite &&
        squadState.directory.some((record) => normalizeCode(record.invite_code) === normalizeCode(trimmedInvite));
    if (inviteInUse) {
        showError('This invite code is already in use. Choose a different code.');
        return;
    }

    clearError();

    const user = window.authService?.getUser();

    const baseRecord = {
        id: `sq_${Date.now()}`,
        owner: user?.sub ?? null,
        created_at: new Date().toISOString(),
        squad_name: trimmedName,
        game_title: trimmedGame,
        skill_tier: trimmedTier,
        visibility,
        invite_code: trimmedInvite,
        description: trimmedDescription
    };

    const userRecord = {
        ...baseRecord,
        membership: 'owner'
    };

    squadState.records.push(userRecord);
    squadState.directory.push({ ...baseRecord });

    writeUserRecords(squadState.records);
    writeToStorage(DIRECTORY_KEY, squadState.directory);

    renderSquads();
    togglePanel(false);
};

const handleJoinSubmit = (event) => {
    event.preventDefault();
    if (!selectors.joinForm) {
        return;
    }

    const formData = new FormData(selectors.joinForm);
    const inviteInput = (formData.get('invite_code') || '').trim().toUpperCase();

    if (!inviteInput) {
        showJoinError('Please enter an invitation code.');
        return;
    }

    const normalizedInvite = normalizeCode(inviteInput);

    const directoryMatch = squadState.directory.find(
        (record) => record.invite_code && normalizeCode(record.invite_code) === normalizedInvite
    );

    if (!directoryMatch) {
        showJoinError('No squad found for that invitation code.');
        return;
    }

    const alreadyMember = squadState.records.find(
        (record) =>
            record.id === directoryMatch.id ||
            (record.invite_code && normalizeCode(record.invite_code) === normalizedInvite)
    );

    if (alreadyMember) {
        showJoinError('You are already part of this squad.');
        return;
    }

    clearJoinError();

    const joinedRecord = {
        ...directoryMatch,
        membership: 'member',
        joined_at: new Date().toISOString()
    };

    squadState.records.push(joinedRecord);
    writeUserRecords(squadState.records);
    renderSquads();

    selectors.joinForm.reset();
    showJoinFeedback('Joined squad successfully!');
    selectors.joinForm.querySelector('input')?.focus();
};

const handleToggle = () => {
    const isHidden = selectors.panel?.hidden !== false;
    togglePanel(isHidden);
};

const handleCancel = () => togglePanel(false);

const init = () => {
    if (!selectors.list) {
        return;
    }

    squadState.directory = readDirectory();
    squadState.records = readUserRecords();

    renderSquads();

    selectors.toggle?.addEventListener('click', handleToggle);
    selectors.form?.addEventListener('submit', handleCreateSubmit);
    selectors.form?.querySelector('[data-action="cancel"]')?.addEventListener('click', handleCancel);
    selectors.joinForm?.addEventListener('submit', handleJoinSubmit);
};

document.addEventListener('DOMContentLoaded', init);
