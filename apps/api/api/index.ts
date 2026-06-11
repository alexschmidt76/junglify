import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.json({ 
    message: 'welcome to the junglify backend api',
    monkey_facts: [
        "monkeys have four limbs", 
        "monkeys can sometimes swing on tree branches with their tails, if they are skilled enough of course", 
        "monkeys can play halo reach (because they have thumbs)"
    ]
});
}
