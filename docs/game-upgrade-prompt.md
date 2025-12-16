# Professional Multiplayer Platformer - Complete Enhancement Prompt

## 📋 Project Overview

**Current State:** A TypeScript + Vite + Canvas 2D side-scrolling platformer with two levels, featuring a "princess plumber" character, multiple enemy types, hazards, coins, and polished movement mechanics.

**Target State:** A professional-quality local multiplayer platformer suitable for children, with enhanced visuals, expanded content, and polished UI/UX.

---

## 🎮 Current Game Architecture Reference

### Level Data Structure (levels.ts)
```typescript
type LevelDefinition = {
  name: string
  rows: string[]           // Tile map using characters
  boulders?: BoulderDef[]  // Rolling boulder hazards
  fireBars?: FireBarDef[]  // Rotating fire bar hazards
  enemies?: EnemyDef[]     // Enemy spawns (turtle/slime/bird)
  coinTrails?: CoinTrail[] // Diagonal coin trails
}
```

### Tile Legend
- `.` = Empty space
- `=` = Platform (solid, can stand on)
- `#` = Solid block (ground/walls)
- `C` = Coin pickup
- `P` = Player spawn point
- `G` = Goal/finish point
- `S` = Spike hazard
- `B` = Bounce pad

### Existing Features
- Coyote time (grace period after leaving platform)
- Jump buffering (register jump before landing)
- Variable jump height (hold for higher jump)
- Bounce pads with squash/stretch animation
- Three enemy types with patrol AI
- Rolling boulders and rotating fire bars
- Coin collection with score popups
- Lives system with game over
- Two-level progression
- Animated start/complete/game-over screens

---

## 🚀 PHASE 1: Local Multiplayer System

### 1.1 Second Player Implementation

**Create Player 2 with independent state:**
```typescript
// Suggested structure
interface PlayerConfig {
  id: 1 | 2
  controls: ControlScheme
  spawnOffset: { x: number, y: number }
  spriteVariant: 'blue' | 'pink' | 'green' | 'yellow'
}

interface ControlScheme {
  left: string[]   // Key codes
  right: string[]
  jump: string[]
  action: string[]
}

const PLAYER_CONTROLS = {
  player1: {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['KeyW', 'Space', 'ArrowUp'],
    action: ['KeyE', 'ShiftLeft']
  },
  player2: {
    left: ['Numpad4'],
    right: ['Numpad6'],
    jump: ['Numpad8', 'Numpad5'],
    action: ['Numpad0']
  }
}
```

**Player sprite variations:**
- Player 1: Original pink/red costume
- Player 2: Blue costume (palette swap)
- Unlockable: Green, Yellow, Purple variants

**Spawn handling:**
- Add `P2` marker to level rows for Player 2 spawn
- If no P2, spawn Player 2 slightly offset from P1
- Both players visible on screen at start

### 1.2 Shared Camera System

**Dynamic camera that keeps both players in view:**
```typescript
class MultiplayerCamera {
  // Calculate center point between players
  // Adjust zoom based on distance
  // Clamp to level bounds
  // Smooth interpolation (lerp)
  
  minZoom: 0.5      // Maximum zoom out
  maxZoom: 1.0      // Normal view
  padding: 100      // Edge padding in pixels
  smoothing: 0.1    // Camera lerp factor
}
```

**Camera behaviors:**
- When players close: Normal zoom, follow midpoint
- When players spread: Zoom out to fit both + padding
- Vertical handling: Prioritize ground level, allow vertical scroll
- Dead player: Camera follows surviving player

### 1.3 Player Interaction

**Cooperative mechanics:**
- Head bounce: Jump on partner's head for extra height
- Revival: Touch downed partner to revive (costs 1 life from helper)
- Carry: Hold action near partner to carry them (for puzzles)

**Rules:**
- Players cannot push each other off platforms
- Soft collision (slight resistance, not solid)
- Cannot damage each other

### 1.4 Multiplayer Game Rules

