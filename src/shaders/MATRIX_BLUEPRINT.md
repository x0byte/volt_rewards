# Matrix-Watercolor Reveal Shader — Architectural Blueprint

> **Lead Architect:** GLSL / WebGL Shader Designer  
> **Target:** React Three Fiber custom `shaderMaterial` on a 3D credit card mesh  
> **Constraint:** Fully procedural — no external textures or font bitmaps

---

## 1. Required Uniforms

| Uniform | Type | Purpose |
|---|---|---|
| `uTime` | `float` | Elapsed time (seconds) for animation |
| `uMouse` | `vec2` | Mouse/finger position in UV space `[0, 1]` |
| `uRadius` | `float` | Base radius of the reveal area (e.g., `0.3`) |
| `uNoiseScale` | `float` | Controls how much noise distorts the mask edge (`0.05`–`0.25`) |
| `uRainSpeed` | `float` | Vertical scroll speed of digital rain |
| `uGridDensity` | `float` | Columns × rows of code characters (e.g., `30`) |
| `uGlowIntensity` | `float` | Brightness multiplier for the Matrix green glow |
| `uBaseTexture` | `sampler2D` | Base card texture/color (optional, can be solid) |

**Derived outputs:**
- `gl_FragColor` — blended final pixel

---

## 2. Noise Function Choice: 2D Simplex Noise

### Why Simplex over Perlin

- **Performance:** Simplex has O(n²) vs Perlin's O(2ⁿ) partial derivative cost.
- **Directional artifacts:** Perlin exhibits square-grid bias. Simplex's triangular lattice avoids axis-aligned artifacts that would look "mechanical" rather than organic watercolor.
- **Scalability:** The 2D version generalises cleanly to multi-octave FBM if needed.

### Core Noise Implementation (Pseudo-GLSL)

```glsl
// Simplex-like 2D noise using a permutation polynomial
// (Ashima Arts / Stefan Gustavson derivative)
vec2 permute(vec2 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float snoise(vec2 v) {
    // Skew the input space to triangular coordinates
    const vec2 C = vec2(0.211324865405187, 0.366025403784439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Calculate which simplex corner we're in
    vec2 i1 = step(x0.yx, x0.xy);
    vec3 x = vec3(x0.x, x0.y, dot(x0, vec2(0.5)));
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));

    // Gradients and distance falloff
    vec3 m = max(0.5 - vec3(dot(x0, x0),
                            dot(vec2(x0.x - i1.x + C.x, x0.y - i1.y + C.y),
                                vec2(x0.x - i1.x + C.x, x0.y - i1.y + C.y)),
                            dot(vec2(x0.x - 1.0 + 2.0*C.x, x0.y - 1.0 + 2.0*C.y),
                                vec2(x0.x - 1.0 + 2.0*C.x, x0.y - 1.0 + 2.0*C.y))), 0.0);
    m = m * m * m * m; //  m^4 for smooth falloff

    vec3 h = 2.0 * fract(p * 0.0243902439) - 1.0;
    vec3 g = normalize(vec3(h.xy, h.z * 0.5 + 0.5));
    return 42.0 * dot(m, g);
}
```

### How Noise Distorts the UV / Distance Field

The key insight: instead of computing a clean Euclidean distance from the fragment to `uMouse`, we **offset the UV coordinates** before the distance calculation, using layered noise:

```glsl
float watercolorDistance(vec2 uv, vec2 mouse, float time) {
    // Layer 1: large-scale drift (slow, meandering)
    vec2 n1 = vec2(
        snoise(uv * 2.0 + time * 0.15),
        snoise(uv * 2.0 + time * 0.15 + 100.0)
    );

    // Layer 2: fine-grain turbulence (small, fast)
    vec2 n2 = vec2(
        snoise(uv * 8.0 + time * 0.4),
        snoise(uv * 8.0 + time * 0.4 + 200.0)
    );

    // Composite displacement
    vec2 displacement = n1 * 0.08 + n2 * 0.04;
    vec2 warpedUV = uv + displacement * uNoiseScale;

    // Distance to mouse in warped space
    float d = length(warpedUV - mouse);
    return d;
}
```

**Why this works for watercolor:**  
- The displacement field is *divergent* (not curl-free), so nearby pixels get pushed by different amounts, creating irregular, jagged boundaries.
- Two noise octaves produce both large "blooms" and small "fingers" of ink bleeding outward.
- Because noise is C¹ continuous, the distance field transitions smoothly — no hard edges.

