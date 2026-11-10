# Launching a feature

How we announce a user-facing feature: an Update post on Featurebase, a featured image, and short narrated videos on YouTube. The Family Screen V2 launch in November 2026 is the worked example. Its files are in [tools/product-videos/family-screen-v2](../tools/product-videos/family-screen-v2).

A launch often needs help articles too. Write those with [help-articles.md](help-articles.md), and link them from the post.

An agent can run most of this with the `launch-feature` skill in `.claude/skills/`. It stops for a person at every step marked **(you)**.

## 1. Plan

- Write down what changed, who it applies to (volunteer families, client families, staff roles), and how people turn it on or off. For a feature behind an early access flag, see [early-access-features.md](early-access-features.md).
- Pick the everyday tasks the post should teach. Each task gets one video of about a minute or less. Six was enough for a full screen redesign; a small feature may need one or none.
- Write a short script per video: what the viewer sees, and one narration sentence or two per step.
- Check the plan against the code and the app as it is in production, not against the PR description. Features change between the plan and the launch.

## 2. Record the videos

Follow [tools/product-videos/README.md](../tools/product-videos/README.md). It covers preparing Atlantis data, writing the steps and narration, and checking the result.

- Create a topic folder named after the feature, with a `topic.json` listing the PostHog flags the feature needs. The recorder turns them on in its own browser only.
- **(you)** Sign in for the recorder with `node record.mjs login`.
- Get every video working with `--dry` before a real take, and check a contact sheet of each MP4.
- **(you)** Watch every video before uploading.

## 3. Featured image

- Use a real screenshot of the feature in Atlantis, framed by `thumbnail.html`. A drawn mock-up looked less convincing.
- Render it at 1600 × 800 (see the tooling README) and use it as the post's featured image.

## 4. YouTube

- **(you)** Upload the MP4s to the CareTogether channel. Leave them as drafts.
- Titles start with "CareTogether:" and stay under 70 characters, so search results don't cut them off.
- Descriptions start with the task in one sentence, because YouTube shows only the first two lines, then a short "In this video" list.
- Keep the titles and descriptions in the topic's `youtube.md`. An agent can set them in YouTube Studio in your signed-in browser.
- **(you)** Before the post goes out, set every video to Unlisted or Public. An embedded draft video doesn't play.

## 5. The Update post

Featurebase calls these changelogs; the dashboard shows them under **Updates**.

- Write in English. Start with what launched and how people get it ("rolling out" for a gradual rollout), then what's new, then the videos, then how to switch back if there is a way.
- Use exact UI labels and say who each part applies to, for example "**Arrangements** (client families) or **Assignments** (volunteer families)".
- Link existing help articles instead of explaining shared features again, for example [Get More from CareTogether Tables](https://caretogether.featurebase.app/en/help/articles/5660049-get-more-from-caretogether-tables).
- Put each video under its own heading with one line on what it shows, then the embed. Featurebase's YouTube embed markup is:

  ```html
  <div class="iframe-wrapper" data-add-empty-paragraph-after=""><iframe src="https://www.youtube.com/embed/<VIDEO_ID>" data-youtube-video=""></iframe></div>
  ```

- Create the post as a draft with the featured image.
- To try another wording, create a separate draft with a marker in the title, such as "(Updated version)", instead of overwriting the first draft. That keeps both versions to compare. Delete or rename the extra drafts before publishing.
- The `humanize` skill in `.claude/skills/` rewrites a draft in a plainer voice, if a draft sounds too much like marketing.
- **(you)** Read the draft in the Featurebase editor and choose the version to publish.

## 6. Publish

- Check the subscriber list in the dashboard: **Updates** → **Manage subscribers**. The API's `subscribedToChangelog` field on contacts is not reliable; the dashboard list is the truth. It had 50 addresses in November 2026, including internal and test addresses.
- Make sure every video is Unlisted or Public, and the title has no draft marker.
- Make sure every help article the post links to is published. A link to a draft article doesn't open for readers.
- **(you)** Publish, and decide whether to email subscribers. Featurebase's publish call sends no email unless you ask for it, but the editor's own option may be on. Agents never publish or send email without your explicit OK.
- After publishing, open the live post and play each video.

## 7. Keep the launch

Commit the topic folder: steps, narration, setup scripts, assets, thumbnail source and `youtube.md`. The MP4s live on YouTube and the post on Featurebase, so they don't go in git. Add anything new you learned to this page.
