
namespace CareTogether.Engines
{
    public sealed record RoleVersionApproval(string Version, RoleApprovalStatus ApprovalStatus);

    public enum RoleApprovalStatus { Prospective = 0, Approved = 1, Onboarded = 2 };
}
