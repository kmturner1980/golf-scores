# Requirements Document

## Introduction

The Coach Admin dashboard (`admin.html` / `assets/js/admin.js`) currently shows a
"Season" card at the top of every visit containing four controls: the Viewing
Year selector, the "Make This the Current Season" button, and the "New Season
Label" input with its "Create New Season" button. A separate "Add Existing
Player to This Season" card sits lower on the page. The season-creation and
season-management controls change rarely, yet they occupy prominent space on
every session and add clutter.

This feature separates two distinct concerns:

- The **frequently-changed** concern — which season the dashboard is currently
  scoped to (the Viewing Year) — stays on the main dashboard.
- The **rarely-changed** concern — creating seasons, marking a season current,
  and adding an existing player to a season — moves into a dedicated,
  collapsed-by-default **Settings** area within `admin.html`.

The Settings area is structured as a generic container so additional admin
settings can be added later, but this feature scopes its content to season
management only. The solution is frontend-only: no Google Apps Script backend
actions are added or changed, and all existing backend actions
(`createYear`, `setCurrentYear`, `addPlayerToYear`, `removePlayerFromYear`,
`adminData`) are reused as-is. The feature also introduces persistence of the
last-viewed season across sessions.

## Glossary

- **Dashboard**: The authenticated admin view rendered inside `admin.html` after
  a successful coach login, comprising Team Totals, Roster, player detail, and
  the round editor.
- **Settings_Area**: A new collapsible section within `admin.html`, collapsed by
  default, that houses admin-management controls. In this feature it contains
  only season-management controls.
- **Viewing_Season**: The single season the Dashboard is currently scoped to.
  All Team Totals, Roster rows, and player detail reflect this season. Tracked
  in the client as `selectedYearId`.
- **Current_Season**: The season marked `IsCurrent` in the backend. New
  player-submitted rounds and newly added players are attached to this season.
  It is distinct from the Viewing_Season.
- **Season**: A tracked competitive year, represented by a Years row with a
  `YearID`, `Label`, `CreatedAt`, and `IsCurrent` flag.
- **Roster**: The set of players rostered to a given Season, derived from the
  PlayerYears association (a player rostered to a Season via a PlayerYears row).
- **Existing_Player**: A player that exists globally in the backend but is not
  rostered to the Viewing_Season.
- **Admin**: The single coach/administrator authenticated via the shared admin
  password.
- **Viewing_Season_Store**: The browser `localStorage` entry that persists the
  most recently selected Viewing_Season across sessions.

## Requirements

### Requirement 1: Dedicated Settings area

**User Story:** As the Admin, I want a dedicated Settings area that is hidden by
default, so that the season-management controls I rarely change do not clutter
the Dashboard on every visit.

#### Acceptance Criteria

1. WHEN the Dashboard is displayed after a successful login, THE Settings_Area SHALL be rendered in a collapsed state with the season-management controls defined in Requirements 4, 5, and 6 hidden from view.
2. THE Settings_Area SHALL display a toggle control labeled "Settings" that presents a visible indicator reflecting whether the Settings_Area is currently collapsed or expanded.
3. WHEN the toggle control is activated by click or tap WHILE the Settings_Area is collapsed, THE Settings_Area SHALL display the season-management controls defined in Requirements 4, 5, and 6 within 300 milliseconds and update the indicator to reflect the expanded state.
4. WHEN the toggle control is activated by click or tap WHILE the Settings_Area is expanded, THE Settings_Area SHALL hide the season-management controls defined in Requirements 4, 5, and 6 within 300 milliseconds and update the indicator to reflect the collapsed state.
5. THE Settings_Area SHALL be titled "Settings".

### Requirement 2: Viewing Season remains on the Dashboard

**User Story:** As the Admin, I want the Viewing Year selector to stay on the
main Dashboard, so that I can change which season I am viewing without opening
Settings.

#### Acceptance Criteria

