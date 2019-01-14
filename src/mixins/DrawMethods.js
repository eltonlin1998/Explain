export default {
  methods: {
    rescaleCanvas() {
      // only redraw when the user has finished resizing the window
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawStrokesInstantly(), 400) // resizing the canvas causes all drawings to be lost 
    },
    async playVideo() {
      // prevent the option of playing non-video supported video (because there was no recording in the first place)
      // breaks if there are strokes rendering simultaneously 
      // this.$refs['record-button'].playRecording()
      this.isPlayingVideo = true 
      this.currentTime = 0
      this.idx = 0 
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      const checkWhetherStrokesShouldBePlayed = async () => {
        const startIdx = this.idx 
        for (let i = startIdx; i < this.allStrokes.length; i++) {
          const nextStroke = this.allStrokes[i]
          if (Number(nextStroke.startTime) == this.currentTime.toFixed(1)) {
            const strokePeriod = (nextStroke.endTime - nextStroke.startTime) * 1000
            const pointPeriod = strokePeriod / nextStroke.points.length 
            this.drawStroke(nextStroke.points, pointPeriod)
            if (i == this.allStrokes.length - 1) {
              clearInterval(this.playProgress)
              this.isPlayingVisual = false 
            }
          } else {
            this.idx = i 
            this.isPlayingVideo = true
            break 
          }
        }
        this.currentTime += 0.1
      }
      this.playProgress = setInterval(checkWhetherStrokesShouldBePlayed, 100)
    },
    async quickplay() {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      for (const stroke of this.allStrokes) {
        await this.drawStroke(stroke.points)
      }
		},
    drawStrokesInstantly() {
      for (const stroke of this.allStrokes) {
        this.drawStroke(stroke.points, null)
      }
    },
    // null is instant, 0 is quickplay, otherwise it's a realtime replay
    async drawStroke(points, pointPeriod = 0) {
      return new Promise(async resolve => {
        this.setStyle()
        for (const point of points) {
          const x = point.unitX * this.canvas.width
          const y = point.unitY * this.canvas.height
          this.drawToPoint(x, y)
          if (pointPeriod != null) {
            await new Promise(resolve => setTimeout(resolve, pointPeriod)) // this line is really important, in that it's what makes the function take time to finish executing 
          }
        }
        this.lastX = -1
        resolve()
      })  
    },
    drawToPoint(x, y) {
      if (this.lastX == -1) {
        this.lastX = x
        this.lastY = y
        return
      }
      this.setStyle()
      this.traceLineTo(x, y)
      this.ctx.stroke() 
      // update position
      this.lastX = x
      this.lastY = y
    },
    setStyle() {
      this.ctx.strokeStyle = 'purple'
      this.ctx.lineCap = 'round' // lines at different angles can join into each other
      this.ctx.lineWidth = 2
    },
    traceLineTo(x, y) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(x,y)
    }
  }
}