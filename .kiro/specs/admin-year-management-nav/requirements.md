# Requirements Document

## Introduction

This feature restructures the Coach Admin dashboard's information architecture entirely on the frontend. It replaces the inline Settings disclosure with a header hamburger menu, adds a full-screen Year Management view that hosts all season administration, moves player-adding out of the main dashboard into per-season editing, and makes creating a season a guided 4-step walkthrough. No Apps Script/backend changes are made; every relocated control keeps working through the existing backend actions. No new HTML page is added and session/auth is unchanged.

## Glossary

- **Admin_App**: The Coach Admin single-page application (`admin.html` + `assets/js/admin.js` + `assets/css/styles.css`).
- **Main_Dashboard**: The default `#dashboard` content — the Viewing-Season selector, Team Totals, and Roster.
- **Hamburger_Menu**: The header navigation control (`#menuToggle`) and its panel (`#menuPanel`) listing at least "Dashboard" and "Year Management".
- **Year_Management_View**: The full-screen view (`#yearMgmt`, `#dashboard.year-mgmt-open`) listing all seasons and hosting season administration.
- **Player_View**: The existing full-screen player-detail view (`#dashboard.player-view-open`), left intact.
- **Loading_State**: The dashboard loading state (`#dashboard.dashboard-loading`) shown while season data loads.
- **Edit_Year_Panel**: The section of the Year_Management_View that administers one explicitly selected season.
- **Editing_Year_Id**: The YearID of the season currently being edited in the Edit_Year_Panel (distinct from the Viewing-Season selection).
- **Selected_Year_Id**: The YearID chosen in the Main_Dashboard Viewing-Season selector.
- **Walkthrough**: The 4-step guided flow for creating a new season (Name → Returning players → New players → Review & Confirm).
- **Returning_Players**: Players carried onto a new season from a previous season's roster (via `importCandidatesFrom`).
- **New_Player_Row**: A `{ name, sex }` entry typed in Walkthrough Step 3.
- **Current_Season**: The season for which `isCurrentYearRow` is true.
- **Backend_Actions**: The existing Apps Script actions `createYear`, `addPlayer`, `addPlayerToYear`, `setCurrentYear`, `removePlayerFromYear`.

## Requirements

### Requirement 1: Hamburger menu navigation

**User Story:** As a coach, I want a hamburger menu in the header, so that I can move between the dashboard and season management from anywhere.

#### Acceptance Criteria

1. THE Admin_App SHALL render a Hamburger_Menu control in the header.
2. WHEN the coach activates the Hamburger_Menu control, THE Admin_App SHALL open a menu panel listing at least "Dashboard" and "Year Management".
3. WHEN the menu panel is open AND the coach selects "Dashboard", THE Admin_App SHALL close any open full-screen view and display the Main_Dashboard.
4. WHEN the menu panel is open AND the coach selects "Year Management", THE Admin_App SHALL open the Year_Management_View.
5. WHEN the coach selects a menu item, THE Admin_App SHALL close the menu panel.
6. WHEN the coach presses Escape WHILE the menu panel is open, THE Admin_App SHALL close the menu panel.
7. WHEN the coach activates a control outside the menu panel WHILE the menu panel is open, THE Admin_App SHALL close the menu panel.
8. THE Hamburger_Menu control SHALL be keyboard-focusable and operable via Enter or Space.
9. WHILE the menu panel state changes, THE Admin_App SHALL reflect the open/closed state in the control's `aria-expanded` attribute.

### Requirement 2: Trimmed Main dashboard

**User Story:** As a coach, I want the main dashboard limited to viewing information, so that season administration is out of my way while I read stats.

#### Acceptance Criteria

1. THE Main_Dashboard SHALL display the Viewing-Season selector, Team Totals, and the Roster.
2. THE Main_Dashboard SHALL NOT display the Settings disclosure section.
3. THE Main_Dashboard SHALL NOT display a standalone Add Player card.
4. WHEN the coach changes the Viewing-Season selector, THE Admin_App SHALL scope Team Totals and the Roster to the chosen season.

### Requirement 3: Year Management full-screen view-state

**User Story:** As a coach, I want a dedicated full-screen Year Management view, so that I can manage all seasons without leaving the page.

#### Acceptance Criteria

1. WHEN the Year_Management_View is opened, THE Admin_App SHALL display it as the sole visible dashboard content and hide the Main_Dashboard cards.
2. WHEN the Year_Management_View is opened, THE Admin_App SHALL push exactly one browser history entry.
3. WHEN the coach activates the in-view Back control WHILE the Year_Management_View is open, THE Admin_App SHALL return to the Main_Dashboard.
4. WHEN the browser Back navigation occurs WHILE the Year_Management_View is open, THE Admin_App SHALL return to the Main_Dashboard without pushing or consuming an extra history entry beyond the one it opened with.
5. IF the Player_View is open WHEN the Year_Management_View is requested, THEN THE Admin_App SHALL close the Player_View before opening the Year_Management_View.
6. THE Admin_App SHALL keep at most one full-screen view open at a time.
7. WHILE the Loading_State is active, THE Admin_App SHALL hide the Year_Management_View behind the loading overlay and restore the correct view-state after loading completes.
8. WHEN the Year_Management_View is already open AND is requested again, THE Admin_App SHALL NOT push an additional history entry.

### Requirement 4: Season list

**User Story:** As a coach, I want to see every season in one place, so that I can pick which one to edit or make current.

#### Acceptance Criteria

