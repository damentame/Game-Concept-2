# Game-Concept-2

Game-Concept-2 now treats Unreal Engine 4 as the primary source of truth. The repository root still contains the original web prototype files (`index.html`, `game.js`, `styles.css`) as legacy artifacts for reference only.

## UE4 project layout

The UE4 project lives in `Game-Concept-2-UE4/`.

- `Source/` - C++ gameplay modules and targets.
- `Content/` - Blueprints, meshes, materials, animations.
- `Config/` - scalability and device-profile defaults.

## Dockerized UE4 workflow (Linux host)

### 1) Prerequisites

- Docker Engine + Docker Compose plugin.
- Access to a UE4 source-built image. Default is:
  - `adamrehn/ue4-full:4.27.2`

You can override the image at runtime:

```bash
UE4_IMAGE=adamrehn/ue4-full:4.27.2 docker compose build
```

### 2) Build the UE4 tool image

```bash
docker compose build
```

### 3) Generate project files

```bash
docker compose run --rm ue4-generate-project-files
```

### 4) Build targets

#### Development Editor target (for creators)

```bash
docker compose run --rm ue4-development-editor
```

#### Shipping target (for low-spec profiling)

```bash
docker compose run --rm ue4-shipping
```

### 5) Full Shipping package with BuildCookRun

```bash
docker compose run --rm ue4-buildcookrun-shipping
```

Packaged Linux Shipping artifacts are archived into `BuildArtifacts/LinuxShipping` by default.

## Volumes and caching

The compose stack mounts:

- Project workspace: `./:/workspace`
- Persistent UE4 DerivedDataCache volume:
  - `gameconcept2_ue4_derived_data_cache`

This cache volume is reused across runs to improve shader/content iteration time.

## Script entry points

The `scripts/` directory includes direct wrappers:

- `scripts/generate_project_files.sh`
- `scripts/build_development_editor.sh`
- `scripts/build_shipping.sh`
- `scripts/buildcookrun_shipping.sh`

These scripts are executed by the Docker services but can also be run manually inside a UE4-capable container.
