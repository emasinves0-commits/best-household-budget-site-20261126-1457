// Seed data for the Hartley household, November 2026.
// Every figure on the site is computed from these rows: category totals,
// dashboard sums and the reports chart all add up the same transactions,
// so the numbers always agree with each other.

export const HOUSEHOLD = {
  name: 'The Hartley Household',
  members: 'Maya & Tom Hartley, plus June (9) and Leo (6)',
  month: 'November 2026',
  monthShort: 'Nov 2026',
  currencyNote: 'All figures in US dollars.',
};

export const INCOME = [
  { date: '2026-11-15', source: "Maya's salary — Northgate Clinic", amount: 3400.0 },
  { date: '2026-11-15', source: "Tom's salary — Alder & Finch", amount: 3400.0 },
  { date: '2026-11-08', source: 'Tom — freelance wiring job', amount: 1200.0 },
  { date: '2026-11-20', source: 'Bank interest', amount: 42.0 },
  { date: '2026-11-22', source: 'Refund — returned jacket', amount: 58.0 },
  { date: '2026-11-14', source: 'Garage sale', amount: 300.0 },
  // December is a plan, not actuals yet: the salaries are expected on the
  // 15th as usual, the freelance job is booked, the rest is the usual trickle.
  { date: '2026-12-15', source: "Maya's salary — Northgate Clinic", amount: 3400.0 },
  { date: '2026-12-15', source: "Tom's salary — Alder & Finch", amount: 3400.0 },
  { date: '2026-12-10', source: 'Tom — freelance wiring job', amount: 1100.0 },
  { date: '2026-12-18', source: 'Bank interest', amount: 45.0 },
  { date: '2026-12-20', source: 'Refund — returned gift', amount: 55.0 },
  // January's salaries only: the December payday plan looks ahead to them.
  { date: '2027-01-15', source: "Maya's salary — Northgate Clinic", amount: 3400.0 },
  { date: '2027-01-15', source: "Tom's salary — Alder & Finch", amount: 3400.0 },
];

export const BUDGETS = [
  { category: 'Housing', budget: 2150.0, note: 'Mortgage + home insurance. Fixed.' },
  { category: 'Groceries', budget: 780.0, note: 'Weekly shop on Saturdays.' },
  { category: 'Utilities', budget: 320.0, note: 'Power, water, gas, internet.' },
  { category: 'Transport', budget: 460.0, note: 'Fuel, metro cards, parking, tolls.' },
  { category: 'Dining Out', budget: 240.0, note: 'One takeaway night a week, max.' },
  { category: 'Kids & School', budget: 380.0, note: 'Lunches, lessons, clubs, books.' },
  { category: 'Health', budget: 260.0, note: 'Pharmacy, dentist, gym.' },
  { category: 'Entertainment', budget: 180.0, note: 'Films, games, outings.' },
  { category: 'Subscriptions', budget: 96.0, note: 'Streaming, music, apps.' },
  { category: 'Clothing', budget: 150.0, note: 'Growing kids, worn-out shoes.' },
  { category: 'Savings', budget: 1200.0, note: 'Moved to goals on payday.' },
  { category: 'Misc', budget: 120.0, note: 'Everything else, kept small.' },
];

