// ============================================================
// UNISA 2026 - Complete Module Data
// Student: MUTSHIDZI MADZIVHANDILA
// ============================================================

const MODULE_DATA = [

  // ──────────────────────────────────────────────────────────
  // FYE1500 — First Year Experience (Semester 1)
  // ──────────────────────────────────────────────────────────
  {
    code: 'FYE1500',
    title: 'Fundamental Skills for Student Success',
    period: 'Semester 1 — 2026',
    lecturer: 'Naseehat Ebrahim Dawood',
    email: null,
    tel: null,
    color: 0,
    description: `FYE1500 is a foundational, non-credit, self-development course run by UNISA's Student Retention Unit (SRU). It is specifically designed for first-year students and functions as a comprehensive orientation and onboarding programme. The course takes roughly 3 to 6 hours to complete in total and requires no prescribed textbook — all content is built directly into the myUnisa platform.

The course is structured into themed "sessions", each covering a specific set of skills that are critical for surviving and thriving as a UNISA distance-education student. The nine major themes are: (1) Cybersecurity — understanding online threats, how to protect your personal data and accounts, recognising phishing attacks and social engineering; (2) Getting to know your Learning Management System (LMS) — a hands-on orientation to myUnisa, how to navigate your module sites, submit assessments, check grades, and use discussion forums; (3) Understanding UNISA Library Services — how to access the extensive e-library, search databases such as EbscoHost and JSTOR, request printed books, use reference management tools, and cite sources correctly; (4) Understanding Student Affairs Services — financial aid, counselling, disability services, and other support structures UNISA provides; (5) Basic Academic Literacy — reading academic texts critically, understanding assignment briefs, paraphrasing, referencing, and avoiding plagiarism; (6) Basic Numeracy — foundational mathematical skills that support quantitative work across all disciplines; (7) Basic Digital Literacy — file management, word processing, using cloud storage, and navigating the internet safely; (8) Basic Study Skills — time management, creating study schedules, active reading strategies, note-taking, and preparing for examinations; and (9) mySupport Hub — UNISA's centralised support portal for logging queries, tracking tickets, and accessing help quickly.

There are NO assessments and NO examinations for FYE1500. Completion is voluntary but strongly encouraged. A study conducted the previous year found that 99% of students who completed FYE1500 reported it benefitted their broader studies.

Important Note: FYE1500 is entirely separate from the Academic Integrity Course (AIC), which is hosted on a different platform. As a first-time entering student you are required to complete BOTH courses.`,
    learningUnits: [
      { title: 'Orientation', description: 'Introduction to the FYE1500 course structure, goals, and how to navigate through the sessions. Explains what UNISA expects from distance-learning students and how to get the most out of this course.' },
      { title: 'Cybersecurity 101', description: '6 pages covering the fundamentals of cybersecurity in a student context. Topics include: types of cyber threats (malware, ransomware, phishing, identity theft), creating strong passwords, two-factor authentication, safe use of public Wi-Fi, recognising suspicious emails and links, protecting personal and financial information online, and what to do if your account is compromised.' },
      { title: 'Getting to Know Your LMS (myUnisa)', description: '3 pages + 1 folder covering myUnisa as your primary academic portal. Walks you through: logging in and navigating your dashboard, finding and accessing your module sites, reading announcements, downloading study material, submitting assignments, checking your submission status, using the calendar to track due dates, accessing your grades, and communicating with lecturers and e-tutors through the platform.' },
      { title: 'Understanding UNISA Library Services', description: 'Orientation to the UNISA digital and physical library ecosystem. Covers: registering for library access, using the online catalogue, accessing full-text databases (EbscoHost, ScienceDirect, JSTOR, etc.), borrowing physical books via post, using the Unisa Library App, citation styles (APA, Harvard), reference management software (Mendeley, Zotero), and understanding copyright and plagiarism in an academic context.' },
      { title: 'Understanding Student Affairs Services', description: 'Overview of the support structures available to UNISA students beyond academics. Includes: NSFAS and bursary guidance, psychological counselling and trauma support, the disability unit and accommodations, career services, Student Representative Council (SRC), and how to escalate administrative issues.' },
      { title: 'Basic Academic Literacy', description: 'Covers the reading and writing skills needed to succeed in university-level work: understanding assignment questions, close reading of academic texts, constructing arguments, paragraph structure, referencing in-text and in reference lists, paraphrasing vs. quoting, what constitutes plagiarism at UNISA, and how TurnItIn works.' },
      { title: 'Basic Numeracy', description: 'Foundational quantitative skills relevant to student life and across disciplines: working with percentages (e.g. calculating your year mark), ratios, basic statistics, reading graphs and tables, and interpreting numerical data in everyday contexts.' },
      { title: 'Basic Digital Literacy', description: 'Practical digital skills: organising files and folders, using Microsoft Office tools (Word, Excel, PowerPoint), cloud storage (OneDrive, Google Drive), emailing professionally, downloading and installing software, and using a browser effectively for academic research.' },
      { title: 'Basic Study Skills', description: 'Strategies and techniques for effective distance learning: creating a weekly study timetable, setting SMART goals, active reading and annotation, Cornell note-taking method, spaced repetition, managing exam anxiety, and balancing work/family/studies as a UNISA student.' },
      { title: 'mySupport Hub', description: 'A guided tour of UNISA\'s centralised support portal: how to log a query, track a support ticket, find self-help articles, access frequently asked questions, and escalate unresolved issues. This is the primary channel for all administrative problems at UNISA.' },
    ],
    assessments: [
      // No formal assessments — completion-based
    ],
    tasks: [
      { title: 'Complete FYE1500 course', type: 'Task', due: '2026-03-02', note: 'Extended deadline. No assessment — just complete all sessions.' },
      { title: 'Complete Academic Integrity Course (AIC)', type: 'Task', due: null, note: 'Separate platform from FYE1500. Compulsory for all first-time entering students.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // APM1513 — Applied Linear Algebra
  // ──────────────────────────────────────────────────────────
  {
    code: 'APM1513',
    title: 'Applied Linear Algebra',
    period: 'Year — 2026',
    lecturer: 'Dr Y Sithole',
    email: 'sithoy@unisa.ac.za',
    tel: '011 670 9147',
    consultation: 'Thursdays 10:00–11:59 (email for appointment first)',
    color: 1,
    description: `APM1513 Applied Linear Algebra is a first-level applied mathematics module that serves as the gateway into computational and numerical methods at UNISA. It is the first module in which you actively use a computer to solve mathematical problems, distinguishing it from the purely theoretical algebra you may have encountered before.

The module's purpose is to enable students to master and apply numerical and algebraic techniques across five major topic areas: the method of least squares (used to fit models to data), linear programming via the Simplex method (used to optimise real-world decisions under constraints), eigenvalues and eigenvectors (foundational to data science, engineering, and physics), matrix diagonalization, and a selection of miscellaneous applied problems.

APM1513 sits at the centre of a cluster of related modules in the UNISA Applied Mathematics pathway. It connects directly to COS2633 (Numerical Methods I) and APM3711 (Numerical Methods II) at levels 2 and 3, both of which build on the numerical computation introduced here. APM2616 (Computer Algebra), also in the same cluster, takes a complementary symbolic approach — while APM1513 is about finding approximate numerical answers, APM2616 is about finding exact symbolic ones using computer algebra systems like MATLAB or Mathematica.

The module uses IRIS (an integrated mathematical software environment) as a practical computing tool — installation instructions are provided on the module site. Students are expected to install and configure IRIS before attempting computational exercises.

Assessment structure: APM1513 has 4 assessments in total. Assessment 1 is an online MCQ quiz (the only quiz-format assessment). Assessments 2, 3, and 4 are written assignment submissions with increasing complexity, each building on the previous topic area. Students who do not submit at least one assignment will not gain exam admission. A minimum year mark of 40% is required for exam admission from 2026.`,
    learningUnits: [
      { title: 'Systems of Linear Equations', description: 'Review of Gaussian elimination, back substitution, reduced row echelon form, and the conditions under which systems have unique, infinite, or no solutions. Introduction to matrix representation of systems. Computational methods for solving large systems that are impractical to solve by hand.' },
      { title: 'The Method of Least Squares', description: 'Understanding overdetermined systems (more equations than unknowns) which arise when fitting models to noisy data. Deriving the normal equations. Applications to linear regression: fitting a straight line, a polynomial, or any linear model to a data set. Geometric interpretation: the least squares solution is the orthogonal projection of the data vector onto the column space of the coefficient matrix. Practical examples from engineering and statistics.' },
      { title: 'Linear Programming and the Simplex Method', description: 'Formulating real-world optimisation problems as linear programmes: defining decision variables, the objective function (to maximise or minimise), and inequality constraints. Graphical solution for two-variable problems. The Simplex algorithm: setting up the initial tableau, identifying pivot columns and rows, performing pivot operations, and reading the optimal solution. Special cases: infeasibility, unboundedness, and degeneracy. Sensitivity analysis and shadow prices.' },
      { title: 'Eigenvalues and Eigenvectors', description: 'Definition of eigenvalues (λ) and eigenvectors (v) via the characteristic equation det(A − λI) = 0. Computing eigenvalues by solving the characteristic polynomial. Finding eigenvectors for each eigenvalue by solving the corresponding homogeneous system. Properties of eigenvalues for symmetric, orthogonal, and triangular matrices. Geometric interpretation of eigenvectors as the directions along which a linear transformation acts as pure scaling.' },
      { title: 'Diagonalization of Matrices', description: 'Conditions for a matrix to be diagonalizable (sufficient independent eigenvectors). Constructing the modal matrix P and the diagonal matrix D such that A = PDP⁻¹. Applications of diagonalization: computing high powers of matrices efficiently (e.g. Aⁿ = PDⁿP⁻¹), solving systems of differential equations, and Markov chains. Spectral decomposition for symmetric matrices.' },
      { title: 'Miscellaneous Applications', description: 'Applied problems that draw on all the module topics simultaneously: population growth models using matrices, Leontief input-output economic models, network flow problems, and data compression concepts. These problems demonstrate the real-world relevance of computational linear algebra across engineering, economics, and computer science.' },
    ],
    assessments: [
      { title: 'Assessment 1 (Quiz — MCQ)', type: 'Quiz', opened: '2026-03-01', due: '2026-05-06', note: 'Online MCQ format. Covers introductory topics. Prepare thoroughly before attempting — the quiz is only available during the open window.' },
      { title: 'Assessment 2 (Written Assignment)', type: 'Assignment', opened: '2026-03-20', due: '2026-06-08', note: 'Written submission. Covers Least Squares and early Linear Programming topics.' },
      { title: 'Assessment 3 (Written Assignment)', type: 'Assignment', opens: '2026-05-01', due: '2026-07-06', note: 'Written submission. Covers Simplex Method and Eigenvalue problems.' },
      { title: 'Assessment 4 (Written Assignment)', type: 'Assignment', opens: '2026-07-01', due: '2026-08-11', note: 'Final written submission. Covers Diagonalization and Applications.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // APM2616 — Computer Algebra
  // ──────────────────────────────────────────────────────────
  {
    code: 'APM2616',
    title: 'Computer Algebra',
    period: 'Year — 2026',
    lecturer: 'Mr M Kgarose',
    email: 'kgarom@unisa.ac.za',
    tel: '011 670 9169',
    color: 2,
    description: `APM2616 Computer Algebra is a second-level applied mathematics module that focuses on the symbolic — as opposed to numerical — solution of mathematical problems using computer algebra systems (CAS). While sister modules like APM1513 and COS2633 concentrate on finding approximate numerical answers, APM2616 teaches you to obtain exact, closed-form symbolic answers using software such as MATLAB's Symbolic Toolbox, Mathematica, Maple, or equivalent systems.

The module sits squarely at the intersection of mathematics and computer science: students must understand the mathematics deeply enough to recognise what a correct symbolic answer looks like, and must also be able to translate mathematical operations into CAS commands and interpret the output.

Topics covered span a wide range of undergraduate mathematics, approached from a computational-algebra perspective: symbolic manipulation of algebraic expressions (expansion, factorisation, simplification), solving equations and systems of equations exactly, symbolic differentiation and integration (including definite integrals and series expansions), linear algebra operations (matrix inversion, determinants, eigenvalue computation) done symbolically, and solving ordinary differential equations using CAS.

The module learning takes place primarily in a Tutorial Site where interactive student-to-student collaboration is encouraged. The main module site serves as the administrative hub — for tutorial letters, the study guide, assessment submissions, and announcements.

Assessment structure: 4 written assignments spread across the year, each with a generous submission window. All four count towards the year mark. A minimum year mark of 40% is required for exam admission from 2026.`,
    learningUnits: [
      { title: 'Introduction to Computer Algebra Systems', description: 'What a CAS is and why symbolic computation matters. Overview of available systems (Mathematica, Maple, MATLAB Symbolic Toolbox, SageMath). Installing and setting up the required software. Basic syntax, the Read-Evaluate-Print loop, defining variables and expressions, and the critical distinction between symbolic and numeric evaluation.' },
      { title: 'Symbolic Algebraic Manipulation', description: 'Using CAS commands to expand, factor, simplify, and collect terms in algebraic expressions. Substitution of values or sub-expressions. Working with polynomials: GCD, LCM, partial fractions. Rational expressions and simplification. Trigonometric and exponential simplification. Understanding when a CAS chooses one form of simplification over another and how to guide it.' },
      { title: 'Solving Equations Symbolically', description: 'Using CAS solve commands for algebraic equations (linear, quadratic, polynomial), systems of equations (exact symbolic solutions), and transcendental equations. Understanding when exact solutions exist vs. when only numerical approximations are possible. Working with parametric solutions. Introduction to Gröbner bases for systems of polynomial equations.' },
      { title: 'Symbolic Calculus: Differentiation', description: 'Computing derivatives symbolically — first, second, and higher-order derivatives of functions involving polynomials, trigonometric, exponential, logarithmic, and composite functions. Implicit differentiation. Partial derivatives and gradients of multivariable functions. Computing Jacobian and Hessian matrices symbolically. Applications: finding critical points and classifying them analytically.' },
      { title: 'Symbolic Calculus: Integration', description: 'Indefinite and definite integration using CAS. Techniques the CAS applies automatically: substitution, integration by parts, partial fractions, trigonometric substitution, and special functions. Computing improper integrals. Double and triple integrals. Line and surface integrals. Taylor and Maclaurin series expansions to arbitrary order. Limits using L\'Hôpital\'s rule.' },
      { title: 'Symbolic Linear Algebra', description: 'Performing all standard linear algebra operations symbolically: matrix multiplication, transposition, inversion, determinants, rank, null space, and column space. Computing exact eigenvalues and eigenvectors (including complex ones). Symbolic matrix decompositions (LU, QR, SVD). Solving linear systems Ax=b exactly over symbolic fields.' },
      { title: 'Symbolic Ordinary Differential Equations', description: 'Using CAS to find exact solutions to ODEs: first-order separable, linear, Bernoulli, and exact equations; second-order linear ODEs with constant coefficients; systems of ODEs. Understanding initial and boundary value problems. Laplace transforms done symbolically. Verification of solutions by back-substitution. Comparison of symbolic and numerical (Runge-Kutta) approaches.' },
    ],
    assessments: [
      { title: 'Assessment 1', type: 'Assignment', opened: '2026-01-01', due: '2026-05-25', note: 'First written assignment. Submit via myUnisa. Covers CAS fundamentals and symbolic manipulation.' },
      { title: 'Assessment 2', type: 'Assignment', opened: '2026-01-01', due: '2026-06-22', note: 'Covers symbolic calculus (differentiation and integration).' },
      { title: 'Assessment 3', type: 'Assignment', opened: '2026-01-01', due: '2026-07-20', note: 'Covers symbolic linear algebra operations.' },
      { title: 'Assessment 4', type: 'Assignment', opened: '2026-01-01', due: '2026-08-17', note: 'Final assignment. Covers symbolic ODEs and integrated applications.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // COS1521 — Computer Systems: Fundamental Concepts
  // ──────────────────────────────────────────────────────────
  {
    code: 'COS1521',
    title: 'Computer Systems: Fundamental Concepts',
    period: 'Year — 2026',
    lecturer: 'Mr LS Nxumalo',
    email: 'nxumls@unisa.ac.za',
    tel: null,
    color: 3,
    description: `COS1521 Computer Systems: Fundamental Concepts is a first-level Computer Science module that provides a broad, foundational understanding of how computers work — from the physics of binary logic all the way up to high-level software engineering. It is a wide-coverage survey module designed to ensure that every student begins their CS degree with the same baseline knowledge of the entire computing stack.

The module is delivered in the fully online model: everything needed to study is available on myUnisa. The prescribed textbook is "Foundations of Computer Science" by Behrouz Forouzan, 5th edition (2023), ISBN 9781473787322. Students are strongly advised to buy the 5th edition specifically, as the 4th edition has significant differences in Chapter 6, includes different page numbers throughout, and is missing newly added chapters. An eBook version is available at a cheaper price via VitalSource.

Assessment structure: COS1521 has 5 assessments. Assessments 1 through 3 and Assessment 5 are online MCQ quizzes. Assessment 4 is unique — it is a Discussion Forum post which requires students to respond to a topic, demonstrating engagement with the content. All 5 assessments together constitute 20% of the final mark (year mark). A minimum year mark of 40% is required for exam admission. Students must submit at least one assignment. The final examination is an online MCQ exam in October/November.

A work schedule is provided in Additional Resources at the start of each year, guiding the pace at which students should study chapters in order to submit assessments on time.`,
    learningUnits: [
      { title: 'Number Systems and Data Representation', description: 'In-depth study of positional number systems: binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16). Conversion algorithms between all bases. Binary arithmetic: addition, subtraction, multiplication, and division. Representing negative numbers: sign-magnitude, one\'s complement, two\'s complement. Fixed-point and floating-point representation (IEEE 754 standard). Integer overflow and underflow. How characters are encoded: ASCII, Unicode (UTF-8, UTF-16, UTF-32).' },
      { title: 'Operations on Data', description: 'Boolean algebra and logic gates: AND, OR, NOT, NAND, NOR, XOR, XNOR. Truth tables. Boolean identities and simplification using De Morgan\'s laws and Karnaugh maps. Combinational circuits: half adder, full adder, multiplexer, demultiplexer, decoder, encoder. Sequential circuits: latches (SR, D), flip-flops (D, JK, T), registers, and counters. How combinational and sequential logic combine to build functional units.' },
      { title: 'Computer Organisation and Architecture', description: 'The Von Neumann architecture: CPU, memory, I/O. The CPU in detail: the arithmetic logic unit (ALU), control unit, registers (program counter, instruction register, memory address register, memory buffer register). The fetch-decode-execute cycle step by step. Memory hierarchy: registers → L1/L2/L3 cache → RAM → secondary storage. Memory addressing modes. Introduction to instruction set architecture (ISA): RISC vs. CISC.' },
      { title: 'Computer Networks and the Internet', description: 'Network topologies: bus, star, ring, mesh, hybrid. Network types: LAN, WAN, MAN, PAN. The layered model of networking: OSI 7-layer model and TCP/IP 4-layer model — functions of each layer. Data encapsulation and de-encapsulation. IP addressing: IPv4, subnet masks, CIDR notation, introduction to IPv6. The Domain Name System (DNS). How HTTP, FTP, SMTP work at the application layer. Wireless networking standards (Wi-Fi 802.11). The Internet and the World Wide Web: how a browser retrieves a webpage.' },
      { title: 'Operating Systems', description: 'What an operating system is and what it does. Process management: processes vs. threads, process states (new, ready, running, waiting, terminated), process scheduling algorithms (FCFS, SJF, Round Robin, Priority). Memory management: logical vs. physical addresses, paging, segmentation, virtual memory, page replacement algorithms (LRU, FIFO, Optimal). File systems: hierarchical directory structures, file attributes, file access methods. Device management and I/O. Deadlock: conditions, prevention, avoidance, and detection.' },
      { title: 'Algorithms and Programming Languages', description: 'What an algorithm is: definiteness, finiteness, input, output, effectiveness. Representing algorithms: pseudocode and flowcharts. Big-O notation and algorithmic complexity — O(1), O(log n), O(n), O(n²). Generations of programming languages: machine code, assembly, high-level languages, 4GLs. Compilation vs. interpretation. Structured programming constructs: sequence, selection, iteration. Introduction to functional and object-oriented paradigms.' },
      { title: 'Software Engineering', description: 'The software development life cycle (SDLC): requirements analysis, design, implementation, testing, maintenance. Software development methodologies: Waterfall, Agile (Scrum, Kanban), Spiral model. Requirements engineering: functional vs. non-functional requirements, use cases. UML diagrams: use case diagrams, class diagrams, sequence diagrams. Testing: unit testing, integration testing, system testing, user acceptance testing. Version control concepts.' },
      { title: 'Data and File Structures', description: 'Arrays, linked lists (singly, doubly, circular), stacks, queues, trees (binary trees, binary search trees, AVL trees), and graphs — conceptual understanding of each. Abstract Data Types (ADTs). Searching algorithms: linear search, binary search. Sorting algorithms: bubble sort, selection sort, insertion sort, quicksort, merge sort. Hashing and hash tables. File organisation: sequential, indexed-sequential, and random access files.' },
      { title: 'Databases', description: 'What databases are and why they matter over flat files. The relational model: tables, attributes, tuples, primary keys, foreign keys. Entity-Relationship (ER) diagrams. Introduction to SQL: SELECT, FROM, WHERE, JOIN (INNER, LEFT, RIGHT), GROUP BY, ORDER BY, INSERT, UPDATE, DELETE. Database normalisation: 1NF, 2NF, 3NF. ACID properties of transactions. Introduction to NoSQL databases and when to use them.' },
    ],
    assessments: [
      { title: 'Assessment 1 (MCQ Quiz)', type: 'Quiz', opened: '2026-02-01', due: '2026-05-27', note: 'Covers Chapters 1–5 of Forouzan (Number Systems, Operations on Data, Computer Organisation, Networks, Operating Systems). Strongly advised to read Additional Resources notes if textbook not yet available.' },
      { title: 'Assessment 2 (MCQ Quiz)', type: 'Quiz', opened: '2026-02-01', due: '2026-06-18', note: 'Covers later chapters on Algorithms, Programming Languages, and Software Engineering.' },
      { title: 'Assessment 3 (MCQ Quiz)', type: 'Quiz', opened: '2026-02-01', due: '2026-07-22', note: 'Covers Data Structures, File Structures, and Databases.' },
      { title: 'Assessment 4 (Discussion Forum)', type: 'Assessment', opened: '2026-02-01', due: '2026-08-13', note: 'Forum-based assessment. You must post a substantive response to the given topic. Counts towards year mark.' },
      { title: 'Assessment 5 (MCQ Quiz)', type: 'Quiz', opened: '2026-02-01', due: '2026-09-02', note: 'Final quiz assessment. Covers integrated and revision topics across the entire module.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // COS2611 — Data Structures and Algorithms (C++)
  // ──────────────────────────────────────────────────────────
  {
    code: 'COS2611',
    title: 'Data Structures and Algorithms',
    period: 'Year — 2026',
    lecturer: 'Dr Ronell van der Merwe',
    email: 'vandeRJ@unisa.ac.za',
    tel: null,
    color: 4,
    description: `COS2611 Data Structures and Algorithms is a second-level Computer Science module that is among the most practically intensive in the UNISA CS curriculum. The module teaches students to design, implement, analyse, and compare fundamental data structures and the algorithms that operate on them — all using C++ as the implementation language.

This is explicitly a programming module. Every concept introduced in the theoretical classes (Books) is expected to be implemented in working, compilable, tested C++ code. The module emphasises not just correctness but also algorithmic efficiency — students are expected to reason about time and space complexity (Big-O notation) for all implementations.

The module is structured progressively through 4 "Classes" (Books), each unlocking the next. Access to each Class, its associated Webinar, and its graded Assessment is conditional on completing the previous Class and passing the prerequisite quiz (Welcome Videos). This design ensures students build each concept on a solid foundation before advancing.

Assessments and weighting: There are 4 graded assessments. Assessment 1 is a solo programming project (C++ file submission). Assessment 2 is a peer-review workshop — you submit code in Phase 1, then review peers' code in Phase 2 and receive reviews in turn. Assessment 3 is another individual programming project. Assessment 4 is an online MCQ quiz. Additionally, there are 4 self-assessments (ungraded practice activities) that students are strongly encouraged to complete. From 2026 a minimum year mark of 40% is required for exam admission. You must NOT use AI tools to generate your code — the assessments test your understanding of the algorithmic complexities involved.`,
    learningUnits: [
      { title: 'Class 1: Linear Data Structures (Queues & Stacks)', description: 'Deep dive into linear data structures. Stacks: LIFO (Last In First Out) principle, array-based and linked-list-based implementations, push/pop/peek operations, applications (expression evaluation, backtracking, undo functionality, call stacks). Queues: FIFO (First In First Out) principle, array-based circular queues and linked-list queues, enqueue/dequeue operations, variants (priority queues, deque). C++ template-based implementation of both structures. Assessment 1 project: Warehouse Order Dispatch System — simulating order queuing, processing, and truck dispatch using queues and stacks for three order types (Small, Medium, Bulk).' },
      { title: 'Class 2: Sorting Algorithms', description: 'Systematic study of comparison-based sorting algorithms with full C++ implementation and complexity analysis. Bubble sort O(n²), selection sort O(n²), insertion sort O(n²) — when are quadratic sorts acceptable? Merge sort O(n log n) and quicksort O(n log n) average — divide-and-conquer approach. Heap sort O(n log n). Counting sort, radix sort, and bucket sort (non-comparison sorts). Stability in sorting. Best, worst, and average case analysis. The peer-review workshop (Assessment 2) centres on implementing and comparing sorting algorithms — students receive bonus marks (+3) for exceptional work.' },
      { title: 'Class 3: Trees and Binary Search Trees', description: 'Tree terminology: root, parent, child, leaf, height, depth, subtree. Binary trees: full, complete, perfect. Binary search tree (BST) property and all standard operations: search, insert, delete (handling three delete cases). Tree traversals: inorder (sorted output), preorder, postorder, and level-order (BFS). Balanced BSTs: AVL trees (rotations: LL, RR, LR, RL), and introduction to Red-Black trees. Self-Assessment 2 involves implementing a recursive binary tree in C++. Self-Assessment 3 is implementing Breadth-First Search on a graph represented as an adjacency list.' },
      { title: 'Class 4: Graphs', description: 'Graph fundamentals: vertices, edges, directed vs. undirected, weighted vs. unweighted, adjacency matrix vs. adjacency list representation. Graph traversals: Depth-First Search (DFS) with stack-based and recursive implementations; Breadth-First Search (BFS) with queue-based implementation. Connected components. Shortest path algorithms: Dijkstra\'s algorithm (single-source, non-negative weights) and Bellman-Ford (handles negative weights). Minimum spanning trees: Kruskal\'s and Prim\'s algorithms. Topological sorting of directed acyclic graphs (DAGs). Assessment 4 (MCQ quiz) tests graph theory and algorithm knowledge.' },
    ],
    assessments: [
      { title: 'Assessment 1 — Warehouse Order Dispatch (C++)', type: 'Assignment', due: null, note: 'Solo C++ project. Implement a warehouse simulation using queues and stacks. Submit a single .cpp file named 12345678_AS1.cpp. Must use latest C++ standard. First three lines must include your student number and name. No AI code generation allowed.' },
      { title: 'Assessment 2 — Sorting Algorithms Peer-Review', type: 'Assessment', due: null, note: 'Phase 1: Develop your sorting algorithm implementation (download skeleton file COS2611_As2_P1_Skeleton.cpp from Additional Resources). Phase 2: Review peers\' submitted code. Bonus +3 marks available for exceptional submissions. No AI tools for code generation.' },
      { title: 'Assessment 3 — Advanced Data Structures (C++)', type: 'Assignment', due: null, note: 'Unlocked after completing Class 3, Self Assessment 2 & 3, and passing Self Assessment 4. Covers trees and graphs implementation in C++.' },
      { title: 'Assessment 4 — Graph Algorithms (MCQ Quiz)', type: 'Quiz', due: null, note: 'Online quiz covering graph theory, BFS/DFS, shortest paths, and MST algorithms. Unlocked after completing Class 4.' },
      { title: 'Self Assessment 1 (Practice — ungraded)', type: 'Task', due: null, note: 'Practice quiz. Marks do NOT count toward formative assessment.' },
      { title: 'Self Assessment 2 — Recursive Binary Tree (Practice)', type: 'Task', due: null, note: 'Implement a recursive binary tree in C++ using AI prompt engineering for guidance practice.' },
      { title: 'Self Assessment 3 — BFS Implementation (Practice)', type: 'Task', due: null, note: 'Implement BFS on an undirected graph represented as an adjacency list in C++.' },
      { title: 'Self Assessment 4 (Practice Quiz)', type: 'Task', due: null, note: 'Practice quiz. Marks do NOT count toward formative assessments.' },
      { title: 'Watch Welcome Videos + Quiz (Compulsory)', type: 'Task', due: null, note: 'Compulsory prerequisite. Must watch both videos and pass the quiz before any other module activities unlock.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // COS2614 — Programming: Contemporary Concepts (Qt/C++)
  // ──────────────────────────────────────────────────────────
  {
    code: 'COS2614',
    title: 'Programming: Contemporary Concepts',
    period: 'Year — 2026',
    lecturer: 'Mr L Aron',
    email: 'aronl@unisa.ac.za',
    tel: null,
    color: 5,
    description: `COS2614 Programming: Contemporary Concepts is a second-level programming module that picks up directly from COS1512/COS1513 (Introduction to Programming in C++) and significantly expands the scope into modern, professional software development practices. The central technology platform is the Qt framework — a powerful, cross-platform C++ framework widely used in industry for building desktop GUI applications, embedded systems, and complex software systems.

Students are expected to invest at least 120 hours of study time in this module. This is a heavily practical, hands-on module: understanding concepts alone is insufficient — you must write code on a computer using Qt Creator (the Qt IDE) and compile and run your programs regularly. Consistent work throughout the semester is critical; you cannot cram this module in the final weeks.

All enrolled students are allocated an e-tutor who has their own separate myUnisa page and discussion forum. Students are strongly encouraged to engage with their e-tutor's forum rather than the main COS2614 discussion forum.

The module covers 8 major content areas, each delivered through Lessons or Content Pages: Pre-requisite OOP review, Qt Creator IDE, Object-Oriented Programming with Qt, UML Diagrams, Design Patterns, Lists/Collections, Libraries, QObject/Signal-Slot mechanism, Generics and Containers, and Qt GUI Widgets.

Assessment structure: 4 assessments. Assessment 1 and 3 are written assignments (major programming projects). Assessment 2 and 4 are online MCQ quizzes. All 4 assessments count toward the year mark. Students must submit all three assignments to pass the module.`,
    learningUnits: [
      { title: 'Pre-requisite Information (OOP Review)', description: 'Review of C++ fundamentals needed for this module: classes and objects, constructors and destructors, access specifiers (public, protected, private), member functions, operator overloading, function overloading, copy constructors, references and pointers, dynamic memory allocation (new/delete), templates. If any of these concepts are unclear, students are strongly advised to revise COS1512/1513 material before proceeding.' },
      { title: 'Qt Creator IDE', description: 'Installing and configuring Qt Creator (the official Qt IDE). Creating a new Qt project: project types (Qt Widgets Application, Qt Console Application, Qt Quick Application). Understanding the project file structure: .pro file, main.cpp, header files, source files, resource files (.qrc). Using the Designer to build GUIs visually. The build system (qmake/CMake). Running and debugging Qt applications. Reading Qt documentation — the most important skill for self-directed Qt development.' },
      { title: 'Object-Oriented Programming with Qt', description: 'How Qt extends standard C++ OOP: the Q_OBJECT macro, Qt\'s meta-object system, moc (Meta-Object Compiler) processing. Inheriting from QObject and QWidget. The parent-child ownership model: how Qt automatically manages memory for objects with parents. Multiple inheritance in Qt and its constraints. Using the Qt type system: QString, QList, QMap, QVariant, and how they differ from standard C++ equivalents. Exception handling in a Qt context.' },
      { title: 'UML Diagrams', description: 'Reading and drawing the UML diagrams that are foundational to software design and that appear throughout the assessments: Class diagrams (classes, attributes, methods, relationships: association, aggregation, composition, inheritance, dependency, realisation — with correct multiplicities). Sequence diagrams (object interactions across time). Use case diagrams. State machine diagrams. Component and deployment diagrams at a conceptual level. Using UML to plan Qt application architecture before writing a single line of code.' },
      { title: 'Design Patterns', description: 'Software design patterns as reusable solutions to common architectural problems. Creational patterns: Singleton (only one instance — relevant for Qt application objects), Factory Method, Abstract Factory, Builder, Prototype. Structural patterns: Adapter, Bridge, Composite, Decorator, Facade, Proxy. Behavioural patterns: Observer (deeply related to Qt\'s Signal-Slot mechanism), Strategy, Command, Iterator, State. Implementing at least three patterns fully in C++/Qt.' },
      { title: 'Lists, Collections, and Qt Containers', description: 'Qt\'s built-in container classes: QList, QVector, QLinkedList, QStack, QQueue, QSet, QMap, QMultiMap, QHash, QMultiHash. Comparing Qt containers with STL containers. Iterators: Java-style and STL-style iterators in Qt. The QStringList convenience class. Container algorithms. When to choose which container based on performance requirements. Model-View architecture for displaying collections in Qt widgets: QAbstractItemModel, QListView, QTreeView, QTableView.' },
      { title: 'Qt Libraries and Modules', description: 'Qt is not just the core framework — it is an ecosystem of modules. Key modules: Qt Core (QObject, event loop, timers, file I/O), Qt Widgets (traditional desktop GUI), Qt Network (HTTP client/server, sockets), Qt SQL (database access), Qt Multimedia (audio/video), Qt Charts. How to add modules to a project\'s .pro file. Using external C++ libraries in a Qt project: adding include paths, linking libraries. Introduction to Qt Quick/QML for modern fluid UIs (conceptual overview).' },
      { title: 'QObject, Signals, and Slots', description: 'Qt\'s most distinctive and powerful feature: the Signal-Slot mechanism. Signals: events emitted by objects. Slots: functions that respond to signals. The connect() function in all its forms: the classic SIGNAL/SLOT macros, the new function-pointer syntax (type-safe, compile-time checked), and lambda functions as slots. Disconnect and connection types (direct, queued, blocking queued). The Qt event loop: QApplication::exec(), event handling, event filters. Custom signals: when and how to define your own. Practical examples: button clicks, timers firing, network data arriving.' },
      { title: 'Generics, Templates, and Qt Containers', description: 'C++ templates as a language feature: function templates, class templates, template specialisation, variadic templates. Qt\'s generic programming model. QGenericMatrix and generic algorithms in Qt. The foreach macro and range-based for loops with Qt containers. Using the STL algorithms (std::sort, std::find, std::transform) with Qt containers. Understanding implicit sharing (copy-on-write) — how Qt containers are efficient even when seemingly copied.' },
      { title: 'Qt GUI Widgets', description: 'Building practical desktop applications with Qt Widgets. Core widgets: QPushButton, QLabel, QLineEdit, QTextEdit, QComboBox, QSpinBox, QSlider, QCheckBox, QRadioButton, QGroupBox. Layout managers: QVBoxLayout, QHBoxLayout, QGridLayout, QFormLayout, QSplitter. Dialog boxes: QDialog, QMessageBox, QFileDialog, QColorDialog, QFontDialog, QInputDialog. The QMainWindow framework: QMenuBar, QToolBar, QStatusBar, QDockWidget. Putting it all together: designing a complete, functional Qt desktop application from scratch.' },
    ],
    assessments: [
      { title: 'Assessment 1 (Written Assignment — Qt Project)', type: 'Assignment', opened: '2026-03-02', due: '2026-05-25', note: 'Major programming assignment. Covers OOP, Qt Creator, UML, and Design Patterns. Submit complete Qt project via myUnisa.' },
      { title: 'Assessment 2 (MCQ Quiz)', type: 'Quiz', opened: '2026-03-02', due: '2026-06-30', note: 'Online quiz. Covers pre-requisite OOP concepts, Qt setup, QObject/Signals/Slots, and UML.' },
      { title: 'Assessment 3 (Written Assignment — Qt Project)', type: 'Assignment', opened: '2026-03-02', due: '2026-08-11', note: 'Second major programming assignment. Covers Containers, Libraries, Generics, and GUI Widgets. Submit complete Qt project.' },
      { title: 'Assessment 4 (MCQ Quiz)', type: 'Quiz', opened: '2026-03-02', due: '2026-09-07', note: 'Final online quiz. Covers Design Patterns, Qt Libraries, and advanced Qt concepts.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // COS3751 — Techniques of Artificial Intelligence
  // ──────────────────────────────────────────────────────────
  {
    code: 'COS3751',
    title: 'Techniques of Artificial Intelligence',
    period: 'Year — 2026',
    lecturer: 'Mr L Ndlovu',
    email: 'ndlovl@unisa.ac.za',
    tel: null,
    color: 0,
    description: `COS3751 Techniques of Artificial Intelligence is a third-level Computer Science module that provides a rigorous, mathematically grounded introduction to the core computational methods that power modern AI systems. It is a fully online module — all material, all learning units, all study plans, and all assessments are hosted on myUnisa. Students are expected to log into the module site on a daily basis.

The module covers three foundational areas of classical AI: (1) Knowledge representation and reasoning — how AI systems encode facts about the world and draw logical inferences; (2) State-space searching — how AI agents navigate problem spaces to find solutions, from uninformed search to heuristic methods; and (3) Automated learning (machine learning) — how systems improve their performance from experience without being explicitly programmed for every case.

The module uses 12 video lessons (delivered via the Video Lessons folder) and 5 supplementary study material files (in the Supplementary Study Material folder), plus a Study Plan that sequences the learning activities. Assessments are released one at a time: Assessment 1 is an MCQ quiz; Assessments 2 and 3 are written long-question assignments. Monthly webinar sessions are announced via the Announcements tool.

This module is particularly relevant for students interested in AI, machine learning, robotics, natural language processing, and intelligent systems development. It provides the theoretical underpinning needed to understand why modern AI (including neural networks and large language models) works the way it does.`,
    learningUnits: [
      { title: 'Introduction to AI: Agents and Environments', description: 'What is artificial intelligence? Brief history from Turing to modern deep learning. The intelligent agent model: agent function, percept sequence, performance measure. Types of agents: simple reflex, model-based, goal-based, utility-based, and learning agents. Types of environments: fully vs. partially observable, deterministic vs. stochastic, episodic vs. sequential, static vs. dynamic, discrete vs. continuous, single-agent vs. multi-agent. Rational agency: what does it mean for an agent to act rationally in each environment type?' },
      { title: 'Knowledge Representation and Propositional Logic', description: 'Why knowledge representation is central to AI: the physical symbol system hypothesis. Propositional logic: syntax (atomic sentences, connectives ¬, ∧, ∨, →, ↔), semantics (truth tables), and inference. Logical equivalences and tautologies. The entailment relation. Inference rules: Modus Ponens, Modus Tollens, And-Elimination, And-Introduction, Or-Introduction, Resolution. Proof by resolution: converting to CNF (Conjunctive Normal Form) and applying resolution refutation. Limitations of propositional logic for knowledge representation.' },
      { title: 'First-Order Predicate Logic', description: 'Extending propositional logic: terms (constants, variables, functions), predicates, quantifiers (∀ universal, ∃ existential). First-order logic syntax and semantics. Interpreting FOL sentences. Equality and function symbols. Negation of quantified statements. Translating natural language into FOL. Unification algorithm: finding substitutions that make two expressions identical. Generalised Modus Ponens. Forward chaining and backward chaining on Horn clauses. Completeness of resolution for FOL: Herbrand\'s theorem.' },
      { title: 'Uninformed Search Strategies', description: 'Formulating problems as state-space search: state, initial state, actions, transition model, goal test, path cost. Tree search vs. graph search (handling repeated states). Uninformed (blind) search algorithms — no heuristic information: Breadth-First Search (BFS) — complete, optimal, O(b^d) space/time; Depth-First Search (DFS) — not complete, not optimal, O(bm) time O(m) space; Uniform Cost Search — optimal, finds cheapest path; Depth-Limited Search; Iterative Deepening DFS (IDDFS) — combines DFS\'s space efficiency with BFS\'s completeness; Bidirectional Search. Comparing algorithms on completeness, optimality, time complexity, space complexity.' },
      { title: 'Informed (Heuristic) Search Strategies', description: 'Heuristic functions h(n): estimating cost from node n to the goal. Best-First Search. Greedy Best-First Search: minimises h(n) — fast but not optimal. A* Search: minimises f(n) = g(n) + h(n) — complete and optimal when h is admissible (never overestimates) and consistent (satisfies the triangle inequality). Proving A*\'s optimality. Designing good admissible heuristics: relaxed problems. Memory-bounded heuristic search: IDA*, RBFS (Recursive Best-First Search), SMA* (Simplified Memory-Bounded A*). Comparing heuristics using effective branching factor.' },
      { title: 'Beyond Classical Search: Local and Adversarial Search', description: 'Problems where the path does not matter — only the final state. Hill-climbing algorithms: steepest-ascent, stochastic, first-choice, random restart. Simulated annealing: accepting worse solutions probabilistically to escape local optima. Genetic algorithms: representing solutions as chromosomes, fitness function, selection, crossover, mutation. Adversarial search (games): minimax algorithm for two-player zero-sum games. Alpha-beta pruning to improve minimax efficiency. Evaluation functions for non-terminal states. Monte Carlo Tree Search (MCTS).' },
      { title: 'Introduction to Machine Learning', description: 'The machine learning paradigm: learning from data rather than hand-coded rules. Supervised learning: learning from labelled examples. Decision trees: ID3 algorithm (information gain, entropy), C4.5, handling overfitting with pruning. Linear regression: ordinary least squares, gradient descent. Logistic regression for classification. The bias-variance trade-off. Cross-validation. Unsupervised learning: k-means clustering, hierarchical clustering. Reinforcement learning: the agent-environment interaction, rewards, policies, Q-learning introduction. Neural networks: perceptron, multilayer networks, backpropagation conceptually.' },
      { title: 'Automated Planning and Uncertainty', description: 'Classical planning: STRIPS representation, goal regression, partial-order planning. Planning graphs and the GraphPlan algorithm. Introduction to uncertainty in AI: when the world is not fully observable or deterministic. Probability review: conditional probability, Bayes\' theorem. Bayesian networks: structure, conditional probability tables, inference by enumeration. Hidden Markov Models (HMMs) and the Viterbi algorithm. Decision-making under uncertainty: maximum expected utility, influence diagrams.' },
    ],
    assessments: [
      { title: 'Assessment 1 (MCQ Quiz)', type: 'Quiz', due: null, note: 'Online MCQ format. Released first. Covers foundational AI concepts, agents/environments, knowledge representation, and search strategies.' },
      { title: 'Assessment 2 (Written — Long Questions)', type: 'Assignment', due: null, note: 'Written assignment with long-form questions. Released after Assessment 1. Covers search algorithms and logic.' },
      { title: 'Assessment 3 (Written — Long Questions)', type: 'Assignment', due: null, note: 'Final written assignment. Covers machine learning techniques and planning.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // COS3761 — Formal Logic
  // ──────────────────────────────────────────────────────────
  {
    code: 'COS3761',
    title: 'Formal Logic',
    period: 'Year — 2026',
    lecturer: 'Dr Sreedevi Vallabhapurapu',
    email: 'vallabs@unisa.ac.za',
    tel: null,
    color: 1,
    description: `COS3761 Formal Logic is a third-level Computer Science module that provides a rigorous mathematical treatment of logic as it applies to computation, formal reasoning, and the foundations of computer science. This is a proof-heavy, mathematically demanding module that requires careful, disciplined study — students who engage seriously with it develop the kind of precise reasoning skills that are invaluable in theoretical CS, programming language design, software verification, and AI.

The module covers three major branches of formal logic: (1) Propositional Logic — the logic of sentences joined by connectives; (2) Predicate (First-Order) Logic — extending propositional logic with quantifiers and variables to reason about objects and their properties; and (3) Modal Logic — reasoning about necessity, possibility, and other modalities beyond classical truth/falsity. These three topics build on each other progressively.

The starting point is Tutorial Letter 101 (in Official Study Material), which provides complete module information. Tutorial Letter 102 (in Additional Resources) contains supplementary notes alongside the prescribed book. Tutorial Letter 103 (in Additional Resources) specifies all three assignments in full detail. Assignment solutions are also published in Additional Resources when available — students should work through all solutions carefully, as they contain hints, explanations, and guidelines.

Assessment structure: 3 assessments. Assessment 1 (MCQ quiz) covers propositional logic. Assessment 2 (written submission) covers predicate logic. Assessment 3 (MCQ quiz) covers modal logic. All three must be submitted — doing so is critical for both the year mark and exam preparation.`,
    learningUnits: [
      { title: 'Learning Unit 1: Propositional Logic', description: 'The complete formal system of propositional logic. Syntax: the formal language of propositional logic — well-formed formulas (wffs), connectives (¬ negation, ∧ conjunction, ∨ disjunction, → implication, ↔ biconditional), precedence rules. Semantics: truth valuations, the semantic concept of truth, truth tables for all connectives. Logical equivalence: two formulas are logically equivalent iff they have the same truth value under every valuation — key equivalences include De Morgan\'s laws, double negation, contrapositive. Tautology, contradiction, and satisfiability. The concepts of logical entailment (|=) and logical consequence. Natural deduction for propositional logic: introduction and elimination rules for each connective (∧I, ∧E, ∨I, ∨E, →I, →E, ¬I, ¬E, ⊥E). Proof strategies: direct proof, proof by contradiction, conditional proof. Soundness and completeness of natural deduction. Resolution: converting to Conjunctive Normal Form (CNF), the resolution rule, resolution refutation proofs. Tableaux (semantic trees) as an alternative proof method.' },
      { title: 'Learning Unit 2: Predicate (First-Order) Logic', description: 'Extending propositional logic to reason about objects and their properties. Syntax: terms (constants, variables, function symbols), atomic formulas using predicate symbols, building complex formulas with propositional connectives and quantifiers (∀ universal, ∃ existential). Bound and free variables, scope. Semantics of FOL: an interpretation consists of a non-empty domain D, assignments of constants to domain elements, functions to D^n → D, and predicates to subsets of D^n. Satisfiability, validity, and logical consequence in FOL. Substitution and the substitution lemma. Natural deduction for FOL: ∀I, ∀E, ∃I, ∃E rules and their restrictions. Prenex normal form. Unification and most general unifiers (MGUs). Resolution for FOL: Skolemization, Herbrand\'s theorem, ground resolution, and the general resolution procedure. Applications: formalising mathematical arguments, database query languages, and program verification.' },
      { title: 'Learning Unit 3: Modal Logic', description: 'Classical logic is two-valued: every proposition is either true or false. Modal logic adds operators that reason about the mode of truth: □ (necessarily true) and ◇ (possibly true). Syntax of modal logic: adding □ and ◇ to the propositional connectives. Kripke semantics: a model M = (W, R, V) consists of a set of possible worlds W, an accessibility relation R ⊆ W×W, and a valuation V. Truth of modal formulas relative to a world in a model: □φ is true at world w iff φ is true at all worlds accessible from w; ◇φ is true at world w iff φ is true at some world accessible from w. Different modal systems arise from placing constraints on R: reflexivity gives the T axiom (□φ → φ), transitivity gives the 4 axiom (□φ → □□φ), symmetry gives the B axiom (φ → □◇φ). Important modal systems: K (minimal), T (reflexive), S4 (reflexive + transitive), S5 (equivalence relation). Proof systems for modal logic: natural deduction extensions, axiom systems. Applications: temporal logic, epistemic logic (knowledge/belief), deontic logic (obligation/permission), and modal logics in program verification (dynamic logic).' },
    ],
    assessments: [
      { title: 'Assessment 1 (MCQ — Propositional Logic)', type: 'Quiz', opened: '2026-01-01', due: '2026-04-30', note: 'Online MCQ quiz. Covers all of Learning Unit 1: Propositional Logic. Closes 30 April 2026 at 23:00. Refer to Tutorial Letter 103 for exact questions scope.' },
      { title: 'Assessment 2 (Written — Predicate Logic)', type: 'Assignment', opened: '2026-01-01', due: '2026-06-26', note: 'Written assignment. Covers all of Learning Unit 2: Predicate Logic. Due 26 June 2026 at 23:00. Refer to Tutorial Letter 103 for full question specification.' },
      { title: 'Assessment 3 (MCQ — Modal Logic)', type: 'Quiz', opened: '2026-01-01', due: '2026-09-08', note: 'Online MCQ quiz. Covers all of Learning Unit 3: Modal Logic. Closes 8 September 2026 at 23:00. Check Additional Resources for assignment solutions and hints after each submission date.' },
    ]
  },

  // ──────────────────────────────────────────────────────────
  // MAT2612 — Introduction to Discrete Mathematics
  // ──────────────────────────────────────────────────────────
  {
    code: 'MAT2612',
    title: 'Introduction to Discrete Mathematics',
    period: 'Year — 2026',
    lecturer: 'Mr M Kgarose',
    email: 'kgarom@unisa.ac.za',
    tel: '011 670 9169',
    color: 2,
    description: `MAT2612 Introduction to Discrete Mathematics is a second-level mathematics module covering the mathematical foundations that underlie virtually all of theoretical computer science. Unlike the calculus-based mathematics in other modules, discrete mathematics deals with countable, separable structures — the mathematics of algorithms, data structures, databases, programming languages, cryptography, and network protocols.

The prescribed textbook is "Discrete Mathematical Structures" by B. Kolman, R. Bushy & S. Ross, sixth edition. A study guide is also provided. The main administrative site provides tutorial letters, the study guide, assessment submission, and important announcements. Actual learning largely takes place in a Tutorial Site where interactive student engagement is encouraged.

5 chapter-specific study URLs are provided on the module page to support self-directed study of each topic: Chapter 1 (Fundamentals), Chapter 2 (Logic), Chapter 3 (Counting), Chapter 4 (Relations & Digraphs), and Chapter 5 (Functions). These are valuable supplementary resources to use alongside the textbook and study guide.

Assessment structure: 4 written assignments, each with a generous submission window (all opened 1 January 2026). All four are traditional written assignments submitted via myUnisa. A minimum year mark of 40% is required for exam admission from 2026.`,
    learningUnits: [
      { title: 'Chapter 1: Fundamentals — Sets and Combinatorics', description: 'Set theory as the language of mathematics: definition of a set, set notation (roster and set-builder), membership (∈). Set operations: union (∪), intersection (∩), difference (\\), complement (A\'), symmetric difference. Subset (⊆), proper subset (⊂), power set P(A). Venn diagrams. Inclusion-exclusion principle for counting: |A ∪ B| = |A| + |B| − |A ∩ B|, extended to three and more sets. Ordered pairs, Cartesian product A × B. Fundamental counting principle (multiplication rule). Permutations: arranging n items (nPr = n!/(n-r)!). Combinations: choosing r from n without order (nCr = n!/r!(n-r)!). Binomial theorem and Pascal\'s triangle. Pigeonhole principle and its applications.' },
      { title: 'Chapter 2: Logic', description: 'Formal mathematical logic with rigorous proof techniques. Propositions and propositional variables. Logical connectives: negation, conjunction, disjunction, implication, biconditional — truth tables for all. Logical equivalence and the laws of logic (De Morgan, absorption, distributive, etc.). Conditional statements: converse, inverse, contrapositive — and which are logically equivalent to the original. Tautologies and contradictions. Predicate logic: predicates, quantifiers ∀ and ∃, nested quantifiers, negating quantified statements. Mathematical proof methods: direct proof, proof by contrapositive, proof by contradiction (reductio ad absurdum), proof by mathematical induction (weak and strong), well-ordering principle. Proof by cases.' },
      { title: 'Chapter 3: Counting and Recurrence Relations', description: 'Advanced counting techniques beyond basic combinations and permutations. Combinations with repetition. Multinomial coefficients. Inclusion-exclusion principle extended. Introduction to recurrence relations: defining sequences recursively. Solving linear recurrence relations: homogeneous recurrences with constant coefficients — characteristic equation, distinct roots, repeated roots. Non-homogeneous recurrences: particular solutions for polynomial and exponential forcing functions. Applications: Fibonacci numbers, Tower of Hanoi, binary search recurrence T(n) = T(n/2) + c. The Master Theorem for divide-and-conquer algorithm analysis. Generating functions as a technique for solving recurrences.' },
      { title: 'Chapter 4: Relations and Digraphs', description: 'Binary relations on sets: definition, notation, matrix representation (Boolean matrix). Digraphs (directed graphs) as a visual representation of relations. Properties of relations: reflexive (every element relates to itself), symmetric (if a→b then b→a), antisymmetric (if a→b and b→a then a=b), transitive (if a→b and b→c then a→c). Equivalence relations: must be reflexive, symmetric, and transitive simultaneously. Equivalence classes and partitions: a fundamental concept in abstract algebra and type theory. Partial order relations (reflexive, antisymmetric, transitive): Hasse diagrams. Total orders. Closures: reflexive closure, symmetric closure, transitive closure (Warshall\'s algorithm). Composition of relations. Matrix multiplication of Boolean matrices for computing composed relations.' },
      { title: 'Chapter 5: Functions', description: 'Functions as special relations: domain, codomain, range, image. Types of functions: injective (one-to-one — no two domain elements map to the same codomain element), surjective (onto — every codomain element is hit), bijective (both injective and surjective). Composition of functions (f∘g)(x) = f(g(x)) and its properties. Inverse functions: when do they exist? Permutation functions. Identity function. The pigeonhole principle restated in terms of functions. Floor (⌊x⌋) and ceiling (⌈x⌉) functions. Sequences as functions from ℕ to some set. Recursive function definitions. Big-O, Big-Ω, Big-Θ notation for function growth rates — connecting back to algorithm complexity from COS1521 and COS2611.' },
    ],
    assessments: [
      { title: 'Assessment 1', type: 'Assignment', opened: '2026-01-01', due: '2026-05-25', note: 'Written assignment. Covers Chapter 1 (Fundamentals: Sets and Combinatorics) and Chapter 2 (Logic). Submit via myUnisa.' },
      { title: 'Assessment 2', type: 'Assignment', opened: '2026-01-01', due: '2026-06-22', note: 'Written assignment. Covers Chapter 3 (Counting and Recurrence Relations).' },
      { title: 'Assessment 3', type: 'Assignment', opened: '2026-01-01', due: '2026-07-20', note: 'Written assignment. Covers Chapter 4 (Relations and Digraphs).' },
      { title: 'Assessment 4', type: 'Assignment', opened: '2026-01-01', due: '2026-08-17', note: 'Final written assignment. Covers Chapter 5 (Functions) and integrated topics.' },
    ]
  },

];

// ============================================================
// UNIT → ASSESSMENT DEPENDENCY MAP
// unitLinks[moduleCode] maps each assessment title to the
// array of unit indices (0-based) that must be studied first.
// ============================================================
const UNIT_LINKS = {

  // FYE1500: all 10 units feed into the single completion task
  FYE1500: {
    'Complete FYE1500 course': [0,1,2,3,4,5,6,7,8,9],
  },

  // APM1513
  // Assessment 1 (Quiz): covers Systems of Linear Equations (unit 0) — intro topics
  // Assessment 2: covers Least Squares (unit 1) + Linear Programming intro (unit 2)
  // Assessment 3: covers Simplex Method (unit 2) + Eigenvalues (unit 3)
  // Assessment 4: covers Diagonalization (unit 4) + Applications (unit 5)
  APM1513: {
    'Assessment 1 (Quiz — MCQ)':        [0],
    'Assessment 2 (Written Assignment)': [0, 1, 2],
    'Assessment 3 (Written Assignment)': [2, 3],
    'Assessment 4 (Written Assignment)': [3, 4, 5],
  },

  // APM2616
  // Assessment 1: CAS intro (unit 0) + symbolic manipulation (unit 1) + solving equations (unit 2)
  // Assessment 2: differentiation (unit 3) + integration (unit 4)
  // Assessment 3: symbolic linear algebra (unit 5)
  // Assessment 4: symbolic ODEs (unit 6) — requires all prior units
  APM2616: {
    'Assessment 1': [0, 1, 2],
    'Assessment 2': [3, 4],
    'Assessment 3': [5],
    'Assessment 4': [0, 1, 2, 3, 4, 5, 6],
  },

  // COS1521: 9 learning units, 5 assessments
  // Assessment 1: Chapters 1–5 = units 0–4 (Number Systems, Operations, Architecture, Networks, OS)
  // Assessment 2: units 5–6 (Algorithms & Programming Languages, Software Engineering)
  // Assessment 3: units 7–8 (Data Structures, Databases)
  // Assessment 4 (Discussion Forum): all content covered so far = units 0–8
  // Assessment 5: integrated revision across all units 0–8
  COS1521: {
    'Assessment 1 (MCQ Quiz)':       [0, 1, 2, 3, 4],
    'Assessment 2 (MCQ Quiz)':       [5, 6],
    'Assessment 3 (MCQ Quiz)':       [7, 8],
    'Assessment 4 (Discussion Forum)':[0, 1, 2, 3, 4, 5, 6, 7, 8],
    'Assessment 5 (MCQ Quiz)':       [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },

  // COS2611: 4 class-books, 4 assessments + self-assessments
  // Class 1 (unit 0) → Assessment 1 (Warehouse / Queues & Stacks)
  // Class 2 (unit 1) → Assessment 2 (Sorting Algorithms Peer-Review)
  // Class 3 (unit 2) → Assessment 3 (Trees/Graphs C++)
  //   Self Assessments 2 & 3 also need Class 3
  // Class 4 (unit 3) → Assessment 4 (Graph Algorithms Quiz)
  // Welcome Videos must be done before everything
  COS2611: {
    'Watch Welcome Videos + Quiz (Compulsory)': [],
    'Assessment 1 — Warehouse Order Dispatch (C++)':   [0],
    'Self Assessment 1 (Practice — ungraded)':          [0],
    'Assessment 2 — Sorting Algorithms Peer-Review':    [0, 1],
    'Self Assessment 2 — Recursive Binary Tree (Practice)': [0, 1, 2],
    'Self Assessment 3 — BFS Implementation (Practice)':    [0, 1, 2],
    'Assessment 3 — Advanced Data Structures (C++)':    [0, 1, 2],
    'Self Assessment 4 (Practice Quiz)':                [0, 1, 2],
    'Assessment 4 — Graph Algorithms (MCQ Quiz)':       [0, 1, 2, 3],
  },

  // COS2614: 10 learning units, 4 assessments
  // Assessment 1: OOP review (unit 0) + Qt Creator (unit 1) + OOP with Qt (unit 2)
  //               + UML (unit 3) + Design Patterns (unit 4)
  // Assessment 2 (Quiz): same foundation units 0–4 + QObject/Signals (unit 7)
  // Assessment 3: Lists (unit 5) + Libraries (unit 6) + QObject (unit 7)
  //               + Generics (unit 8) + GUI Widgets (unit 9)
  // Assessment 4 (Quiz): all units 0–9
  COS2614: {
    'Assessment 1 (Written Assignment — Qt Project)': [0, 1, 2, 3, 4],
    'Assessment 2 (MCQ Quiz)':                        [0, 1, 2, 3, 4, 7],
    'Assessment 3 (Written Assignment — Qt Project)': [5, 6, 7, 8, 9],
    'Assessment 4 (MCQ Quiz)':                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },

  // COS3751: 8 learning units, 3 assessments
  // Assessment 1 (MCQ): units 0–3 (Intro to AI, Propositional Logic, Predicate Logic, Uninformed Search)
  // Assessment 2 (Written): units 4–5 (Informed Search, Adversarial/Local Search)
  // Assessment 3 (Written): units 6–7 (Machine Learning, Planning & Uncertainty)
  COS3751: {
    'Assessment 1 (MCQ Quiz)':             [0, 1, 2, 3],
    'Assessment 2 (Written — Long Questions)': [4, 5],
    'Assessment 3 (Written — Long Questions)': [6, 7],
  },

  // COS3761: 3 learning units, 3 assessments — perfect 1:1 mapping
  // Assessment 1 (MCQ): Unit 0 — Propositional Logic
  // Assessment 2 (Written): Unit 1 — Predicate Logic
  // Assessment 3 (MCQ): Unit 2 — Modal Logic
  COS3761: {
    'Assessment 1 (MCQ — Propositional Logic)':  [0],
    'Assessment 2 (Written — Predicate Logic)':  [1],
    'Assessment 3 (MCQ — Modal Logic)':          [2],
  },

  // MAT2612: 5 chapters/units, 4 assessments
  // Assessment 1: Chapter 1 (unit 0) + Chapter 2 (unit 1)
  // Assessment 2: Chapter 3 (unit 2)
  // Assessment 3: Chapter 4 (unit 3)
  // Assessment 4: Chapter 5 (unit 4) + integrated review of all
  MAT2612: {
    'Assessment 1': [0, 1],
    'Assessment 2': [2],
    'Assessment 3': [3],
    'Assessment 4': [4, 0, 1, 2, 3],
  },
};

// Export for use by app.js
if (typeof module !== 'undefined') module.exports = { MODULE_DATA, UNIT_LINKS };
