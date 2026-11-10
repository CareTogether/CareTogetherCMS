---
name: launch-feature
description: Prepare the launch of a CareTogether feature, with an Update post on Featurebase, a featured image, and short narrated videos on YouTube. Use when someone asks to launch or announce a feature, write its Update or changelog post, or record its tutorial videos.
---

# Launch a feature

Follow [docs/feature-launch.md](../../../docs/feature-launch.md) step by step. It is the process; this skill only adds how an agent runs it. The recording tools and the Family Screen V2 example are in [tools/product-videos](../../../tools/product-videos). If the launch needs help articles, write them with the `help-article` skill.

## Before you start

Ask for anything you can't find:

- The feature, and the PRs or flags behind it.
- Who it is for, and how people turn it on or off.
- The tasks the videos should teach, if the person has a view.

Then write the plan from step 1 of the process and show it before recording anything.

## Rules

- Record only in the Atlantis test organization on app.caretogether.io.
- Never type a password. When the recorder needs a session, run `node record.mjs login` and ask the person to sign in in the window it opens.
- Use `--dry` until the steps work. A real take changes Atlantis data. Tell the person what data each real take adds or changes.
- Check the result yourself before calling a step done. Look at contact sheets of the whole video, and read Featurebase drafts back after every write.
- Keep everything in English: narration, post, YouTube text.
- Write the post and the YouTube text in the plain voice of the example launch. Use the `humanize` skill if a draft sounds like marketing.

## Stop and ask before

- Each real take, if it changes Atlantis data the person may want to keep.
- Uploading videos to YouTube. The person uploads them; you can then set titles and descriptions in their signed-in browser.
- Changing a video's visibility.
- Creating a new Featurebase draft when a draft already exists. Offer a separate draft to compare, instead of overwriting.
- Publishing the post, and above all emailing subscribers. Never do either without the person's explicit OK in chat for that exact action.

## When you finish

- Commit the topic folder in `tools/product-videos/` on a branch, without the MP4s.
- Add anything new you learned to `docs/feature-launch.md` in the same branch.
- Report the draft's title and ID, the video IDs and their visibility, and what is left for the person to do.
