# Requirements Document

## Introduction

This feature converts the coach admin dashboard's player-detail presentation from a card appended to the bottom of a long scrolling page into a full-screen, mobile-friendly player view rendered within the same `admin.html` page. Opening a player hides all other dashboard cards and scrolls to the top; "Back to roster" links (top and bottom) and the browser/gesture Back button return the coach to the roster at the exact scroll position they left. The player view keeps every existing admin action and stat, and its rounds list becomes responsive (stacked cards on phones, table on desktop). This is a presentation-and-navigation change only: no new HTML page, no backend/Apps Script change, and no session/auth change.

## Glossary

- **Admin_Dashboard**: The `#dashboard` container in `admin.html` and its child cards (Season, Settings, Team Totals, Add Player, Roster, Player View, Round Editor).
- **Player_View**: The `#playerDetail` card presented as the sole visible dashboard content when open.
- **Round_Editor**: The `#editRoundCard` form used to add or edit a round.
- **Roster_View**: The default dashboard state showing all cards except the Player View and Round Editor.
- **Navigation_Controller**: The set of functions and state in `assets/js/admin.js` that opens/closes the Player View, manages scroll capture/restore, and wires browser history.
- **Mobile_Breakpoint**: The existing `@media (max-width: 640px)` rule in `assets/css/styles.css`.
- **Roster_Scroll_Position**: The `window.scrollY` value captured at the moment the Player View is opened.

## Requirements

### Requirement 1: Open the full-screen player view

**User Story:** As a coach, I want opening a player to show only that player's details on their own screen, so that I can focus on one athlete without scrolling past every other dashboard card.

#### Acceptance Criteria

1. WHEN a coach clicks a desktop roster row (`tr[data-token]`), THE Navigation_Controller SHALL open the Player_View for that player's token.
2. WHEN a coach clicks the mobile "View full details" control (`.roster-card-detail`), THE Navigation_Controller SHALL open the Player_View for that player's token.
3. WHILE the Player_View is open, THE Admin_Dashboard SHALL hide the Season card, the `#settingsSection` Settings card, the Team Totals card, the Add Player card, and the Roster card.
4. WHEN the Player_View opens, THE Navigation_Controller SHALL scroll the window to the top.
5. IF the provided token matches no player, THEN THE Navigation_Controller SHALL leave the current dashboard state unchanged and SHALL NOT open the Player_View.

### Requirement 2: Return to the roster via on-page links

**User Story:** As a coach, I want "Back to roster" links at the top and bottom of the player view, so that I can leave the player view without scrolling to find a control.

#### Acceptance Criteria

1. WHILE the Player_View is open, THE Player_View SHALL display a "Back to roster" control at the top of the view.
2. WHILE the Player_View is open, THE Player_View SHALL display a "Back to roster" control at the bottom of the view.
3. WHEN a coach activates either "Back to roster" control, THE Navigation_Controller SHALL close the Player_View and SHALL restore the Roster_View.

### Requirement 3: Restore the exact roster scroll position

**User Story:** As a coach, I want to return to the same spot in the roster I left from, so that I can continue reviewing players without hunting for my place.

#### Acceptance Criteria

1. WHEN the Player_View opens, THE Navigation_Controller SHALL capture the current window scroll position as the Roster_Scroll_Position.
2. WHEN the Player_View closes, THE Navigation_Controller SHALL scroll the window to the captured Roster_Scroll_Position after the Roster_View cards are visible.

### Requirement 4: Browser and gesture Back navigation

**User Story:** As a coach on a phone, I want the Back gesture to return me to the roster, so that navigation feels native and I do not accidentally leave the admin page.

#### Acceptance Criteria

1. WHEN the Player_View opens, THE Navigation_Controller SHALL add exactly one browser history entry marked as the player-view state.
2. WHILE the Player_View is open, WHEN the browser Back action fires a popstate event, THE Navigation_Controller SHALL close the Player_View and restore the Roster_View at the Roster_Scroll_Position.
3. WHEN a coach activates an on-page "Back to roster" control, THE Navigation_Controller SHALL consume the pushed history entry so that no duplicate player-view entry remains.
4. WHILE the Player_View is open, WHEN the Player_View is closed by any single Back action, THE Navigation_Controller SHALL run the close-and-restore behavior exactly once.
5. WHILE the dashboard is in the Roster_View, WHEN the browser Back action fires a popstate event, THE Navigation_Controller SHALL leave normal browser navigation unaffected.

