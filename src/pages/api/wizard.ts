import type { APIRoute } from 'astro';

type QuizAnswers = {
  goal?: string;
  struggle?: string;
  support?: string;
};

type PackageKey = 'support' | 'silver' | 'gold' | 'platinum';

const PACKAGE_LABELS: Record<PackageKey, string> = {
  support: 'Support Team Package',
  silver: 'Silver Package',
  gold: 'Gold Package',
  platinum: 'Platinum Package'
};

const PACKAGE_ORDER: PackageKey[] = ['platinum', 'gold', 'silver', 'support'];

function getSupportPreference(support?: string): PackageKey | undefined {
  if (!support) return undefined;
  const normalized = support.toLowerCase();
  if (normalized.includes('every day') || normalized.includes('everyday') || normalized.includes('vip')) return 'platinum';
  if (normalized.includes('weekly')) return 'silver';
  if (normalized.includes('just give me the plan')) return 'support';
  return undefined;
}

function scoreByAnswers({ goal, struggle, support }: QuizAnswers) {
  const scores: Record<PackageKey, number> = {
    support: 0,
    silver: 0,
    gold: 0,
    platinum: 0
  };

  const normalizedGoal = (goal || '').toLowerCase();
  const normalizedStruggle = (struggle || '').toLowerCase();
  const normalizedSupport = support || '';

  if (normalizedGoal.includes('lose fat')) {
    scores.gold += 2;
    scores.platinum += 1;
  } else if (normalizedGoal.includes('build muscle')) {
    scores.gold += 2;
  } else if (normalizedGoal.includes('recomp')) {
    scores.silver += 2;
    scores.gold += 1;
  } else if (normalizedGoal.includes('health') || normalizedGoal.includes('stamina')) {
    scores.support += 2;
    scores.silver += 1;
  }

  if (normalizedStruggle.includes('emotional') || normalizedStruggle.includes('stress')) {
    scores.platinum += 2;
  } else if (normalizedStruggle.includes('low motivation')) {
    scores.gold += 2;
    scores.platinum += 1;
  } else if (normalizedStruggle.includes('busy schedule') || normalizedStruggle.includes('no time')) {
    scores.silver += 2;
    scores.support += 1;
  } else if (normalizedStruggle.includes('sugar')) {
    scores.silver += 1;
    scores.gold += 1;
  } else if (normalizedStruggle.includes('plateau') || normalizedStruggle.includes('stuck')) {
    scores.gold += 2;
    scores.silver += 1;
  }

  if (normalizedSupport.toLowerCase().includes('every day') || normalizedSupport.toLowerCase().includes('everyday') || normalizedSupport.toLowerCase().includes('vip')) {
    scores.platinum += 4;
  } else if (normalizedSupport.toLowerCase().includes('weekly')) {
    scores.silver += 3;
    scores.support += 2;
  } else if (normalizedSupport.toLowerCase().includes('just give me the plan')) {
    scores.support += 3;
    scores.silver += 1;
  }

  return scores;
}

function choosePackage(scores: Record<PackageKey, number>, support?: string): PackageKey {
  const preferred = getSupportPreference(support);

  if (preferred === 'platinum') {
    return 'platinum';
  }

  let bestScore = -1;
  let bestKeys: PackageKey[] = [];

  for (const key of Object.keys(scores) as PackageKey[]) {
    const score = scores[key];
    if (score > bestScore) {
      bestScore = score;
      bestKeys = [key];
    } else if (score === bestScore) {
      bestKeys.push(key);
    }
  }

  if (bestKeys.length === 1) return bestKeys[0];

  if (preferred && bestKeys.includes(preferred)) {
    return preferred;
  }

  // Default to higher-touch package when tied.
  return PACKAGE_ORDER.find(key => bestKeys.includes(key)) || 'silver';
}

function buildReason(pkg: PackageKey, answers: QuizAnswers) {
  const goal = answers.goal || 'your goal';
  const struggle = answers.struggle || 'your biggest struggle';

  if (pkg === 'platinum') {
    return `You asked for daily platinum support, so Platinum gives proactive check-ins to crush ${struggle} and accelerate ${goal}.`;
  }
  if (pkg === 'gold') {
    return `Gold fits your goals with daily responses and direct access, keeping you accountable for ${struggle} and progress on ${goal}.`;
  }
  if (pkg === 'silver') {
    return `Silver matches your pace with weekly direct check-ins, keeping you on track with ${struggle} while driving ${goal}.`;
  }
  return `Support Team is ideal for structured guidance, so you get the full plan plus assistant follow-ups to stay consistent with ${goal}.`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const answers = (await request.json()) as QuizAnswers;
    const scores = scoreByAnswers(answers);
    const pkg = choosePackage(scores, answers.support);

    return new Response(JSON.stringify({
      package: PACKAGE_LABELS[pkg],
      reason: buildReason(pkg, answers)
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({
      package: PACKAGE_LABELS.silver,
      reason: 'Silver gives you direct weekly guidance with Salakawy to keep your transformation moving.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
