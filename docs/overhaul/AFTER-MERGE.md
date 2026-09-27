# After the merge: what David does

The overhaul is merged, and `pipeline.yml` deployed the verified build to GitHub Pages. These are the steps only you can do: they need your eyes, your accounts, your repository settings, or your documents. Do them in order. Steps 1–4 matter most.

The live site: https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/

## 1. Check the live site (10 minutes)

Do this once on a computer and once on your phone, in a private or incognito window so you get a fresh case.

- [ ] Open the site. Click **View résumé** and go through the whole case: choose a scope and press **Submit scope**, then **Request full document**, then try **Release document** until it lets you (three times), then **Continue** after the ceremony, **Proceed to adjudication**, **Acknowledge** and **Confirm**. It should end on "Case closed" with an **Open résumé** button, and that button should open the résumé.
- [ ] Open a new private window, click **View résumé**, then click **Request expedited processing**. It should close the case in one step.
- [ ] Open the résumé directly: https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/ It should show no jokes and no case.
- [ ] Open each PDF. Each should be exactly one page:
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume.pdf
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume-emb.pdf
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume-plt.pdf
  - https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume-be.pdf
- [ ] Open https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/privacy/ and press **Reset**. The table should then be empty.
- [ ] If anything looks wrong, tell Claude what you saw and on which device. To undo the whole release, see step 9.

If the old site still shows, your browser has cached it. Reload with Ctrl+Shift+R (or Cmd+Shift+R on a Mac), or wait a few minutes.

## 2. Refresh link previews (2 minutes)

The preview image changed ("Access to this résumé is subject to review."). Sites that cached the old one keep showing it until asked to refresh.

- [ ] **LinkedIn:** go to https://www.linkedin.com/post-inspector/, paste the site address and press **Inspect**. Do it again for the `/resume/` address.
- [ ] Other places refresh by themselves within a few days.

## 3. Protect `main` (5 minutes)

`main` has no protection right now, so anything could be pushed to it directly. With the rule below, every change goes through a pull request and deploys only after all checks pass.

1. On GitHub, open the repository, then **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.
2. **Ruleset name:** `main`. **Enforcement status:** Active.
3. **Target branches:** **Add target → Include default branch**.
4. Tick **Require a pull request before merging**. Leave the required approvals at 0 if you're the only person working on it.
5. Tick **Require status checks to pass**, then **Add checks**, and add each of these (type the name and pick it from the list):
   - `Format, typecheck, unit tests`
   - `Build, PDF verify, scan`
   - `E2E (chromium)`
   - `E2E (mobile)`
   - `E2E (firefox)`
   - `E2E (webkit)`
   - `Lighthouse budgets`

   Do **not** add `Deploy to GitHub Pages`: it's skipped on pull requests, so requiring it would block every merge.
6. Leave **Block force pushes** ticked. Press **Create**.

## 4. Confirm the honours wording (only you can)

The site, every PDF and the build checks all say **Magna Cum Laude** for the Mississippi State BS. The checks enforce it, because that's the fact on record.

- [ ] Look at your diploma or official transcript.
- [ ] **If it says Magna Cum Laude:** nothing to do.
- [ ] **If it says Summa Cum Laude:** send Claude the exact wording and where it's written ("diploma" or "transcript, page 1"). Claude will change it everywhere in one pull request: the fact, the lines built from it, the check rules, the PDF check and the saved copies the tests compare against.

## 5. Delete the merged branch (30 seconds)

- [ ] Open the pull request (https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/pull/2) and press **Delete branch** at the bottom. The next Claude session starts a fresh branch from `main`.

## 6. Run the playtest (when you have people)

- [ ] Follow `docs/overhaul/PLAYTEST.md`: about ten people, one task ("Get David's résumé"), and a few questions afterwards.
- [ ] Give Claude the results table. Tuning changes only the timing values and the Department's wording, never the rules.

## 7. Optional: show the site on the repository page

- [ ] On the repository's main page, press the gear next to **About**. Paste the live site address into **Website** and press **Save changes**.

## 8. Optional: a custom domain

Only if you buy a domain.

1. **Settings → Secrets and variables → Actions → Variables**: add `SITE_URL` = `https://your-domain.example` and `BASE_PATH` = `/`.
2. Ask Claude to add `public/CNAME` with your domain, in a pull request.
3. **Settings → Pages → Custom domain**: enter the domain, and follow GitHub's DNS instructions at your domain registrar.

## 9. If you ever need to undo the release

1. Open the pull request (link in step 5) and press **Revert** near the bottom. GitHub opens a new pull request that undoes everything.
2. Merge that pull request.

It restores the old site and its old workflows, and they deploy it again. Nothing else is needed. (If you protected `main` in step 3, the revert's pull request runs the old checks. If the ruleset blocks it, turn the ruleset off in **Settings → Rules → Rulesets**, merge, then turn it back on.)

## Where to send people

- **Recruiters and applications:** https://davidpurvis.github.io/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World/resume/ (the plain résumé, never gated)
- **A PDF to attach:** `resume.pdf`, or the cut that fits the role: `resume-emb.pdf` (embedded), `resume-plt.pdf` (platform, DevOps and SRE) or `resume-be.pdf` (backend)
- **Anyone who'd enjoy the joke:** the home page
