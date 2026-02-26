#include "BPInteractableDoorBase.h"

#include "Components/StaticMeshComponent.h"
#include "Components/TimelineComponent.h"

ABPInteractableDoorBase::ABPInteractableDoorBase()
{
    PrimaryActorTick.bCanEverTick = false;

    Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    SetRootComponent(Root);

    DoorMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DoorMesh"));
    DoorMesh->SetupAttachment(Root);

    DoorTimeline = CreateDefaultSubobject<UTimelineComponent>(TEXT("DoorTimeline"));
}

bool ABPInteractableDoorBase::TryInteract(AActor* Interactor)
{
    if (LockState == EDoorLockState::LockedPermanently)
    {
        return false;
    }

    if (LockState == EDoorLockState::RequiresKey && !BP_CanUnlock(Interactor))
    {
        return false;
    }

    StartDoorTransition(!bIsOpen);
    return true;
}

bool ABPInteractableDoorBase::TryOpenForAI(APawn* AIPawn)
{
    if (!bAllowAIOpen || LockState != EDoorLockState::Unlocked)
    {
        return false;
    }

    return TryInteract(AIPawn);
}

void ABPInteractableDoorBase::OnDoorTimelineTick(float Alpha)
{
    const float SignedYaw = (bIsOpen ? 1.0f : -1.0f) * OpenYawAngle;
    DoorMesh->SetRelativeRotation(FMath::Lerp(ClosedRotation, ClosedRotation + FRotator(0.0f, SignedYaw, 0.0f), Alpha));
}

void ABPInteractableDoorBase::StartDoorTransition(bool bOpenTarget)
{
    if (!OpenCurve || !DoorTimeline)
    {
        bIsOpen = bOpenTarget;
        BP_OnDoorStateChanged(bIsOpen);
        return;
    }

    bIsOpen = bOpenTarget;
    ClosedRotation = DoorMesh->GetRelativeRotation();

    FOnTimelineFloat TickDelegate;
    TickDelegate.BindUFunction(this, FName("OnDoorTimelineTick"));
    DoorTimeline->AddInterpFloat(OpenCurve, TickDelegate);

    DoorTimeline->PlayFromStart();
    BP_OnDoorStateChanged(bIsOpen);
}
