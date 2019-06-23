/*!
 * LL two-way parallel translation - ve.dm.LinearData extensions
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Get linear data with everything stripped except structure nodes
 *
 * @param {Array} data Linear data
 * @return {Array} The linear data, with everything stripped except structure nodes
 */
ve.dm.LinearData.static.stripContent = function ( data ) {
	return ve.copy( data.filter( function ( item ) {
		var type = item.type;
		if ( type ) {
			if ( type.charAt( 0 ) === '/' ) {
				type = type.substr( 1 );
			}
			return !ve.dm.nodeFactory.isNodeContent( type );
		}
		return false;
	} ) );
};