**Lives system:**
- Each player starts with 3 lives
- Lives are individual (not shared)
- When one player dies, they respawn at last checkpoint or start
- If one player has 0 lives, they spectate until level restart
- Game over only when BOTH players reach 0 lives

**Level completion:**
- BOTH players must reach goal to complete level
- First player at goal waits (shows celebration animation)
- Timer bonus calculated when second player arrives
- If one player is dead (has lives remaining), they respawn at goal area

**Scoring:**
- Shared score between players
- Coin collection adds to shared total
- Combo bonus for collecting coins quickly (either player)
- Both players get completion bonus

---

## 🎨 PHASE 2: Professional UI System

### 2.1 Main Menu Screen

**Visual design:**
```
┌─────────────────────────────────────────┐
│  [Animated parallax background]         │
│                                         │
│      ★ PRINCESS PLUMBER ★               │
│         [Logo with bounce]              │
│                                         │
│        ► SINGLE PLAYER                  │
│          2 PLAYERS                      │
│          SETTINGS                       │
│          HOW TO PLAY                    │
│                                         │
│    [Animated character running]         │
│  ═══════════════════════════════════    │
│         Press ENTER to select           │
└─────────────────────────────────────────┘
```

**Menu interactions:**
- Arrow keys to navigate
- Enter to select
- Hover effect: Scale up 1.1x, glow
- Selection sound effect
- Background music (looping, cheerful)

### 2.2 Character Select Screen

**Layout:**
```
┌─────────────────────────────────────────┐
│  SELECT YOUR CHARACTER                  │
│                                         │
│  PLAYER 1              PLAYER 2         │
│  [WASD+Space]          [Arrows+Enter]   │
│                                         │
│  ┌─────┐ ┌─────┐      ┌─────┐ ┌─────┐  │
│  │PINK │ │BLUE │      │PINK │ │BLUE │  │
│  │ ◄►  │ │     │      │     │ │ ◄►  │  │
│  └─────┘ └─────┘      └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐      ┌─────┐ ┌─────┐  │
│  │GREEN│ │ 🔒  │      │GREEN│ │ 🔒  │  │
│  └─────┘ └─────┘      └─────┘ └─────┘  │
│                                         │
│  [Character preview animation area]     │
│                                         │
│       Both players press JUMP to start  │
└─────────────────────────────────────────┘
```

**Features:**
- Each player selects independently
- Cannot select same color (auto-switch)
- Preview shows idle → run → jump animation
- Locked characters show unlock requirement
- "Ready" indicator when player confirms

### 2.3 Level Select Screen

**World map style:**
```
┌─────────────────────────────────────────┐
│  WORLD 1: ROOFTOP CITY                  │
│  ═══════════════════════════════════    │
│                                         │
│    (1)━━━━(2)━━━━(3)━━━━(4)            │
│     ★★★    ★★☆    ★☆☆    🔒            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Level 2: Skyline Sprint        │   │
│  │  Best Time: 1:24                │   │
│  │  Coins: 47/52                   │   │
│  │  ★★☆ (No deaths for 3rd star)  │   │
│  └─────────────────────────────────┘   │
│                                         │
│   ◄ World 1          World 2 (🔒) ►    │
│         Press ENTER to play             │
└─────────────────────────────────────────┘
```

**Star rating criteria:**
- ★ Complete the level
- ★★ Collect 80%+ coins
- ★★★ Complete with no deaths

### 2.4 Enhanced HUD

**In-game layout:**
```
┌─────────────────────────────────────────┐
│ P1 ♥♥♥  [🪙 x47]  LEVEL 2  [🪙 x32] ♥♥♡ P2│
│ ────────────────────────────────────────│
│                                         │
│              [GAME AREA]                │
│                                         │
│                          +10 (floating) │
│                                         │
└─────────────────────────────────────────┘
```

**HUD elements:**
- Player 1 info: Left side (hearts, NOT numbers)
- Player 2 info: Right side (mirrored)
- Shared coin count: Center
- Level name: Center top
- Combo multiplier: Shows when active (x2, x3, etc.)
- Floating score popups: Rise and fade

