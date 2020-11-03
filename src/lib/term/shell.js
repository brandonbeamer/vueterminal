/**********
 *
 *  Shell-like interface for Brandon's Terminal
 *
 */

const commands = {
  date: () => import('@/lib/term/date'),
  help: () => import('@/lib/term/help'),
  portfolio: () => import('@/lib/term/portfolio'),
  social: () => import('@/lib/term/social')
}

export default {
  main: async function (term, ...argv) {
    await term.print('Welcome to BrandonBeamer.com!\n\n', { typeOut: true, wrap: true })
    while (true) {
      await term.print([
        'Type a command; try ',
        { clickHandler: () => { term.simulateInput('help\n') } }, '[help]', {},
        " if you don't know any.\n"
      ], { typeOut: true, wrap: true })
      const input = await term.readLine('> ', false)
      // console.log('input: ', input.length)
      if (!input.match(/\S/)) continue

      const command = input.match(/^\S+/)[0]
      const argString = input.match(/\s+(.*)/)[1]
      const argv = argString.split(/\s+/)

      if (commands[command]) {
        // const val = commands[command]
        // if (typeof val === 'string') {
        //   // we need to load it
        //   commands[command]
        // }

        // console.log(commands)
        // run it after possibly loading
        const mod = await commands[command]()
        await mod.main(term, argString, argv)
      } else {
        // no such command
        await term.printLine(`Unrecognized command: ${command}`)
      }
    }
  }
}