---

## 3. Procedural Matrix Digital Rain Algorithm

### Strategy

No external glyph atlas. Instead, each cell of a grid is assigned a "character" via a random function, and each character is rendered as a binary pattern of sub-cells. The result looks like katakana/kanji "code" at a distance.

### Step 1: Character Selection via Pseudo-Random Hash

```glsl
// Pure GLSL hash — outputs a pseudo-random float given integer coords
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// Select a glyph pattern based on cell seed
// Returns a 4-bit pattern encoded as a float
float glyphPattern(vec2 cell, float seed) {
    float r = rand(cell + seed);
    // Map [0,1] into one of 16 glyph masks
    // Each glyph is a 4x4 binary pattern stored as a 16-bit integer
    // Bit i = int(r * 16) == i ? intrinsic random pattern : 0
    float pattern = 0.0;
    float choice = floor(r * 16.0);

    // Each case encodes a 4x4 glyph
    // (In actual GLSL use a ternary chain or array lookup)
    if (choice < 1.0) pattern = 0xF00F;  // Just illustration
    else if (choice < 2.0) pattern = 0x8421;
    // ... 14 more patterns ...

    return pattern;
}
```

*Implementation note:* For production, inline a switch chain or use a 16-element constant array. Each 16-bit pattern encodes a 4×4 raster of on/off sub-cells.

### Step 2: Grid Layout with Sine-Wave Column Modulation

```glsl
float matrixChar(vec2 uv, float tileCount, float time) {
    // Tile the UV into cells
    vec2 cellUV = uv * tileCount;
    vec2 cell = floor(cellUV);
    vec2 sub = fract(cellUV);  // Position within cell [0,1]

    // Each column scrolls at a slightly different speed (the "rain" effect)
    float scroll = time * (0.8 + 0.4 * sin(cell.x * 1.7 + 3.0));
    float rowOffset = fract(scroll);
    cell.y = floor(cellUV.y + scroll);  // accumulate offset

    // Random drop at column level — some columns brighter than others
    float columnIntensity = 0.5 + 0.5 * sin(cell.x * 4.1 + time * 0.6);
    // Leading character (bottom of column) is brightest
    float leader = 1.0 - fract(scroll);
    leader = smoothstep(0.0, 0.3, leader);

    // Character pattern
    float glyph = glyphPattern(cell, 0.0);

    // Decode glyph: test if this sub-cell is lit
    int bitIndex = int(sub.x * 4.0) + int(sub.y * 4.0) * 4;
    float isLit = mod(floor(glyph / exp2(float(bitIndex))), 2.0);

    // Brightness falloff from column leader
    float brightness = isLit * (0.3 + 0.7 * leader) * columnIntensity;

    return brightness;
}
```

### Step 3: Cosmic/Sine Wave Modulation

To avoid static repetition, layers of sine waves modulate column speed and intensity:

```glsl
vec3 computeMatrixLayer(vec2 uv, float tileCount, float time) {
    float intensity = matrixChar(uv, tileCount, time);

    // "Cosmic" modulation: large-scale wave that sweeps across the card
    float wave = 0.5 + 0.5 * sin(uv.x * 8.0 + uv.y * 6.0 + time * 0.7);
    // Secondary wave at harmonic frequency
    float wave2 = 0.5 + 0.5 * sin(uv.x * 15.0 - uv.y * 10.0 + time * 1.3);

    // Combine: characters near wave peaks are brighter
    intensity *= (0.7 + 0.3 * wave) * (0.7 + 0.3 * wave2);

    // Classic Matrix green
    vec3 color = vec3(0.05, 0.95, 0.15);  // R, G, B

    // Add subtle white core for glow
    vec3 withGlow = mix(color, vec3(0.8, 1.0, 0.8), intensity * 0.5);

    return withGlow * intensity;
}
```

**Layering trick for density:** Call `computeMatrixLayer` twice with different `tileCount` and `time` offsets, then sum:

```glsl
vec3 rain = computeMatrixLayer(uv, 30.0, time * 0.6)  // main layer
          + computeMatrixLayer(uv, 15.0, time * 0.9);  // sparse layer
```

This gives the visual density of real Matrix code without a texture.

---

## 4. Mixing Equation: The Watercolor Blend

### The Mask

```glsl
float baseDist = watercolorDistance(vUv, uMouse, uTime);
float mask = 1.0 - smoothstep(uRadius * 0.3, uRadius * 1.6, baseDist);
```

