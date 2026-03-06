import dotenv from 'dotenv';
dotenv.config();

class KeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;

    constructor() {
        const rawKeys = process.env.GOOGLE_API_KEYS || process.env.GOOGLE_API_KEY || '';
        this.keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    public getNextKey(): string {
        if (this.keys.length === 0) return '';
        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    public hasKeys(): boolean {
        return this.keys.length > 0;
    }
}

export const keyManager = new KeyManager();