class FruitFiesta {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.setupCanvas()

    // Game State
    this.gameRunning = false
    this.score = 0
    this.lives = 5
    this.level = 1
    this.maxLevel = 10

    // Basket
    this.basket = {
      x: 0,
      y: 0,
      width: 80,
      height: 60,
      speed: 8,
    }

    this.fruitTypes = [
      { emoji: "🍎", speed: 1.5 },
      { emoji: "🍌", speed: 1.2 },
      { emoji: "🍊", speed: 1.6 },
      { emoji: "🍇", speed: 1.4 },
      { emoji: "🍓", speed: 1.5 },
    ]

    // Fruits and Bombs
    this.fruits = []
    this.bombs = []
    this.fruitsCaughtSinceLastBomb = 0 // Add bomb tracking

    // Input
    this.keys = {}
    this.fruitSpawnTime = 0
    this.fruitSpawnInterval = 150 // Much slower spawn for level 1

    this.touchX = null
    this.isMobile = false

    this.levelTransitionDelay = 0

    this.setupBasket()
    this.setupEventListeners()
    this.detectMobile()
  }

  setupCanvas() {
    this.canvas.width = this.canvas.offsetWidth || 800
    this.canvas.height = this.canvas.offsetHeight || 500

    window.addEventListener("resize", () => {
      this.canvas.width = this.canvas.offsetWidth
      this.canvas.height = this.canvas.offsetHeight
    })
  }

  setupBasket() {
    this.basket.x = this.canvas.width / 2 - this.basket.width / 2
    this.basket.y = this.canvas.height - 120
  }

  detectMobile() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true
      this.handleKeyPress(e.key.toLowerCase())
    })

    document.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false
    })

    document.addEventListener("touchstart", (e) => {
      const touch = e.touches[0]
      this.touchX = touch.clientX
    })

    document.addEventListener("touchmove", (e) => {
      if (!this.touchX) return
      const touch = e.touches[0]
      const diff = touch.clientX - this.touchX

      if (diff < -5) {
        this.basket.x = Math.max(0, this.basket.x - this.basket.speed * 2)
      } else if (diff > 5) {
        this.basket.x = Math.min(this.canvas.width - this.basket.width, this.basket.x + this.basket.speed * 2)
      }
      this.touchX = touch.clientX
    })

    document.addEventListener("touchend", () => {
      this.touchX = null
    })

    const homeBtn = document.getElementById("homeBtn")
    if (homeBtn) {
      homeBtn.addEventListener("click", () => this.goHome())
    }

    const homeStartBtn = document.getElementById("homeStartBtn")
    if (homeStartBtn) {
      homeStartBtn.addEventListener("click", () => this.startGame())
    }

    const restartBtn = document.getElementById("restartBtn")
    if (restartBtn) {
      restartBtn.addEventListener("click", () => this.restartGame())
    }

    const gameOverRestartBtn = document.getElementById("gameOverRestartBtn")
    if (gameOverRestartBtn) {
      gameOverRestartBtn.addEventListener("click", () => this.restartGame())
    }

    const gameWonRestartBtn = document.getElementById("gameWonRestartBtn")
    if (gameWonRestartBtn) {
      gameWonRestartBtn.addEventListener("click", () => this.restartGame())
    }
  }

  goHome() {
    this.gameRunning = false
    const homeScreen = document.getElementById("homeScreen")
    const gameContainer = document.getElementById("gameContainer")
    if (homeScreen) homeScreen.classList.add("active")
    if (gameContainer) gameContainer.style.display = "none"
  }

  startGame() {
    const homeScreen = document.getElementById("homeScreen")
    const gameContainer = document.getElementById("gameContainer")
    if (homeScreen) homeScreen.classList.remove("active")
    if (gameContainer) gameContainer.style.display = "block"

    const controlsText = document.getElementById("controlsText")
    if (controlsText) {
      controlsText.textContent = this.isMobile ? "Swipe left/right to move" : "Use ← → Arrow Keys or A/D to Move"
    }

    setTimeout(() => {
      this.canvas.width = this.canvas.offsetWidth
      this.canvas.height = this.canvas.offsetHeight
      this.setupBasket()
    }, 10)

    this.gameRunning = true
    this.score = 0
    this.lives = 5
    this.level = 1
    this.fruits = []
    this.bombs = []
    this.fruitsCaughtSinceLastBomb = 0
    this.fruitSpawnTime = 0
    this.levelTransitionDelay = 0
    this.fruitSpawnInterval = 150 // Start with slow spawn

    const restartBtn = document.getElementById("restartBtn")
    if (restartBtn) restartBtn.style.display = "inline-block"

    const gameOverScreen = document.getElementById("gameOverScreen")
    if (gameOverScreen) gameOverScreen.style.display = "none"

    const gameWonScreen = document.getElementById("gameWonScreen")
    if (gameWonScreen) gameWonScreen.style.display = "none"

    const levelUpScreen = document.getElementById("levelUpScreen")
    if (levelUpScreen) levelUpScreen.style.display = "none"

    this.updateUI()

    this.gameLoop()
  }

  restartGame() {
    this.gameRunning = false
    this.startGame()
  }

  handleKeyPress(key) {
    if (key === "enter" && !this.gameRunning) {
      this.startGame()
    }
  }

  updateLevel() {
    const scoreThreshold = this.level * 10
    if (this.score >= scoreThreshold && this.level < this.maxLevel) {
      this.showLevelUpScreen()
      this.level++
      this.playSound("levelup")
      this.adjustDifficulty()
    }
  }

  adjustDifficulty() {
    const speedMultiplier = 1 + (this.level - 1) * 0.08
    this.fruitTypes.forEach((fruit) => {
      fruit.speed = fruit.speed * speedMultiplier
    })
    // Decrease spawn interval more gradually (slower fruits spawn more frequently)
    this.fruitSpawnInterval = Math.max(60, 150 - (this.level - 1) * 8)
  }

  showLevelUpScreen() {
    this.levelTransitionDelay = 120
    const levelUpScreen = document.getElementById("levelUpScreen")
    if (levelUpScreen) {
      const nextLevelNum = document.getElementById("nextLevelNum")
      if (nextLevelNum) nextLevelNum.textContent = this.level + 1
      levelUpScreen.style.display = "flex"
      setTimeout(() => {
        if (levelUpScreen) levelUpScreen.style.display = "none"
      }, 2000)
    }
  }

  updateBasketPosition() {
    if (this.keys["arrowleft"] || this.keys["a"]) {
      this.basket.x = Math.max(0, this.basket.x - this.basket.speed)
    }
    if (this.keys["arrowright"] || this.keys["d"]) {
      this.basket.x = Math.min(this.canvas.width - this.basket.width, this.basket.x + this.basket.speed)
    }
  }

  spawnFruit() {
    if (this.levelTransitionDelay > 0) return

    this.fruitSpawnTime++

    if (this.fruitSpawnTime > this.fruitSpawnInterval) {
      if (this.fruitsCaughtSinceLastBomb >= Math.random() * 5 + 5) {
        const bomb = {
          x: Math.random() * (this.canvas.width - 40),
          y: -50,
          size: 40,
          emoji: "💣",
          vx: (Math.random() - 0.5) * 0.5,
          vy: 2,
          isBomb: true,
        }
        this.bombs.push(bomb)
        this.fruitsCaughtSinceLastBomb = 0
      } else {
        const fruitType = this.fruitTypes[Math.floor(Math.random() * this.fruitTypes.length)]
        const fruit = {
          x: Math.random() * (this.canvas.width - 40),
          y: -50,
          size: 40,
          type: fruitType,
          vx: (Math.random() - 0.5) * 0.5,
          vy: fruitType.speed,
          isBomb: false,
        }

        this.fruits.push(fruit)
        this.fruitsCaughtSinceLastBomb++
      }
      this.fruitSpawnTime = 0
    }
  }

  updateFruits() {
    this.fruits = this.fruits.filter((fruit) => {
      fruit.y += fruit.vy
      fruit.x += fruit.vx

      if (fruit.x < 0) fruit.x = 0
      if (fruit.x + fruit.size > this.canvas.width) fruit.x = this.canvas.width - fruit.size

      if (this.checkCollision(fruit)) {
        this.score++
        this.playSound("catch")
        return false
      }

      if (fruit.y > this.canvas.height) {
        this.lives--
        this.playSound("miss")

        if (this.lives <= 0) {
          this.endGame()
        }

        return false
      }

      return true
    })

    this.bombs = this.bombs.filter((bomb) => {
      bomb.y += bomb.vy
      bomb.x += bomb.vx

      if (bomb.x < 0) bomb.x = 0
      if (bomb.x + bomb.size > this.canvas.width) bomb.x = this.canvas.width - bomb.size

      if (this.checkCollision(bomb)) {
        this.lives--
        this.playSound("bomb")

        if (this.lives <= 0) {
          this.endGame()
        }

        return false
      }

      if (bomb.y > this.canvas.height) {
        return false
      }

      return true
    })
  }

  checkCollision(item) {
    return (
      item.x < this.basket.x + this.basket.width &&
      item.x + item.size > this.basket.x &&
      item.y + item.size > this.basket.y &&
      item.y < this.basket.y + this.basket.height
    )
  }

  playSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      if (type === "catch") {
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } else if (type === "miss") {
        oscillator.frequency.value = 400
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } else if (type === "bomb") {
        oscillator.frequency.value = 200
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } else if (type === "levelup") {
        oscillator.frequency.value = 1200
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }
    } catch (e) {
      console.log("[v0] Sound error:", e)
    }
  }

  drawBasket() {
    this.ctx.font = "50px Arial"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"
    this.ctx.fillText("🧺", this.basket.x + this.basket.width / 2, this.basket.y + this.basket.height / 2)
  }

  drawFruits() {
    this.fruits.forEach((fruit) => {
      this.ctx.font = `${fruit.size}px Arial`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText(fruit.type.emoji, fruit.x + fruit.size / 2, fruit.y + fruit.size / 2)
    })

    this.bombs.forEach((bomb) => {
      this.ctx.font = `${bomb.size}px Arial`
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText(bomb.emoji, bomb.x + bomb.size / 2, bomb.y + bomb.size / 2)
    })
  }

  drawScore() {
    this.ctx.fillStyle = "rgba(45, 106, 79, 0.6)"
    this.ctx.font = "bold 24px Arial"
    this.ctx.textAlign = "center"
    this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, 40)

    const nextLevelScore = this.level * 10
    this.ctx.fillStyle = "rgba(82, 183, 136, 0.7)"
    this.ctx.font = "16px Arial"
    this.ctx.fillText(`${this.score}/${nextLevelScore}`, this.canvas.width / 2, 65)
  }

  updateUI() {
    const scoreEl = document.getElementById("score")
    if (scoreEl) scoreEl.textContent = this.score

    const livesEl = document.getElementById("lives")
    if (livesEl) livesEl.textContent = this.lives

    const levelEl = document.getElementById("level")
    if (levelEl) levelEl.textContent = this.level
  }

  endGame() {
    this.gameRunning = false

    const finalScore = document.getElementById("finalScore")
    if (finalScore) finalScore.textContent = this.score

    const levelReached = document.getElementById("levelReached")
    if (levelReached) levelReached.textContent = this.level

    const gameOverScreen = document.getElementById("gameOverScreen")
    if (gameOverScreen) gameOverScreen.style.display = "flex"

    const restartBtn = document.getElementById("restartBtn")
    if (restartBtn) restartBtn.style.display = "none"
  }

  winGame() {
    this.gameRunning = false

    const winFinalScore = document.getElementById("winFinalScore")
    if (winFinalScore) winFinalScore.textContent = this.score

    const gameWonScreen = document.getElementById("gameWonScreen")
    if (gameWonScreen) gameWonScreen.style.display = "flex"

    const restartBtn = document.getElementById("restartBtn")
    if (restartBtn) restartBtn.style.display = "none"

    this.playSound("levelup")
  }

  gameLoop() {
    if (!this.gameRunning) return

    if (this.levelTransitionDelay > 0) {
      this.levelTransitionDelay--
      requestAnimationFrame(() => this.gameLoop())
      return
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.updateBasketPosition()
    this.spawnFruit()
    this.updateFruits()
    this.updateLevel()

    if (this.level > this.maxLevel) {
      this.winGame()
      return
    }

    this.drawBasket()
    this.drawFruits()
    this.drawScore()

    this.updateUI()

    requestAnimationFrame(() => this.gameLoop())
  }
}

// Initialize and start - show home screen on load
if (typeof document !== "undefined" && document.getElementById("gameCanvas")) {
  const game = new FruitFiesta()
}
