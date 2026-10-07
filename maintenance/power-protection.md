# Power Protection & UPS PBQ

The activity lives in `docs/practice/pbqs/a-plus-core-1/power-protection/app/` and uses the existing standalone PBQ structure and generated in-flow Hub navigation. No shared app code is changed.

`model.js` owns deterministic case generation, source connections, power and service dependencies, ratings, runtime bands, scoring, reset, and validated persistence recovery. `app.js` renders the Activity/Lesson interface and inspection and confirmation dialogs. `art.js` supplies original local SVG equipment illustrations. There are no runtime network requests or external assets.

## Supplied equipment assumptions

- The three UPS profiles are illustrative units with both W and VA limits, six battery outlets, and three surge-only outlets. Total utility-mode load includes both banks. Battery-mode load includes the battery bank. A utility overload warns; battery overload shuts down battery output on transfer.
- Runtime uses the next supplied load-band ceiling, conservatively. It does not interpolate or derive exact runtime from watts. Profiles assume healthy, fully charged batteries. Failed batteries provide no backup. Replacement completes an approved service, charging, and self-test procedure in the simulation.
- The UPS starts after input is connected. Its supplied documentation requires direct grounded wall input. A cascaded input may pass power in the simulator but fails installation scoring.
- The separate surge protector is connected directly to an appropriate wall circuit and is rated for six devices, 1,800 W, and 1,800 VA. Suitable rated wall circuits are available; building circuit design is outside the activity.
- The office laser printer is unsupported on either UPS bank. This is a supplied equipment restriction rather than a claim about every printer and UPS combination.
- PoE endpoint figures are supplied AC-side allocations including conversion. Endpoint load is counted once at the switch when powered by PoE, or at its own source when using the supplied AC adapter. The switch has a 60 W PoE budget. Service results follow the complete powered path; external providers are assumed available during the local outage.
- The troubleshooting overload case uses an older workstation PSU with specified 0.50 power factor. Initial watts stay below the compact UPS's W limit while VA exceeds its VA limit. Removing the optional fan or installing a suitable UPS resolves that fault.

## Validation

Run the repository's navigation, source, strict build, and site-link checks. Then run:

```sh
node tests/power-protection.cjs
PBQ_PLAYWRIGHT=/path/to/playwright node tests/power-protection.cjs --local
```

The model checks exercise 1,400 generated cases, including all four types and four troubleshooting faults, defensible solutions, separate W/VA limits, runtime bands, PoE accounting, partial/full credit, actual repairs, reset, randomization, and corrupted-state recovery. Browser checks cover the built Hub, inspection, connection changes, outage/retest/submission, diagnosis and maintenance, saved state, modal cancellation, tab keyboard behavior, touch, knowledge checks, denied storage, and unobstructed layouts from 320 to 1,440 px.

If using an existing compatible Chromium binary, set `PBQ_BROWSER_EXECUTABLE=/path/to/chromium`. Optional `PBQ_SCREENSHOT_DIR` captures local images for visual inspection; those images are not committed or distributed as a separate review artifact.

## Technical sources

- [APC UPS buying guide](https://www.apc.com/us/en/support/product-support/ups-buying-guide-for-selecting-a-battery-backup-system.jsp): distinct W/VA limits, battery runtime, surge-only outlets, and voltage regulation.
- [Schneider Electric laser-printer guidance](https://www.se.com/us/en/faqs/FA158812/): restrictions on Back-UPS battery and surge-only outlets; separately rated protection and appropriately sized alternatives.
- [Schneider Electric power-strip guidance](https://www.se.com/us/en/faqs/FA158852/): direct wall input and avoiding cascaded strips and extension cords with the documented UPS products.

These sources guide concepts and supplied equipment restrictions. They are not the source of the fictional UPS ratings or runtime tables.
