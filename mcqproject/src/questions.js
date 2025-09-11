const questions = [
  {
    id: 1,
    question: 'What is the capital of France?',
    options: ['Berlin', 'Paris', 'Rome', 'Madrid'],
    answer: 1,
    explanation: 'Paris is the capital and most populous city of France.',
    tags: ['geography'],
  },
  {
    id: 2,
    question: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
    answer: 1,
    explanation: 'Mars is called the Red Planet due to its reddish appearance.',
    tags: ['space'],
  },
  {
    id: 3,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    answer: 1,
    explanation: 'Adding 2 and 2 gives 4.',
    tags: ['math'],
  },
  // Multi-answer sample
  {
    id: 4,
    question: 'Which are prime numbers?',
    options: ['2', '3', '4', '5'],
    answer: [0,1,3],
    explanation: '2, 3, and 5 are primes.',
    tags: ['math'],
  },
  // Hotspot sample (scaffold)
  {
    id: 5,
    type: 'hotspot',
    question: 'Click the highlighted area of the logo',
    media: {
      src: 'https://dummyimage.com/600x300/222/fff.png&text=Hotspot+Demo',
      zones: [ {x: 20, y: 30, w: 20, h: 25} ],
    },
    options: ['Zone A'],
    answer: [0],
    explanation: 'The box on the left is the target zone.',
    tags: ['hotspot'],
  },
];

export default questions;
