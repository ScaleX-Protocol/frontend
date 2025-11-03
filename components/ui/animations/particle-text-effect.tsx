"use client"

import { useEffect, useRef } from "react"

interface Vector2D {
  x: number
  y: number
}

interface Color {
  r: number
  g: number
  b: number
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 }
  vel: Vector2D = { x: 0, y: 0 }
  acc: Vector2D = { x: 0, y: 0 }
  target: Vector2D = { x: 0, y: 0 }
  
  closeEnoughTarget = 100
  maxSpeed = 1.0
  maxForce = 0.1
  particleSize = 10
  isKilled = false
  
  startColor: Color = { r: 0, g: 0, b: 0 }
  targetColor: Color = { r: 0, g: 0, b: 0 }
  colorWeight = 0
  colorBlendRate = 0.01

  move() {
    const distance = this.getDistanceToTarget()
    const proximityMult = this.calculateProximityMultiplier(distance)
    
    const force = this.calculateSteeringForce(proximityMult)
    this.applyForce(force)
    this.updatePosition()
  }

  private getDistanceToTarget(): number {
    const dx = this.pos.x - this.target.x
    const dy = this.pos.y - this.target.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private calculateProximityMultiplier(distance: number): number {
    return distance < this.closeEnoughTarget 
      ? distance / this.closeEnoughTarget 
      : 1
  }

  private calculateSteeringForce(proximityMult: number): Vector2D {
    const desired = this.getDesiredVelocity(proximityMult)
    return this.limitForce({
      x: desired.x - this.vel.x,
      y: desired.y - this.vel.y
    })
  }

  private getDesiredVelocity(proximityMult: number): Vector2D {
    const direction = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y
    }
    
    const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
    if (magnitude === 0) return { x: 0, y: 0 }
    
    const speed = this.maxSpeed * proximityMult
    return {
      x: (direction.x / magnitude) * speed,
      y: (direction.y / magnitude) * speed
    }
  }

  private limitForce(force: Vector2D): Vector2D {
    const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
    if (magnitude === 0 || magnitude <= this.maxForce) return force
    
    return {
      x: (force.x / magnitude) * this.maxForce,
      y: (force.y / magnitude) * this.maxForce
    }
  }

  private applyForce(force: Vector2D) {
    this.acc.x += force.x
    this.acc.y += force.y
  }

  private updatePosition() {
    this.vel.x += this.acc.x
    this.vel.y += this.acc.y
    this.pos.x += this.vel.x
    this.pos.y += this.vel.y
    this.acc.x = 0
    this.acc.y = 0
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    if (!this.isKilled) {
      this.updateColor()
    }
    const color = this.getCurrentColor()
    const colorString = `rgb(${color.r}, ${color.g}, ${color.b})`
    
    ctx.save()
    ctx.shadowColor = colorString
    ctx.shadowBlur = drawAsPoints ? 3 : 5
    ctx.fillStyle = colorString
    
    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2)
    } else {
      ctx.beginPath()
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }

  private updateColor() {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
    }
  }

  getCurrentColor(): Color {
    return {
      r: Math.round(this.interpolateColor(this.startColor.r, this.targetColor.r)),
      g: Math.round(this.interpolateColor(this.startColor.g, this.targetColor.g)),
      b: Math.round(this.interpolateColor(this.startColor.b, this.targetColor.b))
    }
  }

  private interpolateColor(start: number, target: number): number {
    return start + (target - start) * this.colorWeight
  }

  kill(width: number, height: number) {
    if (this.isKilled) return
    
    this.setExitTarget(width, height)
    this.isKilled = true
  }

  private setExitTarget(width: number, height: number) {
    const angle = Math.random() * Math.PI * 2
    const distance = (width + height) / 2
    const center = { x: width / 2, y: height / 2 }
    
    this.target = {
      x: center.x + Math.cos(angle) * distance,
      y: center.y + Math.sin(angle) * distance
    }
  }
}

interface ParticleTextEffectProps {
  words?: string[]
}

const DEFAULT_WORDS = ["SCALEX", "PROTOCOL", "FINANCE", "DEFI"]
const PIXEL_STEPS = 6
const DRAW_AS_POINTS = true
const WORD_TRANSITION_FRAMES = 360

const COLOR_PALETTE: Color[] = [
  { r: 96, g: 165, b: 250 },  // blue-400
  { r: 139, g: 92, b: 246 },  // violet-500
  { r: 168, g: 85, b: 247 },  // purple-500
  { r: 59, g: 130, b: 246 },  // blue-500
]

