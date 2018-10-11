var ZipLite;
(function (ZipLite) {
    function LoadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                resolve({ data: reader.result, file: file });
            });
            reader.addEventListener('abort', (event) => { reject(event); });
            reader.addEventListener('error', (event) => { reject(event); });
            reader.readAsArrayBuffer(file);
        });
    }
    function NumberToLEArray(num, length) {
        const data = new Uint8Array(length);
        num = Math.floor(num);
        for (let i = 0; i < length; ++i) {
            data[i] = num & 0xFF;
            num = num >>> 8;
        }
        return data;
    }
    function LEArrayToNumber(data, offset, length) {
        let num = 0;
        for (let i = 0; i < length; ++i) {
            num = (num << 8) | data[offset + i];
        }
        return num;
    }
    function DateToLEArray(date) {
        const data = new Uint8Array(4);
        return data;
    }
    function LEArrayToDate(data, offset) {
        return new Date();
    }
    const CRCTable = [
        0, 1996959894, -301047508, -1727442502, 124634137, 1886057615, -379345611, -1637575261,
        249268274, 2044508324, -522852066, -1747789432, 162941995, 2125561021, -407360249, -1866523247,
        498536548, 1789927666, -205950648, -2067906082, 450548861, 1843258603, -187386543, -2083289657,
        325883990, 1684777152, -43845254, -1973040660, 335633487, 1661365465, -99664541, -1928851979,
        997073096, 1281953886, -715111964, -1570279054, 1006888145, 1258607687, -770865667, -1526024853,
        901097722, 1119000684, -608450090, -1396901568, 853044451, 1172266101, -589951537, -1412350631,
        651767980, 1373503546, -925412992, -1076862698, 565507253, 1454621731, -809855591, -1195530993,
        671266974, 1594198024, -972236366, -1324619484, 795835527, 1483230225, -1050600021, -1234817731,
        1994146192, 31158534, -1731059524, -271249366, 1907459465, 112637215, -1614814043, -390540237,
        2013776290, 251722036, -1777751922, -519137256, 2137656763, 141376813, -1855689577, -429695999,
        1802195444, 476864866, -2056965928, -228458418, 1812370925, 453092731, -2113342271, -183516073,
        1706088902, 314042704, -1950435094, -54949764, 1658658271, 366619977, -1932296973, -69972891,
        1303535960, 984961486, -1547960204, -725929758, 1256170817, 1037604311, -1529756563, -740887301,
        1131014506, 879679996, -1385723834, -631195440, 1141124467, 855842277, -1442165665, -586318647,
        1342533948, 654459306, -1106571248, -921952122, 1466479909, 544179635, -1184443383, -832445281,
        1591671054, 702138776, -1328506846, -942167884, 1504918807, 783551873, -1212326853, -1061524307,
        -306674912, -1698712650, 62317068, 1957810842, -355121351, -1647151185, 81470997, 1943803523,
        -480048366, -1805370492, 225274430, 2053790376, -468791541, -1828061283, 167816743, 2097651377,
        -267414716, -2029476910, 503444072, 1762050814, -144550051, -2140837941, 426522225, 1852507879,
        -19653770, -1982649376, 282753626, 1742555852, -105259153, -1900089351, 397917763, 1622183637,
        -690576408, -1580100738, 953729732, 1340076626, -776247311, -1497606297, 1068828381, 1219638859,
        -670225446, -1358292148, 906185462, 1090812512, -547295293, -1469587627, 829329135, 1181335161,
        -882789492, -1134132454, 628085408, 1382605366, -871598187, -1156888829, 570562233, 1426400815,
        -977650754, -1296233688, 733239954, 1555261956, -1026031705, -1244606671, 752459403, 1541320221,
        -1687895376, -328994266, 1969922972, 40735498, -1677130071, -351390145, 1913087877, 83908371,
        -1782625662, -491226604, 2075208622, 213261112, -1831694693, -438977011, 2094854071, 198958881,
        -2032938284, -237706686, 1759359992, 534414190, -2118248755, -155638181, 1873836001, 414664567,
        -2012718362, -15766928, 1711684554, 285281116, -1889165569, -127750551, 1634467795, 376229701,
        -1609899400, -686959890, 1308918612, 956543938, -1486412191, -799009033, 1231636301, 1047427035,
        -1362007478, -640263460, 1088359270, 936918000, -1447252397, -558129467, 1202900863, 817233897,
        -1111625188, -893730166, 1404277552, 615818150, -1160759803, -841546093, 1423857449, 601450431,
        -1285129682, -1000256840, 1567103746, 711928724, -1274298825, -1022587231, 1510334235, 755167117,
    ];
    function CRC32(data) {
        let crc = 0 ^ -1;
        for (let b of data) {
            crc = (crc >>> 8) ^ CRCTable[(crc ^ b) & 0xFF];
        }
        console.log(crc, NumberToLEArray(crc, 4), crc ^ -1, NumberToLEArray(crc ^ -1, 4));
        return NumberToLEArray(crc ^ -1, 4);
    }
    ZipLite.CRC32 = CRC32;
    class Zip {
        constructor() {
            this.files = {};
        }
        createPKFile(name, data, date) {
            const header = {};
            const file = {
                data: data,
            };
            const pkfile = {
                date: date,
                name: name,
                header: header,
                file: file,
            };
            return pkfile;
        }
        loadFile(file) {
            return LoadFile(file).then((result) => {
                return this.createPKFile(file.name, new Uint8Array(result.data), new Date(file.lastModified));
            });
        }
        createFile(file, data, date) {
            return Promise.resolve(this.createPKFile(file, data, date));
        }
        addFile(file, data, date) {
            return ((typeof file === 'string') ?
                this.createFile(file, data || '', date || new Date()) :
                this.loadFile(file)).then((pkfile) => {
                this.files[pkfile.name] = pkfile;
            });
        }
        convertPK0102(pkfile, file, position) {
            const filename = (new TextEncoder()).encode(pkfile.name);
            const data = new Uint8Array(46 + filename.length);
            let b = 0;
            data[b++] = 0x50;
            data[b++] = 0x4B;
            data[b++] = 0x01;
            data[b++] = 0x02;
            data[b++] = file[4];
            data[b++] = file[5];
            data[b++] = file[4];
            data[b++] = file[5];
            data[b++] = file[6];
            data[b++] = file[7];
            data[b++] = file[8];
            data[b++] = file[9];
            data[b++] = file[10];
            data[b++] = file[11];
            data[b++] = file[12];
            data[b++] = file[13];
            data[b++] = file[14];
            data[b++] = file[15];
            data[b++] = file[16];
            data[b++] = file[17];
            data[b++] = file[18];
            data[b++] = file[19];
            data[b++] = file[20];
            data[b++] = file[21];
            data[b++] = file[22];
            data[b++] = file[23];
            data[b++] = file[24];
            data[b++] = file[25];
            data[b++] = file[26];
            data[b++] = file[27];
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            const pos = NumberToLEArray(position, 4);
            for (let i = 0; i < 4; ++i) {
                data[b++] = pos[i];
            }
            for (let v of filename) {
                data[b++] = v;
            }
            return data;
        }
        convertPK0304(pkfile) {
            const filename = (new TextEncoder()).encode(pkfile.name);
            const file = typeof pkfile.file.data === 'string' ? (new TextEncoder()).encode(pkfile.file.data) : pkfile.file.data;
            const data = new Uint8Array(30 + filename.length + file.length);
            let b = 0;
            data[b++] = 0x50;
            data[b++] = 0x4B;
            data[b++] = 0x03;
            data[b++] = 0x04;
            data[b++] = 0x14;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            data[b++] = 0x00;
            const date = DateToLEArray(pkfile.date);
            data[b++] = date[0];
            data[b++] = date[1];
            data[b++] = date[2];
            data[b++] = date[3];
            const crc32 = CRC32(file);
            data[b++] = crc32[0];
            data[b++] = crc32[1];
            data[b++] = crc32[2];
            data[b++] = crc32[3];
            const size = NumberToLEArray(pkfile.file.data.length, 4);
            for (let i = 0; i < 4; ++i) {
                data[b + i] = data[b + i + 4] = size[i];
            }
            b += 8;
            const namesize = NumberToLEArray(filename.length, 2);
            for (let i = 0; i < 2; ++i) {
                data[b++] = namesize[i];
            }
            data[b++] = 0x00;
            data[b++] = 0x00;
            for (let v of filename) {
                data[b++] = v;
            }
            for (let v of file) {
                data[b++] = v;
            }
            return data;
        }
        generate() {
            const pk0102 = [];
            const pk0304 = [];
            let position = 0;
            let headersize = 0;
            Object.keys(this.files).forEach((key) => {
                const pkfile = this.files[key];
                const file = this.convertPK0304(pkfile);
                const header = this.convertPK0102(pkfile, file, position);
                position += file.length;
                headersize += header.length;
                pk0102.push(header);
                pk0304.push(file);
            });
            const pk0506 = new Uint8Array(22);
            let b = 0;
            pk0506[b++] = 0x50;
            pk0506[b++] = 0x4B;
            pk0506[b++] = 0x05;
            pk0506[b++] = 0x06;
            pk0506[b++] = 0x00;
            pk0506[b++] = 0x00;
            pk0506[b++] = 0x00;
            pk0506[b++] = 0x00;
            const size = NumberToLEArray(pk0102.length, 2);
            for (let i = 0; i < 2; ++i) {
                pk0506[b + i] = pk0506[b + i + 2] = size[i];
            }
            b += 4;
            const hsize = NumberToLEArray(headersize, 4);
            for (let i = 0; i < 4; ++i) {
                pk0506[b++] = hsize[i];
            }
            const pos = NumberToLEArray(position, 4);
            for (let i = 0; i < 4; ++i) {
                pk0506[b++] = pos[i];
            }
            pk0506[b++] = 0x00;
            pk0506[b++] = 0x00;
            const zip = new Uint8Array(position + headersize + pk0506.length);
            let z = 0;
            pk0304.forEach((file) => { for (let v of file) {
                zip[z++] = v;
            } });
            pk0102.forEach((file) => { for (let v of file) {
                zip[z++] = v;
            } });
            for (let v of pk0506) {
                zip[z++] = v;
            }
            return zip;
        }
        loadPKFile(zip, offset) {
            offset += 4;
            if (zip[offset++] !== 0x14 || zip[offset++] !== 0x00) {
                throw 'Version error';
            }
            offset += 2;
            if (zip[offset++] !== 0x00 || zip[offset++] !== 0x00) {
                throw 'Unknown compression algorithm';
            }
            const date = LEArrayToDate(zip, offset);
            offset += 4;
            offset += 4;
            const filesize = LEArrayToNumber(zip, offset, 4);
            offset += 8;
            const namesize = LEArrayToNumber(zip, offset, 2);
            offset += 2;
            const commentsize = LEArrayToNumber(zip, offset, 2);
            offset += 2;
            const name = new TextDecoder('utf-8').decode(zip.slice(offset, offset + namesize));
            offset += namesize;
            offset += commentsize;
            const data = zip.slice(offset, offset + filesize);
            offset += filesize;
            const header = {};
            const file = {
                data: data,
            };
            const pkfile = {
                date: date,
                name: name,
                header: header,
                file: file,
            };
            this.files[name] = pkfile;
            return offset;
        }
        load(data) {
            this.files = {};
            let offset = 0;
            while (offset < data.length) {
                if (data[offset] !== 0x50 || data[offset + 1] !== 0x4B) {
                    throw 'Error token.';
                }
                if (data[offset + 2] !== 0x03 || data[offset + 3] !== 0x04) {
                    if (data[offset + 2] === 0x01 || data[offset + 3] === 0x02) {
                        break;
                    }
                    throw 'Error token.';
                }
                offset += this.loadPKFile(data, offset);
            }
        }
        size() { return Object.keys(this.files).length; }
        get(filename) {
            if (!this.files[filename]) {
                return null;
            }
            return this.files[filename].file.data;
        }
        rename(oldname, newname) {
            if (!oldname || !newname || !this.files[oldname]) {
                return false;
            }
            this.files[newname] = this.files[oldname];
            delete this.files[oldname];
        }
        remove(filename) {
            if (!filename) {
                return false;
            }
            if (typeof filename === 'string') {
                delete this.files[filename];
                return true;
            }
            filename.forEach((file) => { delete this.files[file]; });
            return true;
        }
        removeAll() { this.files = {}; }
    }
    ZipLite.Zip = Zip;
    function zip() { }
    ZipLite.zip = zip;
    function unzip(zipfile) {
        const zip = new Zip();
        return LoadFile(zipfile).then((data) => {
            zip.load(new Uint8Array(data.data));
            return zip;
        });
    }
    ZipLite.unzip = unzip;
})(ZipLite || (ZipLite = {}));
