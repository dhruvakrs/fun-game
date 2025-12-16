import { GameConfig } from '../config'
import type { Player } from '../entities/player'

type Palette = {
  outfit: string
  outfitDark: string
  accent: string
  skin: string
  hair: string
  hairShadow: string
  boot: string
  outline: string
  highlight: string
}

const colors: Palette = {
  outfit: '#ff7aa2',
  outfitDark: '#e75b86',
  accent: '#ffd173',
  skin: '#f6d6bd',
  hair: '#f2c477',
  hairShadow: '#e4b56a',
  boot: '#2d2b4f',
  outline: '#231942',
  highlight: '#ffe9f3',
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  time: number,
) {
  const { body } = player
  const running = player.onGround && Math.abs(body.vx) > 12
  const airborne = !player.onGround
  const runCycle = running ? Math.sin(time * GameConfig.runAnimSpeed) : 0
  const bob = running ? Math.sin(time * GameConfig.runAnimSpeed * 0.5) * 1.4 : 0
  const blinkPhase = (time * GameConfig.idleBlinkSpeed) % 6
  const isBlink = !running && !airborne && blinkPhase > 5.7
  const facing = player.facing

  ctx.save()
  ctx.translate(body.x + body.width / 2, body.y + body.height)
  ctx.scale(facing, 1)
  ctx.translate(0, bob)

  drawShadow(ctx)
  drawLegs(ctx, runCycle, airborne)
  drawBody(ctx, runCycle, airborne)
  drawArms(ctx, runCycle, airborne)
  drawHead(ctx, runCycle, airborne, isBlink)

  ctx.restore()
}

function drawShadow(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.beginPath()
  ctx.ellipse(0, 2, 11, 4, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawLegs(
  ctx: CanvasRenderingContext2D,
  runCycle: number,
  airborne: boolean,
) {
  const swing = airborne ? 0 : runCycle * 4
  const crouch = airborne ? 4 : 0

  const backOffset = airborne ? -2 : -6
  ctx.fillStyle = colors.boot
  ctx.fillRect(backOffset + swing * -0.4, -8 + crouch, 7, 8)
  ctx.fillStyle = colors.outfitDark
  ctx.fillRect(backOffset + swing * -0.4, -18 + crouch, 7, 10)

  const frontOffset = airborne ? 4 : 2
  ctx.fillStyle = colors.boot
  ctx.fillRect(frontOffset + swing * 0.7, -8 + crouch, 7, 8)
  ctx.fillStyle = colors.outfit
  ctx.fillRect(frontOffset + swing * 0.7, -18 + crouch, 7, 10)
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  runCycle: number,
  airborne: boolean,
) {
  const wobble = airborne ? -1 : Math.sin(runCycle * 0.5) * 1.2
  ctx.fillStyle = colors.outfit
  ctx.fillRect(-9, -32 + wobble, 18, 16)

  // Skirt/overalls flair
  ctx.fillStyle = colors.outfitDark
  ctx.fillRect(-10, -18 + wobble, 20, 4)

  // Belt
  ctx.fillStyle = colors.accent
  ctx.fillRect(-8, -22 + wobble, 16, 3)

  // Straps
  ctx.fillStyle = colors.outfitDark
  ctx.fillRect(-8, -32 + wobble, 4, 14)
  ctx.fillRect(4, -32 + wobble, 4, 14)
}

function drawArms(
  ctx: CanvasRenderingContext2D,
  runCycle: number,
  airborne: boolean,
) {
  const armSwing = airborne ? 6 : Math.sin(runCycle) * 6
  const armY = airborne ? -30 : -28
  ctx.fillStyle = colors.outline
  ctx.fillRect(-14 - armSwing * 0.3, armY, 5, 11)
  ctx.fillStyle = colors.skin
  ctx.fillRect(-14 - armSwing * 0.3, armY + 8, 5, 5)

  ctx.fillStyle = colors.outline
  ctx.fillRect(9 + armSwing, armY + 1, 5, 11)
  ctx.fillStyle = colors.skin
  ctx.fillRect(9 + armSwing, armY + 8, 5, 5)
}

function drawHead(
  ctx: CanvasRenderingContext2D,
  runCycle: number,
  airborne: boolean,
  isBlink: boolean,
) {
  const bob = airborne ? -1 : Math.cos(runCycle) * 0.8
  ctx.save()
  ctx.translate(0, bob)

  // Hair back and ponytail
  ctx.fillStyle = colors.hairShadow
  ctx.fillRect(-10, -52, 20, 6)
  const sway = airborne ? 2 : Math.sin(runCycle) * 1.5
  ctx.fillStyle = colors.hair
  ctx.beginPath()
  ctx.moveTo(8, -48)
  ctx.quadraticCurveTo(14 + sway, -46, 10 + sway, -34)
  ctx.lineTo(4 + sway, -34)
  ctx.closePath()
  ctx.fill()

  // Face
  ctx.fillStyle = colors.skin
  ctx.fillRect(-9, -50, 18, 14)

  // Bangs
  ctx.fillStyle = colors.hair
  ctx.fillRect(-9, -50, 18, 5)
  ctx.fillStyle = colors.hairShadow
  ctx.fillRect(-9, -50, 6, 3)

  // Eyes
  const eyeHeight = isBlink ? 1 : 3
  ctx.fillStyle = colors.outline
  ctx.fillRect(-4, -44, 3, eyeHeight)
  ctx.fillRect(2, -44, 3, eyeHeight)

  // Blush
  ctx.fillStyle = colors.outfit
  ctx.fillRect(-7, -42, 2, 2)
  ctx.fillRect(7, -42, 2, 2)

  // Mouth
  ctx.fillStyle = colors.outline
  ctx.fillRect(-1, -40, 2, 1)

  // Hair tie ribbon
  ctx.fillStyle = colors.outfitDark
  ctx.fillRect(6, -46, 4, 3)

  // Highlight
  ctx.fillStyle = colors.highlight
  ctx.fillRect(-6, -48, 4, 2)

  ctx.restore()
}
