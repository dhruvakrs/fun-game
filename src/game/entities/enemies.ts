import { GameConfig } from '../config'
import type { Enemy, EnemyDef } from './types'

export function spawnEnemy(def: EnemyDef): Enemy {
  const baseWidth = def.type === 'bird' ? 26 : def.type === 'turtle' ? 30 : 24
  const baseHeight = def.type === 'bird' ? 18 : def.type === 'turtle' ? 20 : 18
  return {
    type: def.type,
    body: {
      x: def.x,
      y: def.y,
      width: baseWidth,
      height: baseHeight,
      vx: def.speed,
      vy: 0,
    },
    dir: 1,
    speed: def.speed,
    range: { min: def.range[0], max: def.range[1] },
    baseY: def.y,
    animTimer: 0,
    hopTimer: def.type === 'slime' ? def.hopInterval ?? 1.3 : undefined,
  }
}

export function updateEnemies(enemies: Enemy[], delta: number) {
  enemies.forEach((enemy) => {
    enemy.animTimer += delta
    if (enemy.type === 'turtle') {
      enemy.body.x += enemy.dir * enemy.speed * delta
      if (
        enemy.body.x < enemy.range.min ||
        enemy.body.x + enemy.body.width > enemy.range.max
      ) {
        enemy.dir *= -1
        enemy.body.x = clamp(
          enemy.body.x,
          enemy.range.min,
          enemy.range.max - enemy.body.width,
        )
      }
    } else if (enemy.type === 'slime') {
      enemy.body.x += enemy.dir * enemy.speed * delta
      if (
        enemy.body.x < enemy.range.min ||
        enemy.body.x + enemy.body.width > enemy.range.max
      ) {
        enemy.dir *= -1
        enemy.body.x = clamp(
          enemy.body.x,
          enemy.range.min,
          enemy.range.max - enemy.body.width,
        )
      }

      if (enemy.hopTimer !== undefined) {
        enemy.hopTimer -= delta
        if (enemy.hopTimer <= 0 && enemy.body.y >= enemy.baseY - 0.01) {
          enemy.body.vy = -360
          enemy.hopTimer = 1.2
        }
      }
      enemy.body.vy += GameConfig.gravity * 0.8 * delta
      enemy.body.y = Math.min(
        enemy.baseY,
        enemy.body.y + enemy.body.vy * delta,
      )
      if (enemy.body.y >= enemy.baseY) {
        enemy.body.y = enemy.baseY
        enemy.body.vy = 0
      }
    } else if (enemy.type === 'bird') {
      enemy.body.x += enemy.dir * enemy.speed * delta
      if (
        enemy.body.x < enemy.range.min ||
        enemy.body.x + enemy.body.width > enemy.range.max
      ) {
        enemy.dir *= -1
        enemy.body.x = clamp(
          enemy.body.x,
          enemy.range.min,
          enemy.range.max - enemy.body.width,
        )
      }
      enemy.body.y =
        enemy.baseY + Math.sin(enemy.animTimer * 2.4) * 12
    }
  })
}

export function resetEnemies(enemies: Enemy[], defs: EnemyDef[]) {
  enemies.splice(0, enemies.length, ...defs.map((def) => spawnEnemy(def)))
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
