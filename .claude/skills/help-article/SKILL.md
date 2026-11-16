---
name: help-article
description: Write or update a CareTogether help center article on Featurebase, with screenshots and videos recorded in the Atlantis test organization. Use when someone asks for a help article, a how-to, a guide for staff, or to update help content after a feature changed.
---

# Write a help article

Follow [docs/help-articles.md](../../../docs/help-articles.md) step by step. It is the process; this skill only adds how an agent runs it. The screenshot and video tools are in [tools/product-videos](../../../tools/product-videos).

## Before you start

- Search the help center with the Featurebase connector for an article on the subject. If one exists, plan an update to it instead of a new article.
- Ask for anything you can't find: who the article is for, and the task it should teach.
- Write the plan from step 1 of the process, including which steps get a screenshot, and show it before taking any.

## Rules

- Take screenshots and videos only in the Atlantis test organization on app.caretogether.io.
- Never type a password. When the recorder needs a session, run `node record.mjs login` and ask the person to sign in in the window it opens.
- Use `--dry` unless a screenshot must show the result of a save. Tell the person what Atlantis data a run without `--dry` adds or changes.
- Open every screenshot before using it. Check it shows only test data and the right element is ringed.
- Read every Featurebase draft back after writing it.
- Write in English, in ASD-STE100 Simplified Technical English, with the exact UI labels. The rules are in step 3 of the process.

## Stop and ask before

- A run that changes Atlantis data the person may want to keep.
- Overwriting an existing article. Offer a draft for the person to compare, or show the changes first.
- Publishing an article. Never publish without the person's explicit OK in chat for that article.

## When you finish

- Commit the topic folder with the script on a branch, without the images or videos.
- Add anything new you learned to `docs/help-articles.md` in the same branch.
- Report the article's title and ID, whether it is a draft or published, and what is left for the person to do.
