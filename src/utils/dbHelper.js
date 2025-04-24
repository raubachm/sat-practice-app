// File: utils/dbHelper.js (Simple Mock Version)
// This is a simplified version without SQL.js for testing UI structure

// In-memory database
const memoryDB = {
  users: [],
  sessions: [],
  questions: []
};

// Initialize the database
export const initDB = async () => {
  // Check if we have stored data in localStorage
  try {
    const storedData = localStorage.getItem('sat_practice_data');
    if (storedData) {
      const data = JSON.parse(storedData);
      memoryDB.users = data.users || [];
      memoryDB.sessions = data.sessions || [];
      memoryDB.questions = data.questions || [];
    }
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
  }
  
  return {
    all: db.all,
    run: db.run
  };
};

// Get the database instance
export const getDB = async () => {
  return {
    all: db.all,
    run: db.run
  };
};

// Save database to localStorage
export const saveDB = () => {
  try {
    localStorage.setItem('sat_practice_data', JSON.stringify(memoryDB));
  } catch (error) {
    console.error("Error saving data to localStorage:", error);
  }
};

// Helper to generate unique IDs
const generateId = (collection) => {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map(item => item.id)) + 1;
};

// DB wrapper object with SQL-like methods
export const db = {
  // Query all records
  all: async (sql, params = []) => {
    try {
      // Very simple SQL parser to handle basic queries
      if (sql.includes('SELECT') && sql.includes('FROM')) {
        // Extract table name
        const fromMatch = sql.match(/FROM\s+(\w+)/i);
        if (!fromMatch) return [];
        
        const tableName = fromMatch[1].toLowerCase();
        let data = [];
        
        // Handle different tables
        if (tableName === 'users') {
          data = [...memoryDB.users];
        } else if (tableName === 'sessions') {
          data = [...memoryDB.sessions];
          
          // Handle JOIN with Users
          if (sql.includes('JOIN Users')) {
            data = data.map(session => {
              const user = memoryDB.users.find(u => u.id === parseInt(session.user_id)) || {};
              return {
                ...session,
                userName: user.name
              };
            });
          }
          
          // Handle WHERE clause for session_id
          if (params.length > 0 && sql.includes('WHERE session_id = ?')) {
            data = data.filter(s => s.id === parseInt(params[0]));
          }
          
          // Handle ORDER BY
          if (sql.includes('ORDER BY')) {
            const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
            if (orderMatch) {
              const [_, field, direction] = orderMatch;
              data.sort((a, b) => {
                if (direction.toUpperCase() === 'DESC') {
                  return a[field] < b[field] ? 1 : -1;
                } else {
                  return a[field] > b[field] ? 1 : -1;
                }
              });
            }
          }
        } else if (tableName === 'questions') {
          data = [...memoryDB.questions];
          
          // Handle WHERE clause
          if (params.length > 0 && sql.includes('WHERE session_id = ?')) {
            data = data.filter(q => q.session_id === parseInt(params[0]));
          }
          
          // Handle ORDER BY
          if (sql.includes('ORDER BY')) {
            const orderMatch = sql.match(/ORDER BY\s+(\w+)/i);
            if (orderMatch) {
              const field = orderMatch[1];
              data.sort((a, b) => a[field] > b[field] ? 1 : -1);
            }
          }
        }
        
        return data;
      }
      
      return [];
    } catch (error) {
      console.error("Error in db.all:", error);
      return [];
    }
  },
  
  // Insert, update, or delete records
  run: async (sql, params = []) => {
    try {
      // Handle INSERT
      if (sql.includes('INSERT INTO')) {
        const tableMatch = sql.match(/INSERT INTO\s+(\w+)/i);
        if (!tableMatch) throw new Error("Invalid SQL: Table name not found");
        
        const tableName = tableMatch[1].toLowerCase();
        let lastID = 0;
        
        if (tableName === 'users') {
          const id = generateId(memoryDB.users);
          const newUser = { id, name: params[0] };
          memoryDB.users.push(newUser);
          lastID = id;
        } else if (tableName === 'sessions') {
          const id = generateId(memoryDB.sessions);
          const newSession = { 
            id, 
            user_id: params[0], 
            subject: params[1], 
            date: params[2]
          };
          memoryDB.sessions.push(newSession);
          lastID = id;
        } else if (tableName === 'questions') {
          const id = generateId(memoryDB.questions);
          const newQuestion = { 
            id, 
            session_id: params[0], 
            question_payload: params[1], 
            hint_requested: params[2] ? 1 : 0, 
            explanation_requested: params[3] ? 1 : 0, 
            created_at: params[4],
            user_answer: null
          };
          memoryDB.questions.push(newQuestion);
          lastID = id;
        }
        
        saveDB();
        return { lastID };
      }
      
      // Handle UPDATE
      if (sql.includes('UPDATE')) {
        const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
        if (!tableMatch) throw new Error("Invalid SQL: Table name not found");
        
        const tableName = tableMatch[1].toLowerCase();
        const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
        if (!whereMatch) throw new Error("Invalid SQL: WHERE clause not found");
        
        const fieldName = whereMatch[1];
        const id = params[params.length - 1]; // Last parameter is always the ID
        
        if (tableName === 'questions') {
          const questionIndex = memoryDB.questions.findIndex(q => q[fieldName] === parseInt(id));
          if (questionIndex === -1) throw new Error(`Question with ${fieldName}=${id} not found`);
          
          if (sql.includes('user_answer')) {
            memoryDB.questions[questionIndex].user_answer = params[0];
          } else if (sql.includes('hint_requested')) {
            memoryDB.questions[questionIndex].hint_requested = params[0] ? 1 : 0;
          } else if (sql.includes('explanation_requested')) {
            memoryDB.questions[questionIndex].explanation_requested = params[0] ? 1 : 0;
          }
        }
        
        saveDB();
        return { changes: 1 };
      }
      
      return { lastID: 0, changes: 0 };
    } catch (error) {
      console.error("Error in db.run:", error);
      return { lastID: 0, changes: 0 };
    }
  }
};