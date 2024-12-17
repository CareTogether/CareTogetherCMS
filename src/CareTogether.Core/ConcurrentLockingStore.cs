using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Nito.AsyncEx;

namespace CareTogether
{
    public sealed class ConcurrentLockingStore<TKey, TValue>
        where TKey : notnull
    {
        readonly ConcurrentDictionary<TKey, AsyncReaderWriterLock> _ItemLocks = new();
        readonly ConcurrentDictionary<TKey, AsyncLazy<TValue>> _Items = new();
        readonly Func<TKey, Task<TValue>> _ValueFactory;

        public ConcurrentLockingStore(Func<TKey, Task<TValue>> valueFactory)
        {
            _ValueFactory = valueFactory;
        }

        public async Task<LockedItem<TValue>> WriteLockItemAsync(TKey key)
        {
            (AsyncReaderWriterLock itemLock, TValue item) = await GetOrAddAsync(key);
            IDisposable writeLock = await itemLock.WriterLockAsync();
            return new LockedItem<TValue>(writeLock, item);
        }

        public async Task<LockedItem<TValue>> ReadLockItemAsync(TKey key)
        {
            (AsyncReaderWriterLock itemLock, TValue item) = await GetOrAddAsync(key);
            IDisposable writeLock = await itemLock.ReaderLockAsync();
            return new LockedItem<TValue>(writeLock, item);
        }

        async Task<(AsyncReaderWriterLock itemLock, TValue item)> GetOrAddAsync(TKey key)
        {
            AsyncReaderWriterLock itemLock = _ItemLocks.GetOrAdd(key, new AsyncReaderWriterLock());
            AsyncLazy<TValue> lazyItem = _Items.GetOrAdd(
                key,
                keyToAdd => new AsyncLazy<TValue>(() => _ValueFactory(keyToAdd))
            );
            TValue? item = await lazyItem; //TODO: await lazyItem.Task instead?
            return (itemLock, item);
        }

        public sealed class LockedItem<T> : IDisposable
        {
            readonly IDisposable _LockHandle;

            public LockedItem(IDisposable lockHandle, T value)
            {
                _LockHandle = lockHandle;
                Value = value;
            }

            public T Value { get; }

            public void Dispose()
            {
                _LockHandle.Dispose();
            }
        }
    }
}