export const TRANSACTIONS = [
  { date: '2026-11-01', merchant: 'Hartley Mortgage', category: 'Housing', amount: 1950.0, note: 'Monthly payment' },
  { date: '2026-11-03', merchant: 'SafeHome Insurance', category: 'Housing', amount: 200.0, note: 'Home insurance' },
  { date: '2026-11-02', merchant: 'GreenMart', category: 'Groceries', amount: 142.3, note: 'Weekly shop' },
  { date: '2026-11-05', merchant: 'FreshFoods Market', category: 'Groceries', amount: 98.45, note: 'Weekly shop' },
  { date: '2026-11-09', merchant: 'GreenMart', category: 'Groceries', amount: 121.6, note: 'Weekly shop' },
  { date: '2026-11-13', merchant: 'Corner Deli', category: 'Groceries', amount: 46.2, note: 'Top-up shop' },
  { date: '2026-11-16', merchant: 'FreshFoods Market', category: 'Groceries', amount: 87.15, note: 'Weekly shop' },
  { date: '2026-11-20', merchant: 'GreenMart', category: 'Groceries', amount: 116.7, note: 'Weekly shop' },
  { date: '2026-11-04', merchant: 'City Power', category: 'Utilities', amount: 132.4, note: 'October usage' },
  { date: '2026-11-06', merchant: 'Water Dept', category: 'Utilities', amount: 48.25, note: 'Quarterly bill' },
  { date: '2026-11-10', merchant: 'NorthNet Internet', category: 'Utilities', amount: 79.0, note: 'Monthly' },
  { date: '2026-11-18', merchant: 'City Gas', category: 'Utilities', amount: 27.5, note: 'Monthly' },
  { date: '2026-11-03', merchant: 'Shell', category: 'Transport', amount: 52.0, note: 'Fuel' },
  { date: '2026-11-07', merchant: 'Metro Card', category: 'Transport', amount: 44.3, note: 'Monthly top-up' },
  { date: '2026-11-11', merchant: 'Shell', category: 'Transport', amount: 48.5, note: 'Fuel' },
  { date: '2026-11-14', merchant: 'City Parking', category: 'Transport', amount: 60.0, note: 'Monthly permit' },
  { date: '2026-11-17', merchant: 'Shell', category: 'Transport', amount: 55.0, note: 'Fuel' },
  { date: '2026-11-21', merchant: 'Metro Card', category: 'Transport', amount: 44.3, note: 'Monthly top-up' },
  { date: '2026-11-24', merchant: 'Shell', category: 'Transport', amount: 54.5, note: 'Fuel' },
  { date: '2026-11-25', merchant: 'River Toll', category: 'Transport', amount: 40.0, note: 'Bridge tolls' },
  { date: '2026-11-02', merchant: 'Pizza Night', category: 'Dining Out', amount: 38.5, note: 'Friday takeaway' },
  { date: '2026-11-08', merchant: 'Sushi House', category: 'Dining Out', amount: 62.25, note: "Maya's birthday" },
  { date: '2026-11-15', merchant: 'Corner Café', category: 'Dining Out', amount: 24.0, note: 'Lunch with friends' },
  { date: '2026-11-22', merchant: 'Burger Joint', category: 'Dining Out', amount: 41.0, note: 'Saturday lunch' },
  { date: '2026-11-25', merchant: 'Thai Garden', category: 'Dining Out', amount: 21.0, note: 'Takeaway' },
  { date: '2026-11-05', merchant: 'School Lunch', category: 'Kids & School', amount: 85.0, note: 'November lunches' },
  { date: '2026-11-12', merchant: 'Piano Lessons', category: 'Kids & School', amount: 120.0, note: "June's lessons" },
  { date: '2026-11-19', merchant: 'Book Nook', category: 'Kids & School', amount: 57.1, note: 'Reading books' },
  { date: '2026-11-23', merchant: 'Soccer Club', category: 'Kids & School', amount: 80.0, note: "Leo's term fees" },
  { date: '2026-11-07', merchant: 'Pharmacy', category: 'Health', amount: 42.5, note: 'Prescriptions' },
  { date: '2026-11-13', merchant: 'Bright Smile Dentist', category: 'Health', amount: 95.0, note: "Tom's check-up" },
  { date: '2026-11-20', merchant: 'Riverside Gym', category: 'Health', amount: 57.5, note: 'Monthly membership' },
  { date: '2026-11-06', merchant: 'Cineplex', category: 'Entertainment', amount: 34.0, note: 'Family film night' },
  { date: '2026-11-14', merchant: 'StreamFlix Rental', category: 'Entertainment', amount: 12.5, note: 'Film rental' },
  { date: '2026-11-21', merchant: 'Toy Barn', category: 'Entertainment', amount: 56.0, note: 'Board games' },
  { date: '2026-11-24', merchant: 'Hall Concerts', category: 'Entertainment', amount: 40.0, note: 'School concert tickets' },
  { date: '2026-11-01', merchant: 'StreamFlix', category: 'Subscriptions', amount: 15.99, note: 'Monthly' },
  { date: '2026-11-01', merchant: 'MusicBox', category: 'Subscriptions', amount: 10.99, note: 'Monthly' },
  { date: '2026-11-05', merchant: 'Cloud Drive', category: 'Subscriptions', amount: 9.99, note: 'Storage plan' },
  { date: '2026-11-09', merchant: 'Daily News', category: 'Subscriptions', amount: 12.0, note: 'Monthly' },
  { date: '2026-11-12', merchant: 'FitTrack', category: 'Subscriptions', amount: 19.99, note: 'Fitness app' },
  { date: '2026-11-15', merchant: 'LearnKids', category: 'Subscriptions', amount: 14.99, note: "Children's learning" },
  { date: '2026-11-20', merchant: 'AudioBooks', category: 'Subscriptions', amount: 12.05, note: 'Monthly' },
  { date: '2026-11-10', merchant: 'Kids Wear', category: 'Clothing', amount: 64.99, note: 'Winter jackets' },
  { date: '2026-11-18', merchant: 'Shoe Store', category: 'Clothing', amount: 25.0, note: "Tom's work shoes" },
  { date: '2026-11-15', merchant: 'Emergency Fund', category: 'Savings', amount: 1200.0, note: 'Payday transfer to goals' },
  { date: '2026-11-09', merchant: 'Hardware Store', category: 'Misc', amount: 31.25, note: 'Light bulbs, tape' },
  { date: '2026-11-22', merchant: 'Gift Shop', category: 'Misc', amount: 43.0, note: "Grandma's birthday gift" },
  // December, planned: the bills are real, the spending is what the
  // household expects to spend. Planned total $4,850.75, of which $1,200
  // goes to savings — leaving $3,149.25 of the $8,000 expected in.
  { date: '2026-12-01', merchant: 'Hartley Mortgage', category: 'Housing', amount: 1950.0, note: 'Monthly payment' },
  { date: '2026-12-03', merchant: 'SafeHome Insurance', category: 'Housing', amount: 200.0, note: 'Home insurance' },
  { date: '2026-12-05', merchant: 'GreenMart', category: 'Groceries', amount: 138.2, note: 'Weekly shop, planned' },
  { date: '2026-12-12', merchant: 'FreshFoods Market', category: 'Groceries', amount: 104.5, note: 'Weekly shop, planned' },
  { date: '2026-12-19', merchant: 'GreenMart', category: 'Groceries', amount: 129.75, note: 'Weekly shop, planned' },
  { date: '2026-12-26', merchant: 'Corner Deli', category: 'Groceries', amount: 52.3, note: 'Top-up shop, planned' },
  { date: '2026-12-04', merchant: 'City Power', category: 'Utilities', amount: 130.0, note: 'November usage, planned' },
  { date: '2026-12-10', merchant: 'NorthNet Internet', category: 'Utilities', amount: 79.0, note: 'Monthly, planned' },
  { date: '2026-12-18', merchant: 'City Gas', category: 'Utilities', amount: 27.5, note: 'Monthly, planned' },
  { date: '2026-12-03', merchant: 'Shell', category: 'Transport', amount: 49.0, note: 'Fuel, planned' },
  { date: '2026-12-07', merchant: 'Metro Card', category: 'Transport', amount: 44.3, note: 'Monthly top-up, planned' },
  { date: '2026-12-17', merchant: 'Shell', category: 'Transport', amount: 51.5, note: 'Fuel, planned' },
  { date: '2026-12-24', merchant: 'River Toll', category: 'Transport', amount: 40.0, note: 'Bridge tolls, planned' },
  { date: '2026-12-08', merchant: 'Pizza Night', category: 'Dining Out', amount: 36.75, note: 'Friday takeaway, planned' },
  { date: '2026-12-22', merchant: 'Sushi House', category: 'Dining Out', amount: 58.4, note: 'Family dinner, planned' },
  { date: '2026-12-12', merchant: 'Piano Lessons', category: 'Kids & School', amount: 120.0, note: "June's lessons, planned" },
  { date: '2026-12-19', merchant: 'Book Nook', category: 'Kids & School', amount: 48.9, note: 'Reading books, planned' },
  { date: '2026-12-07', merchant: 'Pharmacy', category: 'Health', amount: 38.25, note: 'Prescriptions, planned' },
  { date: '2026-12-20', merchant: 'Riverside Gym', category: 'Health', amount: 57.5, note: 'Monthly membership, planned' },
  { date: '2026-12-06', merchant: 'Cineplex', category: 'Entertainment', amount: 32.0, note: 'Family film night, planned' },
  { date: '2026-12-21', merchant: 'Toy Barn', category: 'Entertainment', amount: 44.0, note: 'Board games, planned' },
  { date: '2026-12-01', merchant: 'StreamFlix', category: 'Subscriptions', amount: 15.99, note: 'Monthly, planned' },
  { date: '2026-12-01', merchant: 'MusicBox', category: 'Subscriptions', amount: 10.99, note: 'Monthly, planned' },
  { date: '2026-12-05', merchant: 'Cloud Drive', category: 'Subscriptions', amount: 9.99, note: 'Storage plan, planned' },
  { date: '2026-12-09', merchant: 'Daily News', category: 'Subscriptions', amount: 12.0, note: 'Monthly, planned' },
  { date: '2026-12-12', merchant: 'FitTrack', category: 'Subscriptions', amount: 19.99, note: 'Fitness app, planned' },
  { date: '2026-12-15', merchant: 'LearnKids', category: 'Subscriptions', amount: 14.99, note: "Children's learning, planned" },
  { date: '2026-12-20', merchant: 'AudioBooks', category: 'Subscriptions', amount: 12.05, note: 'Monthly, planned' },
  { date: '2026-12-10', merchant: 'Kids Wear', category: 'Clothing', amount: 58.5, note: 'Winter jackets, planned' },
  { date: '2026-12-15', merchant: 'Emergency Fund', category: 'Savings', amount: 1200.0, note: 'Payday transfer to goals, planned' },
  { date: '2026-12-09', merchant: 'Hardware Store', category: 'Misc', amount: 28.4, note: 'Light bulbs, tape, planned' },
  { date: '2026-12-22', merchant: 'Gift Shop', category: 'Misc', amount: 36.0, note: 'Christmas gifts, planned' },
];

