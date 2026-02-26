#pragma once

#include "CoreMinimal.h"
#include "GCEnemyTypes.generated.h"

UENUM(BlueprintType)
enum class EEnemyAIState : uint8
{
    Patrol,
    Investigate,
    Chase,
    Attack,
    Recover
};

USTRUCT(BlueprintType)
struct FEnemySenseMemory
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector LastSeenLocation = FVector::ZeroVector;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector LastHeardLocation = FVector::ZeroVector;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float LastSenseAgeSeconds = 0.0f;
};
