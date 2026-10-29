# Hero film: the source clip

Keep the source clip of the hero film in this folder (it is not uploaded to GitHub). To rebuild every hero asset from it (graded frames, poster, depth maps, loops, reel), run from the project root:

```bash
scripts/prepare-film.sh videos/film/<clip>.mp4 <start-seconds> <duration-seconds>
# e.g. scripts/prepare-film.sh videos/film/gemini_generated_video_3db71569.mp4 4 6
```

The grade itself lives in `hero-film/` (a Remotion project). The output goes to `public/hero/`.
