export const main = async function (term, argc, argv) {
  await term.printLine(new Date().toDateString(), { typeOut: true })
}