### 2.5 Pause Menu

**Overlay design:**
```
┌─────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓ PAUSED ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓   ► RESUME        ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓     RESTART       ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓     SETTINGS      ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓     QUIT LEVEL    ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────────────────────────┘
(▓ = Blurred/darkened game behind)
```

**Pause behavior:**
- Either player can pause (Escape or P)
- Game freezes completely
- Semi-transparent dark overlay
- Resume returns to exact state

---

## ✨ PHASE 3: Visual Effects & Polish

### 3.1 Particle System

**Create reusable particle emitter:**
```typescript
interface ParticleConfig {
  count: number
  lifetime: [min, max]      // seconds
  speed: [min, max]
  direction: [minAngle, maxAngle]  // radians
  size: [start, end]
  color: string | string[]  // Can fade between colors
  gravity: number
  fadeOut: boolean
}

// Predefined particle effects
const PARTICLES = {
  dustLand: { count: 5, lifetime: [0.2, 0.4], color: '#b5a68c', ... },
  coinSparkle: { count: 8, lifetime: [0.3, 0.5], color: ['#ffff00', '#ffffff'], ... },
  deathPoof: { count: 20, lifetime: [0.3, 0.6], color: '#ffffff', ... },
  fireEmber: { count: 2, lifetime: [0.5, 1.0], color: ['#ff6600', '#ff0000'], ... },
  speedLines: { count: 1, lifetime: [0.1, 0.2], color: '#ffffff88', ... }
}
```

**Trigger points:**
- Landing from any jump → dust particles
- Collecting coin → sparkle burst
- Player death → poof cloud
- Fire bar rotation → ember trail
- Running fast → speed lines behind player
- Bounce pad → ring burst

### 3.2 Screen Effects

**Camera shake:**
```typescript
class ScreenShake {
  // Trigger on: damage taken, boulder impact, explosions
  intensity: number    // Pixels of displacement
  duration: number     // Seconds
  falloff: 'linear' | 'exponential'
}

// Usage examples:
shake({ intensity: 8, duration: 0.3 })   // Taking damage
shake({ intensity: 4, duration: 0.15 })  // Stomping enemy
shake({ intensity: 12, duration: 0.4 })  // Boulder crash
```

**Screen flash:**
- White flash (0.05s) on coin collection
- Red tint (0.1s) on damage
- Golden flash on level complete

**Vignette:**
- Normal: None
- Low health (1 heart): Subtle red vignette
- Critical (half heart): Pulsing red vignette

### 3.3 Parallax Background System

**Layer structure:**
```typescript
interface BackgroundLayer {
  image: string           // Asset path
  scrollMultiplier: number  // 0 = static, 1 = match camera
  yOffset: number         // Vertical position
  repeat: 'x' | 'y' | 'both' | 'none'
}

// Rooftop City theme
const rooftopBackground: BackgroundLayer[] = [
  { image: 'sky-gradient.png', scrollMultiplier: 0, yOffset: 0 },
  { image: 'clouds-far.png', scrollMultiplier: 0.1, yOffset: 20 },
  { image: 'city-skyline.png', scrollMultiplier: 0.3, yOffset: 100 },
  { image: 'buildings-mid.png', scrollMultiplier: 0.5, yOffset: 150 },
  { image: 'rooftops-near.png', scrollMultiplier: 0.8, yOffset: 200 },
]
```

### 3.4 Animation Enhancements

**Character animations to add:**
- Idle blink (existing) ✓
- Run cycle (existing) ✓
- Jump rise (existing) ✓
- Jump fall (separate from rise)
- Landing squash
- Wall slide (if adding wall jump)
- Damage taken (flash + knockback pose)
- Death (spin + fall)
- Victory dance (at goal)
- Carrying partner (if adding carry mechanic)

**Animation principles:**
- Squash on landing (scale Y: 0.7, X: 1.3 for 0.1s)
- Stretch on jump start (scale Y: 1.3, X: 0.8 for 0.1s)
- Anticipation: Brief crouch before jump
- Follow-through: Hair/cape continues moving after stop

