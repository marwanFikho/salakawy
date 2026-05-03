import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store DB in the project root data/ folder
// Using a path relative to this file to be safer in different environments
const dbPath = path.resolve(__dirname, '../../data/database.sqlite');

console.log('Attempting to open database at:', dbPath);

let db: any;

try {
    db = new Database(dbPath, { fileMustExist: false, timeout: 5000 });
    console.log('Database opened successfully');
    
    // Disable WAL mode on Vercel as it requires write access to the directory
    if (!process.env.VERCEL) {
        db.pragma('journal_mode = WAL');
    }
} catch (err) {
    console.error('SQLite initialization failed. Fallback to :memory:', err);
    try {
        db = new Database(':memory:');
        console.log('Fallback in-memory database initialized');
    } catch (memErr) {
        console.error('Even in-memory database failed:', memErr);
        // Last resort: mock object to prevent crashes
        db = {
            prepare: () => ({ get: () => ({}), all: () => [], run: () => ({}) }),
            exec: () => {},
            pragma: () => {}
        };
    }
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analytics_pageviews (
      id TEXT PRIMARY KEY,
      page_url TEXT NOT NULL,
      referrer TEXT,
      device_type TEXT DEFAULT 'desktop',
      session_id TEXT,
      duration_seconds INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_pageviews_created ON analytics_pageviews(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_pageviews_page ON analytics_pageviews(page_url);

  CREATE TABLE IF NOT EXISTS site_content (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media_uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      public_url TEXT,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      display_order INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
  );
  
  CREATE INDEX IF NOT EXISTS idx_media_category ON media_uploads(category);
  CREATE INDEX IF NOT EXISTS idx_media_status ON media_uploads(status);
`);

// Insert default site_content if empty
const checkContent = db.prepare('SELECT count(*) as count FROM site_content').get() as { count: number };
if (checkContent.count === 0) {
  const insertContent = db.prepare('INSERT INTO site_content (id, content) VALUES (?, ?)');
  
  const defaultContacts = {
      coach: {
          name: "Salakawy",
          role: "Head Coach",
          phone: "+20 121 772 0267",
          photo: "/coach.jpg",
          whatsapp: "201217720267"
      },
      assistant: {
          name: "Nour",
          role: "Assistant Coach",
          phone: "+20 109 215 1540",
          photo: "/Nour Assistant.jpeg",
          whatsapp: "201092151540"
      }
  };
  
  const defaultPackages = {
      support: {
          name: "Support Team", price_egp: 1200, price_usd: 45, duration: "1 Month",
          price_3m_egp: 3200, price_3m_usd: 85, subtitle: "Weekly follow-up handled entirely by our Assistant Team.",
          features: ["Plan designed by Salakawy", "Weekly assistant follow-up", "Adjusted Flexible Diet", "Gym & Home Workouts + Videos"],
          cta_text: "Message Nour", icon: "✅"
      },
      silver: {
          name: "Silver", price_egp: 3700, price_usd: 80, duration: "1 Month",
          price_3m_egp: 7900, price_3m_usd: 170, subtitle: "Weekly responses directly with Salakawy to keep you on track.",
          features: ["Direct Salakawy follow-up weekly", "WhatsApp Q & A anytime", "Diet Based on BMR & Food Choices", "Cardio and Abs routine", "Gym & Home Workouts"],
          cta_text: "Book Silver", icon: "🌟", popular: true
      },
      gold: {
          name: "Gold", price_egp: 4900, price_usd: 110, duration: "1 Month",
          price_3m_egp: 12900, price_3m_usd: 270, subtitle: "Daily responses, VIP attention, and direct phone access.",
          features: ["Daily responses & updates", "My direct Phone Number", "Feel free to call me anytime", "WhatsApp Q & A instantly", "Full Diet & Workout Plan"],
          cta_text: "Book Gold", icon: "👑"
      },
      platinum: {
          name: "Platinum", price_egp: 12700, price_usd: 230, duration: "1 Month",
          price_3m_egp: 0, price_3m_usd: 0, subtitle: "The ultimate VIP experience. I reach out to you proactively every day.",
          features: ["I reach out to YOU daily", "Priority response 24/7", "Fully customized everything", "Private video coaching calls", "Lifetime access to resources"],
          cta_text: "Book Platinum", icon: "💎"
      }
  };
  
  insertContent.run('contacts', JSON.stringify(defaultContacts));
  insertContent.run('packages', JSON.stringify(defaultPackages));
}

export default db;
