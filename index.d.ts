declare module ZipLite {
    function CRC32(data: Uint8Array): Uint8Array;
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
        load(zipfile: File): void;
    }
    function zip(): void;
    function unzip(): void;
}
