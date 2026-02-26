#pragma once

#include "CoreMinimal.h"
#include "Abilities/GameplayAbility.h"
#include "GCMagicAbility.generated.h"

UCLASS(Abstract)
class UGCMagicAbility : public UGameplayAbility
{
    GENERATED_BODY()

public:
    UGCMagicAbility();

protected:
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Costs")
    float ManaCost = 20.0f;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Cooldown")
    FGameplayTag CooldownTag;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Cooldown")
    float CooldownSeconds = 2.0f;

    UFUNCTION(BlueprintImplementableEvent, Category = "Magic")
    void BP_PerformCast(const FVector& TargetLocation);
};

UCLASS()
class UGCProjectileMagicAbility : public UGCMagicAbility
{
    GENERATED_BODY()

public:
    virtual void ActivateAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        const FGameplayEventData* TriggerEventData) override;
};

UCLASS()
class UGCInstantMagicAbility : public UGCMagicAbility
{
    GENERATED_BODY()

public:
    virtual void ActivateAbility(
        const FGameplayAbilitySpecHandle Handle,
        const FGameplayAbilityActorInfo* ActorInfo,
        const FGameplayAbilityActivationInfo ActivationInfo,
        const FGameplayEventData* TriggerEventData) override;
};
