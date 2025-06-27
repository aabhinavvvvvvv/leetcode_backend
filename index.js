import express from 'express';
import cors from 'cors';
import { LeetCode } from 'leetcode-query';

const app = express();
app.use(cors());
app.use(express.json());

// Type guards
function hasTopicTags(obj) {
  return typeof obj === 'object' && obj !== null && Array.isArray(obj.topicTags);
}
function hasDifficulty(obj) {
  return typeof obj === 'object' && obj !== null && typeof obj.difficulty === 'string';
}


app.post('/api/leetcode-problems', async (req, res) => {
  const leetcode = new LeetCode();
  try {
    let problems = await leetcode.problems({});
    if (!Array.isArray(problems)) {
      if (typeof problems === 'object' && problems !== null && Array.isArray(problems.stat_status_pairs)) {
        problems = problems.stat_status_pairs;
      } else if (typeof problems === 'object' && problems !== null && Array.isArray(problems.data)) {
        problems = problems.data;
      } else if (typeof problems === 'object' && problems !== null) {
        const firstArray = Object.values(problems).find(v => Array.isArray(v));
        if (firstArray) problems = firstArray;
      }
    }
    const { topics, count } = req.body || {};
    let filtered = problems;
    if (topics && Array.isArray(topics) && topics.length > 0) {
      const topicsLower = topics.map((t) => t.toLowerCase());
      filtered = filtered.filter(
        (p) =>
          hasTopicTags(p) &&
          p.topicTags.some(
            tag =>
              tag &&
              tag.name &&
              topicsLower.includes(tag.name.toLowerCase())
          )
      );
    }
    if (count && typeof count === 'number') {
      filtered = filtered.slice(0, count);
    }
    res.status(200).json({ problems: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch problems', details: err.message });
  }
});


app.get('/api/leetcode-submissions', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    res.status(400).json({ error: 'Missing username parameter' });
    return;
  }
  const leetcode = new LeetCode();
  try {
    const submissions = await leetcode.recent_submissions(username);
    res.status(200).json({ submissions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions from LeetCode', details: err.message });
  }
});


app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));