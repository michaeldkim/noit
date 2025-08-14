// types.ts
export type BlobStorage = 'opfs' | 'idb';

export interface FileMeta {
    id: number;
    name: string;
    type:string;
    size: number;
    lastModified: number;
    createdAt: string;
    storage: BlobStorage;
    location: string;
}