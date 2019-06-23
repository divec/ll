/*!
 * LL two-way parallel translation - extensions to ve.dm.Surface
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Mark a node as approved and store its translation pair as approved
 *
 * @param {ve.dm.ContentBranchNode} node The node
 */
ve.dm.Surface.prototype.markApproved = function ( node ) {
	var doc, tx;
	doc = this.getDocument();
	tx = ve.dm.TransactionBuilder.static.newFromAttributeChanges(
		doc, node.getOuterRange().start,
		{ 'll-dirty': 'approved' }
	);
	this.change( tx );
	doc.storeApprovedPair( node );
};
