/* global IncrementalDOM */

/**
 * DOM renderer.
 *
 * @license MIT
 * @author Trevor Parscal
 */
const Renderer = class Renderer {
	/**
	 * Create a renderer and start rendering.
	 *
	 * @param {Renderer.Component} root Root component to render
	 * @param {Element} target Element to render into
	 */
	constructor( root, target ) {

		/* Properties */

		/**
		 * @property {Renderer.Component} root Root component to render
		 */
		this.root = root;
		/**
		 * @property {Element} target Element to render into
		 */
		this.target = target;
		/**
		 * @property {number} iteration Rendering iteration
		 */
		this.iteration = 0;
		/**
		 * @property {boolean} queued Rendering has been queued
		 */
		this.queued = false;
		/**
		 * @property {Map} renderables List of renderables in either #prev or #next lists
		 */
		this.renderables = new Map();
		/**
		 * @property {Set} prev List of changeable objects that were used in the last rendering
		 */
		this.prev = new Set();
		/**
		 * @property {Set} next List of changeable objects that will be used in the next rendering
		 */
		this.next = new Set();
		/**
		 * @property {Object} Rendering statistics
		 */
		this.stats = {};

		/* Initialization */

		// Bind render method so it can be passed as a callback
		this.render = this.render.bind( this );
		// Initial render
		this.render();
	}

	/**
	 * Request a re-render.
	 *
	 * Requests are batched and performed asynchronously using requestAnimationFrame.
	 */
	touch() {
		if ( !this.queued ) {
			this.queued = true;
			requestAnimationFrame( this.render, 0 );
		}
	}

	/**
	 * Add a changeable object to the next rendering.
	 *
	 * If the object is a component, a renderable for it will be automatically updated or generated
	 * for it and added to #renderables keyed by the component object and also returned for
	 * convenience. If the component was added last rendering and hasn't been moved, adding it again
	 * has no side-effects.
	 *
	 * @param {Renderer.Changeable} changeable Changeable to add
	 * @param {Renderer.Changeable} [parentChangeable=null] Parent changeable object, use null when
	 *     adding root changeable object
	 * @return {Renderer.renderable|null} Renderable object if changeable is a component
	 */
	add( changeable, parentChangeable = null ) {
		if ( changeable instanceof Renderer.Changeable ) {
			// Move changeable from prev to next
			this.prev.delete( changeable );
			this.next.add( changeable );
			// Setup event propagation
			let parentRenderable = this.renderables.get( parentChangeable ) || null;
			if ( changeable instanceof Renderer.Context ) {
				// Direct touch events at parent renderable
				changeable.touch = parentRenderable ? parentRenderable.touch : null;
			} else if ( changeable instanceof Renderer.Component ) {
				// Update parent or auto-create renderable
				let renderable = this.renderables.get( changeable );
				if ( !renderable ) {
					renderable = new Renderer.Renderable( changeable );
					this.renderables.set( changeable, renderable );
					this.stats.added++;
				}
				// Direct touch events at renderable
				changeable.touch = renderable.touch;
				// Assert heirarchy
				renderable.attach( this, parentRenderable );
				return renderable;
			}
		}
		return null;
	}

	/**
	 * Render component tree.
	 *
	 * Traverses and renders component tree, updating objects along the way to reflect additions and
	 * removals. Updates the DOM in-place by diffing with the previous rendering and
	 * patching as needed.
	 */
	render() {
		this.stats.hits = 0;
		this.stats.misses = 0;
		this.stats.added = 0;
		this.stats.deleted = 0;

		this.queued = false;

		// Root
		let renderable = this.add( this.root );
		let context = {};
		let list = renderable.render( context );

		// Traverse and render - breath first
		const stack = [ { renderable, context, list } ];
		const resets = [];
		let current;
		let index = 0;
		while ( current = stack[index++] ) {
			( { renderable, context, list } = current );
			for ( let i = 0, len = list.length; i < len; i++ ) {
				let item = list[i];
				if ( i > 0 && item instanceof Renderer.Changeable ) {
					// Special objects - handle, then use rendering or discard
					if ( item instanceof Renderer.Component ) {
						// Add child renderable to this rendering cycle
						const childRenderable = this.add( item, renderable.component );
						// Trickle-down invalidation
						if ( renderable && renderable.trickleDown >= this.iteration ) {
							resets.push( renderable );
							childRenderable.trickleDown = this.iteration;
						}
						// Replace child renderable with its rendering
						list[i] = childRenderable.render( context );
						// console.log( 'render', childRenderable.component.constructor.name );
						// Descend into item in future iteration
						stack.push( { renderable: childRenderable, context, list: list[i] } );
					} else {
						// Discard non-renderable item from rendering
						delete list[i];
						if ( item instanceof Renderer.Context ) {
							// Add child to this rendering cycle
							this.add( item, renderable.component );
							// Update context
							const childContext = item.update( context );
							// Ammend context prototype chain
							context = Object.create( context );
							Object.assign( context, childContext );
						}
					}
				} else if ( i === 1 && typeof item === 'object' && !Array.isArray( item ) ) {
					// Attributes - Look for events to bind
					const component = renderable.component;
					for ( let key in item ) {
						let method = item[key];
						if ( key.startsWith( 'on' ) ) {
							if ( typeof component[method] === 'function' ) {
								// Bind "on*" event to matching method
								item[key] = renderable.bind( method );
							}
						}
					}
				} else if ( Array.isArray( item ) ) {
					// Element - Descend into child
					stack.push( { renderable, context, list: item } );
				}
			}
		}

		// Trigger external rendering handler
		IncrementalDOM.patch( this.target, parse, stack[0].list );

		// Cleanup detached changables (whatever is left in the prev list)
		for ( let changeable of this.prev ) {
			// Disconnect touch triggering
			changeable.touch = null;
			// Cleanup renderables list
			if ( changeable instanceof Renderer.Component ) {
				let renderable = this.renderables.get( changeable );
				renderable.detach();
				this.renderables.delete( changeable );
			}
			this.stats.deleted++;
		}

		// Swap lists and prepare for next iteration
		[ this.prev, this.next ] = [ this.next, this.prev ];
		this.next.clear();

		// console.log( this.stats );
	}
};

