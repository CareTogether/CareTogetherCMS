# Launch videos

Records short narrated videos of CareTogether features against the Atlantis test organization on app.caretogether.io. A scripted browser clicks through the app with a visible cursor and highlight ring. A local text-to-speech model reads the narration, and ffmpeg joins the two into an MP4.

This folder is part of the feature launch process in [docs/feature-launch.md](../../docs/feature-launch.md). `launches/family-screen-v2/` is a complete example.

## Setup (once per machine)

You need Node with the PWA's dependencies installed (`npm ci` in `src/caretogether-pwa`), Chromium, ffmpeg, and [uv](https://docs.astral.sh/uv/).

```bash
cd tools/launch-videos
uv venv --python 3.11 .venv
uv pip install --python .venv/bin/python -r requirements.txt
mkdir -p models
curl -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o models/voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
node record.mjs login
```

`login` opens a browser window. Sign in to an account that can see Atlantis yourself; the session is saved in `.profile/`. Run it again when recordings start failing at the sign-in page.

Chromium is expected at `/usr/bin/chromium`. Set `CHROMIUM_PATH` to use another one.

`.venv/`, `models/`, `.profile/`, `work/` and MP4 files are ignored by git.

## A launch's files

```
launches/<launch>/
  launch.json          name, and the PostHog flags to force on while recording
  videos/<video>.mjs   steps: what the browser does
  videos/<video>.json  narration: voice, speed, and one text per step id
  assets/              files a video uploads
  setup/               scripts that put Atlantis data into the state a video needs
  thumbnail.html       the post's featured image, 1600 × 800
  youtube.md           titles and descriptions for the uploads
```

The step ids in the `.mjs` and the `.json` must match, in the same order. Each step starts its narration clip and its actions together, then waits until the clip ends plus a short pause.

A video module exports:

- `output`: the MP4 file name, written to `work/<launch>/`.
- `startUrl`: the path after the Atlantis organization URL.
- `ready(page)`: waits for, or prepares, the starting state.
- `steps({ page, dryRun, h, baseUrl })`: returns one async function per step id. `h` has `click`, `moveTo`, `highlight`, `highlightArea`, `typeSlowly`, `sleep` and `resetOverlay`.

Copy a video from `launches/family-screen-v2/videos/` as a starting point.

## Making a video

```bash
node record.mjs probe <launch> /families/<id> [script.mjs]   # find locators: saves work/probe.png, prints the accessibility tree
node record.mjs record <launch>/<video> --dry                # check the steps without saving anything in Atlantis
.venv/bin/python tts.py <launch>/<video>                     # narration clips and their lengths
node record.mjs record <launch>/<video>                      # the real take, timed to the clips
.venv/bin/python build.py <launch>/<video>                   # work/<launch>/<output>.mp4
```

Run `tts.py` before the real take, so each step waits for its clip's real length. If a step fails, the recorder saves `work/<launch>/<video>/error.png` and prints the page's accessibility tree.

A real take changes Atlantis data (it saves notes, completes requirements, uploads files). Use `--dry` while you work on the steps, and run the launch's `setup/` scripts with `probe` to reset the data before a retake.

## Checking a video

Before uploading, look at frames from the whole video, not only the first seconds:

```bash
ffmpeg -i work/<launch>/<output>.mp4 -vf "fps=1/4,scale=480:-1,tile=4x4" -frames:v 1 work/<launch>/contact-sheet.png
```

Check that each highlight lands on what the narration names, that no loading spinner or error shows, and that the app's teal looks teal. `build.py` converts the colors so players don't show it as cyan.

## Thumbnail

Put a real screenshot from Atlantis next to `thumbnail.html`, as in the example, then render it:

```bash
chromium --headless --hide-scrollbars --window-size=1600,800 --screenshot=work/<launch>/thumbnail.png launches/<launch>/thumbnail.html
```

## Voices

Kokoro's `af_heart` is the voice we chose for Family Screen V2. We also tried other Kokoro voices, Chatterbox and Qwen3-TTS, and kept `af_heart` for its clear, natural delivery that runs fast on a laptop. Keep it for new launches so the videos sound alike.
