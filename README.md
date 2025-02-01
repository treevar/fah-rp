# fah-rp
Rich Presence for [Folding@Home](https://foldingathome.org)

## Getting started
1. Make sure you have [Node.js](https://nodejs.org/en/download/) installed
1. Download 
1. Run `getModules.bat`
1. Edit config if necessary 
1. Run `start.bat` (Folding@Home must be running)

## Editing config

- **mode**: The "mode" you want it to run with<br>
  - `name` Displays your user name and total points
  - `team` Displays your team name and points contributed
  - `slots` Displays what your slots are folding
- **doCycle**: Whether or not to cycle between modes
  - `true` Cycle between modes
  - `false` Don't cycle modes
- **cycles**: Number of cycles to wait between switching modes where each cycle is one time through the loop
- **cycleModes**: Array of modes to cycle through, see mode for valid modes
- **primary**: The primary slot to be displayed
  - `CPU` Displays CPU as primary slot
  - `GPU` Displays GPU as primary slot
- **autoPrimary**: Whether or not to automatically switch primary slot if it's idle 
<br>NOTE: if only one slot exists that one will be primary no matter what is selected
  - `true` Switch primary slot when idle
  - `false` Don't switch primary slot when idle
- **logging**: Whether or not to log info to console
  - `true` Log info
  - `false` Don't log info

