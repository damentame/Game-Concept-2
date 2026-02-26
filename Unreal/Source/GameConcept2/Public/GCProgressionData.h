#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "GameplayTagContainer.h"
#include "GCProgressionData.generated.h"

USTRUCT(BlueprintType)
struct FSkillNode
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName NodeId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 RequiredLevel = 1;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 XPRequired = 100;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FGameplayTag UnlockTag;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<FName> PrerequisiteNodes;
};

UCLASS(BlueprintType)
class UGCProgressionData : public UDataAsset
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    TArray<int32> XPPerLevel;

    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    TArray<FSkillNode> SkillTreeNodes;
};

UCLASS(ClassGroup=(Progression), meta=(BlueprintSpawnableComponent))
class UGCProgressionComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable)
    void AddXP(int32 Amount);

    UFUNCTION(BlueprintCallable)
    bool UnlockNode(FName NodeId);

    UFUNCTION(BlueprintPure)
    bool HasTag(FGameplayTag UnlockTag) const;

protected:
    UPROPERTY(EditAnywhere, BlueprintReadOnly)
    TObjectPtr<UGCProgressionData> ProgressionData;

    UPROPERTY(BlueprintReadOnly)
    int32 CurrentXP = 0;

    UPROPERTY(BlueprintReadOnly)
    int32 CurrentLevel = 1;

    UPROPERTY(BlueprintReadOnly)
    FGameplayTagContainer UnlockedTags;

    UFUNCTION(BlueprintImplementableEvent)
    void BP_OnLevelUp(int32 NewLevel);

    UFUNCTION(BlueprintImplementableEvent)
    void BP_OnNodeUnlocked(FName NodeId, FGameplayTag UnlockTag);
};
