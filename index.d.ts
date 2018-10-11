declare module ZipLite {
    function CRC32(data: Uint8Array): Uint8Array;
    interface ZipFile {
        filename: string;
        data: Uint8Array | string;
    }
    class Zip {
        private files;
        constructor();
        private createPKFile;
        private loadFile;
        private createFile;
        addFile(file: File | string, data?: Uint8Array | string, date?: Date): Promise<void>;
        private convertPK0102;
        private convertPK0304;
        generate(): Uint8Array;
        private loadPKFile;
        load(data: Uint8Array): void;
        size(): number;
        get(filename: string): Uint8Array | string | null;
        rename(oldname: string, newname: string): false | undefined;
        remove(filename: string | string[]): boolean;
        removeAll(): void;
    }
    function zip(): void;
    function unzip(zipfile: File): Promise<Zip>;
}
