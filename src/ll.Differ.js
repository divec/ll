/*!
 * LL two-way parallel translation - Differ class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Two-way and three-way Differ class
 *
 * @class
 * @constructor
 * @param {ve.dm.HashValueStore} store The hash value store for the linear data to be diffed
 */
ll.Differ = function LLDiffer( store ) {
	this.store = store;
};

/* Initialize */

OO.initClass( ll.Differ );

/* Instance methods */

/**
 * Perform a three-way diff of linear data
 *
 * @param {Array} linearDataA Modified version A of the linear data
 * @param {Array} linearDataO The common ancestor linear data
 * @param {Array} linearDataB Modified version B of the linear data
 * @return {Array[]} Three-way diff
 * @return {Array[]} return.i The i'th chunk of the diff
 * @return {Array|null} return.i.0 The chunk in modified version A (null if unmodified)
 * @return {Array} return.i.1 The chunk in the common ancestor
 * @return {Array|null} return.i.2 The chunk in modified version B (null if unmodified)
 */
ll.Differ.prototype.diff3 = function ( linearDataA, linearDataO, linearDataB ) {
	var ops, i, iLen, ptr, aDiff, bDiff, diff3,
		clusters = [],
		cluster = null;
	ops = Array.prototype.concat.call(
		[],
		this.diff( linearDataO, linearDataA ).map( function ( op ) {
			op.surface = 'A';
			return op;
		} ),
		this.diff( linearDataO, linearDataB ).map( function ( op ) {
			op.surface = 'B';
			return op;
		} )
	).sort( function ( a, b ) {
		return a.start - b.start || a.surface - b.surface;
	} );
	ops.forEach( function ( op ) {
		var diff;
		if ( op.type !== 'REPLACE' ) {
			return;
		}
		if ( cluster && cluster.end <= op.start ) {
			clusters.push( cluster );
			cluster = null;
		}
		if ( !cluster ) {
			cluster = {
				start: op.start,
				surface: op.surface,
				end: -1,
				aDiff: 0,
				bDiff: 0
			};
		} else {
			// More than one overlapping cluster = conflict. So unset surface
			cluster.surface = null;
		}
		if ( cluster.end < op.end ) {
			cluster.end = op.end;
		}
		diff = op.insert.length - op.remove.length;
		if ( op.surface === 'A' ) {
			cluster.aDiff += diff;
		} else {
			cluster.bDiff += diff;
		}
	} );
	if ( cluster ) {
		clusters.push( cluster );
		cluster = null;
	}
	ptr = 0;
	aDiff = 0;
	bDiff = 0;
	diff3 = [];
	for ( i = 0, iLen = clusters.length; i < iLen; i++ ) {
		cluster = clusters[ i ];
		if ( cluster.start > ptr ) {
			diff3.push( [
				null,
				linearDataO.slice( ptr, cluster.start ),
				null
			] );
		}
		diff3.push( [
			cluster.surface === 'B' ? null : linearDataA.slice(
				cluster.start + aDiff,
				cluster.end + aDiff + cluster.aDiff
			),
			linearDataO.slice(
				cluster.start,
				cluster.end
			),
			cluster.surface === 'A' ? null : linearDataB.slice(
				cluster.start + bDiff,
				cluster.end + bDiff + cluster.bDiff
			)
		] );
		ptr = cluster.end;
		aDiff += cluster.aDiff;
		bDiff += cluster.bDiff;
	}
	if ( ptr < linearDataO.length ) {
		diff3.push( [
			null,
			linearDataO.slice( ptr ),
			null
		] );
	}
	return diff3;
};

/**
 * Perform a two-way diff of linear data
 *
 * @param {Array} linearData1 First version of the linear data
 * @param {Array} linearData2 Second version of the linear data
 * @return {Object[]} Two-way diff
 * @return {Object} return.i The i'th chunk of the diff
 * @return {number} return.i.start Start offset in linearData1
 * @return {number} return.i.end End offset in linearData1
 * @return {string} return.i.type RETAIN or REPLACE
 * @return {Array} [return.i.data] For RETAIN, the data retained
 * @return {Array} [return.i.remove] For REPLACE, the data removed
 * @return {Array} [return.i.insert] For REPLACE, the data inserted
 */
ll.Differ.prototype.diff = function ( linearData1, linearData2 ) {
	var i, rawItem, type, data,
		differ = new ve.DiffMatchPatch( this.store, this.store ),
		rawDiff = differ.getCleanDiff( linearData1, linearData2 ),
		ops = [],
		op = null,
		len = 0;

	for ( i = 0; i < rawDiff.length; i++ ) {
		rawItem = rawDiff[ i ];
		type = { '-1': 'REMOVE', 0: 'RETAIN', 1: 'INSERT' }[ rawItem[ 0 ] ];
		data = rawItem[ 1 ];
		if ( type === 'RETAIN' ) {
			if ( op && op.type !== 'RETAIN' ) {
				ops.push( op );
				op = null;
			}
			if ( !op ) {
				op = {
					start: len,
					end: len,
					type: 'RETAIN',
					data: []
				};
			}
			ve.batchPush( op.data, data );
		} else {
			if ( op && op.type === 'RETAIN' ) {
				ops.push( op );
				op = null;
			}
			if ( !op ) {
				op = {
					start: len,
					end: len,
					type: 'REPLACE',
					remove: [],
					insert: []
				};
			}
			ve.batchPush(
				type === 'REMOVE' ? op.remove : op.insert,
				data
			);
		}
		if ( type !== 'INSERT' ) {
			len += data.length;
			op.end += data.length;
		}
	}
	if ( op ) {
		ops.push( op );
	}
	return ops;
};
