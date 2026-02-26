# Core Gameplay Loop Implementation (C++ + Blueprint)

## 1) AI Chase System

### C++ foundation
- `AGCEnemyAIController` wires AI Perception sight + hearing, tracks state transitions, and syncs behavior values into Blackboard keys (`AIState`, `TargetActor`, `LastKnownLocation`).
- States implemented: `Patrol -> Investigate -> Chase -> Attack -> Recover` using `EEnemyAIState`.
- Recover state automatically returns to Patrol after `RecoverDurationSeconds`.

### Blueprint extension points
- Override `BP_OnStateChanged` to drive animation layers and VFX per state.
- Build a BT using Blackboard enum condition checks for each state branch.

### Level setup
1. Add a `NavMeshBoundsVolume` over the playable area.
2. Create `BT_Enemy` + `BB_Enemy` with the matching keys listed above.
3. Assign `BehaviorTreeAsset` in enemy AI controller blueprint derived from `AGCEnemyAIController`.

## 2) Door System

- `ABPInteractableDoorBase` is the C++ base for `BP_InteractableDoor`.
- Timeline-based open/close rotation using `OpenCurve` + `OpenYawAngle`.
- Lock states:
  - `Unlocked`
  - `RequiresKey` (calls `BP_CanUnlock`)
  - `LockedPermanently`
- Optional AI interaction gate via `bAllowAIOpen` and `TryOpenForAI`.

## 3) Melee Combat

- `UGCMeleeComponent` supports montage-driven combos with socket sweep traces.
- Trace sockets per attack (`hand_r_start`, `hand_r_end`) are configured in `FMeleeAttackSpec`.
- Hit windows are opened/closed via anim notify calls to `BeginHitWindow` / `EndHitWindow`.
- Built-in fields for stamina cost, stagger duration, and invulnerability frames.
- Use `BP_ConsumeStamina`, `BP_OnMeleeHit`, and `BP_OnStaggerApplied` for gameplay effects.

## 4) Magic Ranged Abilities (GAS)

- `UGCMagicAbility` is the shared base for mana + cooldown-tag driven spells.
- `UGCProjectileMagicAbility` and `UGCInstantMagicAbility` provide templates for progression branches.
- Use `BP_PerformCast(TargetLocation)` to spawn projectile actors or apply instant gameplay effects in Blueprint.

## 5) Upgrade Progression

- `UGCProgressionData` data asset stores level XP table and skill tree nodes.
- `UGCProgressionComponent` handles XP accrual, level-ups, and node unlocks.
- Skill nodes include prerequisites and gameplay tags for unlock gates.
- Suggested unlock tiers via tags:
  - `Unlock.Combo.Strong`
  - `Unlock.Combo.AOEFinisher`
  - `Unlock.Spell.Projectile`
  - `Unlock.Spell.Instant`

## 6) Debug Views

- `UGCDebugOverlayComponent` renders:
  - AI state text
  - ability cooldown percentage
  - perception cone gizmo
  - melee range proxy sphere
- Melee trace debug is also built into `UGCMeleeComponent` (`bDrawDebugTrace`).

## Blueprint checklist

- `BP_EnemyCharacter`
  - Add `UGCMeleeComponent` + `UGCDebugOverlayComponent`
  - Set anim notifies to hit windows
- `BP_PlayerCharacter`
  - Add ASC + grant magic abilities
  - Add `UGCProgressionComponent`
- `BP_InteractableDoor`
  - Derive from `ABPInteractableDoorBase`
  - Assign timeline curve and audio/VFX hooks
