export function computeElo(winnerScore, loserScore, k = 32) {
  const ew = 1 / (1 + 10 ** ((loserScore - winnerScore) / 400));
  const el = 1 / (1 + 10 ** ((winnerScore - loserScore) / 400));
  return {
    winner: Math.round(winnerScore + k * (1 - ew)),
    loser: Math.round(loserScore + k * (0 - el)),
  };
}
