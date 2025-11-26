import cliProgress from 'cli-progress'

export type ProgressBar = {
  increment: () => void
  stop: () => void
} | null

export function createProgressBar(label: string, total: number): ProgressBar {
  if (!process.stdout.isTTY || total === 0) {
    return null
  }

  const bar = new cliProgress.SingleBar({
    format: `${label.padEnd(18)} [{bar}] {value}/{total} ({percentage}%)`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    clearOnComplete: true,
    hideCursor: true,
    linewrap: false,
  })

  bar.start(total, 0)
  return bar
}