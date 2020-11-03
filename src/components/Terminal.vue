<template>
  <div>
    <div id="container">
      <div id="font-test" class="terminal">
        12345678901234567890
        <br />12345678901234567890
        <br />12345678901234567890
        <br />12345678901234567890
        <br />12345678901234567890
        <br />
      </div>
      <div id="real-terminal" class="terminal" ref="term" @wheel.passive="handleWheel">
        <div v-for="(line, rowIndex) of visibleLineBuffer" :key="rowIndex" class="term-line">
          <span
            v-for="(cell, colIndex) of line"
            :key="`${line},${colIndex}`"
            :class="{
              clickable: !!cell.clickHandler

            }"
            :style="{
              color: cell.activeCursor ? cursorColor : cell.color,
              backgroundColor: cell.activeCursor ? cursorColor : cell.backgroundColor,
            }"
            v-on="cell.clickHandler ? {click: cell.clickHandler, mouseover: cell.mouseoverHandler, mouseout: cell.mouseoutHandler} : {}"

          >{{ cell.char }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Shell from '@/lib/term/shell'
const defaultCellProperties = {
  backgroundColor: 'black',
  color: 'green',
  activeCursor: false,
  clickHandler: null,
  mouseoverHandler: null,
  mouseoutHandler: null,
  clickGroup: null,
  hoverStatus: false
}
export default {
  data () {
    return {
      nrows: 0,
      ncols: 0,
      cursorCol: 0,
      cursorLine: 0,
      cursorBlinkRate: 1000,
      cursorTimeout: null,
      cursorColor: 'green',
      printRate: 1,
      lineBuffer: [],
      topLine: 0,
      nextUniqueId: 0,
      clickGroups: {}, // groupID: [cell, cell, ...]
      readLineMemory: []
    }
  },
  computed: {
    visibleLineBuffer () {
      return this.lineBuffer
        .slice(this.topLine, this.topLine + this.nrows)
        .map((line, lineIndex) => {
          return line.slice(0, this.ncols)
        })
    }
  },
  methods: {
    // runtime
    async run (entryFunc, ...args) {
      entryFunc(this, ...args)
    },

    // input
    async readLine (prompt = '', trim = true) {
      await this.print(prompt, { typeOut: true })
      let inputString = ''
      let inputPos = 0
      const startLine = this.cursorLine
      const startCol = this.cursorCol
      // console.log('startline: ', startLine, 'startCol: ', startCol)
      const thisComponent = this
      return new Promise((resolve) => {
        const handleKeyPressEvent = async function (event) {
          // console.log('keypress: ', event)
          if (event.key.length === 1) {
            inputString = inputString.substring(0, inputPos) + event.key + inputString.substring(inputPos)
            inputPos++
            thisComponent.print(inputString, { typeOut: false, line: startLine, col: startCol, updateCursor: false })
            thisComponent.advanceCursor()
            thisComponent.scrollBottom()

            // console.log('inputString: ', inputString)
          } else if (event.key === 'Enter') {
            if (!trim) {
              inputString += '\n'
            }
            thisComponent.print('\n', { typeOut: true })
            document.removeEventListener('keypress', handleKeyPressEvent)
            document.removeEventListener('keydown', handleKeyDownEvent)

            thisComponent.readLineMemory.push(inputString)
            thisComponent.scrollBottom()
            resolve(inputString)
          }
        }
        const handleKeyDownEvent = async function (event) {
          // console.log('keydown: ', event)
          if (event.key === 'Backspace' && inputPos !== 0) {
            inputString = inputString.substring(0, inputPos - 1) + inputString.substring(inputPos)
            inputPos--
            thisComponent.print(inputString + ' ', { typeOut: false, line: startLine, col: startCol, updateCursor: false })
            thisComponent.advanceCursor(false)
            thisComponent.scrollBottom()
          } else if (event.key === 'ArrowLeft' && inputPos !== 0) {
            inputPos--
            thisComponent.advanceCursor(false)
            thisComponent.scrollBottom()
          } else if (event.key === 'ArrowRight' && inputPos < inputString.length) {
            inputPos++
            thisComponent.advanceCursor()
            thisComponent.scrollBottom()
          } else if (event.key === 'Delete' && inputPos < inputString.length) {
            inputString = inputString.substring(0, inputPos) + inputString.substring(inputPos + 1)
            thisComponent.print(inputString + ' ', { typeOut: false, line: startLine, col: startCol, updateCursor: false })
            thisComponent.scrollBottom()
          }
        }
        document.addEventListener('keypress', handleKeyPressEvent)
        document.addEventListener('keydown', handleKeyDownEvent)
      })
    },

    handleKeydown (event) {
      // console.log(event)
      if (event.key && event.key === 'ArrowUp') {
        // scroll up
        this.scroll(-1)
      } else if (event.key && event.key === 'ArrowDown') {
        // scroll down
        this.scroll(1)
      }
    },

    handleWheel (event) {
      this.scroll(event.deltaY / Math.abs(event.deltaY)) // +/- 1
    },

    // simulated input
    simulateInput (input) {
      for (const char of input) {
        if (char === '\n') {
          // simulate return key press
          document.dispatchEvent(new KeyboardEvent('keypress', {
            key: 'Enter'
          }))
        } else {
          // simulate character key press
          document.dispatchEvent(new KeyboardEvent('keypress', {
            key: char
          }))
        }
      }
    },

    // printing
    async printLine (s, opts) {
      return this.print(s + '\n', opts)
    },
    async print (
      s,
      { typeOut = false, line = undefined, col = undefined, updateCursor = true, wrap = false } = {}
    ) {
      const _this = this
      line = line === undefined ? this.cursorLine : line
      col = col === undefined ? this.cursorCol : col

      const cancelTypeOut = (e) => {
        // if (e) console.log(e)
        typeOut = false
      }

      if (typeOut) {
        this.moveCursor(line, col)
        document.addEventListener('click', cancelTypeOut)
        document.addEventListener('keydown', cancelTypeOut)
      }

      const _printOneString = async function (str, properties) {
        if (wrap) {
          // insert some well-placed newlines
          let newStr = ''
          let tempCol = col
          while (str.length) {
            // console.log(`${tempCol}/${_this.ncols}`, newStr)
            if (str[0] === '\n') {
              newStr += '\n'
              str = str.substring(1)
              tempCol = 0
              continue
            }

            let nextChunk = str.match(/^ +/)

            if (nextChunk) {
              // we have spaces next
              if (tempCol + nextChunk[0].length >= _this.ncols) {
                // they spill over
                newStr += '\n' // if whitespace spills over, just replace all of it with a newline
                tempCol = 0
              } else {
                // the spaces don't spill over
                newStr += nextChunk[0]
                tempCol += nextChunk[0].length
              }

              // regardless of how the chunk was dealt with, we move on
              str = str.substring(nextChunk[0].length)
              continue
            }

            nextChunk = str.match(/^[^ \n]+/)
            if (nextChunk) {
              if (tempCol + nextChunk[0].length === _this.ncols) {
                // if the chunk perfectly fits, then default printing behavior will start a new line for us
                // so we remove any following whitespace
                newStr += nextChunk[0]
                tempCol = 0
                str = str.substring(nextChunk[0].length).replace(/^ +/, '')
                continue
              }

              if (tempCol + nextChunk[0].length > _this.ncols) {
                // the non-whitespace chunk spills over
                newStr = newStr.replace(/ +$/, '') + '\n' + nextChunk[0]

                // we take the modulo here to account for the possibility that the chunk is wider than the terminal
                tempCol = nextChunk[0].length % _this.ncols
                str = str.substring(nextChunk[0].length)
                continue
              } else {
                // the non-whitespace chunk doesn't spill over
                newStr += nextChunk[0]
                tempCol += nextChunk[0].length
                str = str.substring(nextChunk[0].length)
                continue
              }
            } else {
              console.error('What the hell does this string begin with? ', str)
            }
          } // end of while loop

          str = newStr
        }

        str = str.replace(/ /g, '\u00A0')

        for (const char of str) {
          if (char === '\n') {
            line++
            col = 0
            if (line === _this.lineBuffer.length) {
              _this.addLine()
            }
          } else {
            // PRINTING A CHARACTER
            const cell = _this.lineBuffer[line][col]

            // console.log('*****char: ', char)
            for (const p in properties) {
              // console.log('p: ', p, ' is ', properties[p])
              cell[p] = properties[p]
            }
            cell.char = char

            if (cell.clickGroup != null) {
              _this.clickGroups[cell.clickGroup].push(cell)
              cell.mouseoverHandler = () => {
                for (const _ of _this.clickGroups[cell.clickGroup]) {
                  _.hoverStatus = false
                }
                cell.hoverStatus = true
                _this.updateClickGroup(cell.clickGroup)
              }

              cell.mouseoutHandler = () => {
                cell.hoverStatus = false
                _this.updateClickGroup(cell.clickGroup)
              }
            }

            const newCoords = _this.nextCell(line, col)
            line = newCoords.line
            col = newCoords.col
            if (line === _this.lineBuffer.length) {
              _this.addLine()
            }
          }
          if (typeOut) {
            _this.moveCursor(line, col)
            await new Promise((resolve) => setTimeout(resolve, _this.printRate))
          }
        }
      }

      if (Array.isArray(s)) {
        // make a copy of the defaults
        let properties = {}
        for (const p in defaultCellProperties) {
          properties[p] = defaultCellProperties[p]
        }

        for (const item of s) {
          if (typeof item === 'string') {
            await _printOneString(item, properties)
          } else {
            properties = {} // start fresh

            for (const p in defaultCellProperties) {
              properties[p] = defaultCellProperties[p]
            }

            for (const p in item) {
              properties[p] = item[p]

              // special consideration for click events
              if (p === 'clickHandler') {
                // the clickHandler property also sets the mouseoverHandler and mouseoutHandler properties
                const clickGroup = this.nextUniqueId++
                properties.clickGroup = clickGroup
                this.clickGroups[properties.clickGroup] = []
              }
            }
          }
        }
      } else {
        await _printOneString(s, defaultCellProperties)
      }

      if (updateCursor) {
        this.moveCursor(line, col)
      }

      document.removeEventListener('click', cancelTypeOut)
      document.removeEventListener('keydown', cancelTypeOut)
    },

    // random utils
    updateClickGroup (clickGroupId) {
      for (const cell of this.clickGroups[clickGroupId]) {
        if (cell.hoverStatus) {
          for (const _ of this.clickGroups[clickGroupId]) {
            _.color = defaultCellProperties.backgroundColor
            _.backgroundColor = defaultCellProperties.color
          }
          return
        }
      }
      for (const _ of this.clickGroups[clickGroupId]) {
        _.color = defaultCellProperties.color
        _.backgroundColor = defaultCellProperties.backgroundColor
      }
    },

    // scrolling
    scroll (delta) {
      this.topLine = Math.min(Math.max(this.topLine + delta, 0), this.lineBuffer.length - this.nrows)
    },

    scrollBottom () {
      // scrolls
      this.topLine = this.lineBuffer.length - this.nrows
    },

    // geometry methods
    getCharDimensions () {
      // return the rendered dimensions of a character [width, height]
      const ft = document.getElementById('font-test')
      return { width: ft.clientWidth / 20, height: ft.clientHeight / 5 }
    },
    updateDimensions () {
      // recalculate display rows and cols
      const el = this.$el
      const { width: charWidth, height: charHeight } = this.getCharDimensions()
      // const charWidth = 12.8
      // const charHeight = 31.2

      const prevCols = this.ncols
      const prevRows = this.nrows

      this.nrows = Math.floor((el.clientHeight * 0.95) / charHeight)
      this.ncols = Math.min(
        Math.floor((el.clientWidth * 0.95) / charWidth),
        60
      )

      if (this.ncols > prevCols) {
        // we need to pad the existing lines
        for (const line of this.lineBuffer) {
          for (let i = 0; i < this.ncols - prevCols; i++) {
            line.push(this.newCell())
          }
        }
      }

      if (this.nrows > prevRows) {
        for (let i = 0; i < this.nrows - prevRows; i++) {
          this.addLine()
        }
      }

      // const lastLine = this.lineBuffer[this.lineBuffer.length - 1]
      // while (lastLine.length < this.ncols) {
      //   lastLine.push(this.newCell())
      // }

      // console.log('New Dimensions: ', this.nrows, this.ncols)
    },
    addLine () {
      this.lineBuffer.push([])
      for (let c = 0; c < this.ncols; c++) {
        this.lineBuffer[this.lineBuffer.length - 1].push(this.newCell())
      }
      this.topLine = Math.max(0, this.lineBuffer.length - this.nrows)
    },
    newCell () {
      // creates a new cell object
      const cell = {
        char: '\u00A0' // nbsp
      }

      for (const p in defaultCellProperties) {
        this.$set(cell, p, defaultCellProperties[p])
      }
      return cell
    },

    // cursor management
    advanceCursor (forwards = true) {
      const nextPos = forwards ? this.nextCell(this.cursorLine, this.cursorCol) : this.prevCell(this.cursorLine, this.cursorCol)
      this.moveCursor(nextPos.line, nextPos.col)
    },
    nextCell (fromLine, fromCol) {
      return {
        line: fromCol === this.ncols - 1 ? fromLine + 1 : fromLine,
        col: (fromCol + 1) % this.ncols
      }
    },
    prevCell (fromLine, fromCol) {
      return {
        line: fromCol === 0 ? fromLine - 1 : fromLine,
        col: fromCol > 0 ? fromCol - 1 : this.ncols - 1
      }
    },
    moveCursor (line, col) {
      const cell = this.lineBuffer[this.cursorLine][this.cursorCol]
      cell.activeCursor = false

      this.cursorCol = col
      this.cursorLine = line
      this.showCursor(true)
    },
    showCursor (showing = true, blink = true) {
      if (this.cursorTimeout !== null) {
        clearTimeout(this.cursorTimeout)
        this.cursorTimeout = null
      }
      const cell = this.lineBuffer[this.cursorLine][this.cursorCol]
      if (showing) {
        cell.activeCursor = true
      } else {
        cell.activeCursor = false
      }

      if (blink) {
        this.cursorTimeout = setTimeout(() => {
          this.showCursor(!showing, blink)
        }, this.cursorBlinkRate)
      }
    }
  },
  created () {

  },
  destroyed () {
    window.removeEventListener('resize', this.updateDimensions)
  },
  mounted () {
    window.addEventListener('resize', this.updateDimensions)
    document.addEventListener('keydown', this.handleKeydown)
    // this.$refs.term.addEventListener('wheel', this.handleWheel)
    this.updateDimensions()

    this.run(Shell.main)
  }
}
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=VT323&display=swap");

#container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  width: min-content;
  margin: auto;
}

.terminal {
  font-family: "VT323", monospace;
  font-variant-ligatures: none;
  font-size: 32px;
  background-color: black;
  letter-spacing: 0;
  line-height: 1em;
  white-space: nowrap;
  overflow: hidden;
  margin: auto;
}

.clickable {
  cursor: pointer;
}

#real-terminal {
  border: 1px solid green;
  padding: 1px;
}

#font-test {
  display: inline-block;
  position: absolute;
  visibility: hidden;
}
</style>
