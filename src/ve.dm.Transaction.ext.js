/*!
 * LL two-way parallel translation - ve.dm.Transaction extensions
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Adapt this transaction to apply to a document with the same structure as this one
 *
 * The adapted transaction guarantees to keep the structure the same. It leaves alone content
 * inside content branch nodes, inserting no content only removing content if the node is
 * removed. If adjacent nodes are merged, their content is concatenated.
 *
 * @param {ve.dm.Document} oldDoc Document in the state on which the transaction applies
 * @param {ve.dm.Document} newDoc Corresponding document with the same structure
 * return {Object} Info about adapted transaction
 * @return {ve.dm.Transaction} return.tx Adapted transaction to apply to newDoc
 * @return {Map} return.changedNodePairs Map of changed nodes with (sourceNode, targetNode) pairs
 */
ve.dm.Transaction.prototype.distort = function ( oldDoc, newDoc ) {
	var i, len, op, oldPosition, newPosition, treePath, newRemove, newInsert,
		priorNewLinearOffset, newTx,
		oldLinearOffset = 0,
		newLinearOffset = 0,
		changedNodePairs = new Map(),
		newOps = [];

	for ( i = 0, len = this.operations.length; i < len; i++ ) {
		op = this.operations[ i ];
		if ( op.type === 'retain' ) {
			priorNewLinearOffset = newLinearOffset;
			oldLinearOffset += op.length;
			oldPosition = oldDoc.getPositionFromLinearOffset( oldLinearOffset );
			treePath = ve.dm.getTreePathFromPosition( oldPosition );
			newPosition = newDoc.getPositionFromTreePath( treePath );
			if ( newPosition.linearOffset !== undefined ) {
				// Retain greedily up to the end of a content branch node
				newPosition.linearOffset = newPosition.node.getLength();
			}
			newLinearOffset = ve.dm.getOffsetFromPosition( newPosition );
			// XXX factor out up to here (duplicated); maybe return range? or offset diff (advancement)?

			newOps.push( {
				type: 'retain',
				length: newLinearOffset - priorNewLinearOffset
			} );
		} else if ( op.type === 'replace' ) {
			priorNewLinearOffset = newLinearOffset;
			oldLinearOffset += op.remove.length;
			oldPosition = oldDoc.getPositionFromLinearOffset( oldLinearOffset );
			treePath = ve.dm.getTreePathFromPosition( oldPosition );
			newPosition = newDoc.getPositionFromTreePath( treePath );
			if ( oldPosition.node.canContainContent() ) {
				changedNodePairs.set( oldPosition.node, newPosition.node );
			}
			if ( newPosition.linearOffset !== undefined ) {
				newPosition.linearOffset = 0;
			}
			newLinearOffset = ve.dm.getOffsetFromPosition( newPosition );
			if ( priorNewLinearOffset > newLinearOffset ) {
				// Because retains are greedy, we might be trying to jump backwards here;
				// prevent that from happening
				newLinearOffset = priorNewLinearOffset;
			}

			newRemove = newDoc.getData( new ve.Range( priorNewLinearOffset, newLinearOffset ) );
			newInsert = ve.dm.LinearData.static.stripContent( op.insert );
			newOps.push( {
				type: 'replace',
				remove: newRemove,
				insert: newInsert
			} );
		} else if ( op.type === 'attribute' && op.key === 'll-dirty' ) {
			// Do nothing
		} else {
			newOps.push( ve.copy( op ) );
		}
	}
	newTx = new ve.dm.Transaction( newOps, this.authorId );
	newTx.noEcho = true;
	return { tx: newTx, changedNodePairs: changedNodePairs };
};
