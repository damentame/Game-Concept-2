# Art Asset Bible (Performance + Style Consistency)

This document defines mandatory technical and stylistic constraints for all 3D assets. Treat these as hard budgets unless a lead explicitly grants an exception.

## 1) Geometry Budgets (Hard Limits)

### Player Character (single shared base)
- **LOD0:** **12,000-18,000 triangles**
- **LOD1:** **~8,000 triangles**
- **LOD2:** **~4,000 triangles**
- **LOD3:** **~2,000 triangles**

Rules:
- Keep silhouette fidelity concentrated in LOD0 and LOD1.
- LOD transitions must preserve readable proportions and key design cues.
- Accessories should either share LOD chain budgets or be removable at lower LODs.

### Enemy Variants
- **LOD0:** **8,000-12,000 triangles** per variant.

Rules:
- Enemies must inherit from reusable base topology whenever possible.
- Variant detail should come from materials/attachments before adding unique geometry.

### Buildings (Modular Construction)
- **Per module:** **300-2,000 triangles**.
- All structures must be assembled from a **reusable modular kit**.

Rules:
- Prioritize kit reusability over one-off bespoke meshes.
- Keep corner/transition pieces minimal and broadly reusable.

---

## 2) Texture & Material Policy

### Core Texture Strategy
- Use **texture atlases + trim sheets** as the default.
- Most textures must be **512** or **1024** resolution.
- Avoid unique texture sets unless absolutely required for gameplay readability.

### Channel Packing
- Use **ORM packing**:
  - **R = Occlusion**
  - **G = Roughness**
  - **B = Metallic**

### 4K Restriction
- **No unique 4K textures** except approved **hero props**.
- Hero-prop exceptions must be rare and justified by camera proximity and narrative importance.

Rules:
- Reuse shared material libraries and trim assets first.
- Prefer parameterized material instances over new master materials.

---

## 3) Rigging & Skeleton Rules

### Shared Rig Requirement
- Player and enemies must use a **shared humanoid skeleton** to maximize animation reuse.
- Skeleton compatibility is mandatory for retarget-free locomotion/combat sets.

### Bone Budget
- Player mesh deform bones target: **< 80 bones**.

Rules:
- Keep helper/IK/control bones separated from deform budget accounting.
- Avoid per-character skeleton divergence unless required by gameplay-critical anatomy.

---

## 4) City Asset Implementation Standards

### Modular Worldbuilding
- Build city content as **modular static meshes**.
- Use a consistent **snapping grid** for all modules.

### Door Construction
- Doors must be separate mesh components.
- Door pivot must be placed at the **hinge** for clean interaction/animation.

### Collision Standards
- Use **simple primitive collisions** wherever possible.
- For custom needs, use **low-cost UCX hulls**.
- Avoid high-poly per-triangle collision on environment assets.

Rules:
- Keep collision gameplay-accurate, not render-accurate.
- Validate walkability and traversal with collision view before submission.

---

## 5) Import Pipeline Rules

### FBX Naming Conventions
Use consistent naming for all imports:
- `SM_<Category>_<AssetName>_LOD0` (static mesh)
- `SK_<Category>_<AssetName>` (skeletal mesh)
- `M_<AssetName>` (master material)
- `MI_<AssetName>_<Variant>` (material instance)
- `T_<AssetName>_<MapType>` (texture)

LOD examples:
- `SM_Building_Wall_A_LOD0`
- `SM_Building_Wall_A_LOD1`
- `SM_Building_Wall_A_LOD2`

### Import Preset (Required Defaults)
- Import FBX with preserved **normals/tangents** according to project standard.
- Import and validate all provided **LODs**.
- Ensure scale, axis orientation, and unit consistency on first import.

### Material Assignment Automation
- Auto-assign approved **master low-poly material instances** at import.
- Avoid creating ad-hoc materials during import unless explicitly requested.

Rules:
- Failed naming, missing LODs, or noncompliant materials block asset acceptance.
- Any exception requires review and documented approval.

---

## Compliance Checklist (Submission Gate)
Before an asset is accepted:
- Triangle counts verified against section budgets.
- LOD chain present and visually validated.
- Texture sizes and ORM packing compliant.
- Skeleton compatibility and bone budget validated.
- Modular/grid/pivot/collision rules met.
- FBX naming and import preset compliance confirmed.
- Master material instance assignment confirmed.

Noncompliant assets are returned for revision.
