
module ZipLite
{

	interface PKFile
	{
		date: Date;
		name: string;
		header: PK0102;
		file: PK0304;
		// file type ... bin=00 00,txt=01 00
		// file attribute
	}

	interface PK0304
	{
		//comment
		data: Uint8Array | string;
	}

	interface PK0102
	{
		// ex field.
		// split
	}

	function LoadFile( file: File )
	{
		return new Promise<{ data: ArrayBuffer, file: File }>( ( resolve, reject ) =>
		{
			const reader = new FileReader();

			reader.addEventListener( 'load', ( event ) =>
			{
				resolve( { data: <ArrayBuffer>reader.result, file: file } );
			} );
			reader.addEventListener( 'abort', ( event ) => { reject( event ); } );
			reader.addEventListener( 'error', ( event ) => { reject( event ); } );

			reader.readAsArrayBuffer( file );
		} );
	}

	function NumberToLEArray( num: number, length: number )
	{
		const data = new Uint8Array( length );
		num = Math.floor( num );

		for ( let i = 0 ; i < length ; ++i )
		{
			data[ i ] = num & 0xFF;
			num = num >>> 8;
		}

		return data;
	}

	function LEArrayToNumber( data: Uint8Array, offset: number, length: number )
	{
		let num = 0;
		for ( let i = 1 ; i <= length ; ++i ) { num = ( num << 8 ) | data[ offset + length - i ]; }
		return num;
	}

	function DateToLEArray( date: Date )
	{
		const data = new Uint8Array( 4 );

		const Y = ( date.getFullYear() - 1980 ) & 0x7F;
		const M = ( date.getMonth() + 1 ) & 0xF;
		const D = ( date.getDate() ) & 0x1F;
		const h = ( date.getHours() ) & 0x1F;
		const m = ( date.getMinutes() ) & 0x3F;
		const s = Math.floor( date.getSeconds() / 2 ) & 0x1F;

		// hhhhhmmm
		data[ 0 ] = ( h << 3 ) | ( m >>> 3 );
		// mmmsssss
		data[ 1 ] = ( ( m & 0x7 ) << 5 ) | s;
		// YYYYYYYM
		data[ 2 ] = ( Y << 1 ) | ( M >>> 3 );
		// MMMDDDDD
		data[ 3 ] = ( (M & 0x7 ) << 5 ) | D;

		return data;
	}

	function LEArrayToDate( data: Uint8Array, offset: number )
	{
		// hhhhhmmm mmmsssss YYYYYYYM MMMDDDDD
		const h = data[ offset ] >> 3; // 0~23
		const m = ( ( data[ offset ] & 0x7 ) << 3 ) | ( data[ offset + 1 ] >>> 5 ); // 0~59
		const s = ( data[ offset + 1 ] & 0x1F ) << 1; // (0~29) *2, s = 0,2,4,8,....

		const Y = ( data[ offset + 2 ] >> 1 ); // 1980 + (0~)
		const M = ( ( data[ offset + 2 ] & 0x1 ) << 3 ) | ( data[ offset + 3 ] >> 5 ); // 1-12
		const D = data[ offset + 3 ] & 0x1F; // 1~31

		return new Date( 1980 + Y, M - 1, D, h, m, s );
	}

