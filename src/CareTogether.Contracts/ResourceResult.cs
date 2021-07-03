using OneOf;
using OneOf.Types;

namespace CareTogether
{
    public class ResourceResult<T> : OneOfBase<T, NotFound>
    {
        ResourceResult(OneOf<T, NotFound> _) : base(_) { }

        public static implicit operator ResourceResult<T>(NotFound _) => new ResourceResult<T>(_);
        public static implicit operator ResourceResult<T>(T _) => new ResourceResult<T>(_);
    }

    public static class ResourceResult
    {
        public static NotFound NotFound { get; } = new NotFound();
    }
}
