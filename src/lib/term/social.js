import axios from 'axios'
import Parser from '@/lib/util/TextParser'

const textFile = '/social.txt'
const OPT = { wrap: true, typeOut: true }

export const main = async function (term, ...argv) {
  let resp
  try {
    resp = await axios.get(textFile)
  } catch {
    await term.print(`Unable to fetch data '${textFile}'.\n\n`, OPT)
    return
  }

  await term.print(Parser.parse(resp.data), OPT)
}