---

## 🔊 PHASE 4: Audio System

### 4.1 Audio Manager

```typescript
class AudioManager {
  private bgmVolume: number = 0.5
  private sfxVolume: number = 0.7
  private currentBGM: AudioBuffer | null
  
  // Background music with crossfade
  playBGM(track: string, fadeTime: number = 1.0): void
  stopBGM(fadeTime: number = 0.5): void
  
  // Sound effects with pooling (prevent overlap issues)
  playSFX(sound: string, volume?: number, pitch?: number): void
  
  // Spatial audio (pan based on screen position)
  playSFXAt(sound: string, x: number, screenWidth: number): void
}
```

### 4.2 Required Audio Assets

**Music tracks:**
- `menu-theme.mp3` - Upbeat, loopable (30-60 seconds)
- `rooftop-level.mp3` - Energetic platforming (60-90 seconds loop)
- `underground-level.mp3` - Mysterious, slightly tense
- `boss-battle.mp3` - Intense (if adding bosses)
- `victory-fanfare.mp3` - Short celebration (5-10 seconds)
- `game-over.mp3` - Sad but not depressing (5 seconds)

**Sound effects:**
```
Player:
- jump.wav (short whoosh)
- land.wav (soft thud)
- footstep-1.wav, footstep-2.wav (alternating)
- damage.wav (oof/ouch)
- death.wav (sad sound)
- bounce.wav (boing spring)

Collectibles:
- coin-1.wav, coin-2.wav, coin-3.wav (chime variations)
- powerup.wav (magical ascending)

Enemies:
- enemy-stomp.wav (squish)
- enemy-damage.wav (player hurt by enemy)

UI:
- menu-move.wav (blip)
- menu-select.wav (confirmation ding)
- menu-back.wav (soft click)
- pause.wav (whoosh down)
- unpause.wav (whoosh up)

Level:
- checkpoint.wav (flag sound)
- level-complete.wav (fanfare)
- door-open.wav (for exits)
```

### 4.3 Audio Implementation Notes

