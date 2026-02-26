#include "GCMagicAbility.h"

#include "AbilitySystemBlueprintLibrary.h"
#include "AbilitySystemComponent.h"

UGCMagicAbility::UGCMagicAbility()
{
    InstancingPolicy = EGameplayAbilityInstancingPolicy::InstancedPerActor;
}

void UGCProjectileMagicAbility::ActivateAbility(
    const FGameplayAbilitySpecHandle Handle,
    const FGameplayAbilityActorInfo* ActorInfo,
    const FGameplayAbilityActivationInfo ActivationInfo,
    const FGameplayEventData* TriggerEventData)
{
    if (!CommitAbility(Handle, ActorInfo, ActivationInfo))
    {
        EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
        return;
    }

    const FVector Target = TriggerEventData ? TriggerEventData->TargetData.Get(0)->GetEndPoint() : ActorInfo->AvatarActor->GetActorLocation();
    BP_PerformCast(Target);
    EndAbility(Handle, ActorInfo, ActivationInfo, false, false);
}

void UGCInstantMagicAbility::ActivateAbility(
    const FGameplayAbilitySpecHandle Handle,
    const FGameplayAbilityActorInfo* ActorInfo,
    const FGameplayAbilityActivationInfo ActivationInfo,
    const FGameplayEventData* TriggerEventData)
{
    if (!CommitAbility(Handle, ActorInfo, ActivationInfo))
    {
        EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
        return;
    }

    const FVector Target = TriggerEventData ? TriggerEventData->TargetData.Get(0)->GetEndPoint() : ActorInfo->AvatarActor->GetActorLocation();
    BP_PerformCast(Target);
    EndAbility(Handle, ActorInfo, ActivationInfo, false, false);
}
