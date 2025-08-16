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
    env?: string;
}

export type NoteKind = 'notes' | 'to-do' | 'accounts' | 'files';

export interface Note {
  id?: number;
  title: string;
  kind: NoteKind;
  body: string;          // ignored when kind === 'files'
  createdAt: string;
  updatedAt: string;
  env?: string;
}