1. THE Dashboard SHALL display the Viewing_Season selector outside the Settings_Area at all times while the Dashboard is loaded, regardless of whether the Settings_Area is expanded or collapsed.
2. WHEN the Admin selects a different Season in the Viewing_Season selector, THE Dashboard SHALL update the Team Totals section, the Roster section, and the player detail section to reflect data for the selected Season within 2 seconds.
3. IF the Admin selects a Season in the Viewing_Season selector for which no data exists, THEN THE Dashboard SHALL display a message indicating that no data is available for the selected Season and SHALL retain the previously displayed Season data unchanged.
4. THE Dashboard SHALL visually mark the entry in the Viewing_Season selector that corresponds to the Current_Season with a persistent indicator distinct from all non-current Season entries.
5. WHILE the Viewing_Season is not the Current_Season, THE Dashboard SHALL keep the Viewing_Season selector enabled and interactive without requiring the Settings_Area to be expanded.

### Requirement 3: Persist the last-viewed Season across sessions

**User Story:** As the Admin, I want the Dashboard to remember the season I was
last viewing, so that reloading returns me to where I left off instead of always
resetting to the current season.

#### Acceptance Criteria

1. WHEN the Admin selects a Season in the Viewing_Season selector, THE Dashboard SHALL write the selected Season identifier to the Viewing_Season_Store before the next Dashboard load can read it.
2. WHEN the Dashboard loads AND the Viewing_Season_Store contains a Season identifier that matches exactly one loaded Season, THE Dashboard SHALL set the Viewing_Season to that matched Season.
3. IF the Dashboard loads AND the Viewing_Season_Store is empty or contains a Season identifier that matches no loaded Season, THEN THE Dashboard SHALL set the Viewing_Season to the Current_Season when a Current_Season exists among the loaded Seasons.
4. IF the Dashboard loads AND the Viewing_Season_Store contains no identifier that matches a loaded Season AND no Current_Season exists among the loaded Seasons, THEN THE Dashboard SHALL set the Viewing_Season to the loaded Season with the most recent creation timestamp.
5. WHEN a new Season is created through the Settings_Area, THE Dashboard SHALL set the Viewing_Season to the newly created Season and write that Season identifier to the Viewing_Season_Store.
6. IF the Dashboard loads AND no Seasons are loaded, THEN THE Dashboard SHALL leave the Viewing_Season unset and SHALL NOT write to the Viewing_Season_Store.
7. IF a read from or write to the Viewing_Season_Store fails, THEN THE Dashboard SHALL apply the Current_Season selection defined in criteria 3 and 4 and SHALL display an indication that the last-viewed Season could not be restored, without blocking Dashboard load.

### Requirement 4: Create a new Season from Settings

**User Story:** As the Admin, I want to create a new season from the Settings
area, so that season creation is available but out of the way during normal use.

#### Acceptance Criteria

1. THE Settings_Area SHALL provide a Season label input that accepts 1 to 100 characters and a create control for creating a new Season.
2. WHEN the Admin activates the create control WHILE the Season label input contains at least one non-whitespace character after trimming, THE Settings_Area SHALL submit the trimmed label to the backend `createYear` action.
3. WHILE a submitted `createYear` request is in progress, THE Settings_Area SHALL disable the create control and SHALL NOT submit an additional create request.
4. IF the Admin activates the create control WHILE the Season label input is empty or contains only whitespace after trimming, THEN THE Settings_Area SHALL display a validation message indicating a label is required and SHALL NOT submit the create request.
5. WHEN the backend confirms creation of a new Season, THE Dashboard SHALL set the newly created Season as the Viewing_Season and reload season data so that the new Season appears selected in the Viewing_Season selector.
6. WHEN the backend confirms creation of a new Season, THE Settings_Area SHALL clear the Season label input and display a confirmation message identifying the created Season.
7. IF the backend returns an error during Season creation, THEN THE Settings_Area SHALL display an error message indicating the reason returned by the backend, SHALL retain the entered label in the Season label input, and SHALL re-enable the create control.

### Requirement 5: Mark a Season as current from Settings

**User Story:** As the Admin, I want to mark a season as the current season from
the Settings area, so that new player-submitted rounds and new players attach to
the intended season.

#### Acceptance Criteria

