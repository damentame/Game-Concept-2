#include "GCMeleeComponent.h"

#include "DrawDebugHelpers.h"
#include "GameFramework/Character.h"
#include "Kismet/KismetSystemLibrary.h"

UGCMeleeComponent::UGCMeleeComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

bool UGCMeleeComponent::TryStartAttack(int32 AttackIndex)
{
    if (!ComboAttacks.IsValidIndex(AttackIndex))
    {
        return false;
    }

    const FMeleeAttackSpec& Attack = ComboAttacks[AttackIndex];
    if (!BP_ConsumeStamina(Attack.StaminaCost))
    {
        return false;
    }

    ActiveAttackIndex = AttackIndex;
    IFrameTimer = Attack.InvulnerabilitySeconds;
    HitActorsThisSwing.Reset();

    if (ACharacter* CharacterOwner = Cast<ACharacter>(GetOwner()))
    {
        CharacterOwner->PlayAnimMontage(Attack.AttackMontage);
    }

    return true;
}

void UGCMeleeComponent::BeginHitWindow()
{
    bHitWindowActive = true;
}

void UGCMeleeComponent::EndHitWindow()
{
    bHitWindowActive = false;
    ActiveAttackIndex = INDEX_NONE;
    HitActorsThisSwing.Reset();
}

void UGCMeleeComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    IFrameTimer = FMath::Max(0.0f, IFrameTimer - DeltaTime);

    if (!bHitWindowActive || !ComboAttacks.IsValidIndex(ActiveAttackIndex))
    {
        return;
    }

    const FMeleeAttackSpec& Attack = ComboAttacks[ActiveAttackIndex];
    const USkeletalMeshComponent* Mesh = Cast<ACharacter>(GetOwner())->GetMesh();
    const FVector Start = Mesh->GetSocketLocation(Attack.TraceStartSocket);
    const FVector End = Mesh->GetSocketLocation(Attack.TraceEndSocket);

    TArray<FHitResult> Hits;
    UKismetSystemLibrary::SphereTraceMulti(
        this,
        Start,
        End,
        TraceRadius,
        UEngineTypes::ConvertToTraceType(ECC_Pawn),
        false,
        {GetOwner()},
        bDrawDebugTrace ? EDrawDebugTrace::ForOneFrame : EDrawDebugTrace::None,
        Hits,
        true);

    for (const FHitResult& Hit : Hits)
    {
        AActor* HitActor = Hit.GetActor();
        if (!HitActor || HitActorsThisSwing.Contains(HitActor))
        {
            continue;
        }

        HitActorsThisSwing.Add(HitActor);
        BP_OnMeleeHit(HitActor, Attack.Damage);
        BP_OnStaggerApplied(HitActor, StaggerSeconds);

        if (bDrawDebugTrace)
        {
            DrawDebugSphere(GetWorld(), Hit.ImpactPoint, TraceRadius, 12, FColor::Red, false, 0.2f);
        }
    }
}