	const CRCTable =
	[
		          0,  1996959894,  -301047508, -1727442502,   124634137,  1886057615,  -379345611, -1637575261,
		  249268274,  2044508324,  -522852066, -1747789432,   162941995,  2125561021,  -407360249, -1866523247,
		  498536548,  1789927666,  -205950648, -2067906082,   450548861,  1843258603,  -187386543, -2083289657,
		  325883990,  1684777152,   -43845254, -1973040660,   335633487,  1661365465,   -99664541, -1928851979,
		  997073096,  1281953886,  -715111964, -1570279054,  1006888145,  1258607687,  -770865667, -1526024853,
		  901097722,  1119000684,  -608450090, -1396901568,   853044451,  1172266101,  -589951537, -1412350631,
		  651767980,  1373503546,  -925412992, -1076862698,   565507253,  1454621731,  -809855591, -1195530993,
		  671266974,  1594198024,  -972236366, -1324619484,   795835527,  1483230225, -1050600021, -1234817731,
		 1994146192,    31158534, -1731059524,  -271249366,  1907459465,   112637215, -1614814043, -390540237,
		 2013776290,   251722036, -1777751922,  -519137256,  2137656763,   141376813, -1855689577, -429695999,
		 1802195444,   476864866, -2056965928,  -228458418,  1812370925,   453092731, -2113342271, -183516073,
		 1706088902,   314042704, -1950435094,   -54949764,  1658658271,   366619977, -1932296973, -69972891,
		 1303535960,   984961486, -1547960204,  -725929758,  1256170817,  1037604311, -1529756563, -740887301,
		 1131014506,   879679996, -1385723834,  -631195440,  1141124467,   855842277, -1442165665, -586318647,
		 1342533948,   654459306, -1106571248,  -921952122,  1466479909,   544179635, -1184443383, -832445281,
		 1591671054,   702138776, -1328506846,  -942167884,  1504918807,   783551873, -1212326853, -1061524307,
		 -306674912, -1698712650,    62317068,  1957810842,  -355121351, -1647151185,    81470997, 1943803523,
		 -480048366, -1805370492,   225274430,  2053790376,  -468791541, -1828061283,   167816743, 2097651377,
		 -267414716, -2029476910,   503444072,  1762050814,  -144550051, -2140837941,   426522225, 1852507879,
		  -19653770, -1982649376,   282753626,  1742555852,  -105259153, -1900089351,   397917763, 1622183637,
		 -690576408, -1580100738,   953729732,  1340076626,  -776247311, -1497606297,  1068828381, 1219638859,
		 -670225446, -1358292148,   906185462,  1090812512,  -547295293, -1469587627,   829329135, 1181335161,
		 -882789492, -1134132454,   628085408,  1382605366,  -871598187, -1156888829,   570562233, 1426400815,
		 -977650754, -1296233688,   733239954,  1555261956, -1026031705, -1244606671,   752459403, 1541320221,
		-1687895376,  -328994266,  1969922972,    40735498, -1677130071,  -351390145,  1913087877, 83908371,
		-1782625662,  -491226604,  2075208622,   213261112, -1831694693,  -438977011,  2094854071, 198958881,
		-2032938284,  -237706686,  1759359992,   534414190, -2118248755,  -155638181,  1873836001, 414664567,
		-2012718362,   -15766928,  1711684554,   285281116, -1889165569,  -127750551,  1634467795, 376229701,
		-1609899400,  -686959890,  1308918612,   956543938, -1486412191,  -799009033,  1231636301, 1047427035,
		-1362007478,  -640263460,  1088359270,   936918000, -1447252397,  -558129467,  1202900863, 817233897,
		-1111625188,  -893730166,  1404277552,   615818150, -1160759803,  -841546093,  1423857449, 601450431,
		-1285129682, -1000256840,  1567103746,   711928724, -1274298825, -1022587231,  1510334235, 755167117,
	];
/*for ( let i = 0 ; i < 256 ; ++i )
{
	let r = i;
	for ( let j = 0 ; j < 8 ; ++j ) { r = ( r & 1 ) ? 0xEDB88320 ^ ( r >>> 1 ) : ( r >>> 1 ); }
	console.log(r);
}*/

	export function CRC32( data: Uint8Array )
	{
		// 100000100110000010001110110110111
		let crc = 0 ^ -1;
		for ( let b of data )
		{
			crc = ( crc >>> 8 ) ^ CRCTable[ ( crc ^ b ) & 0xFF ];
		}
		return NumberToLEArray( crc ^ -1, 4 );
	}

	export interface ZipFile{ filename: string, data: Uint8Array | string }

	export class Zip// implements Iterator<ZipFile>
	{
		private files: { [ key: string ]: PKFile };

		constructor()
		{
			this.files = {};
		}

		/*[Symbol.iterator]()//: IterableIterator<ZipFile>
		{
			let pointer = 0;
			const keys = Object.keys( this.files );
			return { next(): IteratorResult<ZipFile>
			{
				const key = keys[ pointer++ ];
				return {
					done: pointer < keys.length,
					value: { filename: key, data: this.files[ key ].file.data },
				};
			} };
		}

		[Symbol.iterator](): IterableIterator<ZipFile> { return this; }*/

		private createPKFile( name: string, data: Uint8Array | string, date: Date )
		{
			const header: PK0102 = {};
			const file: PK0304 =
			{
				data: data,
			};
			const pkfile: PKFile =
			{
				date: date,
				name: name,
				header: header,
				file: file,
			};

			return pkfile;
		}

		private loadFile( file: File )
		{
			return LoadFile( file ).then( ( result ) =>
			{
				return this.createPKFile( file.name, new Uint8Array( result.data ), new Date( file.lastModified ) );
			} );
		}

		private createFile( file: string, data: Uint8Array | string, date: Date )
		{
			return Promise.resolve( this.createPKFile( file, data, date ) );
		}

		public addFile( file: File | string, data?: Uint8Array | string, date?: Date )
		{
			return ( ( typeof file === 'string' ) ?
				this.createFile( file, data || '', date || new Date() ) :
				this.loadFile( file ) ).then( ( pkfile ) =>
			{
				this.files[ pkfile.name ] = pkfile;
			} );
		}

