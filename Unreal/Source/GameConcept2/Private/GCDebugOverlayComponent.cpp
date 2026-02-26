#include "GCDebugOverlayComponent.h"

#include "DrawDebugHelpers.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"

UGCDebugOverlayComponent::UGCDebugOverlayComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UGCDebugOverlayComponent::SetAIState(EEnemyAIState InState)
{
    CachedState = InState;
}

void UGCDebugOverlayComponent::SetCooldownPercent(float InCooldownPercent)
{
    CooldownPercent = FMath::Clamp(InCooldownPercent, 0.0f, 1.0f);
}

void UGCDebugOverlayComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (GEngine && GetOwner())
    {
        const FString Message = FString::Printf(TEXT("AI: %d | Cooldown: %.0f%%"), static_cast<int32>(CachedState), CooldownPercent * 100.0f);
        GEngine->AddOnScreenDebugMessage(reinterpret_cast<uint64>(this), 0.0f, FColor::Green, Message);

        if (bShowPerceptionCone)
        {
            DrawDebugCone(
                GetWorld(),
                GetOwner()->GetActorLocation(),
                GetOwner()->GetActorForwardVector(),
                800.0f,
                FMath::DegreesToRadians(35.0f),
                FMath::DegreesToRadians(35.0f),
                12,
                FColor::Cyan,
                false,
                -1.0f,
                0,
                1.2f);
        }

        if (bShowMeleeTraces)
        {
            DrawDebugSphere(GetWorld(), GetOwner()->GetActorLocation() + GetOwner()->GetActorForwardVector() * 120.0f, 50.0f, 12, FColor::Orange, false, -1.0f, 0, 1.0f);
        }
    }
}
