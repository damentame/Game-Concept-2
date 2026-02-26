#pragma once

#include "CoreMinimal.h"
#include "AIController.h"
#include "Perception/AIPerceptionTypes.h"
#include "GCEnemyTypes.h"
#include "GCEnemyAIController.generated.h"

class UAIPerceptionComponent;
class UBehaviorTree;
class UBlackboardComponent;
class UAISenseConfig_Sight;
class UAISenseConfig_Hearing;

UCLASS()
class AGCEnemyAIController : public AAIController
{
    GENERATED_BODY()

public:
    AGCEnemyAIController();

    virtual void OnPossess(APawn* InPawn) override;
    virtual void Tick(float DeltaSeconds) override;

    UFUNCTION(BlueprintCallable)
    void SetAIState(EEnemyAIState NewState);

    UFUNCTION(BlueprintPure)
    EEnemyAIState GetAIState() const { return CurrentState; }

protected:
    UPROPERTY(EditDefaultsOnly, Category = "AI")
    TObjectPtr<UBehaviorTree> BehaviorTreeAsset;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "AI")
    TObjectPtr<UAIPerceptionComponent> Perception;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "AI")
    TObjectPtr<UBlackboardComponent> CachedBlackboard;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "AI|State")
    float RecoverDurationSeconds = 1.25f;

    UPROPERTY(BlueprintReadOnly, Category = "AI|State")
    EEnemyAIState CurrentState = EEnemyAIState::Patrol;

    UPROPERTY(BlueprintReadOnly, Category = "AI|State")
    FEnemySenseMemory SenseMemory;

    UFUNCTION()
    void HandleTargetPerception(AActor* Actor, FAIStimulus Stimulus);

    UFUNCTION(BlueprintImplementableEvent, Category = "AI")
    void BP_OnStateChanged(EEnemyAIState NewState);

private:
    float RecoverTimer = 0.0f;

    static const FName BB_State;
    static const FName BB_TargetActor;
    static const FName BB_LastKnownLocation;
};
