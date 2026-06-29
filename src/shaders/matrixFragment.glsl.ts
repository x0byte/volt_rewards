export const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uNoiseScale;
uniform float uRainSpeed;
uniform float uGlowIntensity;
uniform float uOpacity;

varying vec2 vUv;

// ─── Pseudo-random hash ─────────────────────────────────────
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float hash11(float p) {
  p = fract(p * 234.34);
  p += dot(vec2(p, p), vec2(19.19, 43.23));
  return fract(p);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

float watercolorDistance(vec2 uv, vec2 mouse, float time) {
  vec2 n1 = vec2(
    fbm(uv * 3.0 + time * 0.12),
    fbm(uv * 3.0 + time * 0.12 + 50.0)
  );
  vec2 n2 = vec2(
    fbm(uv * 8.0 + time * 0.35),
    fbm(uv * 8.0 + time * 0.35 + 100.0)
  );
  vec2 displacement = n1 * 0.10 + n2 * 0.05;
  vec2 warpedUV = uv + displacement * uNoiseScale;
  return length(warpedUV - mouse);
}

// ─── SDF-based procedural glyph ─────────────────────────
// Generates readable ASCII glyphs using signed distance fields
float glyphSDF(vec2 uv, float seed) {
  float t = seed;
  float charIndex = floor(hash11(t) * 52.0);

  // Normalize UV to [-1, 1] cell space
  uv = uv * 2.0 - 1.0;

  // Simple geometric glyph shapes using SDF
  float d = 1.0;
  float w = 1.0; // glyph width
  float h = 1.5; // glyph height

  // Character 0-9: digits (simplified vertical strokes)
  if (charIndex < 10.0) {
    float n = charIndex;
    float barW = 0.4;
    float barH = 0.3;

    // Top horizontal bar (all digits except 1)
    if (n != 1.0) {
      d = min(d, max(abs(uv.y - (0.7)), barH - barW));
    }
    // Bottom horizontal bar (all digits except 1, 4)
    if (n != 1.0 && n != 4.0) {
      d = min(d, max(abs(uv.y - (-0.7)), barH - barW));
    }
    // Middle bar (2,3,5,6,8,9,0)
    if (n == 2.0 || n == 3.0 || n == 5.0 || n == 6.0 || n == 8.0 || n == 9.0 || n == 0.0) {
      d = min(d, max(abs(uv.y - 0.0), barH - barW));
    }
    // Left vertical (0,4,5,6,8,9)
    if (n == 0.0 || n == 4.0 || n == 5.0 || n == 6.0 || n == 8.0 || n == 9.0) {
      d = min(d, max(abs(uv.x - (-0.5)), barW));
    }
    // Right vertical (0,1,2,3,6,8,9)
    if (n == 0.0 || n == 1.0 || n == 2.0 || n == 3.0 || n == 6.0 || n == 8.0 || n == 9.0) {
      d = min(d, max(abs(uv.x - 0.5), barW));
    }
  } else {
    // Letters A-Z: simpler random strokes
    float seg = (charIndex - 10.0);
    float a = fract(seg * 3.14159);
    float angle = a * 6.283;

    // Create diagonal lines at various angles
    vec2 dir = vec2(cos(angle), sin(angle));
    float proj = dot(uv, dir);
    d = min(d, max(abs(proj), 0.2 - abs(dot(uv, vec2(-dir.y, dir.x)))));

    // Second stroke
    float b = fract(seg * 7.389);
    angle = b * 6.283;
    dir = vec2(cos(angle), sin(angle));
    proj = dot(uv, dir);
    d = min(d, max(abs(proj), 0.2 - abs(dot(uv, vec2(-dir.y, dir.x)))));
  }

  // Edge thickness
  d = 1.0 - smoothstep(0.0, 0.15, abs(d - 0.7));

  return d;
}

// ─── Single column of falling Matrix rain ──────────────
float rainColumn(vec2 uv, float charSpacing, float time, float seed) {
  float col = floor(uv.x * charSpacing);
  float cell = floor(uv.y * charSpacing);

  // Each column has its own speed offset
  float speed = 0.5 + 0.5 * hash11(seed + col * 1.7);
  float scroll = time * speed;

  // The "head" of each column — the leading bright character
  float headOffset = hash11(seed + col * 3.1 + 7.0);
  float headY = (headOffset - scroll) * charSpacing;

  // Position within the streak
  float streakUV = uv.y * charSpacing + scroll;
  float relY = fract(streakUV);

  // Distance from this pixel to the head
  float distToHead = relY;

  // Only render characters near the head (trail length decreases)
  float trailLen = 0.15 + 0.15 * hash11(seed + col * 5.3);
  float trail = 1.0 - smoothstep(0.0, trailLen, distToHead);

  // Character selection per column head (changes when head resets)
  float charSeed = seed + col * 11.0 + floor(streakUV);
  float charIndex = hash11(charSeed);

  // Character position within the cell
  vec2 charUV = fract(uv.yx * charSpacing + vec2(0.0, scroll));

  // Only render if within the visible trail
  float glyph = glyphSDF(charUV, charSeed);

  // Brightness fades from head to tail
  float brightness = trail * trail * (0.8 + 0.2 * hash11(charSeed + 3.0));

  // Some columns are darker overall
  float colBrightness = 0.6 + 0.4 * hash11(seed + col * 7.1);

  // Character only visible within its cell (the rest of the trail is empty space)
  float result = glyph * brightness * colBrightness;

  return result;
}

float matrixRain(vec2 uv, float density, float time, float seed) {
  float total = 0.0;

  // Layer 1: Large, bright, fast
  float l1 = rainColumn(uv, density * 0.7, time * 1.0, seed);
  total += l1 * 0.45;

  // Layer 2: Smaller, dimmer, slower
  float offset = 0.3 + 0.5 * hash11(seed + 100.0);
  vec2 uv2 = uv * 1.3 + offset;
  float l2 = rainColumn(uv2, density * 0.9, time * 0.7, seed + 50.0);
  total += l2 * 0.3;

  // Layer 3: Background layer, faint
  vec2 uv3 = uv * 1.7 + 0.7;
  float l3 = rainColumn(uv3, density * 1.1, time * 0.4, seed + 100.0);
  total += l3 * 0.15;

  return total;
}

void main() {
  vec2 uv = vUv;

  vec3 baseColor = vec3(0.16, 0.15, 0.18);

  // ── Matrix rain ──
  float rain = matrixRain(uv, 40.0, uTime * 1.5, 42.0);

  // ── Color palette (Matrix green) ──
  vec3 hotColor = vec3(0.9, 1.0, 0.8);   // white-green at head
  vec3 coreColor = vec3(0.2, 1.0, 0.3);   // classic green
  vec3 glowColor = vec3(0.0, 0.6, 0.15);  // dark ambient glow

  vec3 rainColor = mix(glowColor, coreColor, rain);
  rainColor = mix(rainColor, hotColor, rain * rain * rain);

  // ── Additive glow around characters ──
  float glow = rain * 0.4;
  rainColor += vec3(0.0, glow * 0.5, glow * 0.1);

  // ── Watercolor distance mask ──
  bool mouseActive = uMouse.x > -0.5 && uMouse.y > -0.5;
  float dist = watercolorDistance(uv, uMouse, uTime);
  float hoverMask = 1.0 - smoothstep(uRadius * 0.5, uRadius * 2.0, dist);

  float mask = hoverMask;
  if (!mouseActive) {
    mask = 0.0;
  }

  // ── Darken base where code is revealed ──
  vec3 adjustedBase = mix(baseColor, baseColor * 0.05, mask);

  // ── Composite with screen blending ──
  vec3 finalColor = mix(adjustedBase, rainColor, mask * rain);

  // ── Organic edge bleed ──
  float bleed = hoverMask * (1.0 - smoothstep(uRadius * 0.6, uRadius * 1.5, dist));
  finalColor += vec3(0.0, 0.2, 0.05) * bleed * 0.3;

  gl_FragColor = vec4(finalColor, 1.0);
}
`