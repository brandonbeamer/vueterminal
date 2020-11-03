import axios from 'axios'
import Parser from '@/lib/util/TextParser'

const OPT = { wrap: true, typeOut: true }

const dataFiles = {
  ascend: '/portfolio/ascend.txt',
  terminal: '/portfolio/terminal.txt',
  whoseturnisit: '/portfolio/whoseturn.txt'
}

export const main = async function (term, argc, argv) {
  const file = argv[0]
  if (!file || file === 'help') {
    // print the list
    await term.print([
      "Type 'portfolio <PROJECT>' to read about a project. \n",
      'List of portfolio projects:\n\n',
      { clickHandler: () => { term.simulateInput('portfolio ascend\n') } }, '[ascend]', {}, '\n',
      { clickHandler: () => { term.simulateInput('portfolio terminal\n') } }, '[terminal]', {}, '\n',
      { clickHandler: () => { term.simulateInput('portfolio whoseturnisit\n') } }, '[whoseturnisit]', {},
      '\n\n'
    ], OPT)
    return
  }

  if (!dataFiles[file]) {
    // file not found
    await term.print([`Porfolio project '${file}' not found. Type `,
      { clickHandler: () => { term.simulateInput('portfolio\n') } },
      '[portfolio]',
      {},
      ' to get a list of projects.\n\n'], OPT)
    return
  }

  // parse the file
  let resp
  try {
    resp = await axios.get(dataFiles[file])
    // await term.print(Parser.parse(resp.data), OPT)
  } catch {
    await term.print(`Unable to fetch data on project '${file}'.\n\n`, OPT)
    return
  }

  await term.print(Parser.parse(resp.data), OPT)
}
