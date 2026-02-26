using UnrealBuildTool;
using System.Collections.Generic;

public class GameConcept2Target : TargetRules
{
    public GameConcept2Target(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V2;
        ExtraModuleNames.Add("GameConcept2");
    }
}
