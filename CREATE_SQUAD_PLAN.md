# Create Squad Feature Build Plan

## 1. Overview
- **Function ID:** `create-squad-flow`
- **Purpose:** Enable authenticated players to create new squads that populate the squad list, leaderboards, and chat modules.
- **Background:** Current squad-related pages (`all-squads.html`, `all-leaderboards.html`, `chat.html`) display static placeholders. This feature introduces the end-to-end flow for user-generated squads and prepares the app for future backend integration.

## 2. Functional Description
- **Functionality Summary:** Provide a guided form that captures squad details, validates input, persists the record, and refreshes the UI immediately.
- **Detailed Behavior:**
  1. Player triggers “Create Squad” via a new button (modal or dedicated page).
  2. Form collects `squad_name`, `game_title`, `skill_tier`, `description`, `visibility`, and optional `invite_code`.
  3. Client-side validation runs (required fields, length, uniqueness).
  4. Submission path:
     - **Without backend:** Persist to `localStorage` (or in-memory store) and re-render squad listings.
     - **With backend:** POST to `/api/squads`, handle success and error responses.
  5. Show success toast + contextual link (e.g., jump into squad chat); on errors display inline guidance and allow retry.
- **User Interaction:** Consistent styling with `css/styles.css`, fully keyboard accessible, responsive layout, inline validation messages, loading/disabled states on submit.
- **Example Use Cases:**
  - Player creates “Valorant Eagles” squad, sees it added to “My Squads” instantly.
  - Duplicate name detected; user receives alert and must choose a different name.
  - Private squad creation generates invite code shared with teammates.

## 3. Inputs and Outputs
| Type   | Name          | Data Type    | Description                                 | Example                          |
|--------|---------------|--------------|---------------------------------------------|----------------------------------|
| Input  | `user_id`     | String       | Authenticated player ID (Auth0 profile `sub`)| `"auth0|abc123"`                 |
| Input  | `squad_name`  | String       | Unique squad display name                   | `"Valorant Eagles"`             |
| Input  | `game_title`  | String       | Game or activity focus                      | `"Valorant"`                    |
| Input  | `skill_tier`  | String/Enum  | Skill tier label                            | `"Diamond"`                     |
| Input  | `description` | String       | Short squad bio                             | `"Ranked grind focused team"`   |
| Input  | `visibility`  | Enum         | `public` or `private` squad access          | `"private"`                     |
| Input  | `invite_code` | String?      | Optional invite token for private squads    | `"EAGLE23"`                     |
| Output | `squad`       | Object       | Persisted squad record (includes generated ID, timestamps) | `{ id: "sq_01", owner: "auth0|abc123", ... }` |
| Output | `ui_feedback` | Object/String| Success or error status for the UI          | `"Squad created successfully!"` |

## 4. Logic / Workflow
1. **Trigger:** User clicks “Create Squad”.
2. **Render Form:** Present modal/page with inputs and client-side validation hooks.
3. **Validate:** Check required fields, duplicate squad name, length limits, optional invite code rules.
4. **Persist:** 
   - Local prototype → save to `localStorage` array `squad_records`.
   - Future backend → call `/api/squads` with authenticated request.
5. **Update State:** Update in-memory squad store, refresh `all-squads.html` list, optionally insert into `chat.html` sidebar.
6. **Feedback:** Show success toast + CTA to manage squad; on failure, show error message and keep form data intact.
7. **Cleanup:** Reset form, close modal, or stay for additional creations based on UX decision.

_Pseudo-code sketch:_
```javascript
async function submitCreateSquad(formData) {
  const payload = { ...formData, owner: authService.getUser().sub };
  const errors = validate(payload);
  if (errors.length) return showValidation(errors);

  showLoading();

  try {
    const squadRecord = backendEnabled
      ? await api.createSquad(payload)
      : persistLocally(payload);

    squadStore.add(squadRecord);
    renderSquadList(squadStore.list());
    showSuccessToast('Squad created!');
    closeModal();
  } catch (error) {
    showErrorBanner(error.message || 'Creation failed');
  } finally {
    hideLoading();
  }
}
```

## 5. Dependencies
- **Auth Layer:** `auth.js` (`AuthService`) for current user identity and auth checks.
- **State Utilities:** New or extended `squadStore` module within `js/` for managing squad data.
- **Storage / API:** `localStorage` for prototype persistence; planned integration with REST endpoint `/api/squads`.
- **UI Components:** Reuse button, modal, and form styles from `css/styles.css`; may require new class tokens for squad forms.
- **Routing:** Existing navigation logic in `js/script.js` may need extension for new entry points (e.g., `Create Squad` button behaviour).

Keep this document local-only (ignored by git) as a working implementation playbook.