- Use Web Audio API for low latency
- Preload all sound effects on game start
- Stream background music (don't preload full tracks)
- Pool frequently-used sounds (coins, footsteps)
- Duck (lower volume) BGM during important SFX
- Save volume settings to localStorage

---

## 🎁 PHASE 5: Power-Up System

### 5.1 Power-Up Definitions

```typescript
type PowerUpType = 'speed' | 'doubleJump' | 'shield' | 'magnet' | 'invincible'

interface PowerUpDef {
  type: PowerUpType
  duration: number      // Seconds (0 = instant/permanent until hit)
  visualEffect: string  // Particle/glow effect name
  soundEffect: string
}

const POWERUPS: Record<PowerUpType, PowerUpDef> = {
  speed: {
    type: 'speed',
    duration: 8,
    visualEffect: 'speedAura',
    soundEffect: 'powerup-speed'
  },
  doubleJump: {
    type: 'doubleJump', 
    duration: 15,
    visualEffect: 'wingSparkle',
    soundEffect: 'powerup-jump'
  },
  shield: {
    type: 'shield',
    duration: 0,  // Until hit
    visualEffect: 'bubbleShield',
    soundEffect: 'powerup-shield'
  },
  magnet: {
    type: 'magnet',
    duration: 10,
    visualEffect: 'magnetField',
    soundEffect: 'powerup-magnet'
  },
  invincible: {
    type: 'invincible',
    duration: 6,
    visualEffect: 'starGlow',
    soundEffect: 'powerup-star'
  }
}
```

### 5.2 Power-Up Behaviors

**Speed Boost (🏃)**
- 1.6x movement speed
- 1.3x jump distance
- Speed lines particle effect
- Player sprite has motion blur/trail
- Warning flash at 2 seconds remaining

**Double Jump (🦋)**
- One extra jump in mid-air
- Resets on landing
- Small wing particle burst on second jump
- Counter shows jumps remaining

**Shield (🛡️)**
- Absorbs one hit from any source
- Visible bubble around player
- Pops with particle effect when used
- Does NOT protect from falling in pits

**Coin Magnet (🧲)**
- Coins within 150px radius fly toward player
- Purple/electric particle trail on attracted coins
- Subtle magnetic field visual around player

**Invincibility Star (⭐)**
- Immune to all damage
- Defeats enemies on contact
- Rainbow color cycling on player sprite
- Music changes to fast-paced version
- Screen has subtle golden tint

### 5.3 Level Integration

Add to level definition:
```typescript
type LevelDefinition = {
  // ... existing fields
  powerUps?: PowerUpSpawn[]
}

interface PowerUpSpawn {
  type: PowerUpType
  x: number
  y: number
  respawn?: boolean    // Does it come back after collection?
  respawnTime?: number // Seconds until respawn
}
```

Add `U` tile marker for power-up spawn points, or define explicitly in powerUps array.

---

## 🗺️ PHASE 6: Expanded Level Content

### 6.1 New Level Elements

**Moving Platforms:**
```typescript
interface MovingPlatformDef {
  x: number
  y: number
  width: number         // In tiles
  path: 'horizontal' | 'vertical' | 'circular' | 'custom'
  distance: number      // Pixels to travel
  speed: number         // Pixels per second
  pauseTime?: number    // Seconds to pause at endpoints
  customPath?: {x: number, y: number}[]  // For custom paths
}
```

**Crumbling Platforms:**
```typescript
interface CrumblingPlatformDef {
  x: number
  y: number
  width: number
  delay: number         // Seconds after stepping before crumble
  respawnTime: number   // Seconds until platform returns
}
```

**Checkpoints:**
- Add `F` (flag) tile to level rows
- Visual: Flag pole that raises when activated
- Behavior: Players respawn here after death
- Only most recent checkpoint is active
- Both players can have different checkpoints active

**Warp Pipes:**
```typescript
interface WarpPipeDef {
  entranceX: number
  entranceY: number
  exitX: number
  exitY: number
  direction: 'down' | 'up' | 'left' | 'right'
  requireBothPlayers?: boolean  // Must both enter together
}
```

### 6.2 World Themes

**World 1: Rooftop City (Levels 1-4)**
- Existing visual style
- Daytime city skyline background
- Brick and metal platforms
- AC units, antennas as obstacles
- Pigeons (bird enemy variant)

**World 2: Underground Caverns (Levels 5-8)**
- Dark background with glowing crystals
- Stone and crystal platforms
- Stalactites (falling hazards)
- Bats (bird enemy variant, erratic movement)
- Lava pits (instant death)
- Minecart sections (auto-scrolling)

### 6.3 New Level Definitions

```typescript
// Level 3: Pipe Dream
const levelThreeRows = [
  '................................................................',
  '..C..........................C..................................',
  '....====..........====..........====...........................',
  '..............C............C...................................',
  '..P.......M..........M..........M..............................',
  '........====......====......====...............................',
  '.....C.............C.............C.............................',
  '..........W===W..........W===W.................................',
  '................................................................',
  '...............====..........====..............................',
  '.......C................C.............................C........',
  '....===============...===============..........................',
  '................................................................',
  '....F.......................F..................................',
  '............===....===....===....===...........................',
  '...................................................G............',
  '################################################################',
  '################################################################',
]

// M = Moving platform spawn
// W = Warp pipe
// F = Flag checkpoint
```

### 6.4 Level Progression

**Unlock requirements:**
- Level 1: Always unlocked
- Level 2: Complete Level 1
- Level 3: Complete Level 2
- Level 4: Complete Level 3 + collect 50% of World 1 coins
- World 2: Complete World 1 (all 4 levels)
- Levels 5-8: Sequential unlock within World 2

**Difficulty curve:**
1. Rooftop Run - Tutorial level, few hazards
2. Skyline Sprint - Introduce all enemy types
3. Pipe Dream - Moving platforms, warp pipes
4. Antenna Array - Fire bars, precise jumping
5. Crystal Caverns - New theme, checkpoints needed
6. Mineshaft Mayhem - Auto-scroll section
7. Lava Lakes - Instant-death hazards
8. Dragon's Den - All mechanics combined (boss?)

---

## 💾 PHASE 7: Save System & Progression

### 7.1 Save Data Structure

```typescript
interface SaveData {
  version: number
  
  // Player progress
  unlockedLevels: number[]
  levelStars: Record<number, number>  // levelId -> stars (0-3)
  levelBestTimes: Record<number, number>  // levelId -> seconds
  levelCoinRecords: Record<number, number>  // levelId -> max coins
  
  // Unlockables
  unlockedCharacters: string[]
  unlockedCostumes: string[]
  
  // Statistics
  totalCoinsCollected: number
  totalDeaths: number
  totalPlayTime: number  // seconds
  enemiesDefeated: number
  
  // Settings
  settings: {
    bgmVolume: number
    sfxVolume: number
    screenShake: boolean
    showTimer: boolean
  }
}
```

### 7.2 Achievements

```typescript
const ACHIEVEMENTS = [
  { id: 'first_coin', name: 'Shiny!', desc: 'Collect your first coin', icon: '🪙' },
  { id: 'coin_100', name: 'Coin Collector', desc: 'Collect 100 coins total', icon: '💰' },
  { id: 'coin_1000', name: 'Treasure Hunter', desc: 'Collect 1000 coins total', icon: '👑' },
  { id: 'no_death_level', name: 'Untouchable', desc: 'Complete any level without dying', icon: '🛡️' },
  { id: 'speed_run', name: 'Speed Demon', desc: 'Complete Level 1 in under 60 seconds', icon: '⚡' },
  { id: 'coop_complete', name: 'Better Together', desc: 'Complete any level in 2-player mode', icon: '🤝' },
  { id: 'all_stars', name: 'Perfectionist', desc: 'Get 3 stars on all levels', icon: '⭐' },
  { id: 'enemy_100', name: 'Exterminator', desc: 'Defeat 100 enemies', icon: '👟' },
]
```

---

## 📁 Recommended File Structure

```
src/
├── main.ts                 # Entry point
├── game/
│   ├── Game.ts             # Main game class, state machine
│   ├── GameState.ts        # State enum and transitions
│   │
│   ├── core/
│   │   ├── Camera.ts       # Multiplayer camera with zoom
│   │   ├── Input.ts        # Keyboard/gamepad, multiplayer
│   │   ├── Physics.ts      # Collision detection
│   │   ├── SaveManager.ts  # localStorage save/load
│   │   └── AssetLoader.ts  # Preload images/audio
│   │
│   ├── entities/
│   │   ├── Entity.ts       # Base entity class
│   │   ├── Player.ts       # Player with multiplayer support
│   │   ├── enemies/
│   │   │   ├── Enemy.ts    # Base enemy class
│   │   │   ├── Turtle.ts
│   │   │   ├── Slime.ts
│   │   │   └── Bird.ts
│   │   ├── hazards/
│   │   │   ├── Boulder.ts
│   │   │   ├── FireBar.ts
│   │   │   ├── Spike.ts
│   │   │   └── CrumblingPlatform.ts
│   │   ├── collectibles/
│   │   │   ├── Coin.ts
│   │   │   └── PowerUp.ts
│   │   └── platforms/
│   │       ├── Platform.ts
│   │       ├── MovingPlatform.ts
│   │       └── BouncePad.ts
│   │
│   ├── systems/
│   │   ├── ParticleSystem.ts
│   │   ├── AudioManager.ts
│   │   └── AchievementManager.ts
│   │
│   ├── ui/
│   │   ├── UIManager.ts    # Handles all UI screens
│   │   ├── screens/
│   │   │   ├── MainMenu.ts
│   │   │   ├── CharacterSelect.ts
│   │   │   ├── LevelSelect.ts
│   │   │   ├── PauseMenu.ts
│   │   │   ├── GameOverScreen.ts
│   │   │   └── VictoryScreen.ts
│   │   ├── HUD.ts          # In-game UI
│   │   └── components/
│   │       ├── Button.ts
│   │       ├── ProgressBar.ts
│   │       └── FloatingText.ts
│   │
│   ├── levels/
│   │   ├── LevelLoader.ts  # Parse level definitions
│   │   ├── levels.ts       # All level data
│   │   └── backgrounds.ts  # Parallax layer configs
│   │
│   └── utils/
│       ├── math.ts         # lerp, clamp, etc.
│       ├── animation.ts    # Easing functions
│       └── constants.ts    # Game-wide constants
│
├── assets/
│   ├── sprites/
│   │   ├── player/
│   │   │   ├── pink/       # Default character
│   │   │   ├── blue/       # Player 2 variant
│   │   │   └── green/      # Unlockable
│   │   ├── enemies/
│   │   ├── tiles/
│   │   ├── ui/
│   │   └── effects/
│   ├── audio/
│   │   ├── bgm/
│   │   └── sfx/
│   └── backgrounds/
│
└── styles/
    └── main.css
```

---

## ⚙️ Technical Requirements

### Performance Targets
- Maintain 60 FPS with all effects enabled
- Support resolutions from 720p to 4K
- Canvas scaling with crisp pixel art (image-rendering: pixelated)
- Particle count limit: 500 simultaneous particles
- Audio pool size: 10 instances per sound effect

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Accessibility Considerations
- Colorblind-friendly player differentiation (patterns, not just colors)
- Screen shake toggle in settings
- High contrast mode option
- Keyboard-only fully playable
- Sound not required for any gameplay element

---

## 🚦 Implementation Priority Order

### Sprint 1: Multiplayer Foundation (Week 1-2)
1. ✅ Refactor Player class for multiple instances
2. ✅ Implement dual control schemes
3. ✅ Create shared camera system
4. ✅ Add P2 spawn points to existing levels
5. ✅ Implement multiplayer game rules

### Sprint 2: UI Overhaul (Week 3-4)
1. Main menu with navigation
2. Character select screen
3. Level select with unlock system
4. Pause menu
5. Enhanced HUD for 2 players

### Sprint 3: Visual Polish (Week 5-6)
1. Particle system
2. Screen shake and effects
3. Parallax backgrounds
4. Animation improvements
5. Screen transitions

### Sprint 4: Audio (Week 7)
1. Audio manager implementation
2. Integrate all sound effects
3. Add background music
4. Volume controls and settings persistence

### Sprint 5: Content Expansion (Week 8-10)
1. Power-up system
2. Moving platforms
3. Checkpoints
4. 6 new levels (3-8)
5. Save system and achievements

### Sprint 6: Polish & Testing (Week 11-12)
1. Bug fixes
2. Performance optimization
3. Balance adjustments
4. Playtesting with kids
5. Final polish

---

## 🧪 Testing Checklist

### Multiplayer Testing
- [ ] Both players can complete level independently
- [ ] Camera keeps both players visible at all times
- [ ] Revival mechanic works correctly
- [ ] Both players at goal triggers level complete
- [ ] One player death doesn't affect other's control
- [ ] Game over only when both have 0 lives

### Performance Testing
- [ ] 60 FPS maintained with max particles
- [ ] No memory leaks over extended play sessions
- [ ] Audio doesn't cut out or overlap badly
- [ ] No input lag in multiplayer

### UX Testing
- [ ] Menu navigation intuitive
- [ ] Controls explained clearly
- [ ] Difficulty progression feels fair
- [ ] Kids can play without adult help (age 6+)

---

## 📝 Notes for Implementation

1. **Start simple:** Get basic 2-player working before adding features
2. **Test frequently:** Especially multiplayer edge cases
3. **Kid-friendly:** Avoid frustrating difficulty spikes
4. **Performance first:** Optimize particle system early
5. **Save often:** Implement save system before adding lots of content

---

*This prompt document provides a complete roadmap for enhancing your platformer game. Use it as a reference for implementation, or provide it directly to AI coding assistants for guided development.*
