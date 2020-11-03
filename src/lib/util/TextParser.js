/*****
 *
 * Implements a parser with markdown-inspired features
 *
 * Current Features:
 *
 * (...)[http://...] - style links, including named ones with references at the bottom of the file
 *
 *
 *
 */

export default {
  parse (input) {
    // returns an array stuitable for term.print()

    // Get link references from bottom of file
    // refs must be a list at the end of the file and each must match /^\[[^\]]\]: \S+$/m

    const refs = {}

    input = input.replace(/\s+$/, '')

    const matchRefList = input.match(/(?<=\n)(?:\[[^\]]+\]\s*:\s*\S+(?:\n+|$))+$/)
    // const matchRefList = input.match(/(?<=\n)(?:\[.+?\]\s*:\s*.+?(?:\n+|$))+$/)
    // console.log(matchRefList)
    if (matchRefList) {
      const refListText = input.substring(input.length - matchRefList[0].length)

      input = input.substring(0, input.length - matchRefList[0].length)
      refListText.split(/\n+/).map(line => {
        const m = line.match(/^\[([^\]]+)\]\s*:\s*(\S+)$/)
        refs[m[1].toLowerCase()] = m[2]
      })
    }

    // console.log(input)

    // the array of items suitable to be sent to tem.print()
    const items = []

    // split text into paragraphs
    const pars = input.replace(/\s+$/, '').split(/\n\s*\n/)

    // parse each paragraph
    for (const par of pars) {
      // append some items for each paragraph
      items.splice(items.length, 0, ...parseParagraph(par, refs))

      // all paragraphs are separated by two newlines, including the last one
      items.push('\n\n')
    }

    // console.log(items)
    return items
  }
}

function parseParagraph (text, refs) {
  // if paragraph starts with whitespace, newlines are respected, otherwise converted to whitespace
  // this allows us to have lists without two newlines between items, for instance
  if (!text.startsWith(' ')) {
    text = text.replace(/\s*\n\s*/g, ' ')
  }

  const items = []

  // match all instances of [...](...) and replace them with clickables
  let pos = 0
  for (const m of text.matchAll(/\[([^\])]+)\]\(([^\])]+)\)/g)) {
    // console.log(m)
    // console.log('remaining: ', text.substring(pos))
    // console.log('next: ', m[0])
    items.push(text.substring(pos, m.index))
    pos = m.index + m[0].length
    const lhs = m[1].toLowerCase()
    const rhs = m[2]
    const url = lhs in refs ? refs[lhs] : rhs
    items.push({ clickHandler: () => { window.open(url) } })
    items.push('[' + m[2] + ']')
    items.push({})
  }
  items.push(text.substring(pos))
  // console.log(items)
  return items
}