/**
 * Parse DOM Element to JSONML.
 *
 * @param {Element} element DOM Element to parse
 * @return {Array} List of JSONML elements
 */
Renderer.parseElement = function ( element ) {
	let i, len;

	if ( element.nodeType === 3 ) {
		return element.data;
	} else if ( element.nodeType === 1 ) {
		let name = 'div',
			attributes = {},
			children = [];

		// Name
		if ( element.nodeName ) {
			name = element.nodeName.toLowerCase();
		}

		// Attributes
		if ( element.attributes ) {
			for ( i = 0, len = element.attributes.length; i < len; i++ ) {
				let attribute = element.attributes[ i ];
				attributes[ attribute.name ] = attribute.value;
			}
		}

		// Children
		if ( element.childNodes ) {
			for ( i = 0, len = element.childNodes.length; i < len; i++ ) {
				let node = element.childNodes[ i ];
				children.push( Renderer.parseElement( node ) );
			}
		}
		return [ name, attributes ].concat( children );
	}
};

/**
 * Parse HTML string to JSONML.
 *
 * @param {string} html HTML string to parse
 * @return {Array} List of JSONML elements
 */
Renderer.parseHTML = function ( html ) {
	var wrapper = document.createElement( 'span' );
	wrapper.innerHTML = html;
	return String( Renderer.parseElement( wrapper ).slice( 2 ) );
};

/**
 * Sync Changeable object.
 */
Renderer.Changeable = class RendererChangeable {
	/**
	 * Create changeable object.
	 *
	 * @param {Object} props Initialization properties
	 */
	constructor( props = {} ) {
		this.state = {};
		this.props = props;
		this.touch = null;
	}

	/**
	 * Change state.
	 *
	 * Stores changes to state and executes #touch.
	 *
	 * @param {Object} changes Changes to shallow merge onto #state
	 */
	change( changes ) {
		// console.log( 'change', this.constructor.name, changes );
		Object.assign( this.state, changes );
		if ( this.touch ) {
			this.touch( this );
		}
	}

	/**
	 * Change props.
	 *
	 * Stores changes to props and executes #touch.
	 *
	 * @param {Object} props Changes to shallow merge onto #props
	 * @chainable
	 */
	using( props ) {
		// console.log( 'using', this.constructor.name, props );
		Object.assign( this.props, props );
		if ( this.touch ) {
			// this.touch( this );
		}
		return this;
	}
};

/**
 * Sync Component.
 *
 * Components are rendered and their state changes bubble-up.
 */
Renderer.Component = class RendererComponent extends Renderer.Changeable {
	/**
	 * Create component.
	 *
	 * @param {Object} [props={}] Initialization properties
	 */
	constructor( props = {} ) {
		super( props );
	}

	/**
	 * Render the component.
	 *
	 * @param {Object} [context] Rendering context
	 * @return {Array} JSONML rendering
	 */
	render( context ) {
		return [ 'div' ];
	}

	/**
	 * Handle component having been added to rendering tree.
	 */
	onAttach() {
		//
	}

	/**
	 * Handle component about to be removed from rendering tree.
	 */
	onDetach() {
		//
	}
};

/**
 * Sync Context.
 *
 * Contexts are not rendered and their state changes trickle-down.
 */
Renderer.Context = class RendererContext extends Renderer.Changeable {
	/**
	 * Create context.
	 *
	 * @param {Object} [props={}] Initialization properties
	 */
	constructor( props = {} ) {
		super( props );
	}

	/**
	 * Update context properties.
	 *
	 * @return {Object} Context properties
	 */
	update( context ) {
		return {};
	}
};

