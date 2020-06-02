'use strict';

function prependPaths( prefix, val ) {
	let ob, k, v;
	if ( Array.isArray( val ) ) {
		return val.map( function ( item ) {
			return prependPaths( prefix, item );
		} );
	}
	if ( typeof val === 'object' && val !== null ) {
		ob = {};
		for ( k in val ) {
			v = val[ k ];
			if (
				( k === 'scripts' || k === 'styles' ) &&
				Array.isArray( v )
			) {
				ob[ k ] = v.map( function ( item ) {
					if ( typeof item === 'string' ) {
						return prefix + item;
					}
					return prependPaths( prefix, item );
				} );
			} else if ( k === 'file' && typeof v === 'string' ) {
				ob[ k ] = prefix + v;
			} else {
				ob[ k ] = prependPaths( prefix, v );
			}
		}
		return ob;
	}
	return val;
}
module.exports = prependPaths;