1. THE Year_Management_View SHALL list every season from the loaded season data.
2. THE Year_Management_View SHALL show, for each season, its label and whether it is the Current_Season.
3. THE Year_Management_View SHALL provide an Edit control for each season.
4. WHERE a season is not the Current_Season, THE Year_Management_View SHALL provide a Make-current control for that season.
5. WHERE a season is the Current_Season, THE Year_Management_View SHALL NOT offer a Make-current control for that season.
6. WHEN the coach activates a season's Make-current control, THE Admin_App SHALL call the `setCurrentYear` action for that season and refresh the data.
7. THE Year_Management_View SHALL provide an Add-New-Year control that launches the Walkthrough.

### Requirement 5: Edit a season

**User Story:** As a coach, I want to fully administer one selected season, so that I can manage its roster and status independently of the season I'm viewing.

#### Acceptance Criteria

1. WHEN the coach activates a season's Edit control, THE Admin_App SHALL record that season's YearID as the Editing_Year_Id and display the Edit_Year_Panel for it.
2. THE Edit_Year_Panel SHALL target the Editing_Year_Id for all its actions, independent of the Selected_Year_Id.
3. WHERE the edited season is not the Current_Season, THE Edit_Year_Panel SHALL offer a Make-current control that calls `setCurrentYear` for the Editing_Year_Id.
4. THE Edit_Year_Panel SHALL list the players rostered to the Editing_Year_Id.
5. WHEN the coach removes a rostered player in the Edit_Year_Panel, THE Admin_App SHALL call `removePlayerFromYear` for that player and the Editing_Year_Id and refresh the data.
6. THE Edit_Year_Panel SHALL offer an Add-Existing-Player control whose candidates are the global players not already rostered to the Editing_Year_Id.
7. WHEN the coach adds an existing player in the Edit_Year_Panel, THE Admin_App SHALL call `addPlayerToYear` for that player and the Editing_Year_Id and refresh the data.
8. THE Edit_Year_Panel SHALL offer an Add-brand-new-player form capturing a name and a sex of Boy or Girl.
9. WHEN the coach adds a brand-new player in the Edit_Year_Panel, THE Admin_App SHALL call `addPlayer` with the entered name, sex, and the Editing_Year_Id.
10. WHEN a brand-new player is added in the Edit_Year_Panel, THE Admin_App SHALL display that player's secret link for copying.
11. THE Edit_Year_Panel SHALL NOT provide a rename control for the season.

### Requirement 6: Add New Year walkthrough

**User Story:** As a coach, I want a guided walkthrough to create a season, so that I can name it and set up its roster in clear steps.

#### Acceptance Criteria

1. WHEN the Walkthrough starts, THE Admin_App SHALL present Step 1 for entering the new season label.
2. THE Walkthrough SHALL present a progress indicator and Back/Next navigation across its four steps.
3. IF the season label is empty after trimming, THEN THE Admin_App SHALL prevent advancing past Step 1 and indicate the label is required.
4. WHEN the coach reaches Step 2, THE Admin_App SHALL present a checklist of Returning_Players from a previous season with nothing selected by default.
5. THE Walkthrough SHALL allow Step 2 to be skipped.
6. WHEN the coach reaches Step 3, THE Admin_App SHALL allow adding one or more New_Player_Rows, each capturing a name and a sex of Boy or Girl, with an add-another control.
7. THE Walkthrough SHALL allow Step 3 to be skipped.
8. WHEN both Step 2 and Step 3 are skipped, THE Admin_App SHALL allow creating a season with no players.
9. WHEN the coach reaches Step 4, THE Admin_App SHALL summarize the label, the selected Returning_Players, and the New_Player_Rows to be created.
10. WHEN assembling New_Player_Rows for creation, THE Admin_App SHALL ignore rows whose name is empty after trimming.

### Requirement 7: Confirm and best-effort creation

**User Story:** As a coach, I want confirming the walkthrough to create the season and its players reliably, so that partial failures don't lose my work.

#### Acceptance Criteria

1. WHEN the coach confirms the Walkthrough, THE Admin_App SHALL call `createYear` with the entered label and the selected Returning_Players' tokens.
2. WHEN `createYear` succeeds, THE Admin_App SHALL call `addPlayer` for each valid New_Player_Row against the newly created season's YearID.
3. WHEN a brand-new player is created during confirmation, THE Admin_App SHALL build that player's secret link from the returned token.
4. WHEN the confirmation completes, THE Admin_App SHALL display the created players and their links for copying.
5. IF `createYear` fails, THEN THE Admin_App SHALL report the failure and keep the Walkthrough open with nothing created.
6. IF `createYear` succeeds AND one or more `addPlayer` calls fail, THEN THE Admin_App SHALL keep the created season and the players that succeeded and report which new players failed.
7. WHEN some new players fail after the season is created, THE Admin_App SHALL direct the coach to the Edit_Year_Panel for that season to re-add the failed players.
8. WHEN confirmation creates a season, THE Admin_App SHALL set that season as the Selected_Year_Id, persist it as the last-viewed season, and refresh the data so the Year_Management_View and Main_Dashboard reflect it.

### Requirement 8: Preserve existing behavior

**User Story:** As a coach, I want everything that isn't being moved to keep working, so that the restructure doesn't break my current workflow.

#### Acceptance Criteria

1. THE Admin_App SHALL preserve the Player_View, roster, Team Totals, rounds editing, mobile responsiveness, and Loading_State behavior.
2. THE Admin_App SHALL keep the relocated controls working through the same Backend_Actions they used before relocation.
3. WHILE the viewport is at or below 640 pixels wide, THE Admin_App SHALL present the Hamburger_Menu, Year_Management_View, Edit_Year_Panel, and Walkthrough using the existing mobile layout conventions.
4. THE Admin_App SHALL NOT modify any Apps Script backend action, add a new HTML page, or change the session/auth flow.
