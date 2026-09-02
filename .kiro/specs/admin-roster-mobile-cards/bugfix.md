# Bugfix Requirements Document

## Introduction

On mobile devices the admin dashboard Roster table renders as an 11-column table
(Name, Rounds, Avg /18, Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles,
Worse, Status). Every column is set to `white-space: nowrap` and the table is
wrapped in a `.table-scroll` container with `overflow-x: auto`, so on a phone the
combined column width exceeds the viewport and the user must scroll horizontally to
see all of a player's stats. The user does not want to scroll horizontally to read
the roster.

This fix introduces a responsive presentation for the admin Roster only: at desktop
widths the current sortable table is preserved exactly, and below a mobile breakpoint
each player is rendered as a collapsible card that fits within the viewport. It is
scoped strictly to the admin Roster — the admin player-detail "Rounds" table, the
public `player.html` "Recent Rounds" table, and Team Totals are out of scope and must
be unchanged. This is also the project's first `@media` breakpoint in `styles.css`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the admin Roster is viewed at a mobile viewport width THEN the roster content width exceeds the viewport, causing horizontal overflow (the roster container's scrollWidth is greater than its clientWidth)
1.2 WHEN the admin Roster is viewed at a mobile viewport width THEN the system requires the user to scroll horizontally within the `.table-scroll` container to see all of a player's stats (Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles, Worse, Status)

### Expected Behavior (Correct)

2.1 WHEN the admin Roster is viewed at a mobile viewport width THEN the system SHALL render the roster so it fits within the viewport with no horizontal overflow (roster container scrollWidth does not exceed clientWidth)
2.2 WHEN the admin Roster is viewed at a mobile viewport width THEN the system SHALL render each player as a collapsible card whose collapsed state shows exactly the player Name, Scoring Avg /18, and Rounds count, with the Active/Inactive status indicator visible in the always-visible header
2.3 WHEN a player's card header is tapped or activated via keyboard at a mobile viewport width THEN the system SHALL expand the card in place to reveal all remaining stats (Avg Diff, Fairway %, GIR %, Putts /18, Birdies+, Doubles, Worse, and full Status) without introducing horizontal scrolling, and SHALL collapse it again when activated a second time
2.4 WHEN a player's card is expanded at a mobile viewport width THEN the system SHALL present a distinct "View full details" action that opens the existing full player detail view (the same `showPlayerDetail(token)` view desktop opens on row click); expanding or collapsing the card SHALL NOT itself navigate to player detail
2.5 WHEN the collapsible card is operated at a mobile viewport width THEN the system SHALL be keyboard-operable and screen-reader friendly (native `<details>`/`<summary>` or an accessible control exposing `aria-expanded`) with an adequately sized tap target
2.6 WHEN the admin Roster is viewed at a mobile viewport width THEN the system SHALL preserve the Boys / Girls / Sex Not Set grouping and per-group headings

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the admin Roster is viewed at a desktop/wide viewport width THEN the system SHALL CONTINUE TO render the current sortable table with all 11 columns
3.2 WHEN a column header is clicked at a desktop/wide viewport width THEN the system SHALL CONTINUE TO sort the roster by that column and toggle sort direction as before
3.3 WHEN a roster row is clicked at a desktop/wide viewport width THEN the system SHALL CONTINUE TO open the player detail view via `showPlayerDetail(token)`
3.4 WHEN the admin player-detail "Rounds" table, the public `player.html` "Recent Rounds" table, or Team Totals are rendered at any viewport width THEN the system SHALL CONTINUE TO render them exactly as before (out of scope for this fix)
3.5 WHEN any stat value is displayed in the roster (either state, either layout) THEN the system SHALL CONTINUE TO format it using the existing `Stats.fmt*` helpers and escape player-supplied text with `escapeHtml`