		private convertPK0102( pkfile: PKFile, file: Uint8Array, position: number )
		{
			const filename = ( new TextEncoder() ).encode( pkfile.name );
			const data = new Uint8Array( 46 + filename.length );

			let b = 0;
			// PK header.
			data[ b++ ] = 0x50; data[ b++ ] = 0x4B; data[ b++ ] = 0x01; data[ b++ ] = 0x02;
			// Version.
			data[ b++ ] = file[ 4 ]; data[ b++ ] = file[ 5 ];
			// Need version.
			data[ b++ ] = file[ 4 ]; data[ b++ ] = file[ 5 ];
			// Option.
			data[ b++ ] = file[ 6 ]; data[ b++ ] = file[ 7 ];
			// Algorithm.
			data[ b++ ] = file[ 8 ]; data[ b++ ] = file[ 9 ];
			// Date
			data[ b++ ] = file[ 10 ]; data[ b++ ] = file[ 11 ]; data[ b++ ] = file[ 12 ]; data[ b++ ] = file[ 13 ];
			// CRC32
			data[ b++ ] = file[ 14 ]; data[ b++ ] = file[ 15 ]; data[ b++ ] = file[ 16 ]; data[ b++ ] = file[ 17 ];
			// File size.
			data[ b++ ] = file[ 18 ]; data[ b++ ] = file[ 19 ]; data[ b++ ] = file[ 20 ]; data[ b++ ] = file[ 21 ];
			// Compressed file size.
			data[ b++ ] = file[ 22 ]; data[ b++ ] = file[ 23 ]; data[ b++ ] = file[ 24 ]; data[ b++ ] = file[ 25 ];
			// File name size.
			data[ b++ ] = file[ 26 ]; data[ b++ ] = file[ 27 ];
			// Ex field size.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// Comment size.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// Split part.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// File type.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// File attribute.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00; data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			const pos = NumberToLEArray( position, 4 );
			for ( let i = 0 ; i < 4 ; ++i ) { data[ b++ ] = pos[ i ]; }
			// File name.
			for ( let v of filename ) { data[ b++ ] = v; }

			return data;
		}

		private convertPK0304( pkfile: PKFile )
		{
			const filename = ( new TextEncoder() ).encode( pkfile.name );
			const file = typeof pkfile.file.data === 'string' ? ( new TextEncoder() ).encode( pkfile.file.data ) : pkfile.file.data;
			const data = new Uint8Array( 30 + filename.length + file.length );

			let b = 0;
			// PK header.
			data[ b++ ] = 0x50; data[ b++ ] = 0x4B; data[ b++ ] = 0x03; data[ b++ ] = 0x04;
			// Version.
			data[ b++ ] = 0x14; data[ b++ ] = 0x00;
			// Option.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// Algorithm.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// Date
			const date = DateToLEArray( pkfile.date );
			data[ b++ ] = date[ 0 ]; data[ b++ ] = date[ 1 ]; data[ b++ ] = date[ 2 ]; data[ b++ ] = date[ 3 ];
			// CRC32
			const crc32 = CRC32( file );
			data[ b++ ] = crc32[ 0 ]; data[ b++ ] = crc32[ 1 ]; data[ b++ ] = crc32[ 2 ]; data[ b++ ] = crc32[ 3 ];
			// File size.
			const size = NumberToLEArray( pkfile.file.data.length, 4 );
			for ( let i = 0 ; i < 4 ; ++i ) { data[ b + i ] = data[ b + i + 4 ] = size[ i ]; }
			b += 8;
			// File name size.
			const namesize = NumberToLEArray( filename.length, 2 );
			for ( let i = 0 ; i < 2 ; ++i ) { data[ b++ ] = namesize[ i ]; }
			// Comment size.
			data[ b++ ] = 0x00; data[ b++ ] = 0x00;
			// File name.
			for ( let v of filename ) { data[ b++ ] = v; }
			// File data.
			for ( let v of file ) { data[ b++ ] = v; }

			return data;
		}

