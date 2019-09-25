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
	var annotations,
		doc = this.getDocument(),
		transactions = [];

	// Remove ll/update and ll/conflict annotations
	annotations = doc.data.getAnnotationsFromRange( node.getRange(), true );
	// The method name 'values' confuses eslint, which thinks it's Array.prototype.values
	// eslint-disable-next-line no-restricted-syntax
	annotations.store.values( annotations.storeHashes ).forEach( function ( annotation ) {
		if ( annotation.name !== 'll/update' && annotation.name !== 'll/conflict' ) {
			return;
		}
		transactions.push( ve.dm.TransactionBuilder.static.newFromAnnotation(
			doc,
			node.getRange(),
			'clear',
			annotation
		) );
	} );

	// Unset dirty flag and diff3 on CBN
	transactions.push( ve.dm.TransactionBuilder.static.newFromAttributeChanges(
		doc,
		node.getOuterRange().start,
		{ 'll-dirty': 'approved', 'll-diff3': undefined }
	) );
	// TODO: This should be atomic (or better still, squashed into a single commit)
	this.change( transactions );
	doc.storeApprovedPair( node );
};
