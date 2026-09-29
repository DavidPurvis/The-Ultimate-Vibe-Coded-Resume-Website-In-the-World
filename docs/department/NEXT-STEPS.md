# Department of David Purvis: what David does next

The Department is finished as a draft pull request:
https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/pull/3

Nothing has been merged or deployed. The live site still shows the previous version.

These are the steps only you can do, because they need your judgement, your accounts or your repository settings. Do them in order.

## Before merging

### 1. Read the report and look at the screenshots (15 minutes)

- [ ] [REPORT.md](REPORT.md) covers what was built, every check that ran and its result, what is still limited, and what nobody has verified yet.
- [ ] [screenshots/](screenshots/) shows the front desk (desktop and phone), two procedures ending, the release approval and the plain résumé.

### 2. Confirm or veto the personal claims (5 minutes)

The site states these things about you. Each is marked `personalClaim` in `src/content/copy/greenFlags.ts`.

- [ ] **The committee finding on Character Review:** "Returns shopping carts."
- [ ] **In the removable appendix:**
  - "Has never been VAC banned."
  - "Has an emergency contact."
  - "Passed every background check he’s been given."
  - "Airtight alibi for 9/11."

For anything untrue, or that you would rather not publish, tell Claude which line, and it will be removed in this pull request.

### 3. Confirm the project motives (2 minutes)

The Projects page now leads each project with why you built it. These come from your handoff, and are in `src/content/site/projects.ts`:

- [ ] "David wanted a desk media controller."
- [ ] "David wanted the buttons to work on Linux."
- [ ] "David wanted to inspect his team’s match statistics."

The self-hosted infrastructure project has no motive, because the handoff gave none. Send one if you want it there.

### 4. Optional: try it before it goes live

You need Node 22 for this. On your computer:

```bash
git fetch origin claude/epic-wright-7js1ej
git switch claude/epic-wright-7js1ej
npm ci
npx playwright install chromium   # the build prints the résumé PDFs with it
npm run build
npm run serve:dist
```

Then open http://127.0.0.1:4321/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/ and walk through step 7 below.

### 5. Optional: a playtest

No person has yet judged whether it is funny, or whether a nontechnical visitor can tell what each department is for. The protocol in [../overhaul/PLAYTEST.md](../overhaul/PLAYTEST.md) still works: its task, "Get David's résumé", is the same.

Give Claude the results. Tuning changes only wording and timing, never the rules (nothing is ever a prerequisite).

### 6. Optional: gameplay footage

The optional gameplay overlay in Recreation shows "Gameplay pending." tiles until you choose videos.

- [ ] If you want real footage, send Claude one or two YouTube video IDs that allow embedding. They go in `src/content/copy/subway.ts`.

## Merging

### 7. If you protected `main`, add the new check first

If you followed step 3 of [../overhaul/AFTER-MERGE.md](../overhaul/AFTER-MERGE.md) and made a ruleset for `main`, add the one new check:

1. Go to **Settings → Rules → Rulesets → `main`**.
2. Under **Require status checks to pass**, press **Add checks**.
3. Add `E2E (test hooks)`. Leave the others as they are.
4. Press **Save changes**.

Deploy already waits for this check, so this only makes the pull request wait for it too. If you never made a ruleset, skip this step.

### 8. Merge

1. Open the pull request (link at the top) and press **Ready for review**.
2. Wait until every check is green.
3. Press **Merge pull request**.

The pipeline then builds the site once, tests it and publishes it to GitHub Pages. That takes about ten minutes. Watch it under the repository's **Actions** tab: the last job is **Deploy to GitHub Pages**.

## After merging

### 9. Check the live site (15 minutes)

Do this once on a computer and once on your phone, each in a private or incognito window, so you start with a fresh case file.

The site: https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/

- [ ] **The front desk** reads "Department of David Purvis", then "Public access to information concerning David Purvis.", then the directory of six categories. Nothing should pop up by itself.
- [ ] **The release procedure:**
  1. Press **Request résumé**. You should see "Résumé request".
  2. Press **Confirm request**, then **Confirm**.
  3. The Determination should say "Approved.".
  4. Press **Open résumé**. You should land on the plain résumé.
- [ ] **Back at the front desk,** press **Request résumé** again. It should go straight to the résumé.
- [ ] **In a new private window:**
  1. Open **Character Review**.
  2. Open **Verification** and press **Skip verification**.
  3. Open **Correspondence**. It should show the notice "Inspection completed in the absence of inspection."
  4. Now Request résumé. The Determination should mention "Verification: skipped."
- [ ] **Direct access.** In a new private window, switch on **Direct access** in the header. **Request résumé** should then go straight to the résumé, and every page should still open.
- [ ] **The résumé, directly,** should show no Department at all: https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/
- [ ] **Each PDF** should be exactly one page:
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume.pdf
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume-emb.pdf
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume-plt.pdf
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume-be.pdf
- [ ] **The tribute** should have no Department, jokes or ads: https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/tribute/
- [ ] **Privacy.** Open https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/privacy/ and press **Clear everything this site stored**. The table should then be empty.

If the old site still shows, reload with Ctrl+Shift+R (Cmd+Shift+R on a Mac), or wait a few minutes. If anything looks wrong, tell Claude what you saw and on which device.

### 10. Refresh link previews (2 minutes)

The preview image now carries the Department.

- [ ] Go to https://www.linkedin.com/post-inspector/, paste the site address and press **Inspect**.
- [ ] Do the same for the `/resume/` address.
- [ ] Other sites refresh on their own within a few days.

### 11. Delete the merged branch (30 seconds)

- [ ] At the bottom of the pull request, press **Delete branch**.

## If you ever need to undo it

1. Open the pull request and press **Revert** near the bottom. GitHub opens a new pull request that undoes everything.
2. Merge that pull request. The pipeline publishes the previous site again.

## Where to send people

This is unchanged.

- **Recruiters:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/ It is never gated.
- **A PDF to attach:** `resume.pdf`, or the cut that fits the role:
  - `resume-emb.pdf`: embedded;
  - `resume-plt.pdf`: platform, DevOps and SRE;
  - `resume-be.pdf`: backend.
- **Anyone who would enjoy it:** the front desk.
