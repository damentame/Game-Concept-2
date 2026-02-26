#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GCEnemyTypes.h"
#include "GCDebugOverlayComponent.generated.h"

UCLASS(ClassGroup=(Debug), meta=(BlueprintSpawnableComponent))
class UGCDebugOverlayComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UGCDebugOverlayComponent();

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable)
    void SetAIState(EEnemyAIState InState);

    UFUNCTION(BlueprintCallable)
    void SetCooldownPercent(float InCooldownPercent);

protected:
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bShowPerceptionCone = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bShowMeleeTraces = true;

private:
    EEnemyAIState CachedState = EEnemyAIState::Patrol;
    float CooldownPercent = 0.0f;
};
