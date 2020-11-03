export const main = async function (term, argString, argv) {
  await term.print([
    'Available Commands:\n\n',
    { clickHandler: () => { term.simulateInput('date\n') } },
    '[date]\n',
    { clickHandler: () => { term.simulateInput('help\n') } },
    '[help]\n',
    { clickHandler: () => { term.simulateInput('portfolio\n') } },
    '[portfolio]\n',
    { clickHandler: () => { term.simulateInput('social\n') } },
    '[social]',
    '\n\n'
  ],
  { typeOut: true })
}
