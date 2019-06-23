/*!
 * LL two-way parallel translation - ve.ce.LinearEnterKeyDownHandler extensions
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

// HACK: In-place override of ve.ce.LinearEnterKeyDownHandler.static.execute
( function () {
	var base = ve.ce.LinearEnterKeyDownHandler.static.execute;
	ve.ce.LinearEnterKeyDownHandler.static.execute = function ( surface, e ) {
		var node = $( surface.nativeSelection.focusNode )
			.closest( '.ve-ce-contentBranchNode-ll-dirty' )
			.data( 'view' );
		if ( !node ) {
			return base( surface, e );
		}
		surface.getModel().markApproved( node.getModel() );
		e.preventDefault();
	};
}() );