export const BILLS = [
  { name: 'Mortgage', payee: 'Hartley Mortgage', amount: 1950.0, due: '2026-11-01', paid: true, recurring: 'Monthly' },
  { name: 'Home insurance', payee: 'SafeHome Insurance', amount: 200.0, due: '2026-11-03', paid: true, recurring: 'Monthly' },
  { name: 'Electricity', payee: 'City Power', amount: 132.4, due: '2026-11-04', paid: true, recurring: 'Monthly' },
  { name: 'Water', payee: 'Water Dept', amount: 48.25, due: '2026-11-06', paid: true, recurring: 'Quarterly' },
  { name: 'Internet', payee: 'NorthNet Internet', amount: 79.0, due: '2026-11-10', paid: true, recurring: 'Monthly' },
  { name: 'Mobile phones', payee: 'CellOne', amount: 85.0, due: '2026-11-12', paid: true, recurring: 'Monthly' },
  { name: 'Car insurance', payee: 'DriveSafe', amount: 112.0, due: '2026-11-15', paid: true, recurring: 'Monthly' },
  { name: 'Gas', payee: 'City Gas', amount: 27.5, due: '2026-11-18', paid: true, recurring: 'Monthly' },
  { name: 'Streaming', payee: 'StreamFlix', amount: 15.99, due: '2026-11-25', paid: true, recurring: 'Monthly' },
  { name: 'Music', payee: 'MusicBox', amount: 10.99, due: '2026-11-25', paid: true, recurring: 'Monthly' },
  { name: 'Mortgage', payee: 'Hartley Mortgage', amount: 1950.0, due: '2026-12-01', paid: false, recurring: 'Monthly' },
  { name: 'Electricity', payee: 'City Power', amount: 130.0, due: '2026-12-04', paid: false, recurring: 'Monthly' },
  { name: 'Internet', payee: 'NorthNet Internet', amount: 79.0, due: '2026-12-10', paid: false, recurring: 'Monthly' },
  { name: 'Mobile phones', payee: 'CellOne', amount: 85.0, due: '2026-12-12', paid: false, recurring: 'Monthly' },
  { name: 'Car insurance', payee: 'DriveSafe', amount: 112.0, due: '2026-12-15', paid: false, recurring: 'Monthly' },
  // January's first bills: the December calendar and payday plan look ahead to them.
  { name: 'Mortgage', payee: 'Hartley Mortgage', amount: 1950.0, due: '2027-01-01', paid: false, recurring: 'Monthly' },
  { name: 'Electricity', payee: 'City Power', amount: 130.0, due: '2027-01-04', paid: false, recurring: 'Monthly' },
  { name: 'Internet', payee: 'NorthNet Internet', amount: 79.0, due: '2027-01-10', paid: false, recurring: 'Monthly' },
  { name: 'Mobile phones', payee: 'CellOne', amount: 85.0, due: '2027-01-12', paid: false, recurring: 'Monthly' },
];

