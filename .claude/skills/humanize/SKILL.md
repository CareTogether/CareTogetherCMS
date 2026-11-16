---
name: humanize
description: Rewrite an article, changelog, announcement, help page or other draft so it reads like plain text written by a person, not an AI, while keeping every fact. Use whenever the user says humanize, humanizer, "make this less AI", "sounds like ChatGPT", "strip the marketing tone", "rewrite this plainly", or mentions Clever Humanizer, even if they only paste a draft and complain about how it sounds. Works in any language. Do not use for proofreading only, translation, or writing new content from scratch.
---

# Humanize

Rewrite the text so a busy reader gets the same information from something that sounds like a person's notes. The idea stays the same. The voice changes.

The target is a plain, useful text. Detector scores are not the target, so do not add errors or randomness to chase one.

The biggest risk is fact drift. A confident plain rewrite can change a product term or swap a detail and nobody notices, so the fact list in step 1 matters more than any style rule. See `references/examples.md` for before/after pairs and for real drift mistakes to avoid.

## Inputs

- The text. If it is in a file, read it.
- Mode: `clear` (default) or `normal`.
  - `clear`: for announcements, changelogs and help pages. Short headings, fragments and steps.
  - `normal`: for blog posts and emails. Keeps paragraphs and full sentences, and uses the same word and rhythm rules.
- A sample of the author's own writing, if there is one. Follow its habits over the rules below when they conflict.

Keep the source's language, its spelling variant (US or UK) and its links. Keep video, image and embed placeholders in place.

## Steps

### 1. List the facts

Before rewriting, list what must survive:

- Names, numbers, dates, limits and links.
- Exact UI labels and product terms, spelled as in the source. Treat terms that sound alike as different things: remove is not delete, closed is not completed, expired is not expiring, find is not search, link is not add.
- Conditions and who something applies to. "A for clients or B for volunteers" must keep both pairings.
- Order of steps.
- Reasons that tell the reader what they get ("so you keep your place"). These are facts about the product, not decoration. Keep them in fewer words unless they are pure selling.

### 2. Rebuild the structure

- Turn a bold lead-in into its own short heading. Use the plain noun: "Side panels", not "Side panels instead of new pages".
- Remove headings and sentences that only sell.
- Break a long sentence into one fact per line or sentence.
- Turn a sequence of instructions into one imperative per sentence.

### 3. Plain the voice

- Cut selling clauses, comparisons with the past and contrast framing ("X instead of Y", "not just X but Y").
- Use the common word: use, show, open, select, change.
- Write what things do, literally. "The header displays the family's name" beats "A header that does the common work".
- In `clear` mode, fragments are fine. "Each video is 1 minute or less." "Newest on top."
- Describe symbols in words when that helps: "the 3 dots button".
- Drop em dashes, semicolons, and colons that set up a reveal. Use a full stop or a comma.
- Avoid AI habits: rule-of-three flourishes, "seamless", "streamline", "powerful", "effortless", "whether you're", "it's worth noting", and closing summaries.
- Vary sentence length because the content calls for it. A short fragment after a long list is fine. Do not make every line the same shape.

### 4. Check against the list

Go through the step 1 list one item at a time and compare it with the rewrite. Fix anything that changed, moved to the wrong group or disappeared. Then read the rewrite once as the audience would and fix anything clumsy enough to confuse them.

## Output

Give the rewritten text first, ready to copy, with no preamble. Save it to a file if the input was a file and the user wants that.

After it, add a short "Check" section with only:

- Any fact you removed on purpose, and why.
- Anything in the source that looked wrong or ambiguous. Flag it, do not silently fix it.

If there is nothing to report, write "Check: all facts kept."
