# Launching a feature

How we announce a user-facing feature: an Update post on Featurebase, a featured image, and short narrated videos on YouTube. The Family Screen V2 launch in November 2026 is the worked example. Its files are in [tools/launch-videos/launches/family-screen-v2](../tools/launch-videos/launches/family-screen-v2).

An agent can run most of this with the `launch-feature` skill in `.claude/skills/`. It stops for a person at every step marked **(you)**.

## 1. Plan

- Write down what changed, who it applies to (volunteer families, client families, staff roles), and how people turn it on or off. For a feature behind an early access flag, see [early-access-features.md](early-access-features.md).
- Pick the everyday tasks the post should teach. Each task gets one video of about a minute or less. Six was enough for a full screen redesign; a small feature may need one or none.
- Write a short script per video: what the viewer sees, and one narration sentence or two per step.
- Check the plan against the code and the app as it is in production, not against the PR description. Features change between the plan and the launch.

## 2. Prepare Atlantis

Record only in the Atlantis test organization on app.caretogether.io. Never use a real organization's data.

- Find families that show each task well, and note their URLs.
- Put the data into the state each video needs: a draft note to approve, a missing requirement, an exemption to show. Save the steps as `setup/` scripts, so a retake or the next launch can reset them.
- Atlantis is sometimes reset, and test data from earlier recordings may be gone or in the way. Check each family before recording.
- **(you)** Sign in for the recorder with `node record.mjs login`. Agents never type passwords.

## 3. Record the videos

Follow [tools/launch-videos/README.md](../tools/launch-videos/README.md).

- Create `launches/<launch>/` with `launch.json`, listing the PostHog flags the feature needs. The recorder turns them on in its own browser only.
- Write each video's steps and narration, and get them working with `--dry` before a real take.
- Narrate with Kokoro `af_heart`, so every launch sounds the same.
- Build the MP4 and check a contact sheet of the whole video. Look for highlights on the wrong element, loading spinners, stale side panels, and colors.
- Things that went wrong last time:
  - A quick filter remembered in localStorage hid a newly uploaded file. Clear remembered filters in `ready()`.
  - Seed documents in Atlantis have no stored file, so their preview fails. Upload a new file in the video instead.
  - Some actions need a second confirmation dialog, such as **Mark requirement incomplete?**.
  - A side panel can still show the old state after a save. Close it before showing the result.
- **(you)** Watch every video before uploading.

## 4. Featured image

- Use a real screenshot of the feature in Atlantis, framed by `thumbnail.html`. A drawn mock-up looked less convincing.
- Render it at 1600 × 800 (see the tooling README) and use it as the post's featured image.

## 5. YouTube

- **(you)** Upload the MP4s to the CareTogether channel. Leave them as drafts.
- Titles start with "CareTogether:" and stay under 70 characters, so search results don't cut them off.
- Descriptions start with the task in one sentence, because YouTube shows only the first two lines, then a short "In this video" list.
- Keep the titles and descriptions in `launches/<launch>/youtube.md`. An agent can set them in YouTube Studio in your signed-in browser.
- **(you)** Before the post goes out, set every video to Unlisted or Public. An embedded draft video doesn't play.

## 6. The Update post

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

## 7. Publish

- Check the subscriber list in the dashboard: **Updates** → **Manage subscribers**. The API's `subscribedToChangelog` field on contacts is not reliable; the dashboard list is the truth. It had 50 addresses in November 2026, including internal and test addresses.
- Make sure every video is Unlisted or Public, and the title has no draft marker.
- **(you)** Publish, and decide whether to email subscribers. Featurebase's publish call sends no email unless you ask for it, but the editor's own option may be on. Agents never publish or send email without your explicit OK.
- After publishing, open the live post and play each video.

## 8. Keep the launch

Commit `launches/<launch>/`: steps, narration, setup scripts, assets, thumbnail source and `youtube.md`. The MP4s live on YouTube and the post on Featurebase, so they don't go in git. Add anything new you learned to this page.
