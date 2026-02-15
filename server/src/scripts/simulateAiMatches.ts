/**
 * @description CLI wrapper for running AI-vs-AI simulation batches.
 */
import { type SessionDeckSize } from '@carcassonne/shared';

import { runSimulation, type SimulationOptions } from './aiSimulation';

const DEFAULT_MATCHES = 100;
const DEFAULT_MAX_TICKS = 30_000;

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const stats = await runSimulation(options);

  console.log(`Simulated ${options.matches} matches on ${options.deckSize} deck.`);
  console.log(`RANDY wins: ${stats.wins.randy} (${formatPercent(stats.wins.randy, options.matches)})`);
  console.log(`MARTIN wins: ${stats.wins.martin} (${formatPercent(stats.wins.martin, options.matches)})`);
  console.log(`Ties: ${stats.ties} (${formatPercent(stats.ties, options.matches)})`);
  console.log(
    `Average scores -> RANDY: ${(stats.scoreTotals.randy / options.matches).toFixed(2)}, MARTIN: ${(
      stats.scoreTotals.martin / options.matches
    ).toFixed(2)}`
  );
}

function parseOptions(args: string[]): SimulationOptions {
  const options: SimulationOptions = {
    matches: DEFAULT_MATCHES,
    deckSize: 'standard',
    maxTicks: DEFAULT_MAX_TICKS
  };

  args.forEach((arg) => {
    if (arg.startsWith('--matches=')) {
      options.matches = parsePositiveInt(arg.split('=')[1], 'matches');
      return;
    }
    if (arg.startsWith('--deck=')) {
      options.deckSize = parseDeckSize(arg.split('=')[1]);
      return;
    }
    if (arg.startsWith('--maxTicks=')) {
      options.maxTicks = parsePositiveInt(arg.split('=')[1], 'maxTicks');
      return;
    }
    if (arg === '--help') {
      console.log('Usage: npm run simulate:ai -- --matches=200 --deck=standard --maxTicks=30000');
      process.exit(0);
    }

    throw new Error(`Unknown argument "${arg}". Use --help for options.`);
  });

  return options;
}

function parseDeckSize(value: string | undefined): SessionDeckSize {
  if (value === 'standard' || value === 'small') {
    return value;
  }
  throw new Error(`Invalid deck value "${value}". Use "standard" or "small".`);
}

function parsePositiveInt(raw: string | undefined, label: string): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected a positive integer for ${label}.`);
  }
  return value;
}

function formatPercent(count: number, total: number): string {
  return `${((count / total) * 100).toFixed(2)}%`;
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Simulation failed: ${message}`);
  process.exitCode = 1;
});
