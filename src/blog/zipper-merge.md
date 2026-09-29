---
title: 'The Zipper Merge Is a Lie: Toward Adaptive Early Merge'
summary: 'A manifesto against the zipper merge, featuring a traffic simulation that is rigged in my favor.'
date: 2026-09-26
order: 1
tags: ['manifesto', 'traffic', 'strong opinions']
interactive: aem
---

Every few years, a traffic engineer goes viral explaining that the zipper merge is the most efficient way to fold two lanes into one. Use both lanes all the way to the end. Take turns. Proceed in peace.

I have read these explanations. I understand them. I reject them.

## The problem with the zipper

The zipper merge assumes a population of drivers who take turns. I have met drivers.

The zipper asks the person in the ending lane to drive past forty cars, smile, and expect to be let in. It asks the people in those forty cars to let him. It is a beautiful system, the way communism is a beautiful system: flawless right up until it meets people.

## Introducing Adaptive Early Merge (AEM)

Under Adaptive Early Merge, you merge early, but _adaptively_:

- early enough to be polite,
- late enough to be efficient,
- and at exactly the moment I, personally, would have merged.

AEM is not a merge strategy. It is a lifestyle. It is the traffic equivalent of arriving at the airport two hours early and being smug about it at the gate.

## The simulation

I built a simulation to settle this scientifically. Both roads get the same cars, the same speed limit and the same random seed. The only difference is the merge philosophy.

<div class="aem-sim" data-aem-sim>
  <p class="aem-sim__fallback">The simulation needs JavaScript. The results, however, are already known: AEM wins.</p>
</div>

You may notice that both roads move almost exactly the same number of cars per minute. You may also notice that the scoreboard declares AEM the winner anyway. That is because the Department measures what matters, which is vibes.

## What I'm asking for

- Lane-ending signs that say "MERGE WHEN IT FEELS RIGHT."
- A traffic cone for every AEM advocate. (Mine is on my wishlist.)
- For the person who drives to the very end of the lane and waves: I see you. I respect you. I will not be letting you in.

---

_Honest footnote: actual traffic engineers recommend the zipper merge in congested traffic, because using both lanes to the end shortens the queue and makes turn-taking fair. They are almost certainly right. This is a website about vibes._