### Requirement 5: Mobile-friendly rounds presentation

**User Story:** As a coach on a phone, I want the player's rounds to fit the screen, so that I can read and act on them without horizontal scrolling.

#### Acceptance Criteria

1. WHILE the viewport is above the Mobile_Breakpoint, THE Player_View SHALL render the rounds list as the existing table (Date, Course, Tees, Holes, Score, Diff, Putts, plus Edit and Delete actions).
2. WHILE the viewport is at or below the Mobile_Breakpoint, THE Player_View SHALL render each round as a stacked card layout that does not require horizontal scrolling.
3. WHILE the viewport is at or below the Mobile_Breakpoint, THE Player_View SHALL expose the per-round Edit and Delete actions within each round card.
4. THE Player_View rounds presentation SHALL display, for each round, the same Date, Course, Tees, Holes, Score, Diff, and Putts values in both the table and card layouts.
5. THE mobile rounds styles SHALL be scoped so that no other table using the `.table-scroll` class is affected.

### Requirement 6: Preserve existing player-view actions and stats

**User Story:** As a coach, I want every existing player action and statistic to keep working, so that moving to a full-screen view does not cost me any capability.

#### Acceptance Criteria

1. THE Player_View SHALL display the stats tiles (`#playerDetailTiles`) and the Coaching Focus list (`#coachingAdvice`).
2. THE Player_View SHALL display the copy-link box for the player's public link.
3. THE Player_View SHALL provide the editable Sex control with its Edit, Save, and Cancel actions.
4. THE Player_View SHALL provide the per-round Edit and per-round Delete actions.
5. THE Player_View SHALL provide the Add Round, Remove from Season, and Delete Player actions.

### Requirement 7: Round editor within the full-screen view

**User Story:** As a coach, I want the add/edit round form to open cleanly from the player view, so that editing a round does not reveal a stack of other dashboard cards.

#### Acceptance Criteria

1. WHEN a coach opens the Round_Editor to add or edit a round, THE Admin_Dashboard SHALL display the Round_Editor as the sole visible dashboard content.
2. WHEN a coach opens the Round_Editor, THE Admin_Dashboard SHALL hide the Player_View while the Round_Editor is shown.
3. WHEN a coach opens the Round_Editor, THE Navigation_Controller SHALL scroll the window to the top.
4. WHEN the Round_Editor submission succeeds, THE Admin_Dashboard SHALL hide the Round_Editor and return to the Player_View for the current player.

### Requirement 8: Post-mutation view transitions

**User Story:** As a coach, I want the app to land me in a sensible place after I change something, so that I keep working without re-navigating.

#### Acceptance Criteria

1. WHEN a coach deletes a round and the refresh completes, THE Navigation_Controller SHALL return to the Player_View for the current player.
2. WHEN a coach edits or adds a round and the refresh completes, THE Navigation_Controller SHALL return to the Player_View for the current player.
3. WHEN a coach saves a Sex change and the refresh completes, THE Navigation_Controller SHALL return to the Player_View for the current player.
4. WHEN a coach removes the player from the season and the refresh completes, THE Navigation_Controller SHALL return to the Roster_View.
5. WHEN a coach deletes the player and the refresh completes, THE Navigation_Controller SHALL return to the Roster_View.
6. WHILE the Player_View is re-shown after a player-preserving mutation, THE Navigation_Controller SHALL NOT add an additional browser history entry.

### Requirement 9: Preserve existing dashboard and loading behavior

**User Story:** As a coach, I want the rest of the dashboard to work exactly as before, so that this change does not introduce regressions.

#### Acceptance Criteria

1. WHILE the viewport is above the Mobile_Breakpoint, THE Player_View rounds list SHALL retain its current desktop table behavior.
2. WHILE season data is loading, THE Admin_Dashboard SHALL show only the loading overlay, consistent with the existing `dashboard-loading` behavior.
3. WHEN season data finishes loading, THE Admin_Dashboard SHALL display the view state set by the Navigation_Controller without conflict between the loading state and the player-view state.
4. THE feature SHALL introduce no new HTML page, no backend or Apps Script change, and no session or authentication change.

### Requirement 10: Consistent styling

**User Story:** As a coach, I want the full-screen view to look like the rest of the app, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE full-screen player-view styles SHALL reuse the existing brand `:root` variables and the `.card` visual system.
2. THE responsive rounds styles SHALL use the existing `@media (max-width: 640px)` Mobile_Breakpoint.
