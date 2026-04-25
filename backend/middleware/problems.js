const TOPICS = [
  'Arrays (1D, 2D/Matrices)',
  'Strings',
  'Hashing (HashMaps & HashSets)',
  'Two Pointers',
  'Sliding Window',
  'Recursion',
  'Linked Lists (Singly, Doubly, Circular)',
  'Stacks & Queues',
  'Trees (Binary Trees, BST)',
  'Greedy Algorithms',
  'Backtracking',
  'Dynamic Programming (1D, 2D, Grids, DP on Trees)',
  'Graphs (BFS, DFS, Shortest Path, MST)'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const MAX_PER_TOPIC = 6;
const QUESTIONS_PER_DIFFICULTY = 2;

const BASIC_FALLBACK_TOPICS = [
  'Arrays (1D, 2D/Matrices)',
  'Strings',
  'Two Pointers',
  'Sliding Window',
  'Hashing (HashMaps & HashSets)',
  'Recursion'
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()\[\]{}.,:/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSourceKey(topic, difficulty, title) {
  return normalizeText(`${topic} ${difficulty} ${title}`).replace(/\s+/g, '__');
}

function buildFallbackTestCases(questionTitle) {
  const base = normalizeText(questionTitle).replace(/\s+/g, '_').slice(0, 20) || 'problem';
  return Array.from({ length: 8 }, (_, i) => ({
    input: `${i + 1}`,
    expectedOutput: `${i + 1}`,
    note: `fallback_${base}`
  }));
}

function ensureEightCases(testCases, questionTitle) {
  const valid = (testCases || []).filter(tc => tc && tc.input && tc.expectedOutput);

  if (valid.length >= 8) {
    return valid.slice(0, 8);
  }

  if (valid.length === 0) {
    return buildFallbackTestCases(questionTitle);
  }

  const filled = [...valid];
  let idx = 0;
  while (filled.length < 8) {
    filled.push({ ...valid[idx % valid.length] });
    idx += 1;
  }
  return filled;
}

function finalizeQuestion(question) {
  const completeCases = ensureEightCases(question.testCases, question.title);
  const visibleTestCases = completeCases.slice(0, 3);
  const hiddenTestCases = completeCases.slice(3, 8);

  return {
    title: question.title,
    description: question.description,
    difficulty: question.difficulty,
    topic: question.topic,
    visibleTestCases,
    hiddenTestCases,
    testCases: completeCases,
    sampleInput: question.sampleInput || visibleTestCases[0]?.input || '',
    sampleOutput: question.sampleOutput || visibleTestCases[0]?.expectedOutput || '',
    constraints: question.constraints || '',
    sourceKey: toSourceKey(question.topic, question.difficulty, question.title)
  };
}

function q(title, description, constraints, sampleInput, sampleOutput, testCases) {
  return { title, description, constraints, sampleInput, sampleOutput, testCases: testCases || [] };
}

const STANDARD_QUESTION_BANK = {
  'Arrays (1D, 2D/Matrices)': {
    Easy: [
      q(
        'Two Sum',
        'Given an array of integers and a target, return the indices of two numbers such that they add up to the target. Exactly one valid answer exists, and you cannot use the same index twice.',
        '2 <= n <= 1e5; -1e9 <= nums[i], target <= 1e9',
        '4\n2 7 11 15\n9',
        '0 1',
        [
          { input: '4\n2 7 11 15\n9', expectedOutput: '0 1' },
          { input: '3\n3 2 4\n6', expectedOutput: '1 2' },
          { input: '2\n3 3\n6', expectedOutput: '0 1' }
        ]
      ),
      q(
        'Best Time to Buy and Sell Stock',
        'Given daily stock prices, find the maximum profit from one buy and one sell operation. You must buy before you sell.',
        '1 <= n <= 1e5; 0 <= prices[i] <= 1e6',
        '6\n7 1 5 3 6 4',
        '5',
        [
          { input: '6\n7 1 5 3 6 4', expectedOutput: '5' },
          { input: '5\n7 6 4 3 1', expectedOutput: '0' },
          { input: '5\n1 2 3 4 5', expectedOutput: '4' }
        ]
      )
    ],
    Medium: [
      q(
        'Product of Array Except Self',
        'For each index i, return the product of all elements except nums[i] without using division and in O(n) time.',
        '2 <= n <= 1e5; -30 <= nums[i] <= 30',
        '4\n1 2 3 4',
        '24 12 8 6',
        [
          { input: '4\n1 2 3 4', expectedOutput: '24 12 8 6' },
          { input: '5\n-1 1 0 -3 3', expectedOutput: '0 0 9 0 0' },
          { input: '3\n2 3 4', expectedOutput: '12 8 6' }
        ]
      ),
      q(
        'Rotate Image',
        'Given an n x n matrix, rotate it by 90 degrees clockwise in place.',
        '1 <= n <= 50',
        '3\n1 2 3\n4 5 6\n7 8 9',
        '7 4 1\n8 5 2\n9 6 3',
        [
          { input: '2\n1 2\n3 4', expectedOutput: '3 1\n4 2' },
          { input: '3\n1 2 3\n4 5 6\n7 8 9', expectedOutput: '7 4 1\n8 5 2\n9 6 3' },
          { input: '1\n5', expectedOutput: '5' }
        ]
      )
    ],
    Hard: [
      q(
        'Trapping Rain Water',
        'Given elevation heights, compute how much rain water is trapped after raining.',
        '1 <= n <= 2e5; 0 <= height[i] <= 1e5',
        '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        '6',
        [
          { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6' },
          { input: '6\n4 2 0 3 2 5', expectedOutput: '9' },
          { input: '3\n1 2 3', expectedOutput: '0' }
        ]
      ),
      q(
        'Median of Two Sorted Arrays',
        'Given two sorted arrays, return the median of the merged sorted sequence in O(log(min(n,m))) time.',
        '0 <= n,m <= 1e5; 1 <= n + m <= 2e5',
        '2\n1 3\n1\n2',
        '2.0',
        [
          { input: '2\n1 3\n1\n2', expectedOutput: '2.0' },
          { input: '2\n1 2\n2\n3 4', expectedOutput: '2.5' },
          { input: '0\n\n1\n1', expectedOutput: '1.0' }
        ]
      )
    ]
  },
  Strings: {
    Easy: [
      q(
        'Valid Anagram',
        'Given two strings s and t, return true if t is an anagram of s, otherwise return false.',
        '1 <= |s|, |t| <= 1e5; lowercase English letters',
        'anagram\nnagaram',
        'true',
        [
          { input: 'anagram\nnagaram', expectedOutput: 'true' },
          { input: 'rat\ncar', expectedOutput: 'false' },
          { input: 'a\na', expectedOutput: 'true' }
        ]
      ),
      q(
        'Longest Common Prefix',
        'Given an array of strings, return the longest common prefix among them. If none exists, return an empty string.',
        '1 <= n <= 200; 0 <= |strs[i]| <= 200',
        '3\nflower flow flight',
        'fl',
        [
          { input: '3\nflower flow flight', expectedOutput: 'fl' },
          { input: '3\ndog racecar car', expectedOutput: '' },
          { input: '1\nhello', expectedOutput: 'hello' }
        ]
      )
    ],
    Medium: [
      q(
        'Longest Substring Without Repeating Characters',
        'Given a string s, find the length of the longest substring without repeating characters.',
        '0 <= |s| <= 1e5',
        'abcabcbb',
        '3',
        [
          { input: 'abcabcbb', expectedOutput: '3' },
          { input: 'bbbbb', expectedOutput: '1' },
          { input: 'pwwkew', expectedOutput: '3' }
        ]
      ),
      q(
        'Group Anagrams',
        'Group strings that are anagrams of each other and print groups in any order.',
        '1 <= n <= 1e4; 0 <= |strs[i]| <= 100',
        '6\neat tea tan ate nat bat',
        '[eat tea ate] [tan nat] [bat]',
        [
          { input: '6\neat tea tan ate nat bat', expectedOutput: '[eat tea ate] [tan nat] [bat]' },
          { input: '1\n', expectedOutput: '[]' },
          { input: '2\na a', expectedOutput: '[a a]' }
        ]
      )
    ],
    Hard: [
      q(
        'Minimum Window Substring',
        'Given strings s and t, return the minimum window in s that contains all characters from t including multiplicity.',
        '1 <= |s|, |t| <= 1e5',
        'ADOBECODEBANC\nABC',
        'BANC',
        [
          { input: 'ADOBECODEBANC\nABC', expectedOutput: 'BANC' },
          { input: 'a\na', expectedOutput: 'a' },
          { input: 'a\naa', expectedOutput: '' }
        ]
      ),
      q(
        'Edit Distance',
        'Given two strings word1 and word2, return the minimum number of insertions, deletions, and replacements needed to convert word1 to word2.',
        '0 <= |word1|, |word2| <= 500',
        'horse\nros',
        '3',
        [
          { input: 'horse\nros', expectedOutput: '3' },
          { input: 'intention\nexecution', expectedOutput: '5' },
          { input: 'abc\nabc', expectedOutput: '0' }
        ]
      )
    ]
  },
  'Hashing (HashMaps & HashSets)': {
    Easy: [
      q(
        'Contains Duplicate',
        'Given an integer array, return true if any value appears at least twice, otherwise false.',
        '1 <= n <= 1e5',
        '4\n1 2 3 1',
        'true',
        [
          { input: '4\n1 2 3 1', expectedOutput: 'true' },
          { input: '4\n1 2 3 4', expectedOutput: 'false' },
          { input: '5\n1 1 1 1 1', expectedOutput: 'true' }
        ]
      ),
      q(
        'First Unique Character in a String',
        'Return the index of the first non-repeating character in a string. Return -1 if it does not exist.',
        '1 <= |s| <= 1e5',
        'leetcode',
        '0',
        [
          { input: 'leetcode', expectedOutput: '0' },
          { input: 'loveleetcode', expectedOutput: '2' },
          { input: 'aabb', expectedOutput: '-1' }
        ]
      )
    ],
    Medium: [
      q(
        'Top K Frequent Elements',
        'Given an integer array and integer k, return any order of k most frequent elements.',
        '1 <= n <= 1e5',
        '6\n1 1 1 2 2 3\n2',
        '1 2',
        [
          { input: '6\n1 1 1 2 2 3\n2', expectedOutput: '1 2' },
          { input: '1\n1\n1', expectedOutput: '1' },
          { input: '5\n4 4 4 6 6\n1', expectedOutput: '4' }
        ]
      ),
      q(
        'Longest Consecutive Sequence',
        'Given an unsorted array, return the length of the longest sequence of consecutive integers.',
        '0 <= n <= 1e5',
        '6\n100 4 200 1 3 2',
        '4',
        [
          { input: '6\n100 4 200 1 3 2', expectedOutput: '4' },
          { input: '9\n0 3 7 2 5 8 4 6 0', expectedOutput: '9' },
          { input: '0\n', expectedOutput: '0' }
        ]
      )
    ],
    Hard: [
      q(
        'Substring with Concatenation of All Words',
        'Given a string s and an array of words with equal length, find all starting indices of substrings that are concatenations of every word exactly once.',
        '1 <= |s| <= 1e4',
        'barfoothefoobarman\n2\nfoo bar',
        '0 9',
        [
          { input: 'barfoothefoobarman\n2\nfoo bar', expectedOutput: '0 9' },
          { input: 'wordgoodgoodgoodbestword\n4\nword good best word', expectedOutput: '' },
          { input: 'barfoofoobarthefoobarman\n3\nbar foo the', expectedOutput: '6 9 12' }
        ]
      ),
      q(
        'Minimum Number of Refueling Stops',
        'A car starts with startFuel and needs to reach target. Given stations[position, fuel], return minimum stops required to reach target, or -1.',
        '1 <= target <= 1e9',
        '100 10\n4\n10 60\n20 30\n30 30\n60 40',
        '2',
        [
          { input: '100 10\n4\n10 60\n20 30\n30 30\n60 40', expectedOutput: '2' },
          { input: '1 1\n0', expectedOutput: '0' },
          { input: '100 1\n1\n10 100', expectedOutput: '-1' }
        ]
      )
    ]
  },
  'Two Pointers': {
    Easy: [
      q(
        'Valid Palindrome',
        'Given a string, determine if it is a palindrome considering only alphanumeric characters and ignoring case.',
        '1 <= |s| <= 2e5',
        'A man, a plan, a canal: Panama',
        'true',
        [
          { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true' },
          { input: 'race a car', expectedOutput: 'false' },
          { input: ' ', expectedOutput: 'true' }
        ]
      ),
      q(
        'Merge Sorted Array',
        'Given two sorted arrays nums1 and nums2, merge nums2 into nums1 as one sorted array.',
        '0 <= m,n <= 200',
        '3 3\n1 2 3\n2 5 6',
        '1 2 2 3 5 6',
        [
          { input: '3 3\n1 2 3\n2 5 6', expectedOutput: '1 2 2 3 5 6' },
          { input: '1 0\n1\n', expectedOutput: '1' },
          { input: '0 1\n\n1', expectedOutput: '1' }
        ]
      )
    ],
    Medium: [
      q(
        '3Sum',
        'Given an integer array nums, return all unique triplets [a,b,c] such that a+b+c = 0.',
        '0 <= n <= 3000',
        '6\n-1 0 1 2 -1 -4',
        '[-1 -1 2] [-1 0 1]',
        [
          { input: '6\n-1 0 1 2 -1 -4', expectedOutput: '[-1 -1 2] [-1 0 1]' },
          { input: '3\n0 0 0', expectedOutput: '[0 0 0]' },
          { input: '3\n1 2 -2', expectedOutput: '' }
        ]
      ),
      q(
        'Container With Most Water',
        'Given n non-negative integers where each represents a vertical line, find two lines that together with x-axis form a container with maximum water.',
        '2 <= n <= 1e5',
        '9\n1 8 6 2 5 4 8 3 7',
        '49',
        [
          { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49' },
          { input: '2\n1 1', expectedOutput: '1' },
          { input: '5\n4 3 2 1 4', expectedOutput: '16' }
        ]
      )
    ],
    Hard: [
      q(
        'Shortest Subarray to be Removed to Make Array Sorted',
        'Remove the shortest contiguous subarray so the remaining array is non-decreasing. Return the length removed.',
        '1 <= n <= 1e5',
        '7\n1 2 3 10 4 2 3',
        '3',
        [
          { input: '7\n1 2 3 10 4 2 3', expectedOutput: '3' },
          { input: '5\n5 4 3 2 1', expectedOutput: '4' },
          { input: '4\n1 2 3 4', expectedOutput: '0' }
        ]
      ),
      q(
        'Boats to Save People',
        'Each boat carries at most two people with total weight <= limit. Return the minimum number of boats needed.',
        '1 <= n <= 5e4',
        '4\n3 2 2 1\n3',
        '3',
        [
          { input: '4\n3 2 2 1\n3', expectedOutput: '3' },
          { input: '4\n3 5 3 4\n5', expectedOutput: '4' },
          { input: '4\n1 2 2 3\n3', expectedOutput: '3' }
        ]
      )
    ]
  },
  'Sliding Window': {
    Easy: [
      q(
        'Maximum Average Subarray I',
        'Given an integer array nums and integer k, find the maximum average value of any contiguous subarray of length k.',
        '1 <= n <= 1e5',
        '6\n1 12 -5 -6 50 3\n4',
        '12.75',
        [
          { input: '6\n1 12 -5 -6 50 3\n4', expectedOutput: '12.75' },
          { input: '1\n5\n1', expectedOutput: '5.00' },
          { input: '5\n0 4 0 3 2\n1', expectedOutput: '4.00' }
        ]
      ),
      q(
        'Maximum Number of Vowels in a Substring of Given Length',
        'Given a string s and integer k, return the maximum number of vowels in any substring of s with length k.',
        '1 <= |s| <= 1e5',
        'abciiidef\n3',
        '3',
        [
          { input: 'abciiidef\n3', expectedOutput: '3' },
          { input: 'aeiou\n2', expectedOutput: '2' },
          { input: 'leetcode\n3', expectedOutput: '2' }
        ]
      )
    ],
    Medium: [
      q(
        'Longest Repeating Character Replacement',
        'Given a string s and integer k, return the length of the longest substring that can be made of same letters after replacing at most k characters.',
        '1 <= |s| <= 1e5',
        'ABAB\n2',
        '4',
        [
          { input: 'ABAB\n2', expectedOutput: '4' },
          { input: 'AABABBA\n1', expectedOutput: '4' },
          { input: 'AAAA\n2', expectedOutput: '4' }
        ]
      ),
      q(
        'Permutation in String',
        'Given two strings s1 and s2, return true if s2 contains a permutation of s1 as a substring.',
        '1 <= |s1|, |s2| <= 1e5',
        'ab\neidbaooo',
        'true',
        [
          { input: 'ab\neidbaooo', expectedOutput: 'true' },
          { input: 'ab\neidboaoo', expectedOutput: 'false' },
          { input: 'adc\ndcda', expectedOutput: 'true' }
        ]
      )
    ],
    Hard: [
      q(
        'Sliding Window Maximum',
        'Given an array nums and window size k, return the maximum value in each sliding window.',
        '1 <= n <= 1e5',
        '8\n1 3 -1 -3 5 3 6 7\n3',
        '3 3 5 5 6 7',
        [
          { input: '8\n1 3 -1 -3 5 3 6 7\n3', expectedOutput: '3 3 5 5 6 7' },
          { input: '1\n1\n1', expectedOutput: '1' },
          { input: '5\n9 8 7 6 5\n2', expectedOutput: '9 8 7 6' }
        ]
      ),
      q(
        'Subarrays with K Different Integers',
        'Return the number of good subarrays where the number of distinct integers is exactly k.',
        '1 <= n <= 2e4',
        '5\n1 2 1 2 3\n2',
        '7',
        [
          { input: '5\n1 2 1 2 3\n2', expectedOutput: '7' },
          { input: '5\n1 2 1 3 4\n3', expectedOutput: '3' },
          { input: '3\n1 1 1\n1', expectedOutput: '6' }
        ]
      )
    ]
  },
  Recursion: {
    Easy: [
      q(
        'Fibonacci Number (Recursive)',
        'Given n, return the nth Fibonacci number where F(0)=0 and F(1)=1 using a recursive formulation.',
        '0 <= n <= 30',
        '10',
        '55',
        [
          { input: '10', expectedOutput: '55' },
          { input: '0', expectedOutput: '0' },
          { input: '1', expectedOutput: '1' }
        ]
      ),
      q(
        'Power Function (Recursive)',
        'Compute x^n recursively using fast exponentiation.',
        '-100 <= x <= 100; -2^31 <= n <= 2^31-1',
        '2\n10',
        '1024',
        [
          { input: '2\n10', expectedOutput: '1024' },
          { input: '2\n-2', expectedOutput: '0.25' },
          { input: '1.5\n3', expectedOutput: '3.375' }
        ]
      )
    ],
    Medium: [
      q(
        'Generate Parentheses',
        'Given n pairs of parentheses, generate all combinations of well-formed parentheses.',
        '1 <= n <= 8',
        '3',
        '((())) (()()) (())() ()(()) ()()()',
        [
          { input: '3', expectedOutput: '((())) (()()) (())() ()(()) ()()()' },
          { input: '1', expectedOutput: '()' },
          { input: '2', expectedOutput: '(()) ()()' }
        ]
      ),
      q(
        'Subsets',
        'Given a set of distinct integers, return all possible subsets (the power set).',
        '1 <= n <= 15',
        '3\n1 2 3',
        '[] [1] [2] [3] [1 2] [1 3] [2 3] [1 2 3]',
        [
          { input: '3\n1 2 3', expectedOutput: '[] [1] [2] [3] [1 2] [1 3] [2 3] [1 2 3]' },
          { input: '1\n0', expectedOutput: '[] [0]' },
          { input: '2\n4 5', expectedOutput: '[] [4] [5] [4 5]' }
        ]
      )
    ],
    Hard: [
      q(
        'N-Queens',
        'Place n queens on an n x n chessboard so that no two queens attack each other. Return the number of valid configurations.',
        '1 <= n <= 12',
        '4',
        '2',
        [
          { input: '4', expectedOutput: '2' },
          { input: '1', expectedOutput: '1' },
          { input: '5', expectedOutput: '10' }
        ]
      ),
      q(
        'Sudoku Solver',
        'Given a partially filled 9x9 Sudoku board, fill the board so every row, column, and 3x3 subgrid contains digits 1-9 exactly once.',
        'Board is always solvable and has a unique solution.',
        '9 lines of 9 chars (digits or .)',
        '9 lines solved board',
        [
          { input: '53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79', expectedOutput: '534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179' },
          { input: '........3\n85...24..\n72......9\n...4.....\n.1.9...8.\n...8.1...\n9....7...\n..67..2..\n3...1....', expectedOutput: '146928753\n859367241\n723145689\n598472316\n617593482\n234816597\n981254367\n467389125\n352761948' },
          { input: '1.......2\n.2.....3.\n..3...4..\n...4.5...\n....6....\n...7.8...\n..8...9..\n.9.....1.\n2.......3', expectedOutput: '1 2 3 4 5 6 7 8 9' }
        ]
      )
    ]
  },
  'Linked Lists (Singly, Doubly, Circular)': {
    Easy: [
      q(
        'Reverse Linked List',
        'Given the head of a singly linked list, reverse the list and return the new head.',
        '0 <= n <= 5e4',
        '5\n1 2 3 4 5',
        '5 4 3 2 1',
        [
          { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
          { input: '2\n1 2', expectedOutput: '2 1' },
          { input: '0\n', expectedOutput: '' }
        ]
      ),
      q(
        'Middle of the Linked List',
        'Return the middle node of a linked list. If two middles exist, return the second middle.',
        '1 <= n <= 100',
        '5\n1 2 3 4 5',
        '3 4 5',
        [
          { input: '5\n1 2 3 4 5', expectedOutput: '3 4 5' },
          { input: '6\n1 2 3 4 5 6', expectedOutput: '4 5 6' },
          { input: '1\n1', expectedOutput: '1' }
        ]
      )
    ],
    Medium: [
      q(
        'Add Two Numbers',
        'Two non-empty linked lists represent two non-negative integers in reverse order. Add them and return the sum as a linked list.',
        '1 <= length <= 100',
        '3\n2 4 3\n3\n5 6 4',
        '7 0 8',
        [
          { input: '3\n2 4 3\n3\n5 6 4', expectedOutput: '7 0 8' },
          { input: '1\n0\n1\n0', expectedOutput: '0' },
          { input: '7\n9 9 9 9 9 9 9\n4\n9 9 9 9', expectedOutput: '8 9 9 9 0 0 0 1' }
        ]
      ),
      q(
        'Remove Nth Node From End of List',
        'Given a linked list, remove the nth node from the end and return its head.',
        '1 <= n <= length <= 30',
        '5\n1 2 3 4 5\n2',
        '1 2 3 5',
        [
          { input: '5\n1 2 3 4 5\n2', expectedOutput: '1 2 3 5' },
          { input: '1\n1\n1', expectedOutput: '' },
          { input: '2\n1 2\n1', expectedOutput: '1' }
        ]
      )
    ],
    Hard: [
      q(
        'Reverse Nodes in k-Group',
        'Given a linked list, reverse nodes in groups of size k and return the modified list.',
        '1 <= n <= 5e3; 1 <= k <= n',
        '5\n1 2 3 4 5\n2',
        '2 1 4 3 5',
        [
          { input: '5\n1 2 3 4 5\n2', expectedOutput: '2 1 4 3 5' },
          { input: '5\n1 2 3 4 5\n3', expectedOutput: '3 2 1 4 5' },
          { input: '3\n1 2 3\n1', expectedOutput: '1 2 3' }
        ]
      ),
      q(
        'Merge k Sorted Lists',
        'Given k sorted linked lists, merge all lists into one sorted linked list.',
        '0 <= k <= 1e4',
        '3\n1 4 5\n1 3 4\n2 6',
        '1 1 2 3 4 4 5 6',
        [
          { input: '3\n1 4 5\n1 3 4\n2 6', expectedOutput: '1 1 2 3 4 4 5 6' },
          { input: '0\n', expectedOutput: '' },
          { input: '1\n1', expectedOutput: '1' }
        ]
      )
    ]
  },
  'Stacks & Queues': {
    Easy: [
      q(
        'Valid Parentheses',
        'Given a string containing (), {}, and [], determine if the input string is valid.',
        '1 <= |s| <= 1e4',
        '()[]{}',
        'true',
        [
          { input: '()[]{}', expectedOutput: 'true' },
          { input: '(]', expectedOutput: 'false' },
          { input: '([{}])', expectedOutput: 'true' }
        ]
      ),
      q(
        'Implement Queue using Stacks',
        'Implement a queue using two stacks and process operations push, pop, peek, and empty.',
        '1 <= operations <= 1e4',
        'push 1\npush 2\npeek\npop\nempty',
        '1\n1\nfalse',
        [
          { input: 'push 1\npush 2\npeek\npop\nempty', expectedOutput: '1\n1\nfalse' },
          { input: 'push 5\npeek\npop\nempty', expectedOutput: '5\n5\ntrue' },
          { input: 'push 7\npush 8\npop\npeek', expectedOutput: '7\n8' }
        ]
      )
    ],
    Medium: [
      q(
        'Daily Temperatures',
        'Given daily temperatures, return an array where answer[i] is number of days until a warmer temperature. If none, 0.',
        '1 <= n <= 1e5',
        '8\n73 74 75 71 69 72 76 73',
        '1 1 4 2 1 1 0 0',
        [
          { input: '8\n73 74 75 71 69 72 76 73', expectedOutput: '1 1 4 2 1 1 0 0' },
          { input: '4\n30 40 50 60', expectedOutput: '1 1 1 0' },
          { input: '4\n30 60 90 30', expectedOutput: '1 1 0 0' }
        ]
      ),
      q(
        'Evaluate Reverse Polish Notation',
        'Evaluate the value of an arithmetic expression in Reverse Polish Notation.',
        '1 <= tokens.length <= 1e4',
        '5\n2 1 + 3 *',
        '9',
        [
          { input: '5\n2 1 + 3 *', expectedOutput: '9' },
          { input: '6\n4 13 5 / +', expectedOutput: '6' },
          { input: '13\n10 6 9 3 + -11 * / * 17 + 5 +', expectedOutput: '22' }
        ]
      )
    ],
    Hard: [
      q(
        'Largest Rectangle in Histogram',
        'Given heights of bars in a histogram, return the area of the largest rectangle.',
        '1 <= n <= 1e5',
        '6\n2 1 5 6 2 3',
        '10',
        [
          { input: '6\n2 1 5 6 2 3', expectedOutput: '10' },
          { input: '2\n2 4', expectedOutput: '4' },
          { input: '5\n1 1 1 1 1', expectedOutput: '5' }
        ]
      ),
      q(
        'Maximal Rectangle',
        'Given a binary matrix filled with 0s and 1s, find the largest rectangle containing only 1s and return its area.',
        '1 <= rows, cols <= 200',
        '4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0',
        '6',
        [
          { input: '4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0', expectedOutput: '6' },
          { input: '1 1\n0', expectedOutput: '0' },
          { input: '1 1\n1', expectedOutput: '1' }
        ]
      )
    ]
  },
  'Trees (Binary Trees, BST)': {
    Easy: [
      q(
        'Maximum Depth of Binary Tree',
        'Given the root of a binary tree, return its maximum depth.',
        '0 <= nodes <= 1e4',
        '3\n9 20\n15 7',
        '3',
        [
          { input: '3\n9 20\n15 7', expectedOutput: '3' },
          { input: '1\n1', expectedOutput: '1' },
          { input: '0\n', expectedOutput: '0' }
        ]
      ),
      q(
        'Binary Tree Inorder Traversal',
        'Given the root of a binary tree, return the inorder traversal of its nodes.',
        '0 <= nodes <= 1e4',
        '1\nnull 2 3',
        '1 3 2',
        [
          { input: '1\nnull 2 3', expectedOutput: '1 3 2' },
          { input: '0\n', expectedOutput: '' },
          { input: '1\n1', expectedOutput: '1' }
        ]
      )
    ],
    Medium: [
      q(
        'Validate Binary Search Tree',
        'Given the root of a binary tree, determine if it is a valid BST.',
        '0 <= nodes <= 1e4',
        '2 1 3',
        'true',
        [
          { input: '2 1 3', expectedOutput: 'true' },
          { input: '5 1 4 null null 3 6', expectedOutput: 'false' },
          { input: '1', expectedOutput: 'true' }
        ]
      ),
      q(
        'Binary Tree Level Order Traversal',
        'Return the level order traversal of a binary tree.',
        '0 <= nodes <= 1e4',
        '3 9 20 null null 15 7',
        '[3] [9 20] [15 7]',
        [
          { input: '3 9 20 null null 15 7', expectedOutput: '[3] [9 20] [15 7]' },
          { input: '1', expectedOutput: '[1]' },
          { input: '', expectedOutput: '[]' }
        ]
      )
    ],
    Hard: [
      q(
        'Binary Tree Maximum Path Sum',
        'Find the maximum path sum in a non-empty binary tree. A path can start and end at any node.',
        '-1000 <= node.val <= 1000',
        '1 2 3',
        '6',
        [
          { input: '1 2 3', expectedOutput: '6' },
          { input: '-10 9 20 null null 15 7', expectedOutput: '42' },
          { input: '2 -1', expectedOutput: '2' }
        ]
      ),
      q(
        'Serialize and Deserialize Binary Tree',
        'Design algorithms to serialize a binary tree to string and deserialize back to an identical tree.',
        '0 <= nodes <= 1e4',
        '1 2 3 null null 4 5',
        '1 2 3 null null 4 5',
        [
          { input: '1 2 3 null null 4 5', expectedOutput: '1 2 3 null null 4 5' },
          { input: '', expectedOutput: '' },
          { input: '1', expectedOutput: '1' }
        ]
      )
    ]
  },
  'Greedy Algorithms': {
    Easy: [
      q(
        'Assign Cookies',
        'Each child has a greed factor and each cookie has a size. Maximize number of content children.',
        '1 <= n,m <= 3e4',
        '3\n1 2 3\n2\n1 1',
        '1',
        [
          { input: '3\n1 2 3\n2\n1 1', expectedOutput: '1' },
          { input: '2\n1 2\n3\n1 2 3', expectedOutput: '2' },
          { input: '1\n10\n1\n1', expectedOutput: '0' }
        ]
      ),
      q(
        'Lemonade Change',
        'At a lemonade stand each cup costs 5. Customers pay with 5,10,20. Return true if correct change can be provided to every customer in order.',
        '1 <= n <= 1e5',
        '5\n5 5 5 10 20',
        'true',
        [
          { input: '5\n5 5 5 10 20', expectedOutput: 'true' },
          { input: '5\n5 5 10 10 20', expectedOutput: 'false' },
          { input: '3\n5 10 5', expectedOutput: 'true' }
        ]
      )
    ],
    Medium: [
      q(
        'Jump Game',
        'Given an array where each element is max jump length at that position, determine if you can reach the last index.',
        '1 <= n <= 1e5',
        '5\n2 3 1 1 4',
        'true',
        [
          { input: '5\n2 3 1 1 4', expectedOutput: 'true' },
          { input: '5\n3 2 1 0 4', expectedOutput: 'false' },
          { input: '1\n0', expectedOutput: 'true' }
        ]
      ),
      q(
        'Partition Labels',
        'Partition a string into as many parts as possible so that each letter appears in at most one part.',
        '1 <= |s| <= 500',
        'ababcbacadefegdehijhklij',
        '9 7 8',
        [
          { input: 'ababcbacadefegdehijhklij', expectedOutput: '9 7 8' },
          { input: 'eccbbbbdec', expectedOutput: '10' },
          { input: 'abc', expectedOutput: '1 1 1' }
        ]
      )
    ],
    Hard: [
      q(
        'Candy',
        'There are n children with ratings. Distribute candies such that each child has at least one candy and higher rated children get more candies than neighbors. Minimize total candies.',
        '1 <= n <= 2e4',
        '3\n1 0 2',
        '5',
        [
          { input: '3\n1 0 2', expectedOutput: '5' },
          { input: '3\n1 2 2', expectedOutput: '4' },
          { input: '5\n1 3 4 5 2', expectedOutput: '11' }
        ]
      ),
      q(
        'Gas Station',
        'Given gas and cost arrays, return the start station index from which you can travel around circuit once; otherwise return -1.',
        '1 <= n <= 1e5',
        '5\n1 2 3 4 5\n5\n3 4 5 1 2',
        '3',
        [
          { input: '5\n1 2 3 4 5\n5\n3 4 5 1 2', expectedOutput: '3' },
          { input: '3\n2 3 4\n3\n3 4 3', expectedOutput: '-1' },
          { input: '1\n5\n1\n4', expectedOutput: '0' }
        ]
      )
    ]
  },
  Backtracking: {
    Easy: [
      q(
        'Letter Combinations of a Phone Number',
        'Given digits 2-9 inclusive, return all possible letter combinations based on telephone keypad mapping.',
        '0 <= |digits| <= 4',
        '23',
        'ad ae af bd be bf cd ce cf',
        [
          { input: '23', expectedOutput: 'ad ae af bd be bf cd ce cf' },
          { input: '', expectedOutput: '' },
          { input: '2', expectedOutput: 'a b c' }
        ]
      ),
      q(
        'Permutations',
        'Given an array of distinct integers, return all possible permutations.',
        '1 <= n <= 6',
        '3\n1 2 3',
        '1 2 3 | 1 3 2 | 2 1 3 | 2 3 1 | 3 1 2 | 3 2 1',
        [
          { input: '3\n1 2 3', expectedOutput: '1 2 3 | 1 3 2 | 2 1 3 | 2 3 1 | 3 1 2 | 3 2 1' },
          { input: '1\n1', expectedOutput: '1' },
          { input: '2\n0 1', expectedOutput: '0 1 | 1 0' }
        ]
      )
    ],
    Medium: [
      q(
        'Combination Sum',
        'Given distinct integers candidates and a target, return all unique combinations where chosen numbers sum to target. You may reuse elements.',
        '1 <= candidates.length <= 30',
        '4\n2 3 6 7\n7',
        '[2 2 3] [7]',
        [
          { input: '4\n2 3 6 7\n7', expectedOutput: '[2 2 3] [7]' },
          { input: '5\n2 3 5 7 8\n8', expectedOutput: '[2 2 2 2] [2 3 3] [3 5] [8]' },
          { input: '1\n2\n1', expectedOutput: '' }
        ]
      ),
      q(
        'Word Search',
        'Given a 2D board and a word, return true if word exists in grid by sequentially adjacent cells without reusing a cell.',
        '1 <= m,n <= 6',
        '3 4\nA B C E\nS F C S\nA D E E\nABCCED',
        'true',
        [
          { input: '3 4\nA B C E\nS F C S\nA D E E\nABCCED', expectedOutput: 'true' },
          { input: '3 4\nA B C E\nS F C S\nA D E E\nSEE', expectedOutput: 'true' },
          { input: '3 4\nA B C E\nS F C S\nA D E E\nABCB', expectedOutput: 'false' }
        ]
      )
    ],
    Hard: [
      q(
        'Palindrome Partitioning II',
        'Given a string s, partition s such that every substring of partition is a palindrome. Return minimum cuts needed.',
        '1 <= |s| <= 2000',
        'aab',
        '1',
        [
          { input: 'aab', expectedOutput: '1' },
          { input: 'a', expectedOutput: '0' },
          { input: 'ab', expectedOutput: '1' }
        ]
      ),
      q(
        'Word Search II',
        'Given a board and list of words, find all words in the board using backtracking and prefix pruning.',
        '1 <= rows, cols <= 12',
        '4 4\no a a n\ne t a e\ni h k r\ni f l v\n4\noath pea eat rain',
        'oath eat',
        [
          { input: '4 4\no a a n\ne t a e\ni h k r\ni f l v\n4\noath pea eat rain', expectedOutput: 'oath eat' },
          { input: '2 2\na b\nc d\n2\nabcd acdb', expectedOutput: '' },
          { input: '1 1\na\n2\na b', expectedOutput: 'a' }
        ]
      )
    ]
  },
  'Dynamic Programming (1D, 2D, Grids, DP on Trees)': {
    Easy: [
      q(
        'Climbing Stairs',
        'You can climb 1 or 2 steps each time. Given n, return number of distinct ways to reach top.',
        '1 <= n <= 45',
        '5',
        '8',
        [
          { input: '5', expectedOutput: '8' },
          { input: '2', expectedOutput: '2' },
          { input: '3', expectedOutput: '3' }
        ]
      ),
      q(
        'House Robber',
        'Given a list of house values, return the maximum amount you can rob without robbing adjacent houses.',
        '1 <= n <= 100',
        '4\n1 2 3 1',
        '4',
        [
          { input: '4\n1 2 3 1', expectedOutput: '4' },
          { input: '5\n2 7 9 3 1', expectedOutput: '12' },
          { input: '1\n5', expectedOutput: '5' }
        ]
      )
    ],
    Medium: [
      q(
        'Coin Change',
        'Given coin denominations and amount, return minimum number of coins needed to make amount. Return -1 if impossible.',
        '1 <= amount <= 1e4',
        '3\n1 2 5\n11',
        '3',
        [
          { input: '3\n1 2 5\n11', expectedOutput: '3' },
          { input: '1\n2\n3', expectedOutput: '-1' },
          { input: '1\n1\n0', expectedOutput: '0' }
        ]
      ),
      q(
        'Longest Increasing Subsequence',
        'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
        '1 <= n <= 2500',
        '8\n10 9 2 5 3 7 101 18',
        '4',
        [
          { input: '8\n10 9 2 5 3 7 101 18', expectedOutput: '4' },
          { input: '6\n0 1 0 3 2 3', expectedOutput: '4' },
          { input: '7\n7 7 7 7 7 7 7', expectedOutput: '1' }
        ]
      )
    ],
    Hard: [
      q(
        'Burst Balloons',
        'Given n balloons with numbers, burst balloons to maximize coins collected. Return maximum coins.',
        '1 <= n <= 300',
        '4\n3 1 5 8',
        '167',
        [
          { input: '4\n3 1 5 8', expectedOutput: '167' },
          { input: '2\n1 5', expectedOutput: '10' },
          { input: '1\n7', expectedOutput: '7' }
        ]
      ),
      q(
        'Distinct Subsequences',
        'Given strings s and t, return number of distinct subsequences of s which equals t.',
        '1 <= |s|, |t| <= 1000',
        'rabbbit\nrabbit',
        '3',
        [
          { input: 'rabbbit\nrabbit', expectedOutput: '3' },
          { input: 'babgbag\nbag', expectedOutput: '5' },
          { input: 'abc\nabc', expectedOutput: '1' }
        ]
      )
    ]
  },
  'Graphs (BFS, DFS, Shortest Path, MST)': {
    Easy: [
      q(
        'Find if Path Exists in Graph',
        'Given an undirected graph and source/destination nodes, return true if a valid path exists.',
        '1 <= n <= 2e5',
        '3 3\n0 1\n1 2\n2 0\n0 2',
        'true',
        [
          { input: '3 3\n0 1\n1 2\n2 0\n0 2', expectedOutput: 'true' },
          { input: '6 5\n0 1\n0 2\n3 5\n5 4\n4 3\n0 5', expectedOutput: 'false' },
          { input: '1 0\n0 0', expectedOutput: 'true' }
        ]
      ),
      q(
        'Number of Islands',
        'Given a 2D grid of 1s (land) and 0s (water), return number of islands.',
        '1 <= m,n <= 300',
        '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0',
        '1',
        [
          { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expectedOutput: '1' },
          { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expectedOutput: '3' },
          { input: '1 1\n0', expectedOutput: '0' }
        ]
      )
    ],
    Medium: [
      q(
        'Course Schedule',
        'Given number of courses and prerequisites, return true if you can finish all courses.',
        '1 <= numCourses <= 2000',
        '2 1\n1 0',
        'true',
        [
          { input: '2 1\n1 0', expectedOutput: 'true' },
          { input: '2 2\n1 0\n0 1', expectedOutput: 'false' },
          { input: '3 2\n1 0\n2 1', expectedOutput: 'true' }
        ]
      ),
      q(
        'Rotting Oranges',
        'Given a grid where 0=empty, 1=fresh orange, 2=rotten orange, return minimum minutes until all oranges rot, or -1.',
        '1 <= m,n <= 10',
        '3 3\n2 1 1\n1 1 0\n0 1 1',
        '4',
        [
          { input: '3 3\n2 1 1\n1 1 0\n0 1 1', expectedOutput: '4' },
          { input: '3 3\n2 1 1\n0 1 1\n1 0 1', expectedOutput: '-1' },
          { input: '1 2\n0 2', expectedOutput: '0' }
        ]
      )
    ],
    Hard: [
      q(
        'Network Delay Time',
        'Given directed weighted edges times[u,v,w], find the time it takes for all nodes to receive signal from node k. Return -1 if impossible.',
        '1 <= n <= 100',
        '4 3\n2 1 1\n2 3 1\n3 4 1\n2',
        '2',
        [
          { input: '4 3\n2 1 1\n2 3 1\n3 4 1\n2', expectedOutput: '2' },
          { input: '2 1\n1 2 1\n1', expectedOutput: '1' },
          { input: '2 1\n1 2 1\n2', expectedOutput: '-1' }
        ]
      ),
      q(
        'Word Ladder',
        'Given beginWord, endWord, and a word list, return the length of shortest transformation sequence, changing one letter at a time and each intermediate word present in list.',
        '1 <= word length <= 10',
        'hit\ncog\n6\nhot dot dog lot log cog',
        '5',
        [
          { input: 'hit\ncog\n6\nhot dot dog lot log cog', expectedOutput: '5' },
          { input: 'hit\ncog\n5\nhot dot dog lot log', expectedOutput: '0' },
          { input: 'a\nc\n3\na b c', expectedOutput: '2' }
        ]
      )
    ]
  }
};

function buildCuratedQuestions() {
  const questions = [];

  for (const topic of TOPICS) {
    const byDifficulty = STANDARD_QUESTION_BANK[topic] || {};

    for (const difficulty of DIFFICULTIES) {
      const entries = byDifficulty[difficulty] || [];
      const chosen = entries.slice(0, QUESTIONS_PER_DIFFICULTY);

      for (const entry of chosen) {
        questions.push(finalizeQuestion({
          ...entry,
          topic,
          difficulty
        }));
      }
    }
  }

  return questions;
}

function parseProblemsFromFile() {
  return buildCuratedQuestions();
}

let syncPromise = null;

async function syncProblemsToDatabase(ProblemModel) {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const parsed = buildCuratedQuestions();

    await ProblemModel.deleteMany({ sourceKey: { $exists: true } });
    if (parsed.length) {
      await ProblemModel.insertMany(parsed, { ordered: true });
    }

    return { totalParsed: parsed.length, totalUpserted: parsed.length };
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function getDifficultyOrder(requestedDifficulty) {
  const normalized = String(requestedDifficulty || '').trim();
  if (normalized === 'Easy') return ['Easy', 'Medium', 'Hard'];
  if (normalized === 'Hard') return ['Hard', 'Medium', 'Easy'];
  return ['Medium', 'Easy', 'Hard'];
}

function pickFromTopic(topicProblems, requestedDifficulty, needed, usedKeys) {
  const picked = [];
  if (!topicProblems.length || needed <= 0) return picked;

  const byDifficulty = { Easy: [], Medium: [], Hard: [] };
  for (const p of topicProblems) {
    if (byDifficulty[p.difficulty]) {
      byDifficulty[p.difficulty].push(p);
    }
  }

  for (const d of DIFFICULTIES) {
    byDifficulty[d] = shuffle(byDifficulty[d]);
  }

  const order = getDifficultyOrder(requestedDifficulty);
  for (const d of order) {
    for (const p of byDifficulty[d]) {
      if (picked.length >= needed) return picked;
      if (usedKeys.has(p.sourceKey)) continue;
      usedKeys.add(p.sourceKey);
      picked.push(p);
    }
  }

  return picked;
}

async function getProblemsForContestFromDb(ProblemModel, topic, difficulty, count) {
  const requested = Math.max(1, parseInt(count, 10) || 1);
  const allProblems = await ProblemModel.find({ sourceKey: { $exists: true } });

  if (!allProblems.length) {
    return [];
  }

  const byTopic = new Map();
  for (const p of allProblems) {
    if (!byTopic.has(p.topic)) byTopic.set(p.topic, []);
    byTopic.get(p.topic).push(p);
  }

  const selected = [];
  const usedKeys = new Set();

  const topicProblems = byTopic.get(topic) || [];
  const fromPrimaryTopic = pickFromTopic(
    topicProblems,
    difficulty,
    Math.min(requested, MAX_PER_TOPIC),
    usedKeys
  );
  selected.push(...fromPrimaryTopic);

  if (selected.length >= requested) {
    return selected.slice(0, requested);
  }

  const fallbackTopics = [
    ...BASIC_FALLBACK_TOPICS.filter(t => t !== topic),
    ...TOPICS.filter(t => t !== topic && !BASIC_FALLBACK_TOPICS.includes(t))
  ];

  for (const fallbackTopic of fallbackTopics) {
    if (selected.length >= requested) break;

    const fallbackProblems = byTopic.get(fallbackTopic) || [];
    if (!fallbackProblems.length) continue;

    const need = requested - selected.length;
    const picked = pickFromTopic(
      fallbackProblems,
      difficulty,
      Math.min(need, MAX_PER_TOPIC),
      usedKeys
    );
    selected.push(...picked);
  }

  return selected.slice(0, requested);
}

module.exports = {
  TOPICS,
  parseProblemsFromFile,
  syncProblemsToDatabase,
  getProblemsForContestFromDb
};