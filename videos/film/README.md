# Hero film: drop your video here

Put **one** edited clip in this folder (`.mp4`, `.mov`, `.m4v` or `.webm`), then run from the project root:

```bash
.venv-tools/bin/python tools/build_film.py
```

The script turns the clip into scroll frames in `images/film/`. The home page plays them as you scroll: scrolling down moves the film forward, scrolling up rewinds it.

## How to shoot it
- **Story:** you walk towards the camera in a formal suit and stop. The **last shot is your smile**: the film ends there.
- **Length:** 6–12 seconds. The shot must be steady (tripod or gimbal), with no cuts in the middle.
- **Frame:** horizontal 16:9, 1080p or 4K. Keep yourself **in the centre**: phones crop the sides.
- **Background:** dark and plain (black, charcoal, deep gold light). Leave space on both sides of your body.
- **No text, logos or music in the video.** The site adds the gold PORTFOLIO title, the flying tool logos and the websites on top, in sync with the scroll.

If you are not in the centre of the shot, add `--focus 0.4` (more to the left) or `--focus 0.6` (more to the right).

The source clip itself is not uploaded to GitHub, only the frames.
