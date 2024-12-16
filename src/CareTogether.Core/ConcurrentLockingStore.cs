using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Nito.AsyncEx;

namespace CareTogether
{
    public sealed class ConcurrentLockingStore<TKey, TValue>
        where TKey : notnull
    {
        public sealed class LockedItem<T> : IDisposable
        {
            private readonly IDisposable lockHandle;

            public T Value { get; }

            public LockedItem(IDisposable lockHandle, T value)
            {
                this.lockHandle = lockHandle;
                Value = value;
            }

            public void Dispose()
            {
                lockHandle.Dispose();
            }
        }

        private readonly ConcurrentDictionary<TKey, AsyncReaderWriterLock> itemLocks = new();
        private readonly ConcurrentDictionary<TKey, AsyncLazy<TValue>> items = new();
        private readonly Func<TKey, Task<TValue>> valueFactory;

        public ConcurrentLockingStore(Func<TKey, Task<TValue>> valueFactory)
        {
            this.valueFactory = valueFactory;
        }

        public async Task<LockedItem<TValue>> WriteLockItemAsync(TKey key)
        {
            var (itemLock, item) = await GetOrAddAsync(key);
            var writeLock = await itemLock.WriterLockAsync();
            return new LockedItem<TValue>(writeLock, item);
        }

        public async Task<LockedItem<TValue>> ReadLockItemAsync(TKey key)
        {
            var (itemLock, item) = await GetOrAddAsync(key);
            var writeLock = await itemLock.ReaderLockAsync();
            return new LockedItem<TValue>(writeLock, item);
        }

        private async Task<(AsyncReaderWriterLock itemLock, TValue item)> GetOrAddAsync(TKey key)
        {
            var itemLock = itemLocks.GetOrAdd(key, new AsyncReaderWriterLock());
            var lazyItem = items.GetOrAdd(key, (keyToAdd) => new AsyncLazy<TValue>(() => valueFactory(keyToAdd)));
            var item = await lazyItem; //TODO: await lazyItem.Task instead?
            return (itemLock, item);
        }
    }
}
