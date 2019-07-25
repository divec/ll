/*!
 * LL two-way parallel translation - extensions to ve.dm.Surface
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/* Static properties */

/* Instance methods */

/**
 * Mark a node as approved and store its translation pair as approved
 *
 * @param {ve.dm.ContentBranchNode} node The node
 */
ve.dm.Surface.prototype.markApproved = function ( node ) {
	var i, start, hasConflict,
		transactions = [],
		doc = this.getDocument(),
		data = doc.data,
		updateAnnotation = ve.dm.annotationFactory.create( 'll/update' ),
		conflictAnnotation = ve.dm.annotationFactory.create( 'll/conflict' ),
		conflictHash = doc.getStore().hash( conflictAnnotation ),
		conflictSince = null;

	// Remove ll/update annotation
	transactions.push( ve.dm.TransactionBuilder.static.newFromAnnotation(
		doc,
		node.getRange(),
		'clear',
		updateAnnotation
	) );
	// Remove content with ll/conflict annotation
	for ( i = node.getRange().end - 1, start = node.getRange().start; i >= start; i-- ) {
		hasConflict = data.getAnnotationHashesFromOffset( i ).indexOf( conflictHash ) !== -1;
		if ( conflictSince === null && hasConflict ) {
			conflictSince = i;
		} else if ( conflictSince !== null && !hasConflict ) {
			transactions.push( ve.dm.TransactionBuilder.static.newFromRemoval(
				doc,
				new ve.Range( i + 1, conflictSince + 1 )
			) );
			conflictSince = null;
		}
	}
	if ( conflictSince !== null ) {
		transactions.push( ve.dm.TransactionBuilder.static.newFromRemoval(
			doc,
			new ve.Range( start, conflictSince + 1 )
		) );
	}
	// Unset dirty flag on CBN
	transactions.push( ve.dm.TransactionBuilder.static.newFromAttributeChanges(
		doc,
		node.getOuterRange().start,
		{ 'll-dirty': 'approved' }
	) );
	// TODO: This should be atomic (or better still, squashed into a single commit)
	this.change( transactions );
	doc.storeApprovedPair( node );
};
