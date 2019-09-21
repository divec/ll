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
	var transactions = [],
		doc = this.getDocument(),
		updateAnnotation = ve.dm.annotationFactory.create( 'll/update' ),
		conflictAnnotation = ve.dm.annotationFactory.create( 'll/conflict' );

	// Remove ll/update annotation
	transactions.push( ve.dm.TransactionBuilder.static.newFromAnnotation(
		doc,
		node.getRange(),
		'clear',
		updateAnnotation
	) );
	// Remove ll/conflict annotation
	transactions.push( ve.dm.TransactionBuilder.static.newFromAnnotation(
		doc,
		node.getRange(),
		'clear',
		conflictAnnotation
	) );
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
