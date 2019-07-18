/* global Renderer */

window.LogComponent = class LogComponent extends Renderer.Component {
	constructor( props ) {
		super( props );
		this.state = { messages: [] };
		this.props.conversation.addEventListener( 'message', e => {
			this.change( { messages: this.state.messages.concat( [ e.detail ] ) } );
		} );
	}

	render() {
		return [ 'div.Log',
			[ 'ul',
				...this.state.messages.map( message => {
					const classes = [ message.sender ];
					if ( message.sender === this.props.user ) {
						classes.push( 'mine' );
					}
					return [ 'li.' + classes.join( '.' ),
						[ 'span.sender' ],
						[ 'span.text', Renderer.parseHTML( message.text ) ]
					];
				} )
			]
		];
	}
};