1. THE Settings_Area SHALL provide a control to mark a Season as the Current_Season.
2. WHERE the Viewing_Season is already the Current_Season, THE Settings_Area SHALL hide the make-current control.
3. WHERE the Viewing_Season is not the Current_Season, THE Settings_Area SHALL display the make-current control for the Viewing_Season.
4. WHEN the Admin activates the make-current control, THE Settings_Area SHALL clear any previously displayed message and submit the Viewing_Season identifier to the backend `setCurrentYear` action.
5. WHILE a make-current submission is in progress, THE Settings_Area SHALL disable the make-current control and reject additional activations of that control until the submission completes.
6. WHEN the backend confirms the Current_Season change, THE Dashboard SHALL reload season data and update the Current_Season indicator to identify the Viewing_Season as the Current_Season.
7. IF the backend returns an error while marking a Season as the Current_Season, THEN THE Settings_Area SHALL display an error message indicating the failure, retain the Viewing_Season selection unchanged, and leave the prior Current_Season unchanged.

### Requirement 6: Add an existing player to the Viewing Season from Settings

**User Story:** As the Admin, I want to add a returning or previously removed
player to the season I am viewing from the Settings area, so that per-season
roster management lives alongside the other rarely-used season controls.

#### Acceptance Criteria

1. WHEN the Settings_Area renders, THE Settings_Area SHALL populate the Existing_Player selector with every Existing_Player that is not rostered to the Viewing_Season, ordered ascending by player name.
2. WHEN the Viewing_Season changes, THE Settings_Area SHALL update the Existing_Player selector to list only players not rostered to the newly selected Viewing_Season, ordered ascending by player name.
3. WHERE no Existing_Player is available for the Viewing_Season, THE Settings_Area SHALL disable the add control and display a message indicating that all players are already rostered to the Viewing_Season.
4. WHEN the Admin activates the add control WHILE an Existing_Player is selected, THE Settings_Area SHALL submit the selected player identifier and the Viewing_Season identifier to the backend `addPlayerToYear` action.
5. IF the Admin activates the add control WHILE no Existing_Player is selected, THEN THE Settings_Area SHALL take no action and SHALL NOT submit a request to the backend.
6. WHEN the backend confirms the addition, THE Dashboard SHALL reload season data and SHALL display the added player in the Roster for the Viewing_Season.
7. IF the backend returns an error while adding an Existing_Player, THEN THE Settings_Area SHALL display an error message indicating the failure reported by the backend and SHALL leave the Existing_Player selector available for a retry.

### Requirement 7: Preserve remove-from-season on player detail

**User Story:** As the Admin, I want the "Remove from Season" action to stay on
the player detail view, so that removing a player remains a contextual action
tied to the specific player I am viewing.

#### Acceptance Criteria

1. WHILE the Admin is viewing a player in the player detail view, THE player detail view SHALL display the "Remove from Season" control for that player.
2. WHEN the Admin activates the "Remove from Season" control, THE Dashboard SHALL submit the current player identifier and the Viewing_Season identifier to the backend `removePlayerFromYear` action.
3. WHEN the backend confirms the removal, THE Dashboard SHALL reload season data so that the removed player no longer appears in the Roster for the Viewing_Season and SHALL indicate that the removal succeeded.
4. THE Settings_Area SHALL NOT provide a remove-from-season control.
5. IF the backend returns an error while removing a player from the Viewing_Season, THEN THE player detail view SHALL display an error message indicating the failure and SHALL leave the player rostered to the Viewing_Season unchanged.

### Requirement 8: Preserve existing behavior and backend contract

**User Story:** As the Admin, I want the relocation of season controls to change
only where the controls live, so that season behavior and the backend remain
unchanged and no Apps Script redeploy is required.

#### Acceptance Criteria

1. THE feature SHALL reuse the existing backend actions `createYear`, `setCurrentYear`, `addPlayerToYear`, `removePlayerFromYear`, and `adminData` without modifying their request or response contracts.
2. THE feature SHALL NOT add, rename, or remove any Google Apps Script backend action.
3. WHILE the Settings_Area is collapsed, THE Dashboard SHALL scope the Team Totals section, the Roster section, and the player detail section to the Viewing_Season.
4. IF the loaded season list is empty, THEN THE Dashboard SHALL display the existing actionable message about redeploying the backend.
5. WHEN the Admin adds a new player, THE Dashboard SHALL attach that player to the Current_Season independent of the Viewing_Season.
6. WHEN a player submits a new round, THE Dashboard SHALL attach that round to the Current_Season independent of the Viewing_Season.