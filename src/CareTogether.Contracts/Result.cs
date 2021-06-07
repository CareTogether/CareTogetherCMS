using OneOf;

namespace CareTogether
{
    public sealed record NotAllowed();
    public sealed record NotFound();

    public class Result<T> : OneOfBase<T, NotAllowed, NotFound>
    {
        Result(OneOf<T, NotAllowed, NotFound> _) : base(_) { }

        public static implicit operator Result<T>(NotAllowed _) => new Result<T>(_);
        public static implicit operator Result<T>(NotFound _) => new Result<T>(_);
        public static implicit operator Result<T>(T _) => new Result<T>(_);
    }

    public static class Result
    {
        public static NotAllowed NotAllowed { get; } = new NotAllowed();
        public static NotFound NotFound { get; } = new NotFound();
    }
}
