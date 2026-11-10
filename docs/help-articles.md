# Writing help articles

How we write help articles for the CareTogether help center on Featurebase (caretogether.featurebase.app/en/help). An article teaches one task or one area of the app, and stays useful after the launch that introduced it.

An agent can run most of this with the `help-article` skill in `.claude/skills/`. It stops for a person at every step marked **(you)**.

## 1. Plan

- Pick one subject, worded as what the reader wants to do: "Complete or exempt a requirement", not "Requirements".
- Check the help center first. If an article on the subject exists, update it instead of writing a second one.
- Read how the feature works in the code and in production, including who can see it (roles, permissions, flags) and what differs between volunteer and client families.
- List the steps, and which ones need a picture. Not every step does: a screenshot earns its place when the reader has to find something on screen.

## 2. Screenshots and videos

Follow [tools/product-videos/README.md](../tools/product-videos/README.md).

- Use a topic folder named after the subject. If a launch topic already covers it, add a script there instead.
- Write the steps as a script and call `h.screenshot(name, locators)` where a picture is needed, with the ring on what the reader should click or read.
- Run `node record.mjs stills <topic>/<script> --dry`. Drop `--dry` only when a screenshot must show the result of a save.
- Open every image. It must show only Atlantis test data, and nothing important cut off.
- An article can embed a launch video when one already shows the task. Record a new video only for a task that is hard to follow from screenshots.

## 3. Write the article

- Write in English, in plain words. Use the exact UI labels, in bold.
- Start with one or two sentences on what the reader can do and who can do it.
- Use numbered steps, one action per step, with the screenshot right after the step it shows.
- Say who each part applies to, for example volunteer families or client families, or a role that needs a permission.
- End with related articles, if there are any, instead of explaining them again.
- Give the article a short description; Featurebase shows it in search results and lists.
- The `humanize` skill in `.claude/skills/` rewrites a draft in a plainer voice.

## 4. Put it in Featurebase

- Upload each image with the Featurebase connector's upload tool, which returns the image markup to put in the article body. Upload them one at a time.
- To embed a video, use Featurebase's YouTube markup:

  ```html
  <div class="iframe-wrapper" data-add-empty-paragraph-after=""><iframe src="https://www.youtube.com/embed/<VIDEO_ID>" data-youtube-video=""></iframe></div>
  ```

- Create the article as a draft. When editing an article you read from the API, send it back with the `raw` formatter, so its formatting is kept.
- **(you)** Read the draft in the Featurebase editor and publish it. Agents never publish without your explicit OK.
- After publishing, open the live article and check each image and video.

In November 2026 the help center had no collections and only a few articles. If you add the first collection, tell the team, so later articles go into the same structure.

## 5. Keep it current

- Commit the topic folder with the script, so the screenshots can be taken again when the screen changes.
- When a feature changes, search the help center for articles that show it, then retake their screenshots and update their steps.
- Update posts link to help articles. Before an Update is published, make sure the articles it links to are published too.
