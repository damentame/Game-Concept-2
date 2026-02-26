const humanoidSkeleton = {
  name: 'SK_Humanoid_Master',
  retargetProfile: 'RP_Humanoid_Biped',
  animationSets: {
    locomotion: ['Idle', 'Walk_Fwd', 'Run_Fwd', 'Strafe_L', 'Strafe_R', 'Jump_Start', 'Jump_Loop', 'Land'],
    combat: ['Attack_Light_01', 'Attack_Heavy_01', 'Block', 'Dodge', 'Parry', 'Cast_01'],
    reactions: ['Hit_Front', 'Hit_Back', 'Hit_Left', 'Hit_Right', 'Death_Fall', 'Death_Knockback'],
  },
};

const playerModel = {
  mesh: 'SK_Player_BaseBody',
  sharedSkeleton: humanoidSkeleton.name,
  armorSlots: ['head', 'chest', 'arms', 'legs'],
  modularMeshes: {
    head: ['SM_Head_ClothHood', 'SM_Head_IronHelm', 'SM_Head_ArcaneCirclet'],
    chest: ['SM_Chest_LeatherVest', 'SM_Chest_IronCuirass', 'SM_Chest_MageRobe'],
    arms: ['SM_Arms_Leather', 'SM_Arms_Plate', 'SM_Arms_Runesilk'],
    legs: ['SM_Legs_Traveler', 'SM_Legs_Guard', 'SM_Legs_Battlemage'],
  },
};

const enemyPipeline = {
  sharedSkeleton: humanoidSkeleton.name,
  archetypes: [
    { name: 'light', mesh: 'SK_Enemy_Light', role: 'scout' },
    { name: 'medium', mesh: 'SK_Enemy_Medium', role: 'soldier' },
    { name: 'heavy', mesh: 'SK_Enemy_Heavy', role: 'bruiser' },
  ],
  factionMaterials: [
    { faction: 'ember-order', materialInstance: 'MI_Enemy_Faction_Ember' },
    { faction: 'verdant-swarm', materialInstance: 'MI_Enemy_Faction_Verdant' },
    { faction: 'azure-syndicate', materialInstance: 'MI_Enemy_Faction_Azure' },
  ],
};

const physicsAndCollision = {
  ragdollFallback: 'Physics asset simplified to root + major limbs only',
  movementCollision: ['CapsuleComponent (root)'],
  meleeHitDetection: ['Capsule_Head', 'Capsule_Torso', 'Capsule_WeaponArc'],
  note: 'Avoid per-poly collision for runtime combat checks.',
};

const exportImportChecklist = [
  'DCC scene units set to centimeters (1 unit = 1 cm).',
  'Forward axis standardized to +X forward, +Z up.',
  'Freeze transforms before export (zeroed rot/loc, scale = 1).',
  'Normalize and clean skin weights (remove unassigned verts).',
  'Constrain max influences per vertex to 4.',
  'Validate naming conventions for skeleton, meshes, and material slots.',
];

const assetCatalog = [
  { name: 'SK_Player_BaseBody', triangles: 22800, materialSlots: 3, lods: [0, 1, 2] },
  { name: 'SK_Enemy_Light', triangles: 16400, materialSlots: 2, lods: [0, 1, 2] },
  { name: 'SK_Enemy_Medium', triangles: 19800, materialSlots: 2, lods: [0, 1, 2] },
  { name: 'SK_Enemy_Heavy', triangles: 24600, materialSlots: 3, lods: [0, 1] },
  { name: 'SM_Head_IronHelm', triangles: 2600, materialSlots: 1, lods: [0, 1] },
  { name: 'SM_Chest_IronCuirass', triangles: 5400, materialSlots: 2, lods: [0, 1, 2] },
  { name: 'SM_Arms_Plate', triangles: 3500, materialSlots: 1, lods: [0] },
  { name: 'SM_Legs_Guard', triangles: 4100, materialSlots: 1, lods: [0, 1] },
];

function validateAssetCatalog(assets, { maxTriangles = 25000, maxMaterialSlots = 4, requiredLods = [0, 1, 2] } = {}) {
  return assets.map((asset) => {
    const missingLods = requiredLods.filter((lod) => !asset.lods.includes(lod));
    return {
      name: asset.name,
      triangles: asset.triangles,
      materialSlots: asset.materialSlots,
      lods: asset.lods,
      missingLods,
      triangleBudgetOk: asset.triangles <= maxTriangles,
      materialBudgetOk: asset.materialSlots <= maxMaterialSlots,
    };
  });
}

function buildPipelinePanel() {
  const report = validateAssetCatalog(assetCatalog);
  const panel = document.createElement('aside');
  panel.className = 'pipeline-panel';
  panel.innerHTML = `
    <h2>Content Pipeline</h2>
    <p><strong>Shared skeleton:</strong> ${humanoidSkeleton.name}</p>
    <p><strong>Player slots:</strong> ${playerModel.armorSlots.join(', ')}</p>
    <p><strong>Enemy archetypes:</strong> ${enemyPipeline.archetypes.map((a) => a.name).join(', ')}</p>
    <p><strong>Animation sets:</strong> locomotion, combat, hit/death reactions (retargeted with ${humanoidSkeleton.retargetProfile})</p>
    <p><strong>Collision:</strong> ${physicsAndCollision.movementCollision.join(' + ')} + ${physicsAndCollision.meleeHitDetection.length} hit capsules</p>
    <details>
      <summary>Export / Import Checklist</summary>
      <ul>${exportImportChecklist.map((item) => `<li>${item}</li>`).join('')}</ul>
    </details>
    <details open>
      <summary>Editor Validation Report</summary>
      <table>
        <thead>
          <tr><th>Asset</th><th>Tris</th><th>Mats</th><th>Missing LODs</th></tr>
        </thead>
        <tbody>
          ${report.map((entry) => `
            <tr class="${entry.missingLods.length || !entry.triangleBudgetOk || !entry.materialBudgetOk ? 'warn' : 'ok'}">
              <td>${entry.name}</td>
              <td>${entry.triangles}</td>
              <td>${entry.materialSlots}</td>
              <td>${entry.missingLods.length ? entry.missingLods.join(', ') : 'None'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </details>
  `;

  document.body.appendChild(panel);
}

buildPipelinePanel();

window.contentPipeline = {
  humanoidSkeleton,
  playerModel,
  enemyPipeline,
  physicsAndCollision,
  exportImportChecklist,
  validateAssetCatalog,
};
