export class OnceReadMap<K, V> extends Map<K, V> {
    get(key: K): V | undefined {
        const value = super.get(key);
        if (value !== undefined) {
            this.delete(key);
        }
        return value;
    }
}