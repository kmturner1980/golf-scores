# Requirements Document

## Introduction

This feature makes the golf-scores site render well on phones for the core flows: adding rounds, editing rounds, and viewing rounds — on both the admin dashboard (`admin.html` + `assets/js/admin.js`) and the public player page (`player.html` + `assets/js/player.js`). Prior specs already made the admin Roster and the admin player-detail Rounds list responsive; this pass covers the remaining forms, grids, the shared hole-by-hole entry table, and general phone spacing/tap-target issues. The work is delivered almost entirely through CSS at the existing `@media (max-width: 640px)` breakpoint, plus one behavior-neutral markup addition (`data-label` attributes) in the shared `holeTable.js` renderer. No backend, Apps Script, session/auth, or page-structure changes are made, and all existing desktop layout and behavior is preserved.

## Glossary

- **Stylesheet**: `assets/css/styles.css`, the single shared stylesheet for the site.
- **Mobile_Breakpoint**: the existing `@media (max-width: 640px)` block in the Stylesheet where all new mobile rules are added.
- **Hole_Table**: the `<table class="hole-table">` rendered by the shared `assets/js/holeTable.js` on both the player entry form (`#holeRows`) and the admin round editor (`#editHoleRows`).
- **Hole_Table_Renderer**: the `HoleTable.render()` function in `assets/js/holeTable.js`.
- **Field_Row**: any element with class `.field-row`, the two-column form grid.
- **Summary_Grid**: any element with class `.summary-grid`.
- **Stat_Grid**: any element with class `.stat-grid`.
- **Link_Box**: any element with class `.link-box` (a readonly input plus a Copy button).
- **App_Header**: the `header.app-header` element containing the logo and title.
- **Roster_Cards**: the already-shipped mobile card layout for the admin Roster.
- **Rounds_Cards**: the already-shipped mobile card layout for the admin player-detail Rounds list.
- **Phone_Width**: a viewport width of approximately 390px.
- **Desktop_Width**: a viewport width greater than 640px.

## Requirements

### Requirement 1: Collapse paired form fields on mobile

**User Story:** As a golfer entering a round on my phone, I want paired form inputs to stack vertically, so that each field is wide enough to use comfortably.

#### Acceptance Criteria

1. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render every Field_Row as a single-column grid (`grid-template-columns: 1fr`).
2. WHILE the viewport width is greater than 640px, THE Stylesheet SHALL render every Field_Row as a two-column grid (`grid-template-columns: 1fr 1fr`).
3. THE Stylesheet SHALL apply the single-column Field_Row rule to Field_Row instances on both `admin.html` and `player.html`.

### Requirement 2: Reflow the hole-by-hole table into stacked cards on mobile

**User Story:** As a golfer entering hole-by-hole scores on my phone, I want each hole shown as a stacked labeled card instead of a wide scrolling table, so that I can read and tap each field without horizontal scrolling.

#### Acceptance Criteria

1. WHILE the viewport width is 640px or less, THE Stylesheet SHALL hide the Hole_Table header row (`thead`).
2. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render each Hole_Table row (`tr`) as a bordered card block using the brand `--card`, `--border`, and `--radius` values.
3. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render each Hole_Table cell (`td`) as a labeled line whose label text is supplied by the cell's `data-label` attribute via a CSS `::before` rule.
4. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render the Hole_Table hole-number cell as a card heading rather than a labeled input row.
5. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render Hole_Table inputs and selects with a minimum height of at least 40px and a width larger than the desktop 4.5em fixed width.
6. WHILE the viewport width is greater than 640px, THE Stylesheet SHALL render the Hole_Table as its original tabular layout.
7. THE Stylesheet SHALL scope every Hole_Table reflow rule to the `.hole-table` selector so that no other table is affected.
8. WHILE the viewport width is 640px or less, THE Stylesheet SHALL prevent the Hole_Table container from displaying a horizontal scrollbar caused by the hole table.

### Requirement 3: Provide field labels for the reflowed hole table

**User Story:** As a golfer viewing the reflowed hole cards, I want each field labeled, so that I know which value each input represents once the table header is hidden.

#### Acceptance Criteria

