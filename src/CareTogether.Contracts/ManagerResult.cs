using OneOf;
using OneOf.Types;

namespace CareTogether
{
    public struct NotAllowed { }

    public class ManagerResult<T> : OneOfBase<T, NotAllowed, NotFound>
    {
        ManagerResult(OneOf<T, NotAllowed, NotFound> _) : base(_) { }

        public static implicit operator ManagerResult<T>(NotAllowed _) => new ManagerResult<T>(_);
        public static implicit operator ManagerResult<T>(NotFound _) => new ManagerResult<T>(_);
        public static implicit operator ManagerResult<T>(T _) => new ManagerResult<T>(_);
        public static implicit operator ManagerResult<T>(ResourceResult<T> _) =>
            _.Match(
                value => new ManagerResult<T>(value),
                notFound => new ManagerResult<T>(new NotFound()));
    }

    public static class ManagerResult
    {
        public static NotAllowed NotAllowed { get; } = new NotAllowed();
        public static NotFound NotFound { get; } = new NotFound();
    }
}
