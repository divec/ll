/**
 * LL two-way parallel translation extensions to ve.dm.Document
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Get the node, and either relative linear offset or tree offset, of a linear offset
 *
 * @param {number} linearOffset Linear offset
 * @return {Object} Position
 * @return {ve.dm.BranchNode} return.node Branch node in which the position lies
 * @return {number} [return.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @return {number} [return.treeOffset] If node is not a ContentBranchNode, offset in its children list
 */
ve.dm.Document.prototype.getPositionFromLinearOffset = function ( linearOffset ) {
	var selection = this.selectNodes( new ve.Range( linearOffset ) )[ 0 ],
		node = selection.node,
		nodeRange = selection.nodeRange;
	if ( selection.indexInNode !== undefined && !node.isContent() && !node.canContainContent() ) {
		// Between two children of a non-content branch node
		return { node: node, treeOffset: selection.indexInNode };
	}
	if ( node.isContent() ) {
		node = node.getParent();
		nodeRange = node.getRange();
	}
	return { node: node, linearOffset: linearOffset - nodeRange.start };
};

/**
 * Get the node, and either relative linear offset or tree offset, of a tree path
 *
 * @param {number[]} path Tree path, linearized inside ContentBranchNode if there is one
 * @return {Object} Position
 * @return {ve.dm.BranchNode} return.node Branch node in which the position lies
 * @return {number} [return.linearOffset] If node is a ContentBranchNode, relative linear offset within it
 * @return {number} [return.treeOffset] If node is not a ContentBranchNode, offset in its children list
 */
ve.dm.Document.prototype.getPositionFromTreePath = function ( path ) {
	var i,
		node = this.getDocumentNode();
	for ( i = 0; i < path.length - 1; i++ ) {
		node = node.getChildren()[ path[ i ] ];
	}
	if ( node.canContainContent() ) {
		return { node: node, linearOffset: path[ i ] };
	}
	return { node: node, treeOffset: path[ i ] };
};

/**
 * Store a node pair's contents as an approved translation correspondence
 *
 * The other node in the pair is found at the same tree path in the other document
 *
 * @param {ve.dm.ContentBranchNode} node The node
 */
ve.dm.Document.prototype.storeApprovedPair = function ( node ) {
	var treePath, other, lang, otherLang, thisChunked, otherChunked, lastApproved;

	treePath = ve.dm.getTreePathFromPosition( { node: node, linearOffset: 0 } );
	other = node.getDocument().other.getPositionFromTreePath( treePath ).node;

	lang = node.getDocument().getLang();
	otherLang = other.getDocument().getLang();

	thisChunked = node.getChunked();
	otherChunked = other.getChunked();

	// HACK: store the correspondence in the node objects themselves
	lastApproved = {};
	lastApproved[ lang ] = thisChunked;
	lastApproved[ otherLang ] = otherChunked;
	node.setLastApprovedPair( lastApproved );
	other.setLastApprovedPair( lastApproved );
};

/**
 * Store the pair for every content node descendant as a verified translation correspondence
 *
 * @param {ve.dm.BranchNode} node The node
 */
ve.dm.Document.prototype.storeApprovedDescendants = function ( node ) {
	var i, iLen, child;
	for ( i = 0, iLen = node.children.length; i < iLen; i++ ) {
		child = node.children[ i ];
		if ( child.canContainContent() ) {
			this.storeApprovedPair( child );
		} else if ( child.children ) {
			this.storeApprovedDescendants( child );
		}
	}
};
