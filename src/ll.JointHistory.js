/*!
 * LL two-way parallel translation - Joint history class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Joint change history for parallel document models with a shared store
 *
 * The paired history is modelled as a ve.dm.Change applying to the concatenated
 * linmod of doc1 and doc2 (with an extra item in the middle so
 * insertions to the end of doc1 / start of doc2 are not ambiguous).
 *
 * @class
 * @constructor
 * @param {ve.dm.Document} doc1 First document
 * @param {ve.dm.Document} doc2 Second document
 */
ll.JointHistory = function LLJointHistory( doc1, doc2 ) {
	var length1, length2;

	// Parent constructor
	ll.JointHistory.super.call( this, 0, [], [], {} );

	if ( doc1.store !== doc2.store ) {
		throw new Error( 'Documents must have the same store' );
	}
	this.doc1 = doc1;
	this.doc2 = doc2;
	// Use the doc store internally
	this.store = doc1.store;

	// Doc lengths at each transaction in the change
	this.length1AtIndex = [];
	this.length2AtIndex = [];
	// Push an initial identity transaction (which will save the initial store length)
	// and document lengths
	length1 = this.doc1.data.data.length;
	length2 = this.doc2.data.data.length;
	this.length1AtIndex.push( length1 );
	this.length2AtIndex.push( length2 );
	ll.JointHistory.super.prototype.pushTransaction.call(
		this,
		new ve.dm.Transaction( [
			{ type: 'retain', length: length1 + 1 + length2 }
		] )
	);
};

/* Initialization */

OO.inheritClass( ll.JointHistory, ve.dm.Change );

/* Static methods */

/**
 * Calculate the new lengths of the documents after applying the transaction
 *
 * @param {ve.dm.Transaction} transaction The transaction
 * @param {number} length1 The old length of doc1
 * @param {number} length2 The old length of doc2
 * @return {Object} The new document lengths after applying the transaction
 * @return {number} return.length1 The new length of doc1
 * @return {number} return.length2 The new length of doc2
 */
ll.JointHistory.static.getLengthDiffs = function ( transaction, length1, length2 ) {
	var i, iLen, op,
		length = 0,
		diff1 = 0,
		diff2 = 0;
	for ( i = 0, iLen = transaction.operations.length; i < iLen; i++ ) {
		op = transaction.operations[ i ];
		if ( op.type === 'retain' ) {
			length += op.length;
		} else if ( op.type === 'replace' ) {
			if ( length <= length1 ) {
				if ( length + op.remove.length > length1 ) {
					throw new Error( 'Replace over document boundary' );
				}
				diff1 += op.insert.length - op.remove.length;
			} else {
				diff2 += op.insert.length - op.remove.length;
			}
		}
	}
	return { length1: length1 + diff1, length2: length2 + diff2 };
};

/* Instance methods */

/**
 * @inheritdoc
 */
ll.JointHistory.prototype.pushTransaction = function ( transaction, storeLength ) {
	var lengthDiffs = this.constructor.static.getLengthDiffs(
		transaction,
		this.length1AtIndex[ this.length1AtIndex.length - 1 ],
		this.length2AtIndex[ this.length2AtIndex.length - 1 ]
	);
	this.length1AtIndex.push( lengthDiffs.length1 );
	this.length2AtIndex.push( lengthDiffs.length2 );
	ll.JointHistory.super.prototype.pushTransaction.call( this, transaction, storeLength );
};

/**
 * Push an atomic pair of transactions onto the history
 *
 * Each transaction is extended with retains to apply to the concatenated
 * linmod. Each transaction is pushed separately, because pushing the concatenation
 * of both as a single transaction would cause extra rebasing conflicts.
 *
 * TODO: the resulting transactions should be marked as forming a single a atom, when
 * atoms in Change objects are implemented.
 *
 * The documents must be in the after state. This implies in particular that the
 * shared store already contains all needed annotations.
 *
 * @param {ve.dm.Transaction|null} tx1 Transaction on doc1; must already be applied
 * @param {ve.dm.Transaction|null} tx2 Transaction on doc2; must already be applied
 */
ll.JointHistory.prototype.pushTransactionPair = function ( tx1, tx2 ) {
	if ( tx1 ) {
		this.pushTransaction( new ve.dm.Transaction(
			[].concat(
				tx1.operations,
				{
					type: 'retain',
					length: 1 + this.length2AtIndex[ this.length2AtIndex.length - 1 ]
				}
			),
			this.store.getLength()
		) );
	}
	if ( tx2 ) {
		this.pushTransaction( new ve.dm.Transaction(
			[].concat(
				{
					type: 'retain',
					length: 1 + this.length1AtIndex[ this.length1AtIndex.length - 1 ]
				},
				tx2.operations
			),
			this.store.getLength()
		) );
	}
};

/**
 * Get the pair of transactions at a given point in history
 *
 * At least one of the returned pair is a pure retain.
 *
 * @param {number} i Index into the history
 * @return {ve.dm.Transaction[]} Pair of transactions, applying to doc1 and doc2 respectively
 */
ll.JointHistory.prototype.pairAt = function ( i ) {
	var op,
		length1 = this.length1AtIndex[ i ],
		length2 = this.length2AtIndex[ i ],
		pairTx = this.transactions[ i ],
		ops = pairTx.operations;
	// Either the doc1 or doc2 (or both) should have a pure retain
	op = ops[ 0 ];
	if ( op.type === 'retain' && op.length === length1 + 1 ) {
		return [
			new ve.dm.Transaction( [ { type: 'retain', length: length1 } ] ),
			new ve.dm.Transaction( ops.slice( 1 ) )
		];
	}
	op = ops[ ops.length - 1 ];
	if ( op.type === 'retain' && op.length === length2 + 1 ) {
		return [
			new ve.dm.Transaction( ops.slice( 0, -1 ) ),
			new ve.dm.Transaction( [ { type: 'retain', length: length2 } ] )
		];
	}
	throw new Error( 'Unexpected lack of retain' );
};