export const GOALS = [
  { name: 'Emergency fund', target: 10000.0, saved: 7350.0, monthly: 400.0, note: 'Six months of essentials, for the month nobody plans.' },
  { name: 'Summer holiday', target: 3500.0, saved: 1900.0, monthly: 300.0, note: 'Two weeks by the coast in July, booked by March.' },
  { name: 'New car', target: 6000.0, saved: 2400.0, monthly: 250.0, note: 'Deposit for a used estate when the old one gives up.' },
  { name: 'College fund', target: 25000.0, saved: 8100.0, monthly: 250.0, note: 'A little every month since June was born.' },
];

export const DEBTS = [
  // The household's only debt. Balance chosen so the scheduled payment
  // computes to exactly the $1,950.00 monthly mortgage bill already in BILLS:
  // $318,384 at 6.2% over 30 years = $1,950.00 a month.
  { name: 'Mortgage — Hartley home', balance: 318384.0, apr: 6.2, years: 30, note: 'The only debt the household carries. Every other bill is paid in full each month.' },
];

export const MONTHS = [
  { month: 'Jan', income: 8200.0, spent: 6980.0 },
  { month: 'Feb', income: 8150.0, spent: 6710.0 },
  { month: 'Mar', income: 8300.0, spent: 7050.0 },
  { month: 'Apr', income: 8200.0, spent: 6890.0 },
  { month: 'May', income: 8350.0, spent: 7120.0 },
  { month: 'Jun', income: 8200.0, spent: 6620.0 },
  { month: 'Jul', income: 8400.0, spent: 7010.0 },
  { month: 'Aug', income: 8100.0, spent: 6440.0 },
  { month: 'Sep', income: 8400.0, spent: 7160.0 },
  { month: 'Oct', income: 8250.0, spent: 6710.0 },
  { month: 'Nov', income: 8400.0, spent: 5774.74 },
  // December is a plan: spent is the planned total of the December rows.
  { month: 'Dec', income: 8000.0, spent: 4850.75 },
];

// The site's "today": the last November transaction is the 25th, and the
// Plan December action is dated the 27th. Days-until on bills counts from here.
export const TODAY = '2026-11-26';

export const CATEGORY_COLORS = {
  Housing: '#1d4d3b',
  Groceries: '#3e7d5b',
  Utilities: '#7a9e7e',
  Transport: '#c98a2b',
  'Dining Out': '#b4552d',
  'Kids & School': '#4a6fa5',
  Health: '#7d5a9e',
  Entertainment: '#a55a7d',
  Subscriptions: '#5a8a8a',
  Clothing: '#8a6d4b',
  Savings: '#2e7d32',
  Misc: '#8a8a8a',
};
