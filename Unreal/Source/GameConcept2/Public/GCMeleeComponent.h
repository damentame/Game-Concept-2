#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "GCMeleeComponent.generated.h"

class UAnimMontage;

USTRUCT(BlueprintType)
struct FMeleeAttackSpec
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TObjectPtr<UAnimMontage> AttackMontage;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName TraceStartSocket = TEXT("hand_r_start");

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName TraceEndSocket = TEXT("hand_r_end");

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Damage = 15.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float StaminaCost = 20.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float InvulnerabilitySeconds = 0.15f;
};

UCLASS(ClassGroup=(Combat), meta=(BlueprintSpawnableComponent))
class UGCMeleeComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UGCMeleeComponent();

    UFUNCTION(BlueprintCallable)
    bool TryStartAttack(int32 AttackIndex);

    UFUNCTION(BlueprintCallable)
    void BeginHitWindow();

    UFUNCTION(BlueprintCallable)
    void EndHitWindow();

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

protected:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Melee")
    TArray<FMeleeAttackSpec> ComboAttacks;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Melee")
    float StaggerSeconds = 0.35f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Melee")
    float TraceRadius = 14.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Melee")
    bool bDrawDebugTrace = true;

    UFUNCTION(BlueprintImplementableEvent, Category = "Melee")
    bool BP_ConsumeStamina(float Cost);

    UFUNCTION(BlueprintImplementableEvent, Category = "Melee")
    void BP_OnMeleeHit(AActor* HitActor, float Damage);

    UFUNCTION(BlueprintImplementableEvent, Category = "Melee")
    void BP_OnStaggerApplied(AActor* HitActor, float Duration);

private:
    bool bHitWindowActive = false;
    float IFrameTimer = 0.0f;
    int32 ActiveAttackIndex = INDEX_NONE;
    TSet<TWeakObjectPtr<AActor>> HitActorsThisSwing;
};
