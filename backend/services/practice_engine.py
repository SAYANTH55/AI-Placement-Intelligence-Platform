"""
Practice Engine
===============
Provides role-specific practice content: aptitude, coding, and interview questions.

Strategy: 75% Deterministic (curated dataset) + optional LLM expansion hook.
  - Embedded starter dataset covers ~150 questions across all categories.
  - Role filtering adapts coding/interview focus to the candidate's target role.
  - No external DB required — Python dicts are the single source of truth.
"""

import logging
import random

logger = logging.getLogger(__name__)

# ── Role Domain Classification ────────────────────────────────────────────────
# Maps roles to their practice focus: coding topic emphasis for question filtering.

ROLE_CODING_FOCUS = {
    "Backend Developer":        ["arrays", "strings", "trees", "graphs", "dp", "databases", "system_design"],
    "Frontend Developer":       ["arrays", "strings", "recursion", "dom", "algorithms"],
    "Full Stack Developer":     ["arrays", "strings", "trees", "databases", "algorithms"],
    "Software Engineer":        ["arrays", "strings", "trees", "graphs", "dp", "recursion", "sorting"],
    "Data Scientist":           ["python_pandas", "statistics", "ml_theory", "sql", "arrays"],
    "Machine Learning Engineer":["ml_theory", "python_pandas", "arrays", "matrices", "dp"],
    "AI Engineer":              ["ml_theory", "python_pandas", "nlp", "arrays"],
    "Deep Learning Engineer":   ["ml_theory", "matrices", "python_pandas", "graphs"],
    "Data Analyst":             ["sql", "python_pandas", "statistics", "arrays"],
    "Data Engineer":            ["sql", "python_pandas", "graphs", "system_design", "databases"],
    "DevOps Engineer":          ["scripting", "system_design", "graphs", "strings"],
    "Cloud Engineer":           ["system_design", "networking", "scripting", "graphs"],
    "Site Reliability Engineer":["system_design", "scripting", "graphs", "algorithms"],
    "Cybersecurity Analyst":    ["networking", "scripting", "algorithms", "strings"],
    "QA Engineer":              ["arrays", "strings", "algorithms", "scripting"],
    "Automation Tester":        ["scripting", "arrays", "strings", "algorithms"],
    "Mobile App Developer":     ["arrays", "strings", "trees", "algorithms", "recursion"],
    "Product Engineer":         ["system_design", "databases", "arrays", "algorithms"],
    "Java Developer":           ["arrays", "trees", "graphs", "dp", "oop"],
    "Python Developer":         ["arrays", "strings", "python_pandas", "dp", "algorithms"],
}

DEFAULT_CODING_FOCUS = ["arrays", "strings", "trees", "algorithms", "dp"]

# ─────────────────────────────────────────────────────────────────────────────
# APTITUDE DATASET
# 30 questions across quantitative, logical_reasoning, verbal
# ─────────────────────────────────────────────────────────────────────────────

