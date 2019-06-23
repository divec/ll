/*!
 * LL two-way parallel translation - Translator class
 *
 * @copyright 2019 LL team and others; see LICENSE.txt for terms
 */

/**
 * Abstract class implementing a translator
 * @abstract
 * @class
 *
 * @constructor
 */
ll.Translator = function LLTranslator() {
};

/* Initialization */

OO.initClass( ll.Translator );

/* Instance methods */

/**
 * Machine translate chunked source
 *
 * @param {string} sourceLang Source language code; only en|es are supported right now
 * @param {string} targetLang Target language code; only es|en are supported right now
 * @param {ll.ChunkedText[]} texts Texts to translate
 * @return {Promise} Promise resolving with translated ll.ChunkedText[]
 */
ll.Translator.prototype.translate = null;