1. WHEN the Hole_Table_Renderer renders a row, THE Hole_Table_Renderer SHALL add a `data-label` attribute to each of the seven cells with the values `Hole`, `Par`, `Score`, `Fairway`, `GIR`, `Putts`, and `Penalty` respectively.
2. WHEN the Hole_Table_Renderer renders a row, THE Hole_Table_Renderer SHALL add a class identifying the hole-number cell as the card heading cell.
3. THE Hole_Table_Renderer SHALL preserve all existing input classes (`par`, `score`, `fairway`, `fairway-na`, `gir`, `putts`, `penalty`), input values, `required` and `disabled` attributes, and the inline input widths unchanged.
4. THE Hole_Table_Renderer SHALL keep `HoleTable.collect()`, `attachParListeners`, `syncFairwayVisibility`, `applyCoursePars`, and `updateRunningTotal` behaving identically to before the change.
5. WHILE a hole's par is 3, THE Hole_Table SHALL keep the fairway select hidden and show the `fairway-na` placeholder within the labeled Fairway line.

### Requirement 4: Ensure summary and stat grids reflow acceptably on mobile

**User Story:** As a golfer using the totals-entry and stats views on my phone, I want the tile grids to reflow without overflow, so that all tiles remain readable at phone width.

#### Acceptance Criteria

1. WHILE the viewport width is approximately 390px, THE Summary_Grid SHALL reflow its tiles without causing horizontal overflow of the page.
2. WHILE the viewport width is approximately 390px, THE Stat_Grid SHALL reflow its tiles without causing horizontal overflow of the page.
3. IF the Summary_Grid 140px minimum column width causes overflow or cramping at approximately 390px, THEN THE Stylesheet SHALL reduce the Summary_Grid minimum column width at the Mobile_Breakpoint.

### Requirement 5: Fix button clusters, link boxes, and header spacing on mobile

**User Story:** As a coach using the admin dashboard on my phone, I want action buttons, link boxes, and the header to fit the screen, so that controls are tappable and nothing overflows.

#### Acceptance Criteria

1. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render the player-detail right-aligned button clusters (the Remove-from-Season / Delete-Player pair, the Edit/Save/Cancel sex controls, and the Add Round control) so that they wrap or occupy full width without overflowing at Phone_Width.
2. WHILE the viewport width is 640px or less, THE Stylesheet SHALL allow the Link_Box input to shrink below its 200px minimum width so that the input and Copy button fit within Phone_Width.
3. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render the Link_Box Copy button with a minimum tap-target height of at least 40px.
4. WHILE the viewport width is 640px or less, THE Stylesheet SHALL render the App_Header logo and title without horizontal overflow at Phone_Width.
5. WHERE a required layout fix cannot be achieved with CSS alone, THE implementation SHALL apply the minimal HTML change needed and document it.

### Requirement 6: Document the public Recent Rounds table treatment

**User Story:** As a golfer viewing my recent rounds on my phone, I want the rounds list to remain usable, so that I can review my history without a broken layout.

#### Acceptance Criteria

1. THE design SHALL document the decision for the public Recent Rounds table (`#recentRounds`) at Phone_Width.
2. WHILE the viewport width is approximately 390px, THE public Recent Rounds table SHALL remain readable via its existing horizontal scroll container without breaking the page layout.

### Requirement 7: Preserve desktop layout and all existing behavior

**User Story:** As an existing user on a desktop, I want the site to look and behave exactly as before, so that the mobile pass introduces no regressions.

#### Acceptance Criteria

1. WHILE the viewport width is greater than 640px, THE Stylesheet SHALL render all forms, the Hole_Table, the Summary_Grid, the Stat_Grid, button clusters, and the App_Header unchanged from before this feature.
2. THE Stylesheet SHALL leave the already-shipped Roster_Cards and Rounds_Cards behavior unchanged.
3. THE implementation SHALL keep the existing dependency-free Node test suites passing.
4. THE implementation SHALL make no changes to backend code, Apps Script, session/authentication behavior, or the set of pages.

### Requirement 8: Confine new mobile rules to the existing breakpoint

**User Story:** As a maintainer, I want all new mobile rules added to the one existing breakpoint block, so that responsive rules stay consistent and discoverable.

#### Acceptance Criteria

1. THE Stylesheet SHALL add all new mobile rules within the existing `@media (max-width: 640px)` block.
2. THE Stylesheet SHALL reuse the existing brand variables (`--card`, `--border`, `--radius`, `--muted`, `--navy`, `--font-heading`) for the reflowed card styling rather than introducing new color or sizing constants.
