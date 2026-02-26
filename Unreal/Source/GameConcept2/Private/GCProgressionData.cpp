#include "GCProgressionData.h"

void UGCProgressionComponent::AddXP(int32 Amount)
{
    CurrentXP += Amount;

    while (ProgressionData && ProgressionData->XPPerLevel.IsValidIndex(CurrentLevel - 1) &&
           CurrentXP >= ProgressionData->XPPerLevel[CurrentLevel - 1])
    {
        CurrentXP -= ProgressionData->XPPerLevel[CurrentLevel - 1];
        ++CurrentLevel;
        BP_OnLevelUp(CurrentLevel);
    }
}

bool UGCProgressionComponent::UnlockNode(FName NodeId)
{
    if (!ProgressionData)
    {
        return false;
    }

    const FSkillNode* Node = ProgressionData->SkillTreeNodes.FindByPredicate(
        [NodeId](const FSkillNode& Candidate) { return Candidate.NodeId == NodeId; });

    if (!Node || CurrentLevel < Node->RequiredLevel || CurrentXP < Node->XPRequired)
    {
        return false;
    }

    CurrentXP -= Node->XPRequired;
    UnlockedTags.AddTag(Node->UnlockTag);
    BP_OnNodeUnlocked(Node->NodeId, Node->UnlockTag);
    return true;
}

bool UGCProgressionComponent::HasTag(FGameplayTag UnlockTag) const
{
    return UnlockedTags.HasTagExact(UnlockTag);
}
