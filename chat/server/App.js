const http = require( 'http' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	url = require( 'url' ),
	io = require( 'socket.io' );

class App {
	constructor() {
		// Properties
		this.server = http.createServer( this.serve.bind( this ) );
		this.io = io();
	}

	serve( request, response ) {
		// eslint-disable-next-line no-console
		console.log( 'request ', request.url );
		const parsedUrl = url.parse( request.url, true ),
			filePath = parsedUrl.pathname === '/' ? './index.html' : `.${parsedUrl.pathname}`,
			extname = String( path.extname( filePath ) ).toLowerCase(),
			contentType = App.mimeTypes[ extname ] || 'application/octet-stream';
		fs.readFile( path.join( __dirname, '../client/', filePath ), function ( error, content ) {
			if ( error ) {
				if ( error.code === 'ENOENT' ) {
					response.writeHead( 404 );
					response.end( `404 - File not found: ${filePath}\n`, 'utf-8' );
				} else {
					response.writeHead( 500 );
					response.end( `500 - Server error: ${error.code}\n`, 'utf-8' );
				}
			} else {
				response.writeHead( 200, { 'Content-Type': contentType } );
				response.end( content, 'utf-8' );
			}
		} );
	}

	start( port = 8082 ) {
		// Initialization
		this.server.listen( port );
		this.io.listen( this.server );

		// Events
		this.io.on( 'connection', socket => {
			// Broadcast messages to all clients
			socket.on( 'message', message => {
				this.io.emit( 'message', message );
			} );
		} );
	}
}

App.mimeTypes = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpg',
	'.gif': 'image/gif',
	'.wav': 'audio/wav',
	'.mp4': 'video/mp4',
	'.woff': 'application/font-woff',
	'.ttf': 'application/font-ttf',
	'.eot': 'application/vnd.ms-fontobject',
	'.otf': 'application/font-otf',
	'.svg': 'application/image/svg+xml',
	'.wasm': 'application/wasm'
};

module.exports = App;