- `uRadius * 0.3` = inner radius (fully revealed)
- `uRadius * 1.6` = outer radius (fully hidden)
- The asymmetry (0.3 vs 1.6) creates a gradual falloff on the outer edge — the "ink bleeding" zone.

### Edge Enhancement — The "Watercolor Line"

Real watercolor has a dark edge where pigment accumulates. Simulate this:

```glsl
float edgeLine = 0.0;
{
    float edgeMask = smoothstep(uRadius * 1.2, uRadius * 0.8, baseDist);
    edgeLine = edgeMask * (1.0 - smoothstep(uRadius * 1.7, uRadius * 1.0, baseDist));
    edgeLine *= 0.3 + 0.7 * (0.5 + 0.5 * snoise(vUv * 20.0 + uTime * 0.5));
}
```

### Final Blending Equation

```glsl
vec3 baseColor = texture2D(uBaseTexture, vUv).rgb;

// Optional: darken base color in the reveal zone for contrast
vec3 adjustedBase = mix(baseColor, baseColor * 0.3, mask);

// Matrix rain color
vec3 rainColor = computeMatrixLayer(vUv, 30.0, uTime * 0.6);
rainColor += computeMatrixLayer(vUv, 15.0, uTime * 0.9);

// Add glow halo around the edge of the mask
vec3 glow = vec3(0.1, 0.8, 0.2) * uGlowIntensity * pow(edgeLine, 0.5);

// Composite
vec3 finalColor = mix(adjustedBase, rainColor + glow, mask);

// Final edge darkening for watercolor feel
finalColor += vec3(0.0, 0.15, 0.05) * edgeLine;

gl_FragColor = vec4(finalColor, 1.0);
```

### Visual Effect Breakdown

| Distance `d` | Mask Value | Visual Result |
|---|---|---|
| `d < 0.3·R` | `1.0` | Full Matrix code, dark base |
| `0.3·R < d < 0.8·R` | `0.99→0.65` | Code visible, faint base peeking |
| `0.8·R < d < 1.6·R` | `0.65→0.0` | **Ink bleed zone** — noisy edge, glow ring |
| `d > 1.6·R` | `0.0` | Clean base card |

---

## 5. Performance Budget

| Operation | Cost | Notes |
|---|---|---|
| `snoise` × 4 calls | Medium | Each call: ~30 ALU ops |
| Matrix char × 2 layers | Medium | ~50 ALU ops + trig |
| 4×4 glyph decoding | Low | Bit ops × 16 |
| Mixing/compositing | Low | 10–15 ALU ops |
| **Total estimate** | **~200–250 ALU ops / pixel** | Comfortable on modern GPUs at 60 fps |

**Optimisation if needed:**  
- Reduce to single noise call with FBM-baked displacement.  
- Use `lowp` precision for mask calculations.  
- Cache the noise displacement across both matrix layers.

---

## 6. Integration Points with React Three Fiber

```
<shaderMaterial
  uniforms={{
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uRadius: { value: 0.35 },
    uNoiseScale: { value: 0.15 },
    uRainSpeed: { value: 0.6 },
    uGridDensity: { value: 30.0 },
    uGlowIntensity: { value: 0.5 },
    uBaseTexture: { value: cardTexture },
  }}
  vertexShader={vertexShader}
  fragmentShader={fragmentShader}
  transparent={false}
/>
```

**Mouse tracking on the mesh:**  
Use `raycaster.intersect` → convert hit point to UV on the card mesh → pass as `uMouse`. For smooth interpolation, lerp the uniform in `useFrame` with a damping factor.

---

## 7. Summary of Math Concepts Used

| Concept | Application |
|---|---|
| **Simplex noise** | UV displacement for organic mask edges |
| **Pseudo-random hash** | Procedural glyph generation |
| **Sine wave modulation** | Column speed variation, intensity waves |
| **Exponential smoothing** | `smoothstep`/`pow` for ink-bleed falloff curves |
| **Bilinear interleaving** | Multilayer rain for density (2 layers) |
| **Divergent vector field** | Noise displacement creates non-uniform expansion |
| **S-curve remapping** | `smoothstep(inner, outer, d)` for mask gradation |

---

*End of Blueprint.* This document contains all mathematical and architectural decisions needed to implement the shader. No external textures or font bitmaps are required — every visual element is generated procedurally in the fragment shader.