export function ParticleTextEffect({ words = DEFAULT_WORDS }: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const frameCountRef = useRef(0)
  const wordIndexRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0, isPressed: false, isRightClick: false })

  const generateRandomPosition = (centerX: number, centerY: number, radius: number): Vector2D => {
    const angle = Math.random() * Math.PI * 2
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  }

  const renderTextToCanvas = (word: string, canvas: HTMLCanvasElement): ImageData => {
    const offscreen = document.createElement("canvas")
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    const ctx = offscreen.getContext("2d")!

    ctx.fillStyle = "white"
    ctx.font = "300 120px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(word, canvas.width / 2, canvas.height / 2)

    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  const getPixelCoordinates = (imageData: ImageData): number[] => {
    const coordinates: number[] = []
    const pixels = imageData.data
    
    for (let i = 0; i < pixels.length; i += PIXEL_STEPS * 4) {
      coordinates.push(i)
    }
    
    return shuffleArray(coordinates)
  }

  const shuffleArray = (array: number[]): number[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const createOrReuseParticle = (particleIndex: number, canvas: HTMLCanvasElement): Particle => {
    const particles = particlesRef.current
    
    if (particleIndex < particles.length) {
      const particle = particles[particleIndex]
      particle.isKilled = false
      return particle
    }

    return createNewParticle(canvas)
  }

  const createNewParticle = (canvas: HTMLCanvasElement): Particle => {
    const particle = new Particle()
    const center = { x: canvas.width / 2, y: canvas.height / 2 }
    const radius = (canvas.width + canvas.height) / 2
    
    const startPos = generateRandomPosition(center.x, center.y, radius)
    particle.pos = startPos
    
    particle.maxSpeed = Math.random() * 3 + 2
    particle.maxForce = particle.maxSpeed * 0.03
    particle.particleSize = Math.random() * 4 + 3
    particle.colorBlendRate = Math.random() * 0.02 + 0.005

    particlesRef.current.push(particle)
    return particle
  }

  const updateParticleTarget = (particle: Particle, x: number, y: number, color: Color) => {
    particle.startColor = particle.getCurrentColor()
    particle.targetColor = color
    particle.colorWeight = 0
    particle.target = { x, y }
  }

  const getRandomColor = (): Color => {
    return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
  }

  const nextWord = (word: string, canvas: HTMLCanvasElement) => {
    const imageData = renderTextToCanvas(word, canvas)
    const coordinates = getPixelCoordinates(imageData)
    const newColor = getRandomColor()
    const particles = particlesRef.current
    
    let particleIndex = 0

    for (const pixelIndex of coordinates) {
      const alpha = imageData.data[pixelIndex + 3]
      if (alpha === 0) continue

      const x = (pixelIndex / 4) % canvas.width
      const y = Math.floor(pixelIndex / 4 / canvas.width)
      
      const particle = createOrReuseParticle(particleIndex, canvas)
      updateParticleTarget(particle, x, y, newColor)
      particleIndex++
    }

    for (let i = particleIndex; i < particles.length; i++) {
      particles[i].kill(canvas.width, canvas.height)
    }
  }

  const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.15)"
    ctx.fillRect(0, 0, width, height)
  }

  const updateParticles = (particles: Particle[], ctx: CanvasRenderingContext2D) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.move()
      particle.draw(ctx, DRAW_AS_POINTS)

      if (particle.isKilled && isParticleOffScreen(particle, ctx.canvas)) {
        particles.splice(i, 1)
      }
    }
  }

  const isParticleOffScreen = (particle: Particle, canvas: HTMLCanvasElement): boolean => {
    return particle.pos.x < 0 || particle.pos.x > canvas.width ||
           particle.pos.y < 0 || particle.pos.y > canvas.height
  }

  const handleMouseInteraction = (particles: Particle[], canvas: HTMLCanvasElement) => {
    const mouse = mouseRef.current
    if (!mouse.isPressed || !mouse.isRightClick) return

    particles.forEach(particle => {
      const dx = particle.pos.x - mouse.x
      const dy = particle.pos.y - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 50) {
        particle.kill(canvas.width, canvas.height)
      }
    })
  }

  const shouldAdvanceWord = (): boolean => {
    frameCountRef.current++
    return frameCountRef.current % WORD_TRANSITION_FRAMES === 0
  }

  const advanceToNextWord = (canvas: HTMLCanvasElement) => {
    wordIndexRef.current = (wordIndexRef.current + 1) % words.length
    nextWord(words[wordIndexRef.current], canvas)
  }

  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")!
    const particles = particlesRef.current

    clearCanvas(ctx, canvas.width, canvas.height)
    updateParticles(particles, ctx)
    handleMouseInteraction(particles, canvas)

    if (shouldAdvanceWord()) {
      advanceToNextWord(canvas)
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
  }

  const setupEventListeners = (canvas: HTMLCanvasElement) => {
    const updateMousePosition = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isPressed = true
      mouseRef.current.isRightClick = e.button === 2
      updateMousePosition(e)
    }

    const handleMouseUp = () => {
      mouseRef.current.isPressed = false
      mouseRef.current.isRightClick = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateMousePosition(e)
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const handleResize = () => {
      setupCanvas(canvas)
      nextWord(words[wordIndexRef.current], canvas)
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("contextmenu", handleContextMenu)
    window.addEventListener("resize", handleResize)

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("contextmenu", handleContextMenu)
      window.removeEventListener("resize", handleResize)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setupCanvas(canvas)
    nextWord(words[0], canvas)
    animate()
    
    const cleanup = setupEventListeners(canvas)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      cleanup()
    }
  }, [])

  return (
    <div className="w-full h-full absolute inset-0">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        style={{ 
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
          zIndex: 10 
        }} 
      />
    </div>
  )
}