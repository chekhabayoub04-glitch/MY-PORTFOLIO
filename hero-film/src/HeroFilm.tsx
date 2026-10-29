import { colorCorrection } from "@remotion/effects/color-correction";
import { curves } from "@remotion/effects/curves";
import { noise } from "@remotion/effects/noise";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { FilmProps } from "./Composition";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Grade: deeper blacks, warm gold highlights (#FFD23F / #F2A33A), skin kept
// natural by doing the warming in the top of the curves, not with saturation.
const Graded = ({ start }: { start: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Video
      src={staticFile("source.mp4")}
      trimBefore={start * fps}
      muted
      effects={[
        colorCorrection({
          contrast: 1.12,
          pivot: 0.42,
          blacks: -0.35,
          shadows: -0.18,
          highlights: 0.06,
          temperature: 0.08,
          saturation: 0.94,
        }),
        curves({
          channel: "red",
          points: [[0, 0], [0.5, 0.5], [0.85, 0.89], [1, 1]],
        }),
        curves({
          channel: "green",
          points: [[0, 0], [0.5, 0.5], [0.85, 0.85], [1, 0.97]],
        }),
        curves({
          channel: "blue",
          points: [[0, 0.01], [0.5, 0.47], [0.85, 0.74], [1, 0.84]],
        }),
        noise({ amount: 0.055, seed: frame }),
      ]}
    />
  );
};

// A soft volumetric cone from above that opens as he walks forward.
const LightCone = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const open = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.2, 1),
  });
  const half = 12 + open * 12; // cone half-angle in degrees
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        opacity: 0.16 + open * 0.14,
        background: `conic-gradient(from ${180 - half}deg at 50% -30%, rgba(242,163,58,0) 0deg, rgba(255,210,63,.4) ${half * 0.55}deg, rgba(255,226,140,.6) ${half}deg, rgba(255,210,63,.4) ${half * 1.45}deg, rgba(242,163,58,0) ${half * 2}deg)`,
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,.7) 0%, #000 18%, rgba(0,0,0,.4) 45%, transparent 75%)",
        filter: "blur(28px)",
      }}
    />
  );
};

// Haze drifting slowly through the cone.
const Haze = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const puffs = [
    { x: 38, y: 22, r: 260, sx: 6, sy: 2, a: 0.16 },
    { x: 62, y: 34, r: 320, sx: -5, sy: 1.5, a: 0.12 },
    { x: 48, y: 52, r: 380, sx: 3, sy: -1, a: 0.08 },
  ];
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {puffs.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x + p.sx * Math.sin(t * 0.35 + i)}%`,
            top: `${p.y + p.sy * Math.cos(t * 0.3 + i * 2)}%`,
            width: p.r * 2,
            height: p.r * 1.3,
            translate: "-50% -50%",
            borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(255,214,120,${p.a}), transparent)`,
            filter: "blur(30px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Vignette = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 85% at 50% 42%, transparent 52%, rgba(0,0,0,.55) 82%, rgba(0,0,0,.85) 100%)",
    }}
  />
);

export const HeroFilm = ({ start }: FilmProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Graded start={start} />
      <LightCone />
      <Haze />
      <Vignette />
    </AbsoluteFill>
  );
};
