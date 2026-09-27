# Playtest protocol

The tests prove the Department is fair: the résumé is always reachable, and chance and modality never change the outcome. They can't prove it is funny, or that it isn't annoying. This protocol is for David to run with real people after release. Its results tune only two things:
- the pacing values in `BUDGET` (`src/domain/steps.ts`);
- the copy in `src/content/institution/`.

Tuning happens in a follow-up PR. Nothing here changes the rules.

## Participants

Aim for ten sessions:

| Group | How many | Why |
| --- | --- | --- |
| Nontechnical | 3 | The premise must land without developer jokes |
| Programmers or designers | 3 | The audience most likely to see the machinery |
| Keyboard only | 1 | The stationary release control and focus order |
| Touch (phone) | 2 | The three-place release control, 44 px targets |
| Reduced motion (OS setting on) | 1 | Paperwork instead of motion |
| Screen reader (NVDA or VoiceOver) | Optional | Announcements once per step, the ceremony result read once |

Use a fresh browser tab for each person, so each gets a new case. Don't explain the site first.

## Tasks

1. "Get David's résumé." Say nothing else, and don't help unless they ask twice.
2. When they have it (or give up), ask: "Describe this site in one sentence."

## What to record

| Measure | How |
| --- | --- |
| Time to the first noticed signal | Seconds until they react to something institutional (the notice, the case number, the scope question) |
| Time to recognizing the intent | Seconds until they say or show they know it's a deliberate joke |
| First amusement | The step where they first laugh or smile, if any |
| Irritation | Ask afterwards, 1 (none) to 5 (would have left) |
| Doubt | Ask: "At any point, did you doubt you'd get the résumé?" (yes or no, and where) |
| Reached the résumé | Yes or no, and by which route: the full case, "Request expedited processing", the header link, or the skip link |
| Remembered callback | Ask: "Did it bring up anything you'd done earlier?" (which finding) |
| The ending | Their reaction on the disposition card and the plain résumé, in their words |
| Their one sentence | Verbatim |

## Reading the results

- **Irritation of 4 or 5 from two or more people:** shorten `processingMs` or `climaxMaxMs` (the ceremony's total) before touching the copy.
- **Doubt from anyone:** the escapes aren't visible enough. Look at the panel footer first.
- **Recognition after the release step, or never:** the arrival notice or the scope copy is too dry. Adjust `content/institution/` wording within the voice rules (`tests/unit/voice.test.ts`).
- **No remembered callback:** the findings are too easy to skim. Consider fewer, sharper finding lines.
- **Different reactions by modality:** check that the keyboard, touch and reduced-motion performances are paced like the mouse one.

Record each session as one row in a table under this line, with the date, the group, and the measures above.
