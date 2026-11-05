import {describe, it, expect, afterEach} from 'vitest'
import {ref} from 'vue'
import {Editor} from '@tiptap/core'

import {createEditorExtensions, type EditorExtensionDeps} from './editorExtensions'
import {sliceToPlainText} from './clipboardText'

window.API_URL = 'http://localhost:3456'

function createEditor(content: string) {
	const holder = document.createElement('div')
	document.body.appendChild(holder)

	let editor: Editor
	const deps: EditorExtensionDeps = {
		t: key => key,
		isEditing: ref(true),
		isEditEnabled: () => true,
		placeholder: '',
		contentHasChanged: ref(false),
		bubbleSave: () => {},
		getEditor: () => editor,
		uploadCallback: undefined,
		uploadAndInsertFiles: () => {},
	}

	editor = new Editor({element: holder, extensions: createEditorExtensions(deps), content})

	return editor
}

function plainTextOf(html: string) {
	const editor = createEditor(html)
	return sliceToPlainText(editor.state.doc.slice(0, editor.state.doc.content.size))
}

afterEach(() => {
	document.body.innerHTML = ''
})

describe('sliceToPlainText', () => {
	it('keeps bullet markers of a list', () => {
		expect(plainTextOf('<p>start</p><ul><li><p>this</p></li><li><p>is</p></li></ul><p>end</p>'))
			.toBe('start\n- this\n- is\nend')
	})

	it('numbers an ordered list', () => {
		expect(plainTextOf('<ol><li><p>one</p></li><li><p>two</p></li></ol>')).toBe('1. one\n2. two')
	})

	it('marks task items', () => {
		expect(plainTextOf('<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>done</p></li><li data-type="taskItem" data-checked="false"><p>open</p></li></ul>'))
			.toBe('- [x] done\n- [ ] open')
	})

	it('indents nested lists under their parent item', () => {
		expect(plainTextOf('<ul><li><p>outer</p><ul><li><p>inner</p></li></ul></li></ul>'))
			.toBe('- outer\n  - inner')
	})

	it('returns plain paragraphs unchanged', () => {
		expect(plainTextOf('<p>first</p><p>second</p>')).toBe('first\nsecond')
	})
})