/**
 * Sync Rendererable.
 *
 * There are two types of invalidation that can occur, trickle-down and bubble-up.
 * Trickle-up happens when the touch changer is an instance of {Renderer.Context} or the renderable has been
 * moved to a new parent, allowing context changes to affect the entire tree downstream of a context
 * object. Bubble-up happens in all other cases, allowing maximum re-use of cached renderings.
 *
 * Renders a component.
 */
Renderer.Renderable = class RendererRenderable {
	constructor ( component ) {
		this.component = component;
		this.renderer = null;
		this.parent = null;
		this.bindings = new Map();
		this.cache = null;
		this.bubbleUp = 0;
		this.trickleDown = 0;
		this.touch = this.touch.bind( this );
	}

	attach( renderer, parent ) {
		if ( renderer !== this.renderer || parent !== this.parent ) {
			// console.log( 'attach', this.component.constructor.name );
			this.renderer = renderer;
			this.parent = parent;
			this.purge();
			this.component.onAttach();
		}
	}

	detach() {
		// console.log( 'detach', this.component.constructor.name );
		this.component.onDetach();
		this.renderer = null;
		this.parent = null;
		this.purge();
	}

	purge() {
		// console.log( 'purge', this.component.constructor.name );
		const next = this.renderer ? this.renderer.iteration + 1 : 0;
		this.cache = null;
		this.bubbleUp = next;
		this.trickleDown = next;
	}

	/**
	 * Request a component to be re-rendered.
	 */
	touch( changer ) {
		// console.log( 'touch', changer.constructor.name, '>', this.component.constructor.name );
		const next = this.renderer ? this.renderer.iteration + 1 : 0;
		if ( changer instanceof Renderer.Context ) {
			this.trickleDown = next;
		}
		let renderable = this;
		do {
			renderable.bubbleUp = next;
		} while ( renderable = renderable.parent );
		if ( this.renderer ) {
			this.renderer.touch();
		}
	}

	/**
	 * Render a component.
	 *
	 * Automatically uses a cached result unless the component has been touched since last render
	 * or the cache is empty.
	 *
	 * @param {Object} [context={}] Rendering context
	 * @return {Array} JASONML rendering
	 */
	render( context = {} ) {
		const current = this.renderer ? this.renderer.iteration : 0;
		if ( this.trickleDown >= current || this.bubbleUp >= current || !this.cache ) {
			// console.log(
			// 	'render',
			// 	{ td: this.trickleDown, bu: this.bubbleUp, ch: !!this.cache },
			// 	this.component.constructor.name
			// );
			this.cache = this.component.render( context );
			if ( this.renderer ) {
				this.renderer.stats.misses++;
			}
		} else {
			if ( this.renderer ) {
				this.renderer.stats.hits++;
			}
		}
		return this.cache;
	}

	/**
	 * Bind a method.
	 *
	 * When called repeatedly with the same method, either by name or reference, the same binding is
	 * returned.
	 *
	 * @param {string|Function} method Method name or functionn
	 * @param {Mixed} [...args] Arguments to bind with
	 */
	bind( method ) {
		if ( typeof method === 'string' ) {
			if ( typeof this.component[method] !== 'function' ) {
				throw new Error( 'Unknown method: ' + method );
			}
			method = this.component[method];
		}
		// TODO: Make binding unique by args
		if ( !this.bindings.has( method ) ) {
			this.bindings.set( method, method.bind( this.component ) );
		}
		return this.bindings.get( method );
	}
};

/**
 * Parse markup and call IncrementalDOM methods.
 *
 * @license MIT
 * @copyright 2015 Paolo Caminiti
 * @see https://github.com/paolocaminiti/jsonml2idom/blob/master/LICENSE
 *
 * @param {Array} markup Markup in JSONML format
 */
function parse( markup ) {
	const {
		elementOpenStart,
		elementOpenEnd,
		elementClose,
		currentElement,
		skip,
		attr,
		text
	} = IncrementalDOM;

	const head = markup[0];
	const attributes = markup[1] && markup[1].constructor === Object ? markup[1] : null;

	// Open tag
	const dotSplit = head.split( '.' );
	const hashSplit = dotSplit[0].split( '#' );
	const tagName = hashSplit[0] || 'div';
	const id = hashSplit[1];
	const className = dotSplit.slice( 1 ).join( ' ' );
	elementOpenStart( tagName, attributes && attributes.key );

	// Apply attributes
	if ( id ) {
		attr( 'id', id );
	}
	if ( className ) {
		attr( 'class', className );
	}
	if ( attributes ) {
		for ( let key in attributes) {
			attr( key, attributes[key] );
		}
	}

	elementOpenEnd();

	// Add children
	if ( attributes && attributes.skip ) {
		skip();
	} else {
		for ( let i = ( attributes ? 2 : 1 ), len = markup.length; i < len; i++ ) {
			const node = markup[i];

			if ( node === undefined ) {
				continue;
			}

			switch ( node.constructor ) {
				case Array:
					parse( node );
					break;
				case Function:
					node( currentElement() );
					break;
				default:
					text( node );
			}
		}
	}

	elementClose( tagName );
}
