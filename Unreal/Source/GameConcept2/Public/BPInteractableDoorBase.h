#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BPInteractableDoorBase.generated.h"

class UTimelineComponent;
class UCurveFloat;

UENUM(BlueprintType)
enum class EDoorLockState : uint8
{
    Unlocked,
    RequiresKey,
    LockedPermanently
};

UCLASS(Blueprintable)
class ABPInteractableDoorBase : public AActor
{
    GENERATED_BODY()

public:
    ABPInteractableDoorBase();

    UFUNCTION(BlueprintCallable)
    bool TryInteract(AActor* Interactor);

    UFUNCTION(BlueprintCallable)
    bool TryOpenForAI(APawn* AIPawn);

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<USceneComponent> Root;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UStaticMeshComponent> DoorMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UTimelineComponent> DoorTimeline;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Door")
    TObjectPtr<UCurveFloat> OpenCurve;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    EDoorLockState LockState = EDoorLockState::Unlocked;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    bool bAllowAIOpen = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Door")
    float OpenYawAngle = 95.0f;

    UPROPERTY(BlueprintReadOnly, Category = "Door")
    bool bIsOpen = false;

    UFUNCTION(BlueprintImplementableEvent)
    bool BP_CanUnlock(AActor* Interactor) const;

    UFUNCTION(BlueprintImplementableEvent)
    void BP_OnDoorStateChanged(bool bOpened);

private:
    FRotator ClosedRotation;

    UFUNCTION()
    void OnDoorTimelineTick(float Alpha);

    void StartDoorTransition(bool bOpenTarget);
};