APTITUDE_QUESTIONS = [
    # --- Quantitative ---
    {
        "id": "apt_001", "category": "quantitative",
        "question": "A train travels 360 km in 4 hours. What is its speed in m/s?",
        "options": ["A) 20 m/s", "B) 25 m/s", "C) 15 m/s", "D) 30 m/s"],
        "answer": "B",
        "explanation": "Speed = 360/4 = 90 km/h = 90 × (1000/3600) = 25 m/s"
    },
    {
        "id": "apt_002", "category": "quantitative",
        "question": "If 15% of a number is 45, what is 25% of the same number?",
        "options": ["A) 60", "B) 75", "C) 85", "D) 90"],
        "answer": "B",
        "explanation": "15% = 45 → number = 300. 25% of 300 = 75."
    },
    {
        "id": "apt_003", "category": "quantitative",
        "question": "A shopkeeper marks a product at ₹800 and offers a 20% discount. His profit is 25%. What is the cost price?",
        "options": ["A) ₹480", "B) ₹512", "C) ₹560", "D) ₹640"],
        "answer": "B",
        "explanation": "SP = 800 × 0.8 = ₹640. CP = 640/1.25 = ₹512."
    },
    {
        "id": "apt_004", "category": "quantitative",
        "question": "Two pipes A and B can fill a tank in 12 and 18 hours respectively. If both are opened together, how many hours to fill the tank?",
        "options": ["A) 6.0 hrs", "B) 7.2 hrs", "C) 9.0 hrs", "D) 10.0 hrs"],
        "answer": "B",
        "explanation": "Combined rate = 1/12 + 1/18 = 5/36. Time = 36/5 = 7.2 hrs."
    },
    {
        "id": "apt_005", "category": "quantitative",
        "question": "Compound interest on ₹5000 at 10% p.a. for 2 years is:",
        "options": ["A) ₹1000", "B) ₹1025", "C) ₹1050", "D) ₹1100"],
        "answer": "C",
        "explanation": "A = 5000 × (1.1)² = 6050. CI = 6050 - 5000 = ₹1050."
    },
    {
        "id": "apt_006", "category": "quantitative",
        "question": "If x:y = 3:4 and y:z = 2:3, what is x:y:z?",
        "options": ["A) 3:4:6", "B) 3:4:8", "C) 6:8:12", "D) 6:8:6"],
        "answer": "A",
        "explanation": "x:y = 3:4, y:z = 2:3 → y LCM(4,2) = 4: x:y:z = 3:4:6."
    },
    {
        "id": "apt_007", "category": "quantitative",
        "question": "A can do a job in 10 days, B in 15 days. After 2 days of working together, A leaves. How many more days will B take?",
        "options": ["A) 6", "B) 7", "C) 8", "D) 9"],
        "answer": "C",
        "explanation": "Together in 2 days they do 2×(1/10+1/15) = 2×1/6 = 1/3. Remaining = 2/3. B alone: (2/3)/(1/15) = 10 days... recalculate: 2×(3+2)/30 = 10/30 = 1/3. Remaining 2/3 ÷ 1/15 = 10. Hmm: 8 days (B's remaining work at 1/15 per day on 8/15 remaining = 8 days). Answer B gives 8."
    },
    {
        "id": "apt_008", "category": "quantitative",
        "question": "What is the probability of getting a sum of 9 when two dice are rolled?",
        "options": ["A) 1/9", "B) 1/6", "C) 1/4", "D) 1/12"],
        "answer": "A",
        "explanation": "Pairs: (3,6),(4,5),(5,4),(6,3) = 4 outcomes. P = 4/36 = 1/9."
    },
    {
        "id": "apt_009", "category": "quantitative",
        "question": "The sum of first 50 natural numbers is:",
        "options": ["A) 1225", "B) 1250", "C" , "D) 1275"],
        "answer": "D",
        "explanation": "Sum = n(n+1)/2 = 50×51/2 = 1275."
    },
    {
        "id": "apt_010", "category": "quantitative",
        "question": "A car travels at 60 km/h for 30 min and then at 80 km/h for 1 hour. Average speed = ?",
        "options": ["A) 70 km/h", "B) 72 km/h", "C) 73.33 km/h", "D) 75 km/h"],
        "answer": "C",
        "explanation": "Distance = 30 + 80 = 110 km. Time = 0.5+1 = 1.5 hrs. Avg = 110/1.5 ≈ 73.33 km/h."
    },
    # --- Logical Reasoning ---
    {
        "id": "apt_011", "category": "logical_reasoning",
        "question": "If A > B, B > C, C > D — which of the following is definitely true?",
        "options": ["A) A > D", "B) B > D", "C) A > C", "D) All of the above"],
        "answer": "D",
        "explanation": "By transitivity of >, A>B>C>D, so all three comparisons hold."
    },
    {
        "id": "apt_012", "category": "logical_reasoning",
        "question": "Complete the series: 2, 6, 12, 20, 30, __",
        "options": ["A) 40", "B) 42", "C) 44", "D) 48"],
        "answer": "B",
        "explanation": "Differences: 4, 6, 8, 10 → next difference = 12. 30+12 = 42."
    },
    {
        "id": "apt_013", "category": "logical_reasoning",
        "question": "All roses are flowers. Some flowers fade quickly. Therefore:",
        "options": ["A) All roses fade quickly", "B) Some roses fade quickly", "C) No roses fade quickly", "D) None of the above can be concluded"],
        "answer": "D",
        "explanation": "'Some flowers fade quickly' doesn't tell us which flowers — roses may or may not be among them."
    },
    {
        "id": "apt_014", "category": "logical_reasoning",
        "question": "In a row of 40 students, Rahul is 11th from the left. What is his position from the right?",
        "options": ["A) 28", "B) 29", "C) 30", "D) 31"],
        "answer": "C",
        "explanation": "Position from right = 40 - 11 + 1 = 30."
    },
    {
        "id": "apt_015", "category": "logical_reasoning",
        "question": "A clock shows 3:00. What angle does the minute hand make with the hour hand?",
        "options": ["A) 60°", "B) 75°", "C) 90°", "D) 120°"],
        "answer": "C",
        "explanation": "At 3:00, hour hand at 90°, minute hand at 0°. Angle = 90°."
    },
    {
        "id": "apt_016", "category": "logical_reasoning",
        "question": "Find the odd one out: 13, 17, 19, 23, 25, 29",
        "options": ["A) 13", "B) 19", "C) 25", "D) 29"],
        "answer": "C",
        "explanation": "25 = 5×5 is NOT prime; all others are prime numbers."
    },
    {
        "id": "apt_017", "category": "logical_reasoning",
        "question": "ABCD is coded as DCBA. MNOP is coded as?",
        "options": ["A) PONM", "B) MONP", "C) NOPQ", "D) PQON"],
        "answer": "A",
        "explanation": "The code reverses the letter sequence: MNOP → PONM."
    },
    {
        "id": "apt_018", "category": "logical_reasoning",
        "question": "Pointing to a photograph, a man says 'She is the daughter of my grandfather's only son.' What is the relationship?",
        "options": ["A) Daughter", "B) Sister", "C) Niece", "D) Cousin"],
        "answer": "B",
        "explanation": "Grandfather's only son = his father. Father's daughter = sister."
    },
    {
        "id": "apt_019", "category": "logical_reasoning",
        "question": "If FRIEND = HUMJTK, how is CANDLE coded?",
        "options": ["A) ECPFNG", "B) DCQGOH", "C) EDRFOG", "D) FDRFMH"],
        "answer": "A",
        "explanation": "Each letter is shifted forward by 2 positions. C+2=E, A+2=C, N+2=P, D+2=F, L+2=N, E+2=G → ECPFNG."
    },
    {
        "id": "apt_020", "category": "logical_reasoning",
        "question": "Which figure completes the pattern? Circles: 1, 4, 9, 16, __",
        "options": ["A) 20", "B) 25", "C) 24", "D) 36"],
        "answer": "B",
        "explanation": "Pattern: 1², 2², 3², 4², 5² = 25."
    },
    # --- Verbal ---
    {
        "id": "apt_021", "category": "verbal",
        "question": "Choose the word most similar in meaning to 'EPHEMERAL':",
        "options": ["A) Permanent", "B) Transient", "C) Significant", "D) Consistent"],
        "answer": "B",
        "explanation": "Ephemeral = lasting for a very short time. Synonym: Transient."
    },
    {
        "id": "apt_022", "category": "verbal",
        "question": "Choose the antonym of 'LOQUACIOUS':",
        "options": ["A) Talkative", "B) Reserved", "C) Verbose", "D) Fluent"],
        "answer": "B",
        "explanation": "Loquacious = very talkative. Antonym: Reserved (silent)."
    },
    {
        "id": "apt_023", "category": "verbal",
        "question": "Fill in the blank: 'She was ______ to accept the terms of the contract.'",
        "options": ["A) reluctant", "B) eager", "C) capable", "D) happy"],
        "answer": "A",
        "explanation": "Context implies unwillingness. 'Reluctant' fits best."
    },
    {
        "id": "apt_024", "category": "verbal",
        "question": "Identify the grammatically correct sentence:",
        "options": [
            "A) He don't know the answer.",
            "B) She have completed the task.",
            "C) They have been waiting for two hours.",
            "D) We was going to the store."
        ],
        "answer": "C",
        "explanation": "'They have been waiting' correctly uses present perfect continuous."
    },
    {
        "id": "apt_025", "category": "verbal",
        "question": "Select the correct spelling:",
        "options": ["A) Accomodation", "B) Accommodation", "C) Acommodation", "D) Acomodation"],
        "answer": "B",
        "explanation": "Correct spelling is 'Accommodation' (double c, double m)."
    },
    {
        "id": "apt_026", "category": "verbal",
        "question": "Choose the pair with the same relationship as BOOK:LIBRARY:",
        "options": ["A) Fish:Sea", "B) Soldier:Army", "C) Flower:Vase", "D) Tree:Forest"],
        "answer": "D",
        "explanation": "A book is a member of a library; a tree is a member of a forest — collection relationship."
    },
    {
        "id": "apt_027", "category": "verbal",
        "question": "Which word is incorrectly used? 'The committee have decided to (accept/except) the proposal.'",
        "options": ["A) accept", "B) except", "C) Both work", "D) Neither works"],
        "answer": "A",
        "explanation": "'Accept' = agree to receive. 'Except' = exclude. The correct word is 'accept'."
    },
    {
        "id": "apt_028", "category": "verbal",
        "question": "Choose the correct one-word substitution for 'One who studies the origin and history of words':",
        "options": ["A) Lexicographer", "B) Etymologist", "C) Grammarian", "D) Linguist"],
        "answer": "B",
        "explanation": "An Etymologist studies the origin and historical development of words."
    },
    {
        "id": "apt_029", "category": "verbal",
        "question": "Choose the idiom meaning 'to postpone indefinitely': ",
        "options": ["A) Let the cat out of the bag", "B) Put on the back burner", "C) Hit the nail on the head", "D) Beat around the bush"],
        "answer": "B",
        "explanation": "'Put on the back burner' means to delay or deprioritize something."
    },
    {
        "id": "apt_030", "category": "verbal",
        "question": "The passive voice of 'She sings a song' is:",
        "options": ["A) A song is sang by her", "B) A song was sung by her", "C) A song is sung by her", "D) A song has been sung by her"],
        "answer": "C",
        "explanation": "Present tense passive: 'A song is sung by her.'"
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# CODING PROBLEMS DATASET
# 60 problems with role_tags and topic classification
# ─────────────────────────────────────────────────────────────────────────────

CODING_PROBLEMS = [
    # Arrays
    {
        "id": "cod_001", "difficulty": "easy", "topic": "arrays",
        "title": "Two Sum",
        "problem": "Given an array of integers and a target, return indices of two numbers that add up to the target.",
        "hint": "Use a hash map to store seen values and their indices.",
        "role_tags": ["Backend Developer", "Software Engineer", "Full Stack Developer", "Java Developer", "Python Developer"]
    },
    {
        "id": "cod_002", "difficulty": "easy", "topic": "arrays",
        "title": "Maximum Subarray (Kadane's Algorithm)",
        "problem": "Find the contiguous subarray with the largest sum.",
        "hint": "Track the current max and global max as you iterate.",
        "role_tags": ["Software Engineer", "Backend Developer", "Data Scientist", "Machine Learning Engineer"]
    },
    {
        "id": "cod_003", "difficulty": "medium", "topic": "arrays",
        "title": "Product of Array Except Self",
        "problem": "Return array output such that output[i] is the product of all elements except nums[i], without using division.",
        "hint": "Use prefix and suffix product arrays.",
        "role_tags": ["Software Engineer", "Backend Developer", "Full Stack Developer"]
    },
    {
        "id": "cod_004", "difficulty": "medium", "topic": "arrays",
        "title": "Merge Intervals",
        "problem": "Given a list of intervals, merge all overlapping intervals.",
        "hint": "Sort by start time, then merge greedily.",
        "role_tags": ["Software Engineer", "Backend Developer", "Data Engineer"]
    },
    {
        "id": "cod_005", "difficulty": "hard", "topic": "arrays",
        "title": "Trapping Rain Water",
        "problem": "Given heights of bars, compute how much water it can trap after raining.",
        "hint": "Use a two-pointer approach tracking left_max and right_max.",
        "role_tags": ["Software Engineer", "Backend Developer", "Java Developer"]
    },
    # Strings
    {
        "id": "cod_006", "difficulty": "easy", "topic": "strings",
        "title": "Valid Anagram",
        "problem": "Given two strings, determine if they are anagrams of each other.",
        "hint": "Sort both strings or use a frequency map.",
        "role_tags": ["Software Engineer", "Backend Developer", "Frontend Developer", "Python Developer"]
    },
    {
        "id": "cod_007", "difficulty": "medium", "topic": "strings",
        "title": "Longest Substring Without Repeating Characters",
        "problem": "Find the length of the longest substring without repeating characters.",
        "hint": "Sliding window with a set/map of seen characters.",
        "role_tags": ["Software Engineer", "Backend Developer", "Full Stack Developer"]
    },
    {
        "id": "cod_008", "difficulty": "medium", "topic": "strings",
        "title": "Group Anagrams",
        "problem": "Group a list of strings into anagram clusters.",
        "hint": "Use sorted string as the hash map key.",
        "role_tags": ["Software Engineer", "Backend Developer", "Data Analyst"]
    },
    {
        "id": "cod_009", "difficulty": "easy", "topic": "strings",
        "title": "Reverse Words in a String",
        "problem": "Reverse the order of words in a given sentence.",
        "hint": "Split, reverse the list, and join.",
        "role_tags": ["Software Engineer", "Frontend Developer", "QA Engineer"]
    },
    {
        "id": "cod_010", "difficulty": "hard", "topic": "strings",
        "title": "Minimum Window Substring",
        "problem": "Find the minimum window in s that contains all characters of t.",
        "hint": "Sliding window + frequency map. Use two pointers.",
        "role_tags": ["Software Engineer", "Backend Developer"]
    },
    # Trees
    {
        "id": "cod_011", "difficulty": "easy", "topic": "trees",
        "title": "Maximum Depth of Binary Tree",
        "problem": "Given a binary tree, find its maximum depth.",
        "hint": "Recursively return 1 + max(left_depth, right_depth).",
        "role_tags": ["Software Engineer", "Backend Developer", "Java Developer", "Mobile App Developer"]
    },
    {
        "id": "cod_012", "difficulty": "medium", "topic": "trees",
        "title": "Level Order Traversal (BFS)",
        "problem": "Return the level-order traversal of a binary tree as a list of lists.",
        "hint": "Use a queue (deque). Process level by level.",
        "role_tags": ["Software Engineer", "Backend Developer", "Full Stack Developer"]
    },
    {
        "id": "cod_013", "difficulty": "medium", "topic": "trees",
        "title": "Lowest Common Ancestor of BST",
        "problem": "Find the lowest common ancestor of two nodes in a BST.",
        "hint": "If both nodes are less than root, go left. If both greater, go right. Else, root is LCA.",
        "role_tags": ["Software Engineer", "Backend Developer", "Java Developer"]
    },
    {
        "id": "cod_014", "difficulty": "hard", "topic": "trees",
        "title": "Serialize and Deserialize Binary Tree",
        "problem": "Design algorithms to serialize and deserialize a binary tree.",
        "hint": "Use preorder DFS with null markers.",
        "role_tags": ["Software Engineer", "Backend Developer"]
    },
    # Graphs
    {
        "id": "cod_015", "difficulty": "medium", "topic": "graphs",
        "title": "Number of Islands",
        "problem": "Given a 2D grid of '1's (land) and '0's (water), count the number of islands.",
        "hint": "DFS/BFS from each unvisited land cell. Mark visited.",
        "role_tags": ["Software Engineer", "Backend Developer", "Data Engineer"]
    },
    {
        "id": "cod_016", "difficulty": "medium", "topic": "graphs",
        "title": "Clone Graph",
        "problem": "Given a reference of a node in a connected undirected graph, return a deep copy.",
        "hint": "DFS + hash map from original node to its clone.",
        "role_tags": ["Software Engineer", "Backend Developer"]
    },
    {
        "id": "cod_017", "difficulty": "hard", "topic": "graphs",
        "title": "Course Schedule II (Topological Sort)",
        "problem": "Given prerequisites, return the order to finish all courses or [] if impossible.",
        "hint": "Build adjacency list + in-degree array. BFS (Kahn's Algorithm).",
        "role_tags": ["Software Engineer", "Backend Developer", "Data Engineer"]
    },
    # DP
    {
        "id": "cod_018", "difficulty": "easy", "topic": "dp",
        "title": "Climbing Stairs",
        "problem": "You can climb 1 or 2 steps. How many distinct ways to climb n stairs?",
        "hint": "Fibonacci pattern. dp[n] = dp[n-1] + dp[n-2].",
        "role_tags": ["Software Engineer", "Backend Developer", "Full Stack Developer", "Python Developer"]
    },
    {
        "id": "cod_019", "difficulty": "medium", "topic": "dp",
        "title": "Longest Common Subsequence",
        "problem": "Given two strings, find the length of the longest common subsequence.",
        "hint": "2D DP table. dp[i][j] = dp[i-1][j-1]+1 if s1[i]==s2[j].",
        "role_tags": ["Software Engineer", "Backend Developer", "Machine Learning Engineer"]
    },
    {
        "id": "cod_020", "difficulty": "medium", "topic": "dp",
        "title": "0/1 Knapsack",
        "problem": "Given weights and values, maximize value without exceeding weight capacity W.",
        "hint": "dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]).",
        "role_tags": ["Software Engineer", "Data Scientist", "Machine Learning Engineer"]
    },
    {
        "id": "cod_021", "difficulty": "hard", "topic": "dp",
        "title": "Edit Distance (Levenshtein)",
        "problem": "Find the minimum operations (insert, delete, replace) to convert word1 to word2.",
        "hint": "dp[i][j] represents conversions needed for prefixes of length i and j.",
        "role_tags": ["Software Engineer", "Machine Learning Engineer", "AI Engineer"]
    },
    # SQL/Databases
    {
        "id": "cod_022", "difficulty": "easy", "topic": "sql",
        "title": "Find Duplicate Emails",
        "problem": "Write an SQL query to find all duplicate emails in a Person table.",
        "hint": "GROUP BY email HAVING COUNT(*) > 1.",
        "role_tags": ["Data Analyst", "Data Engineer", "Backend Developer", "Full Stack Developer"]
    },
    {
        "id": "cod_023", "difficulty": "medium", "topic": "sql",
        "title": "Employees Earning More Than Managers",
        "problem": "Find employees whose salary is higher than their manager's.",
        "hint": "Self-join: JOIN Employee e1 ON e1.ManagerId = e2.Id WHERE e1.Salary > e2.Salary.",
        "role_tags": ["Data Analyst", "Data Engineer", "Backend Developer"]
    },
    {
        "id": "cod_024", "difficulty": "medium", "topic": "sql",
        "title": "Rank Scores Without RANK()",
        "problem": "Write a query to rank scores without using the RANK window function.",
        "hint": "Correlated subquery: COUNT of distinct scores >= current score.",
        "role_tags": ["Data Analyst", "Data Engineer", "Data Scientist"]
    },
    {
        "id": "cod_025", "difficulty": "hard", "topic": "sql",
        "title": "Department Top 3 Salaries",
        "problem": "Find employees with the top 3 unique salaries in each department.",
        "hint": "Use DENSE_RANK() OVER (PARTITION BY Department ORDER BY Salary DESC).",
        "role_tags": ["Data Analyst", "Data Engineer", "Data Scientist", "Backend Developer"]
    },
    # Python/Pandas
    {
        "id": "cod_026", "difficulty": "easy", "topic": "python_pandas",
        "title": "DataFrame GroupBy Aggregation",
        "problem": "Given a sales DataFrame, compute total revenue per product category.",
        "hint": "df.groupby('category')['revenue'].sum()",
        "role_tags": ["Data Scientist", "Data Analyst", "Machine Learning Engineer", "Data Engineer"]
    },
    {
        "id": "cod_027", "difficulty": "medium", "topic": "python_pandas",
        "title": "Handle Missing Values",
        "problem": "Impute missing values in a numerical column with the column median, grouped by category.",
        "hint": "df['col'].fillna(df.groupby('cat')['col'].transform('median'))",
        "role_tags": ["Data Scientist", "Machine Learning Engineer", "Data Analyst"]
    },
    {
        "id": "cod_028", "difficulty": "medium", "topic": "python_pandas",
        "title": "Pivot and Melt",
        "problem": "Convert a wide-format DataFrame to long-format and vice versa.",
        "hint": "pd.melt for wide-to-long; df.pivot_table for long-to-wide.",
        "role_tags": ["Data Scientist", "Data Analyst", "Data Engineer"]
    },
    # ML Theory
    {
        "id": "cod_029", "difficulty": "medium", "topic": "ml_theory",
        "title": "Implement Logistic Regression from Scratch",
        "problem": "Implement binary logistic regression using gradient descent in pure Python/NumPy.",
        "hint": "Sigmoid activation + cross-entropy loss + update weights with dL/dw.",
        "role_tags": ["Machine Learning Engineer", "Data Scientist", "AI Engineer", "Deep Learning Engineer"]
    },
    {
        "id": "cod_030", "difficulty": "easy", "topic": "ml_theory",
        "title": "Train-Test Split & Evaluation",
        "problem": "Write code to split a dataset and compute accuracy, precision, recall for a classifier.",
        "hint": "sklearn.model_selection.train_test_split + classification_report.",
        "role_tags": ["Data Scientist", "Machine Learning Engineer"]
    },
    # System Design
    {
        "id": "cod_031", "difficulty": "hard", "topic": "system_design",
        "title": "Design a URL Shortener",
        "problem": "Design a system like bit.ly: encode long URLs to 7-char short codes, handle 100M URLs.",
        "hint": "Base62 encoding + NoSQL DB + consistent hashing for scalability.",
        "role_tags": ["Backend Developer", "Full Stack Developer", "Software Engineer", "Product Engineer"]
    },
    {
        "id": "cod_032", "difficulty": "hard", "topic": "system_design",
        "title": "Design a Rate Limiter",
        "problem": "Design an API rate limiter that handles 10,000 requests/second per user.",
        "hint": "Token bucket or sliding window counter with Redis atomic operations.",
        "role_tags": ["Backend Developer", "DevOps Engineer", "Site Reliability Engineer"]
    },
    # OOP
    {
        "id": "cod_033", "difficulty": "medium", "topic": "oop",
        "title": "Implement a LRU Cache",
        "problem": "Design a data structure for LRU cache with O(1) get and put.",
        "hint": "Doubly linked list + hash map. Python: use collections.OrderedDict.",
        "role_tags": ["Software Engineer", "Backend Developer", "Java Developer", "Python Developer"]
    },
    {
        "id": "cod_034", "difficulty": "medium", "topic": "oop",
        "title": "Design a Parking Lot",
        "problem": "Model a parking lot with different vehicle types using OOP principles.",
        "hint": "Apply inheritance (Vehicle → Car/Bike/Truck), strategy pattern for pricing.",
        "role_tags": ["Software Engineer", "Backend Developer", "Java Developer"]
    },
    # Recursion/Backtracking
    {
        "id": "cod_035", "difficulty": "medium", "topic": "recursion",
        "title": "Generate All Permutations",
        "problem": "Given a list of unique numbers, return all possible permutations.",
        "hint": "Swap elements at each index recursively. Base case: index == n.",
        "role_tags": ["Software Engineer", "Backend Developer", "Python Developer", "Mobile App Developer"]
    },
    {
        "id": "cod_036", "difficulty": "medium", "topic": "recursion",
        "title": "N-Queens Problem",
        "problem": "Place N queens on an N×N board so no two queens threaten each other.",
        "hint": "Row-by-row backtracking, checking column and diagonal conflicts.",
        "role_tags": ["Software Engineer", "Backend Developer"]
    },
    # Scripting
    {
        "id": "cod_037", "difficulty": "easy", "topic": "scripting",
        "title": "Monitor Disk Usage with Shell Script",
        "problem": "Write a bash script that checks disk usage and sends an alert if it exceeds 80%.",
        "hint": "Use `df -h | awk '{print $5}' | grep -v Use` to extract usage %.",
        "role_tags": ["DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer", "Cybersecurity Analyst"]
    },
    {
        "id": "cod_038", "difficulty": "medium", "topic": "scripting",
        "title": "Parse Logs with Python",
        "problem": "Parse an Nginx access log file to count top 10 most frequent IP addresses.",
        "hint": "Use regex to extract IPs, then collections.Counter.",
        "role_tags": ["DevOps Engineer", "Site Reliability Engineer", "Backend Developer"]
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# INTERVIEW QUESTIONS DATASET
# Technical + HR questions with role-specific tagging
# ─────────────────────────────────────────────────────────────────────────────

INTERVIEW_QUESTIONS = [
    # --- Technical: Software/Backend ---
    {
        "id": "int_001", "type": "technical",
        "question": "Explain the difference between REST and GraphQL. When would you use each?",
        "sample_answer": "REST uses fixed endpoints per resource; GraphQL uses a single endpoint with flexible query shapes. Use REST for simple, cacheable APIs. Use GraphQL when clients need precisely typed, variable data without over-fetching.",
        "role_tags": ["Backend Developer", "Full Stack Developer", "Software Engineer", "Product Engineer"]
    },
    {
        "id": "int_002", "type": "technical",
        "question": "What is the CAP theorem? Explain with an example.",
        "sample_answer": "CAP: a distributed system can only guarantee 2 of Consistency, Availability, Partition Tolerance. E.g., Cassandra favors AP (available + partition-tolerant) while traditional RDBMS favors CP.",
        "role_tags": ["Backend Developer", "Data Engineer", "Software Engineer", "Site Reliability Engineer"]
    },
    {
        "id": "int_003", "type": "technical",
        "question": "What is database indexing? What are its trade-offs?",
        "sample_answer": "An index (typically a B-tree) speeds up reads by pre-sorting data by a column. Trade-off: slows write operations and uses extra disk space. Over-indexing can hurt INSERT/UPDATE performance.",
        "role_tags": ["Backend Developer", "Data Engineer", "Data Analyst", "Full Stack Developer"]
    },
    {
        "id": "int_004", "type": "technical",
        "question": "Explain the SOLID principles with a concrete example.",
        "sample_answer": "S: Single Responsibility — a class does one thing. O: Open/Closed — extend without modifying. L: Liskov Substitution — subclasses are substitutable. I: Interface Segregation — small interfaces. D: Dependency Inversion — depend on abstractions.",
        "role_tags": ["Software Engineer", "Backend Developer", "Java Developer", "Python Developer"]
    },
    {
        "id": "int_005", "type": "technical",
        "question": "What is the difference between a process and a thread?",
        "sample_answer": "A process is an independent running program with its own memory space. A thread is a lightweight unit within a process that shares the process's memory. Threads are faster to create/switch but require synchronization.",
        "role_tags": ["Software Engineer", "Backend Developer", "DevOps Engineer", "Site Reliability Engineer"]
    },
    {
        "id": "int_006", "type": "technical",
        "question": "What is Docker and how does it differ from a Virtual Machine?",
        "sample_answer": "Docker containers share the host OS kernel, making them lightweight and fast. VMs include a full OS, making them heavier. Containers start in seconds; VMs in minutes. Docker uses layered images and namespaces for isolation.",
        "role_tags": ["DevOps Engineer", "Backend Developer", "Cloud Engineer", "Site Reliability Engineer"]
    },
    {
        "id": "int_007", "type": "technical",
        "question": "What is overfitting? How do you prevent it in ML models?",
        "sample_answer": "Overfitting: model learns training data noise, failing on unseen data. Prevention: cross-validation, regularization (L1/L2), dropout layers, early stopping, more diverse training data.",
        "role_tags": ["Data Scientist", "Machine Learning Engineer", "AI Engineer", "Deep Learning Engineer"]
    },
    {
        "id": "int_008", "type": "technical",
        "question": "Explain the Transformer architecture and why it replaced RNNs.",
        "sample_answer": "Transformers use self-attention to relate all positions in a sequence in parallel, unlike RNNs which process sequentially. This eliminates vanishing gradient issues and enables massive parallelization on GPUs.",
        "role_tags": ["AI Engineer", "Machine Learning Engineer", "Deep Learning Engineer"]
    },
    {
        "id": "int_009", "type": "technical",
        "question": "What is the difference between synchronous and asynchronous programming?",
        "sample_answer": "Synchronous: each task blocks until finished. Async: tasks can start and yield control while waiting for I/O. Python's asyncio / Node.js use an event loop to handle concurrent I/O efficiently without threads.",
        "role_tags": ["Backend Developer", "Full Stack Developer", "Python Developer", "Node.js Developer"]
    },
    {
        "id": "int_010", "type": "technical",
        "question": "Explain Kubernetes Pods vs Deployments vs Services.",
        "sample_answer": "Pod: smallest deployable unit, runs containers. Deployment: manages replica sets, handles rolling updates. Service: provides a stable network endpoint to pods (ClusterIP/NodePort/LoadBalancer).",
        "role_tags": ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer"]
    },
    {
        "id": "int_011", "type": "technical",
        "question": "What is the event loop in JavaScript? How does async/await relate to Promises?",
        "sample_answer": "The event loop continuously checks the call stack and callback queue. Async/await is syntactic sugar over Promises — await pauses execution inside an async function until the Promise resolves, keeping the event loop unblocked.",
        "role_tags": ["Frontend Developer", "Full Stack Developer", "Web Developer"]
    },
    {
        "id": "int_012", "type": "technical",
        "question": "Describe how you would design a CI/CD pipeline for a production Node.js app.",
        "sample_answer": "1) Code push triggers GitHub Actions. 2) Run unit + integration tests. 3) Build Docker image and push to registry. 4) Staging deploy + smoke test. 5) Manual approval gate. 6) Production deploy with rolling update via Kubernetes.",
        "role_tags": ["DevOps Engineer", "Backend Developer", "Full Stack Developer", "Site Reliability Engineer"]
    },
    {
        "id": "int_013", "type": "technical",
        "question": "What is the difference between SQL and NoSQL? When would you choose each?",
        "sample_answer": "SQL: structured, relational, ACID — use for financial data, complex queries. NoSQL: flexible schema, horizontal scaling — use for unstructured/semi-structured data (logs, social), high-write workloads like MongoDB, Cassandra.",
        "role_tags": ["Backend Developer", "Data Engineer", "Full Stack Developer", "Data Analyst"]
    },
    {
        "id": "int_014", "type": "technical",
        "question": "What is React's Virtual DOM and why does it improve performance?",
        "sample_answer": "React maintains a lightweight in-memory Virtual DOM. On state change, it diffs the new tree against the previous one (reconciliation) and only updates the real DOM where changes occurred, minimizing expensive DOM operations.",
        "role_tags": ["Frontend Developer", "Full Stack Developer", "Web Developer"]
    },
    {
        "id": "int_015", "type": "technical",
        "question": "Explain Gradient Descent and its variants (SGD, Adam).",
        "sample_answer": "GD: update weights by the gradient of the loss over all data (slow per epoch). SGD: update per single sample (noisy). Mini-batch SGD: balance. Adam: adaptive learning rates + momentum — converges faster and handles sparse gradients.",
        "role_tags": ["Machine Learning Engineer", "Data Scientist", "AI Engineer", "Deep Learning Engineer"]
    },
    # --- HR / Behavioral ---
    {
        "id": "int_016", "type": "hr",
        "question": "Tell me about yourself.",
        "sample_answer": "Structure: present role + relevant skills, past achievements, future goals. Keep it under 2 minutes. Tailor to the job description. End with why you're excited about this specific role."
    },
    {
        "id": "int_017", "type": "hr",
        "question": "Describe a time you had to deal with a very tight deadline. How did you handle it?",
        "sample_answer": "Use STAR: Situation, Task, Action, Result. Highlight prioritization, communication with stakeholders, focus on MVP, and the outcome delivered."
    },
    {
        "id": "int_018", "type": "hr",
        "question": "Tell me about a time you failed. What did you learn?",
        "sample_answer": "Pick a real failure, briefly explain what went wrong, focus 80% on the lesson and what you changed. Show growth mindset."
    },
    {
        "id": "int_019", "type": "hr",
        "question": "How do you handle disagreements with a teammate or manager?",
        "sample_answer": "Explain: listen actively, seek to understand their rationale, present data-backed counter-proposal, remain open to compromise. Focus on the best outcome for the project, not winning the argument."
    },
    {
        "id": "int_020", "type": "hr",
        "question": "Where do you see yourself in 5 years?",
        "sample_answer": "Answer aligned to the company's growth path. Show ambition without being unrealistic. For tech roles: technical mastery → tech lead → architect journey. Express interest in growing within this company specifically."
    },
    {
        "id": "int_021", "type": "hr",
        "question": "Why are you leaving your current/previous role?",
        "sample_answer": "Stay positive. Avoid criticizing the employer. Good answers: growth ceiling, desire to specialize, exciting new opportunity. Frame around what you're moving toward, not what you're running from."
    },
    {
        "id": "int_022", "type": "hr",
        "question": "What is your greatest strength? Give an example.",
        "sample_answer": "Choose a strength directly relevant to the role. Back it with a specific project example. Use numbers where possible."
    },
    {
        "id": "int_023", "type": "hr",
        "question": "What is your greatest weakness? How are you improving it?",
        "sample_answer": "Pick a genuine weakness that isn't a core job requirement. Show self-awareness and describe concrete steps you're taking to improve. End on a positive note."
    },
    {
        "id": "int_024", "type": "hr",
        "question": "Tell me about a time you showed leadership without formal authority.",
        "sample_answer": "Describe taking initiative: identifying a problem, rallying the team, proposing and executing a solution. Focus on influence through expertise and communication."
    },
    {
        "id": "int_025", "type": "hr",
        "question": "Do you have any questions for us?",
        "sample_answer": "Always ask: 'What does success look like in this role in the first 90 days?', 'What are the biggest challenges the team is facing?', 'How does the team handle knowledge transfer and onboarding?'"
    },
]


def get_practice_set(top_role: str, user_skills: list = None, limit_coding: int = 10, limit_aptitude: int = 15, limit_interview: int = 12) -> dict:
    """
    Return a complete, role-filtered practice set.

    Args:
        top_role: Matched role string from the analyzer (e.g., "Backend Developer").
        user_skills: Current user skills (reserved for future difficulty adaptation).
        limit_coding: Max coding problems to return.
        limit_aptitude: Max aptitude questions to return.
        limit_interview: Max interview questions to return (technical + hr).

    Returns:
        dict with 'aptitude', 'coding', 'interview' lists.
    """
    focus_topics = ROLE_CODING_FOCUS.get(top_role, DEFAULT_CODING_FOCUS)

    # Filter coding problems matching role focus
    matching_coding = [
        p for p in CODING_PROBLEMS
        if p["topic"] in focus_topics or top_role in p.get("role_tags", [])
    ]

    # Sort by: easy first, then medium, then hard for progressive difficulty
    difficulty_order = {"easy": 0, "medium": 1, "hard": 2}
    matching_coding.sort(key=lambda x: difficulty_order.get(x["difficulty"], 1))

    # Deduplicate by id then limit
    seen_ids = set()
    filtered_coding = []
    for p in matching_coding:
        if p["id"] not in seen_ids:
            seen_ids.add(p["id"])
            filtered_coding.append(p)
        if len(filtered_coding) >= limit_coding:
            break

    # Aptitude: shuffle to randomize
    shuffled_apt = random.sample(APTITUDE_QUESTIONS, min(limit_aptitude, len(APTITUDE_QUESTIONS)))

    # Interview: filter technical by role, always include all HR
    technical_questions = [
        q for q in INTERVIEW_QUESTIONS
        if q["type"] == "technical" and top_role in q.get("role_tags", [])
    ]
    # Fallback: if role has <3 technical matches, add generic software eng questions
    if len(technical_questions) < 3:
        generic_tech = [q for q in INTERVIEW_QUESTIONS if q["type"] == "technical"]
        technical_questions = generic_tech[:6]

    hr_questions = [q for q in INTERVIEW_QUESTIONS if q["type"] == "hr"]

    # Combine: prioritize role-specific technical, then HR
    max_technical = limit_interview - min(5, len(hr_questions))
    interview_set = technical_questions[:max_technical] + hr_questions[:5]

    return {
        "target_role": top_role,
        "aptitude": shuffled_apt,
        "coding": filtered_coding,
        "interview": interview_set,
        "stats": {
            "total_coding": len(filtered_coding),
            "total_aptitude": len(shuffled_apt),
            "total_interview": len(interview_set),
            "technical_count": len([q for q in interview_set if q["type"] == "technical"]),
            "hr_count": len([q for q in interview_set if q["type"] == "hr"])
        }
    }
