/**
 * @description CLI wrapper for running AI-vs-AI simulation batches.
 */
import { type SessionAiProfile, type SessionDeckSize } from '@carcassonne/shared';

import { runSimulation, type SimulationOptions } from './aiSimulation';
import { formatAiProfileName } from './aiSimulationProfiles';

const DEFAULT_MATCHES = 100;
const DEFAULT_MAX_TICKS = 30_000;

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const stats = await runSimulation(options);
  const { first, second } = stats.profiles;

  console.log(`Simulated ${options.matches} matches on ${options.deckSize} deck.`);
  console.log(`${formatAiProfileName(first)} wins: ${stats.wins[first]} (${formatPercent(stats.wins[first], options.matches)})`);
  console.log(`${formatAiProfileName(second)} wins: ${stats.wins[second]} (${formatPercent(stats.wins[second], options.matches)})`);
  console.log(`Ties: ${stats.ties} (${formatPercent(stats.ties, options.matches)})`);
  console.log(
    `Average scores -> ${formatAiProfileName(first)}: ${(stats.scoreTotals[first] / options.matches).toFixed(2)}, ${formatAiProfileName(second)}: ${(
      stats.scoreTotals[second] / options.matches
    ).toFixed(2)}`
  );
}

function parseOptions(args: string[]): SimulationOptions {
  const options: SimulationOptions = {
    matches: DEFAULT_MATCHES,
    deckSize: 'standard',
    maxTicks: DEFAULT_MAX_TICKS,
    firstProfile: 'randy',
    secondProfile: 'martin'
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

    if (arg.startsWith('--a=')) {
      options.firstProfile = parseAiProfile(arg.split('=')[1]);
      return;
    }

    if (arg.startsWith('--b=')) {
      options.secondProfile = parseAiProfile(arg.split('=')[1]);
      return;
    }

    if (arg === '--help') {
      console.log(
        'Usage: npm run simulate:ai -- --matches=200 --deck=standard --maxTicks=30000 --a=randy --b=martin'
      );
      process.exit(0);
    }

    throw new Error(`Unknown argument "${arg}". Use --help for options.`);
  });

  if (options.firstProfile === options.secondProfile) {
    throw new Error('Simulation profiles must be different.');
  }

  return options;
}

function parseDeckSize(value: string | undefined): SessionDeckSize {
  if (value === 'standard' || value === 'small') {
    return value;
  }

  throw new Error(`Invalid deck value "${value}". Use "standard" or "small".`);
}

function parseAiProfile(value: string | undefined): SessionAiProfile {
  if (value === 'randy' || value === 'martin' || value === 'juan') {
    return value;
  }

  throw new Error(`Invalid profile value "${value}". Use "randy", "martin", or "juan".`);
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
