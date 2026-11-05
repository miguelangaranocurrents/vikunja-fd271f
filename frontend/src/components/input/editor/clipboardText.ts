import type {Fragment, Node, Slice} from '@tiptap/pm/model'

// Plain-text representation of a copied slice. ProseMirror's default flattens lists into
// bare lines, so bullets and numbers would be lost when pasting into a plain text target.
export function sliceToPlainText(slice: Slice): string {
	const lines: string[] = []
	appendBlocks(slice.content, '', lines)
	return lines.join('\n')
}

function appendBlocks(content: Fragment, indent: string, lines: string[]) {
	content.forEach(node => appendBlock(node, indent, lines))
}

function appendBlock(node: Node, indent: string, lines: string[]) {
	switch (node.type.name) {
		case 'bulletList':
			node.forEach(item => appendListItem(item, indent, '- ', lines))
			return
		case 'orderedList': {
			let number = node.attrs.start ?? 1
			node.forEach(item => {
				appendListItem(item, indent, `${number}. `, lines)
				number++
			})
			return
		}
		case 'taskList':
			node.forEach(item => {
				const box = item.attrs.checked ? '[x] ' : '[ ] '
				appendListItem(item, indent, '- ' + box, lines)
			})
			return
		case 'blockquote': {
			const quoteLines: string[] = []
			appendBlocks(node.content, '', quoteLines)
			quoteLines.forEach(line => lines.push(indent + '> ' + line))
			return
		}
		default:
			if (node.isTextblock) {
				lines.push(indent + node.textContent)
				return
			}
			appendBlocks(node.content, indent, lines)
	}
}

function appendListItem(item: Node, indent: string, marker: string, lines: string[]) {
	const continuation = indent + ' '.repeat(marker.length)
	for (let index = 0; index < item.childCount; index++) {
		const child = item.child(index)
		if (index > 0) {
			appendBlock(child, continuation, lines)
		} else if (child.isTextblock) {
			lines.push(indent + marker + child.textContent)
		} else {
			// The item starts with a nested block; keep its marker on the item line.
			const nested: string[] = []
			appendBlock(child, continuation, nested)
			if (nested.length > 0) {
				lines.push(indent + marker + nested[0].slice(continuation.length))
				lines.push(...nested.slice(1))
			}
		}
	}
}