		public generate()
		{
			const pk0102: Uint8Array[] = [];
			const pk0304: Uint8Array[] = [];
			let position = 0;
			let headersize = 0;

			Object.keys( this.files ).forEach( ( key ) =>
			{
				const pkfile = this.files[ key ];
				const file = this.convertPK0304( pkfile );
				const header = this.convertPK0102( pkfile, file, position );
				position += file.length;
				headersize += header.length;
				pk0102.push( header );
				pk0304.push( file );
			} );

			const pk0506 = new Uint8Array( 22 );
			let b = 0;
			// PK header.
			pk0506[ b++ ] = 0x50; pk0506[ b++ ] = 0x4B; pk0506[ b++ ] = 0x05; pk0506[ b++ ] = 0x06;
			// Split.
			pk0506[ b++ ] = 0x00; pk0506[ b++ ] = 0x00;
			// Split number.
			pk0506[ b++ ] = 0x00; pk0506[ b++ ] = 0x00;
			// Files.
			const size = NumberToLEArray( pk0102.length, 2 );
			for ( let i = 0 ; i < 2 ; ++i ) { pk0506[ b + i ] = pk0506[ b + i + 2 ] = size[ i ]; }
			b += 4;
			// All header size.
			const hsize = NumberToLEArray( headersize, 4 );
			for ( let i = 0 ; i < 4 ; ++i ) { pk0506[ b++ ] = hsize[ i ]; }
			// Header position.
			const pos = NumberToLEArray( position, 4 );
			for ( let i = 0 ; i < 4 ; ++i ) { pk0506[ b++ ] = pos[ i ]; }
			// Comment length.
			pk0506[ b++ ] = 0x00; pk0506[ b++ ] = 0x00;

			const zip = new Uint8Array( position + headersize + pk0506.length );
			let z = 0;
			pk0304.forEach( ( file ) => { for ( let v of file ) { zip[ z++ ] = v; } } );
			pk0102.forEach( ( file ) => { for ( let v of file ) { zip[ z++ ] = v; } } );
			for ( let v of pk0506 ) { zip[ z++ ] = v; }

			return zip;
		}

		private loadPKFile( zip: Uint8Array, offset: number )
		{
			// Header.
			offset += 4;

			// Version.
			if ( zip[ offset++ ] !== 0x14 || zip[ offset++ ] !== 0x00 ) { throw 'Version error'; }

			// Ignore option.
			offset += 2;

			// Algorithm.
			if ( zip[ offset++ ] !== 0x00 || zip[ offset++ ] !== 0x00 ) { throw 'Unknown compression algorithm'; }

			// Date.
			const date = LEArrayToDate( zip, offset );
			offset += 4;

			// Ignore CRC.
			offset += 4;

			// File size;
			const filesize = LEArrayToNumber( zip, offset, 4 );
			offset +=8;

			// File name size.
			const namesize = LEArrayToNumber( zip, offset, 2 );
			offset += 2;

			// Comment size.
			const commentsize = LEArrayToNumber( zip, offset, 2 );
			offset += 2;

			// File name.
			const name = new TextDecoder( 'utf-8' ).decode( zip.slice( offset, offset + namesize ) );
			offset += namesize;

			// Ignore comment.
			offset += commentsize;

			// File.
			const data = zip.slice( offset, offset + filesize );
			offset += filesize;

			const header: PK0102 = {};
			const file: PK0304 =
			{
				data: data,
			};
			const pkfile: PKFile =
			{
				date: date,
				name: name,
				header: header,
				file: file,
			};
			this.files[ name ] = pkfile;
			return offset;
		}

		public load( data: Uint8Array/*, strconv: ( data: Uint8Array ) => string*/ )
		{
			this.files = {};
			let offset = 0;

			// File.
			while ( offset < data.length )
			{
				if ( data[ offset ] !== 0x50 || data[ offset + 1 ] !== 0x4B ) { throw 'Error token.'; }
				if ( data[ offset + 2 ] !== 0x03 || data[ offset + 3 ] !== 0x04 )
				{
					if ( data[ offset + 2 ] === 0x01 || data[ offset + 3 ] === 0x02 ) { break; }
					throw 'Error token.';
				}
				offset += this.loadPKFile( data, offset );
			}

			// TODO: PK0102 ... string mode => convert data.
		}

		public size() { return Object.keys( this.files ).length; }

		public get( filename: string ): Uint8Array | string | null
		{
			if ( !this.files[ filename ] ) { return null; }
			return this.files[ filename ].file.data;
		}

		public getFileNames() { return Object.keys( this.files ); }

		public rename( oldname: string, newname: string )
		{
			if ( !oldname || !newname || !this.files[ oldname ] ) { return false; }
			this.files[ newname ] = this.files[ oldname ];
			delete this.files[ oldname ];
		}

		public remove( filename: string | string[] )
		{
			if ( !filename ) { return false; }
			if ( typeof filename === 'string' )
			{
				delete this.files[ filename ];
				return true;
			}
			filename.forEach( ( file ) => { delete this.files[ file ]; } );
			return true;
		}

		public removeAll() { this.files = {}; }
	}

	export function zip(  ){}
	export function unzip( zipfile: File )
	{
		const zip = new Zip();
		return LoadFile( zipfile ).then( ( data ) =>
		{
			zip.load( new Uint8Array( data.data ) );

			return zip;
		} );
	}
}
