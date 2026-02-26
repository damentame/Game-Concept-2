#include "GCEnemyAIController.h"

#include "BehaviorTree/BehaviorTree.h"
#include "BehaviorTree/BlackboardComponent.h"
#include "Perception/AIPerceptionComponent.h"
#include "Perception/AISenseConfig_Hearing.h"
#include "Perception/AISenseConfig_Sight.h"

const FName AGCEnemyAIController::BB_State = TEXT("AIState");
const FName AGCEnemyAIController::BB_TargetActor = TEXT("TargetActor");
const FName AGCEnemyAIController::BB_LastKnownLocation = TEXT("LastKnownLocation");

AGCEnemyAIController::AGCEnemyAIController()
{
    PrimaryActorTick.bCanEverTick = true;

    Perception = CreateDefaultSubobject<UAIPerceptionComponent>(TEXT("Perception"));
    SetPerceptionComponent(*Perception);

    UAISenseConfig_Sight* Sight = CreateDefaultSubobject<UAISenseConfig_Sight>(TEXT("SightConfig"));
    Sight->SightRadius = 1600.0f;
    Sight->LoseSightRadius = 1800.0f;
    Sight->PeripheralVisionAngleDegrees = 70.0f;
    Sight->SetMaxAge(3.0f);
    Perception->ConfigureSense(*Sight);

    UAISenseConfig_Hearing* Hearing = CreateDefaultSubobject<UAISenseConfig_Hearing>(TEXT("HearingConfig"));
    Hearing->HearingRange = 1300.0f;
    Hearing->SetMaxAge(2.0f);
    Perception->ConfigureSense(*Hearing);

    Perception->SetDominantSense(Sight->GetSenseImplementation());
    Perception->OnTargetPerceptionUpdated.AddDynamic(this, &AGCEnemyAIController::HandleTargetPerception);
}

void AGCEnemyAIController::OnPossess(APawn* InPawn)
{
    Super::OnPossess(InPawn);

    if (!BehaviorTreeAsset)
    {
        return;
    }

    UseBlackboard(BehaviorTreeAsset->BlackboardAsset, CachedBlackboard);
    RunBehaviorTree(BehaviorTreeAsset);
    SetAIState(EEnemyAIState::Patrol);
}

void AGCEnemyAIController::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    SenseMemory.LastSenseAgeSeconds += DeltaSeconds;

    if (CurrentState == EEnemyAIState::Recover)
    {
        RecoverTimer -= DeltaSeconds;
        if (RecoverTimer <= 0.0f)
        {
            SetAIState(EEnemyAIState::Patrol);
        }
    }
}

void AGCEnemyAIController::SetAIState(EEnemyAIState NewState)
{
    if (CurrentState == NewState)
    {
        return;
    }

    CurrentState = NewState;

    if (CachedBlackboard)
    {
        CachedBlackboard->SetValueAsEnum(BB_State, static_cast<uint8>(CurrentState));
        CachedBlackboard->SetValueAsVector(BB_LastKnownLocation, SenseMemory.LastSeenLocation);
    }

    if (CurrentState == EEnemyAIState::Recover)
    {
        RecoverTimer = RecoverDurationSeconds;
    }

    BP_OnStateChanged(CurrentState);
}

void AGCEnemyAIController::HandleTargetPerception(AActor* Actor, FAIStimulus Stimulus)
{
    if (!CachedBlackboard)
    {
        return;
    }

    if (Stimulus.Type.Name == TEXT("Default__AISense_Sight"))
    {
        if (Stimulus.WasSuccessfullySensed())
        {
            SenseMemory.LastSeenLocation = Stimulus.StimulusLocation;
            SenseMemory.LastSenseAgeSeconds = 0.0f;
            CachedBlackboard->SetValueAsObject(BB_TargetActor, Actor);
            SetAIState(EEnemyAIState::Chase);
        }
        else
        {
            CachedBlackboard->ClearValue(BB_TargetActor);
            SetAIState(EEnemyAIState::Investigate);
        }
    }
    else
    {
        SenseMemory.LastHeardLocation = Stimulus.StimulusLocation;
        SenseMemory.LastSenseAgeSeconds = 0.0f;
        CachedBlackboard->SetValueAsVector(BB_LastKnownLocation, SenseMemory.LastHeardLocation);
        if (CurrentState == EEnemyAIState::Patrol)
        {
            SetAIState(EEnemyAIState::Investigate);
        }
    }
}
