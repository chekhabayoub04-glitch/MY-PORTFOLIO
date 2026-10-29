import { CalculateMetadataFunction, Composition } from "remotion";
import { HeroFilm } from "./HeroFilm";

// Durations come from props so scripts/prepare-film.sh can swap the clip
// and the range in one command (--props='{"start":4,"duration":6}').
export type FilmProps = {
  readonly start: number;
  readonly duration: number;
};

const calculateMetadata: CalculateMetadataFunction<FilmProps> = ({
  props,
}) => ({
  durationInFrames: Math.round(props.duration * 24),
});

export const MyComposition = () => {
  return (
    <>
      {/* The scroll-scrubbed walk: frames, mobile loop */}
      <Composition
        id="HeroWalk"
        component={HeroFilm}
        durationInFrames={144}
        fps={24}
        width={720}
        height={1280}
        defaultProps={{ start: 4, duration: 6 }}
        calculateMetadata={calculateMetadata}
      />
      {/* The whole clip, graded the same way, for the ambient background */}
      <Composition
        id="Ambient"
        component={HeroFilm}
        durationInFrames={240}
        fps={24}
        width={720}
        height={1280}
        defaultProps={{ start: 0, duration: 10 }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
